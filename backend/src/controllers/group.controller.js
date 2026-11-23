// backend/src/controllers/group.controller.js
import * as groupService from '../services/group.service.js';

export const getMine = async (req, res, next) => {
  try {
    const group = await groupService.getMyGroup(req.user.id);
    res.json({ group });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const group = await groupService.createGroup(req.user.id, req.body.name);
    res.status(201).json({ group });
  } catch (err) {
    next(err);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const group = await groupService.addMemberByEmail(req.user.id, req.body.email);
    res.status(201).json({ group });
  } catch (err) {
    next(err);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const memberId = Number(req.params.userId);
    const group = await groupService.removeMember(req.user.id, memberId);
    res.json({ group });
  } catch (err) {
    next(err);
  }
};