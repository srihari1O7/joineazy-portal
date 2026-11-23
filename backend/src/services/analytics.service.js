// backend/src/services/analytics.service.js
import { query } from '../config/db.js';
import { httpError } from '../utils/httpError.js';

// SQL fragment: "assignment <a> is meant for group <g>"
// (no targets = everyone, otherwise the group must be targeted)
const targets = (a, g) => `(
  NOT EXISTS (SELECT 1 FROM assignment_groups ag WHERE ag.assignment_id = ${a}.id)
  OR EXISTS (SELECT 1 FROM assignment_groups ag WHERE ag.assignment_id = ${a}.id AND ag.group_id = ${g}.id)
)`;

const percent = (done, total) => (total === 0 ? 0 : Math.round((done / total) * 100));

export const getOverview = async () => {
  const counts = await query(
    `SELECT
       (SELECT COUNT(*) FROM users WHERE role = 'student')::int AS students,
       (SELECT COUNT(*) FROM users u WHERE u.role = 'student'
          AND NOT EXISTS (SELECT 1 FROM group_members gm WHERE gm.user_id = u.id))::int AS ungrouped,
       (SELECT COUNT(*) FROM student_groups)::int AS groups,
       (SELECT COUNT(*) FROM assignments)::int AS assignments`
  );

  const perAssignment = await query(
    `SELECT a.id, a.title, a.due_date,
            (SELECT COUNT(*) FROM student_groups g WHERE ${targets('a', 'g')})::int AS target_groups,
            (SELECT COUNT(*) FROM submissions s
               JOIN student_groups g ON g.id = s.group_id
               WHERE s.assignment_id = a.id AND ${targets('a', 'g')})::int AS submitted_groups
     FROM assignments a
     ORDER BY a.due_date ASC`
  );

  const perGroup = await query(
    `SELECT g.id, g.name,
            (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id)::int AS member_count,
            (SELECT COUNT(*) FROM assignments a WHERE ${targets('a', 'g')})::int AS assigned,
            (SELECT COUNT(*) FROM submissions s
               JOIN assignments a ON a.id = s.assignment_id
               WHERE s.group_id = g.id AND ${targets('a', 'g')})::int AS submitted
     FROM student_groups g
     ORDER BY g.name ASC`
  );

  const assignments = perAssignment.rows.map((r) => ({
    id: r.id,
    title: r.title,
    dueDate: r.due_date,
    targetGroups: r.target_groups,
    submittedGroups: r.submitted_groups,
    percent: percent(r.submitted_groups, r.target_groups),
  }));

  const groups = perGroup.rows.map((r) => ({
    id: r.id,
    name: r.name,
    memberCount: r.member_count,
    assigned: r.assigned,
    submitted: r.submitted,
    percent: percent(r.submitted, r.assigned),
  }));

  const expected = assignments.reduce((sum, a) => sum + a.targetGroups, 0);
  const confirmed = assignments.reduce((sum, a) => sum + a.submittedGroups, 0);

  return {
    totals: {
      ...counts.rows[0],
      expectedSubmissions: expected,
      confirmedSubmissions: confirmed,
      completionPercent: percent(confirmed, expected),
    },
    assignments,
    groups,
  };
};

export const getAssignmentTracking = async (assignmentId) => {
  const assignment = await query(
    'SELECT id, title, due_date FROM assignments WHERE id = $1',
    [assignmentId]
  );
  if (assignment.rows.length === 0) {
    throw httpError(404, 'Assignment not found');
  }

  const groupRows = await query(
    `SELECT g.id, g.name, s.confirmed_at, s.confirmed_by, u.name AS confirmed_by_name
     FROM student_groups g
     LEFT JOIN submissions s ON s.group_id = g.id AND s.assignment_id = $1
     LEFT JOIN users u ON u.id = s.confirmed_by
     WHERE NOT EXISTS (SELECT 1 FROM assignment_groups ag WHERE ag.assignment_id = $1)
        OR EXISTS (SELECT 1 FROM assignment_groups ag WHERE ag.assignment_id = $1 AND ag.group_id = g.id)
     ORDER BY g.name ASC`,
    [assignmentId]
  );

  const groupIds = groupRows.rows.map((g) => g.id);
  const memberRows = groupIds.length
    ? await query(
        `SELECT gm.group_id, u.id, u.name, u.email
         FROM group_members gm
         JOIN users u ON u.id = gm.user_id
         WHERE gm.group_id = ANY($1::int[])
         ORDER BY u.name ASC`,
        [groupIds]
      )
    : { rows: [] };

  const groups = groupRows.rows.map((g) => {
    const submitted = g.confirmed_at !== null;
    return {
      id: g.id,
      name: g.name,
      submitted,
      confirmedAt: g.confirmed_at,
      confirmedBy: g.confirmed_by_name,
      members: memberRows.rows
        .filter((m) => m.group_id === g.id)
        .map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          submitted,
          confirmedIt: submitted && m.id === g.confirmed_by,
        })),
    };
  });

  const done = groups.filter((g) => g.submitted).length;

  return {
    assignment: {
      id: assignment.rows[0].id,
      title: assignment.rows[0].title,
      dueDate: assignment.rows[0].due_date,
    },
    summary: {
      totalGroups: groups.length,
      submittedGroups: done,
      pendingGroups: groups.length - done,
      percent: percent(done, groups.length),
    },
    groups,
  };
};