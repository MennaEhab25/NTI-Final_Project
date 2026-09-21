import TimelineEvent from './timelineEvent.model.js';

export const logEvent = async ({ contractId, type, actorId, meta = {} }) => {
  return await TimelineEvent.create({ contractId, type, actorId, meta });
};

export const getContractTimeline = async (contractId) => {
  return await TimelineEvent.find({ contractId }).sort({ createdAt: 1 });
};