import * as proposalService from './proposal.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { successResponse } from '../../utils/apiResponse.js';

export const createForProject = catchAsync(async (req, res) => {
  const data = await proposalService.createProposal(req.params.id, req.userId, req.body);
  successResponse(res, 201, data, 'Proposal submitted');
});

export const listForProject = catchAsync(async (req, res) => {
  successResponse(res, 200, await proposalService.getProjectProposals(req.params.id, req.userId));
});

export const mine = catchAsync(async (req, res) => {
  successResponse(res, 200, await proposalService.getMyProposals(req.userId));
});

export const update = catchAsync(async (req, res) => {
  successResponse(res, 200, await proposalService.updateProposal(req.params.id, req.userId, req.body));
});

export const shortlist = catchAsync(async (req, res) => {
  successResponse(res, 200, await proposalService.shortlistProposal(req.params.id, req.userId));
});

export const accept = catchAsync(async (req, res) => {
  successResponse(res, 200, await proposalService.acceptProposal(req.params.id, req.userId), 'Proposal accepted and contract created');
});

export const reject = catchAsync(async (req, res) => {
  successResponse(res, 200, await proposalService.rejectProposal(req.params.id, req.userId));
});

export const withdraw = catchAsync(async (req, res) => {
  successResponse(res, 200, await proposalService.withdrawProposal(req.params.id, req.userId));
});
