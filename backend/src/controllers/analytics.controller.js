// backend/src/controllers/analytics.controller.js
import * as analyticsService from '../services/analytics.service.js';
import { httpError } from '../utils/httpError.js';

export const overview = async (req, res, next) => {
  try {
    res.json(await analyticsService.getOverview());
  } catch (err) {
    next(err);
  }
};

export const assignmentTracking = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw httpError(400, 'Invalid assignment id');
    }
    res.json(await analyticsService.getAssignmentTracking(id));
  } catch (err) {
    next(err);
  }
};