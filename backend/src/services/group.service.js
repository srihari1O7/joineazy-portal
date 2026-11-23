// backend/src/services/group.service.js
import pool, { query } from '../config/db.js';
import { httpError } from '../utils/httpError.js';

const getGroupWithMembers = async (groupId) => {
  const group = await query(
    'SELECT id, name, created_by, created_at FROM student_groups WHERE id = $1',
    [groupId]
  );
  if (group.rows.length === 0) return null;

  const members = await query(
    `SELECT u.id, u.name, u.email, gm.joined_at
     FROM group_members gm
     JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = $1
     ORDER BY gm.joined_at`,
    [groupId]
  );

  return { ...group.rows[0], members: members.rows };
};

export const getMyGroup = async (userId) => {
  const result = await query('SELECT group_id FROM group_members WHERE user_id = $1', [userId]);
  if (result.rows.length === 0) return null;
  return getGroupWithMembers(result.rows[0].group_id);
};

export const createGroup = async (userId, name) => {
  const existing = await query('SELECT 1 FROM group_members WHERE user_id = $1', [userId]);
  if (existing.rows.length > 0) {
    throw httpError(409, 'You are already in a group');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const group = await client.query(
      'INSERT INTO student_groups (name, created_by) VALUES ($1, $2) RETURNING id',
      [name, userId]
    );
    const groupId = group.rows[0].id;
    await client.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [
      groupId,
      userId,
    ]);
    await client.query('COMMIT');
    return getGroupWithMembers(groupId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const addMemberByEmail = async (requesterId, email) => {
  const mine = await query('SELECT group_id FROM group_members WHERE user_id = $1', [requesterId]);
  if (mine.rows.length === 0) {
    throw httpError(400, 'Create a group first');
  }
  const groupId = mine.rows[0].group_id;

  const owner = await query('SELECT created_by FROM student_groups WHERE id = $1', [groupId]);
  if (owner.rows[0].created_by !== requesterId) {
    throw httpError(403, 'Only the group creator can add members');
  }

  const target = await query('SELECT id, role FROM users WHERE email = $1', [
    email.toLowerCase().trim(),
  ]);
  if (target.rows.length === 0) {
    throw httpError(404, 'No student found with that email');
  }
  if (target.rows[0].role !== 'student') {
    throw httpError(400, 'Only students can be added to a group');
  }

  const targetId = target.rows[0].id;
  const taken = await query('SELECT 1 FROM group_members WHERE user_id = $1', [targetId]);
  if (taken.rows.length > 0) {
    throw httpError(409, 'That student is already in a group');
  }

  await query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [groupId, targetId]);
  return getGroupWithMembers(groupId);
};

export const removeMember = async (requesterId, memberId) => {
  const mine = await query('SELECT group_id FROM group_members WHERE user_id = $1', [requesterId]);
  if (mine.rows.length === 0) {
    throw httpError(400, 'You are not in a group');
  }
  const groupId = mine.rows[0].group_id;

  const owner = await query('SELECT created_by FROM student_groups WHERE id = $1', [groupId]);
  const isCreator = owner.rows[0].created_by === requesterId;

  if (!isCreator && requesterId !== memberId) {
    throw httpError(403, 'Only the group creator can remove other members');
  }
  if (isCreator && memberId === requesterId) {
    throw httpError(400, 'The group creator cannot leave their own group');
  }

  const result = await query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [
    groupId,
    memberId,
  ]);
  if (result.rowCount === 0) {
    throw httpError(404, 'Member not found in your group');
  }
  return getGroupWithMembers(groupId);
};