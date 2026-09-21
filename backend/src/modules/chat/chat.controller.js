import * as service from './chat.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { successResponse } from '../../utils/apiResponse.js';

export const getMessages = catchAsync(async (req, res) => {
  successResponse(res, 200, await service.list(req.params.contractId, req.userId));
});