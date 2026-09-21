import ExtensionRequest from './extension.model.js';
import Contract from '../contracts/contract.model.js';

export async function createExtension(contractId, freelancerId, data) {
  const contract = await Contract.findById(contractId);
  if (!contract) throw Object.assign(new Error('Contract not found'), { statusCode: 404 });
  if (String(contract.freelancerId) !== String(freelancerId)) {
    throw Object.assign(new Error('Only the freelancer can request an extension'), { statusCode: 403 });
  }
  if (contract.status !== 'ACTIVE') throw Object.assign(new Error('Extension is only available for active contracts'), { statusCode: 400 });

  const requestedDays = Number(data.requestedDays);
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
  if (!request) throw Object.assign(new Error('Extension request not found'), { statusCode: 404 });
  if (request.status !== 'PENDING') throw Object.assign(new Error('Extension request is already reviewed'), { statusCode: 400 });
  const contract = await Contract.findById(request.contractId);
  if (String(contract.clientId) !== String(clientId)) {
    throw Object.assign(new Error('Only the client can review this request'), { statusCode: 403 });
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
