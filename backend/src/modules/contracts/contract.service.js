import Contract from './contract.model.js';
import Project from '../projects/project.model.js';
import Payment from '../payments/payment.model.js';
import { AppError } from '../../utils/errors.js';

function participant(contract, userId) {
  return String(contract.clientId) === String(userId) || String(contract.freelancerId) === String(userId);
}

export async function getContract(id, userId) {
  const contract = await Contract.findById(id)
    .populate('projectId', 'title description category status')
    .populate('proposalId', 'price duration coverLetter')
    .populate('clientId', 'name email')
    .populate('freelancerId', 'name email title');
  if (!contract) return null;
  if (userId && !participant(contract, userId)) throw new AppError('You cannot view this contract', 403);
  return contract;
}

export async function getMyContracts(userId) {
  return Contract.find({ $or: [{ clientId: userId }, { freelancerId: userId }] })
    .populate('projectId', 'title status')
    .sort({ createdAt: -1 })
    .lean();
}

export async function startContract(id, userId) {
  const contract = await Contract.findById(id);
  if (!contract) throw new AppError('Contract not found', 404);
  if (String(contract.clientId) !== String(userId)) throw new AppError('Only the client can start the contract', 403);
  if (contract.status !== 'AWAITING_PAYMENT') throw new AppError('Contract is already started', 400);

  const payment = await Payment.findOne({ contractId: contract._id, status: { $in: ['HELD', 'RELEASED'] } });
  if (!payment) throw new AppError('Payment must be completed before starting the contract', 400);

  contract.status = 'ACTIVE';
  contract.startDate = new Date();
  contract.deadline = new Date(contract.startDate.getTime() + contract.durationDays * 24 * 60 * 60 * 1000);
  await contract.save();
  await Project.findByIdAndUpdate(contract.projectId, { status: 'IN_PROGRESS' });
  return contract;
}
