// backend/src/controllers/assignment.controller.js
import * as assignmentService from '../services/assignment.service.js';
import { httpError } from '../utils/httpError.js';

const parseId = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw httpError(400, 'Invalid assignment id');
  }
  return id;
};

export const create = async (req, res, next) => {
  try {
    const assignment = await assignmentService.createAssignment(req.user.id, req.body);
    res.status(201).json({ assignment });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const assignment = await assignmentService.updateAssignment(parseId(req.params.id), req.body);
    res.json({ assignment });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const assignment = await assignmentService.getAssignmentById(parseId(req.params.id));
    res.json({ assignment });
  } catch (err) {
    next(err);
  }
};

export const listAll = async (req, res, next) => {
  try {
    const assignments = await assignmentService.listAllAssignments();
    res.json({ assignments });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    await assignmentService.deleteAssignment(parseId(req.params.id));
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    next(err);
  }
};