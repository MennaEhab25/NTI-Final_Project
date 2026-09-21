import Message from './chat.model.js';

export const list = (contractId) =>
  Message.find({ contract: contractId }).sort({ createdAt: 1 });

export const add = ({ contractId, senderId, content }) =>
  Message.create({ contract: contractId, sender: senderId, content });