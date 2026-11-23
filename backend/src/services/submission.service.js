// backend/src/services/submission.service.js
import { query } from '../config/db.js';
import { httpError } from '../utils/httpError.js';

const getStudentGroupId = async (userId) => {
  const result = await query('SELECT group_id FROM group_members WHERE user_id = $1', [userId]);
  return result.rows.length > 0 ? result.rows[0].group_id : null;
};

// Assignments a student can see: ones for everyone, or targeted at their group
export const listAssignmentsForStudent = async (userId) => {
  const groupId = await getStudentGroupId(userId);

  const result = await query(
    `SELECT a.id, a.title, a.description, a.due_date, a.onedrive_link, a.created_at,
            s.confirmed_at, u.name AS confirmed_by_name
     FROM assignments a
     LEFT JOIN submissions s ON s.assignment_id = a.id AND s.group_id = $1
     LEFT JOIN users u ON u.id = s.confirmed_by
     WHERE NOT EXISTS (SELECT 1 FROM assignment_groups ag WHERE ag.assignment_id = a.id)
        OR EXISTS (
             SELECT 1 FROM assignment_groups ag
             WHERE ag.assignment_id = a.id AND ag.group_id = $1
           )
     ORDER BY a.due_date ASC`,
    [groupId]
  );

  const assignments = result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    onedriveLink: row.onedrive_link,
    createdAt: row.created_at,
    submitted: row.confirmed_at !== null,
    confirmedAt: row.confirmed_at,
    confirmedBy: row.confirmed_by_name,
    overdue: row.confirmed_at === null && new Date(row.due_date) < new Date(),
  }));

  const total = assignments.length;
  const done = assignments.filter((a) => a.submitted).length;

  return {
    hasGroup: groupId !== null,
    progress: {
      total,
      submitted: done,
      percent: total === 0 ? 0 : Math.round((done / total) * 100),
    },
    assignments,
  };
};

export const confirmSubmission = async (userId, assignmentId) => {
  const groupId = await getStudentGroupId(userId);
  if (groupId === null) {
    throw httpError(400, 'Join or create a group before confirming a submission');
  }

  // The assignment must exist and be visible to this group
  const visible = await query(
    `SELECT a.id FROM assignments a
     WHERE a.id = $1
       AND (
         NOT EXISTS (SELECT 1 FROM assignment_groups ag WHERE ag.assignment_id = a.id)
         OR EXISTS (
              SELECT 1 FROM assignment_groups ag
              WHERE ag.assignment_id = a.id AND ag.group_id = $2
            )
       )`,
    [assignmentId, groupId]
  );
  if (visible.rows.length === 0) {
    throw httpError(404, 'Assignment not found');
  }

  try {
    await query(
      'INSERT INTO submissions (assignment_id, group_id, confirmed_by) VALUES ($1, $2, $3)',
      [assignmentId, groupId, userId]
    );
  } catch (err) {
    if (err.code === '23505') {
      throw httpError(409, 'Your group has already confirmed this submission');
    }
    throw err;
  }

  return { message: 'Submission confirmed' };
};