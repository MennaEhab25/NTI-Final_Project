import * as auditService from './audit.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { successResponse } from '../../utils/apiResponse.js';

export const getTimeline = catchAsync(async (req, res) => {
  const events = await auditService.getContractTimeline(req.params.id);
  successResponse(res, 200, events);
});