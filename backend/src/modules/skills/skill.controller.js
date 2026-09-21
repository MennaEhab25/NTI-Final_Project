import * as service from './skill.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { successResponse } from '../../utils/apiResponse.js';

export const list = catchAsync(async (req, res) => successResponse(res, 200, await service.listSkills()));
export const questions = catchAsync(async (req, res) => successResponse(res, 200, await service.getQuestions(req.params.id)));
export const assess = catchAsync(async (req, res) => {
  successResponse(res, 200, await service.assessSkill(req.userId, req.params.id, req.body.answers), 'Assessment submitted');
});
