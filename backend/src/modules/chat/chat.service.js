import Message from './chat.model.js';
import Contract from '../contracts/contract.model.js';
import { AppError } from '../../utils/errors.js';

export const assertParticipant = async (contractId, userId) => {
  const contract = await Contract.findById(contractId).select('clientId freelancerId');
  if (!contract) throw new AppError('Contract not found', 404);
  const ok = [contract.clientId, contract.freelancerId].some((id) => String(id) === String(userId));
  if (!ok) throw new AppError('You are not part of this contract', 403);
};

export const list = async (contractId, userId) => {
  await assertParticipant(contractId, userId);
  return Message.find({ contract: contractId }).sort({ createdAt: 1 });
};

export const add = async ({ contractId, senderId, content }) => {
  await assertParticipant(contractId, senderId);
  return Message.create({ contract: contractId, sender: senderId, content });
};