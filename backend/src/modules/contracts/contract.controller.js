import { getContract, getMyContracts, startContract } from './contract.service.js';
import { sendContractPdf } from './contract.pdf.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { successResponse } from '../../utils/apiResponse.js';
import { AppError } from '../../utils/errors.js';

export const mine = catchAsync(async (req, res) => {
  successResponse(res, 200, await getMyContracts(req.userId));
});

export const details = catchAsync(async (req, res) => {
  const contract = await getContract(req.params.id, req.userId);
  if (!contract) throw new AppError('Contract not found', 404);
  successResponse(res, 200, contract);
});

export const pdf = catchAsync(async (req, res) => {
  const contract = await getContract(req.params.id, req.userId);
  if (!contract) throw new AppError('Contract not found', 404);
  sendContractPdf(res, contract);
});

export const start = catchAsync(async (req, res) => {
  successResponse(res, 200, await startContract(req.params.id, req.userId), 'Contract started');
});
