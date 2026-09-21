import Delivery from './delivery.model.js';

export const createDelivery = async (data) => {
  return await Delivery.create(data);
};

export const updateDeliveryStatus = async (id, status) => {
  return await Delivery.findByIdAndUpdate(
    id,
    { status, reviewedAt: Date.now() },
    { new: true }
  );
};