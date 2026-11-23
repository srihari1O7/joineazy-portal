// backend/src/controllers/submission.controller.js
import * as submissionService from '../services/submission.service.js';
import { httpError } from '../utils/httpError.js';

export const listMine = async (req, res, next) => {
  try {
    const data = await submissionService.listAssignmentsForStudent(req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const confirm = async (req, res, next) => {
  try {
    const assignmentId = Number(req.params.id);
    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      throw httpError(400, 'Invalid assignment id');
    }
    const data = await submissionService.confirmSubmission(req.user.id, assignmentId);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};