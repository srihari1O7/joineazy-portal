// backend/src/services/assignment.service.js
import pool, { query } from '../config/db.js';
import { httpError } from '../utils/httpError.js';

const formatAssignment = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  dueDate: row.due_date,
  onedriveLink: row.onedrive_link,
  createdAt: row.created_at,
  groupIds: row.group_ids || [],
  targetsAll: !row.group_ids || row.group_ids.length === 0,
});

const assignmentSelect = `
  SELECT a.id, a.title, a.description, a.due_date, a.onedrive_link, a.created_at,
         COALESCE(
           (SELECT array_agg(ag.group_id) FROM assignment_groups ag WHERE ag.assignment_id = a.id),
           '{}'
         ) AS group_ids
  FROM assignments a
`;

export const createAssignment = async (adminId, data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (data.groupIds.length > 0) {
      const found = await client.query(
        'SELECT id FROM student_groups WHERE id = ANY($1::int[])',
        [data.groupIds]
      );
      if (found.rows.length !== data.groupIds.length) {
        throw httpError(400, 'One or more selected groups do not exist');
      }
    }

    const created = await client.query(
      `INSERT INTO assignments (title, description, due_date, onedrive_link, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [data.title, data.description, data.dueDate, data.onedriveLink, adminId]
    );
    const assignmentId = created.rows[0].id;

    for (const groupId of data.groupIds) {
      await client.query(
        'INSERT INTO assignment_groups (assignment_id, group_id) VALUES ($1, $2)',
        [assignmentId, groupId]
      );
    }

    await client.query('COMMIT');
    return getAssignmentById(assignmentId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const updateAssignment = async (assignmentId, data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updated = await client.query(
      `UPDATE assignments
       SET title = $1, description = $2, due_date = $3, onedrive_link = $4
       WHERE id = $5
       RETURNING id`,
      [data.title, data.description, data.dueDate, data.onedriveLink, assignmentId]
    );
    if (updated.rows.length === 0) {
      throw httpError(404, 'Assignment not found');
    }

    if (data.groupIds.length > 0) {
      const found = await client.query(
        'SELECT id FROM student_groups WHERE id = ANY($1::int[])',
        [data.groupIds]
      );
      if (found.rows.length !== data.groupIds.length) {
        throw httpError(400, 'One or more selected groups do not exist');
      }
    }

    await client.query('DELETE FROM assignment_groups WHERE assignment_id = $1', [assignmentId]);
    for (const groupId of data.groupIds) {
      await client.query(
        'INSERT INTO assignment_groups (assignment_id, group_id) VALUES ($1, $2)',
        [assignmentId, groupId]
      );
    }

    await client.query('COMMIT');
    return getAssignmentById(assignmentId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const getAssignmentById = async (assignmentId) => {
  const result = await query(`${assignmentSelect} WHERE a.id = $1`, [assignmentId]);
  if (result.rows.length === 0) {
    throw httpError(404, 'Assignment not found');
  }
  return formatAssignment(result.rows[0]);
};

export const listAllAssignments = async () => {
  const result = await query(`${assignmentSelect} ORDER BY a.due_date ASC`);
  return result.rows.map(formatAssignment);
};

export const deleteAssignment = async (assignmentId) => {
  const result = await query('DELETE FROM assignments WHERE id = $1', [assignmentId]);
  if (result.rowCount === 0) {
    throw httpError(404, 'Assignment not found');
  }
};