import * as projectService from './project.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { successResponse } from '../../utils/apiResponse.js';
import { AppError } from '../../utils/errors.js';

export const create = catchAsync(async (req, res) => {
  const project = await projectService.createProject(req.userId, req.body);
  successResponse(res, 201, project, 'Project created');
});

export const list = catchAsync(async (req, res) => {
  successResponse(res, 200, await projectService.getProjects(req.query));
});

export const mine = catchAsync(async (req, res) => {
  successResponse(res, 200, await projectService.getMyProjects(req.userId));
});

export const details = catchAsync(async (req, res) => {
  const project = await projectService.getProjectById(req.params.id);
  if (!project) throw new AppError('Project not found', 404);
  successResponse(res, 200, project);
});

export const update = catchAsync(async (req, res) => {
  const project = await projectService.updateProject(req.params.id, req.userId, req.body);
  successResponse(res, 200, project, 'Project updated');
});

export const remove = catchAsync(async (req, res) => {
  await projectService.deleteProject(req.params.id, req.userId);
  successResponse(res, 200, null, 'Project deleted');
});
