import { approveExtension, createExtension, rejectExtension } from './extension.service.js';

function currentUserId(req) { return req.user?.id || req.headers['x-user-id']; }

export async function createForContract(req, res, next) {
  try {
    if (!req.body.requestedDays || !req.body.reason) return res.status(400).json({ message: 'requestedDays and reason are required' });
    const data = await createExtension(req.params.id, currentUserId(req), req.body);
    res.status(201).json({ success: true, data, message: 'Extension request created' });
  } catch (error) { next(error); }
}

export async function approve(req, res, next) {
  try { res.json({ success: true, data: await approveExtension(req.params.id, currentUserId(req)) }); }
  catch (error) { next(error); }
}

export async function reject(req, res, next) {
  try { res.json({ success: true, data: await rejectExtension(req.params.id, currentUserId(req)) }); }
  catch (error) { next(error); }
}
