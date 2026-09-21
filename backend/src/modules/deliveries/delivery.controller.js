import * as deliveryService from './delivery.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { successResponse } from '../../utils/apiResponse.js';
import { notify } from '../Notifications/notification.service.js';
import { logEvent } from '../audit/audit.service.js';

export const submitDelivery = catchAsync(async (req, res) => {
  const { message, files, clientId } = req.body;
  const contractId = req.params.id;

  const delivery = await deliveryService.createDelivery({
    contractId,
    freelancerId: req.userId,message,files,status: 'SUBMITTED'
  });

  await logEvent({
    contractId,
    type: 'delivery_submitted',
    actorId: req.userId,
    meta: { deliveryId: delivery._id }
  });

  if (clientId) {
    await notify({
      userId: clientId,
      type: 'delivery_submitted',
      title: 'New Delivery',
      message: 'The freelancer has submitted the work for your review.',
      entityId: delivery._id
    });
  }

  successResponse(res, 201, delivery);
});

export const approveDelivery = catchAsync(async (req, res) => {
  const delivery = await deliveryService.updateDeliveryStatus(req.params.id, 'APPROVED');

  await logEvent({
    contractId: delivery.contractId,
    type: 'delivery_approved',
    actorId: req.userId,
    meta: { deliveryId: delivery._id }
  });

  await notify({
    userId: delivery.freelancerId,
    type: 'delivery_approved',
    title: 'Delivery Approved',
    message: 'Awesome! The client has approved your delivery.',
    entityId: delivery._id
  });

  successResponse(res, 200, delivery);
});

export const requestRevision = catchAsync(async (req, res) => {
  const delivery = await deliveryService.updateDeliveryStatus(req.params.id, 'REVISION_REQUESTED');

  await logEvent({
    contractId: delivery.contractId,
    type: 'delivery_revision',
    actorId: req.userId,
    meta: { deliveryId: delivery._id }
  });

  await notify({
    userId: delivery.freelancerId,
    type: 'delivery_revision',
    title: 'Revision Requested',
    message: 'The client has requested some revisions on your delivery.',
    entityId: delivery._id
  });

  successResponse(res, 200, delivery);
});