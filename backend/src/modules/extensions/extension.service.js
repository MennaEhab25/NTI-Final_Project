import ExtensionRequest from './extension.model.js';
import Contract from '../contracts/contract.model.js';
import { AppError } from '../../utils/errors.js';

export async function createExtension(contractId, freelancerId, data) {
  const contract = await Contract.findById(contractId);
  if (!contract) throw new AppError('Contract not found', 404);
  if (String(contract.freelancerId) !== String(freelancerId)) {
    throw new AppError('Only the freelancer can request an extension', 403);
  }
  if (contract.status !== 'ACTIVE') throw new AppError('Extension is only available for active contracts', 400);
  if (!contract.deadline || Number.isNaN(new Date(contract.deadline).getTime())) {
    throw new AppError('Contract deadline is missing or invalid', 400);
  }

  const requestedDays = Number(data.requestedDays);
  if (!Number.isInteger(requestedDays) || requestedDays <= 0) {
    throw new AppError('requestedDays must be a positive whole number', 400);
  }
  const proposedDeadline = new Date(contract.deadline);
  proposedDeadline.setDate(proposedDeadline.getDate() + requestedDays);

  return ExtensionRequest.create({
    contractId,
    requestedDays,
    reason: data.reason,
    oldDeadline: contract.deadline,
    proposedDeadline,
  });
}

async function reviewExtension(id, clientId, status) {
  const request = await ExtensionRequest.findById(id);
  if (!request) throw new AppError('Extension request not found', 404);
  if (request.status !== 'PENDING') throw new AppError('Extension request is already reviewed', 400);
  const contract = await Contract.findById(request.contractId);
  if (!contract) throw new AppError('Contract not found', 404);
  if (String(contract.clientId) !== String(clientId)) {
    throw new AppError('Only the client can review this request', 403);
  }

  request.status = status;
  request.reviewedAt = new Date();
  if (status === 'APPROVED') {
    contract.deadline = request.proposedDeadline;
    await contract.save();
  }
  await request.save();
  return request;
}

export const approveExtension = (id, clientId) => reviewExtension(id, clientId, 'APPROVED');
export const rejectExtension = (id, clientId) => reviewExtension(id, clientId, 'REJECTED');
