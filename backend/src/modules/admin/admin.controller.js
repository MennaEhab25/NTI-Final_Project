import * as adminService from './admin.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { successResponse } from '../../utils/apiResponse.js';

export const dashboard = catchAsync(async (req, res) => {
  successResponse(res, 200, await adminService.dashboardStats());
});

export const users = catchAsync(async (req, res) => {
  successResponse(res, 200, await adminService.usersList());
});

export const updateUser = catchAsync(async (req, res) => {
  successResponse(res, 200, await adminService.updateUser(req.params.id, req.body));
});

export const projects = catchAsync(async (req, res) => {
  successResponse(res, 200, await adminService.projectsList());
});

export const skills = catchAsync(async (req, res) => {
  successResponse(res, 200, await adminService.skillsList());
});

export const createSkill = catchAsync(async (req, res) => {
  successResponse(res, 201, await adminService.addSkill(req.body));
});

export const editSkill = catchAsync(async (req, res) => {
  successResponse(res, 200, await adminService.updateSkill(req.params.id, req.body));
});

export const removeSkill = catchAsync(async (req, res) => {
  await adminService.deleteSkill(req.params.id);
  res.status(204).end();
});

export const transactions = catchAsync(async (req, res) => {
  successResponse(res, 200, await adminService.transactionsList());
});

export const withdrawals = catchAsync(async (req, res) => {
  successResponse(res, 200, await adminService.withdrawalsList());
});

export const approve = catchAsync(async (req, res) => {
  successResponse(res, 200, await adminService.approveWithdrawal(req.params.id));
});

export const reject = catchAsync(async (req, res) => {
  successResponse(res, 200, await adminService.rejectWithdrawal(req.params.id));
});
