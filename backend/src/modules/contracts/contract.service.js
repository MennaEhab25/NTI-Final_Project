import Contract from './contract.model.js';
import Project from '../projects/project.model.js';

export function getContract(id) {
  return Contract.findById(id)
    .populate('projectId', 'title description category')
    .populate('proposalId', 'price duration coverLetter')
    .lean();
}

export async function startContract(id, userId) {
  const contract = await Contract.findById(id);
  if (!contract) throw Object.assign(new Error('Contract not found'), { statusCode: 404 });
  if (String(contract.clientId) !== String(userId)) {
    throw Object.assign(new Error('Only the client can start the contract'), { statusCode: 403 });
  }
  if (contract.status !== 'AWAITING_PAYMENT') {
    throw Object.assign(new Error('Contract is already started'), { statusCode: 400 });
  }

  contract.status = 'ACTIVE';
  contract.startDate = new Date();
  await contract.save();
  await Project.findByIdAndUpdate(contract.projectId, { status: 'IN_PROGRESS' });
  return contract;
}
