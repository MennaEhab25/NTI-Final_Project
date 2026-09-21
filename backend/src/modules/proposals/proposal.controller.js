import * as proposalService from './proposal.service.js';

function currentUserId(req) { return req.user?.id || req.headers['x-user-id']; }

export async function createForProject(req, res, next) {
  try {
    const userId = currentUserId(req);
    if (!userId) return res.status(401).json({ message: 'User id is required' });
    const required = ['price', 'duration', 'coverLetter'];
    const missing = required.filter((key) => !req.body[key]);
    if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(', ')}` });
    const data = await proposalService.createProposal(req.params.id, userId, req.body);
    res.status(201).json({ success: true, data, message: 'Proposal submitted' });
  } catch (error) { next(error); }
}

export async function listForProject(req, res, next) {
  try { res.json({ success: true, data: await proposalService.getProjectProposals(req.params.id) }); }
  catch (error) { next(error); }
}

export async function mine(req, res, next) {
  try { res.json({ success: true, data: await proposalService.getMyProposals(currentUserId(req)) }); }
  catch (error) { next(error); }
}

export async function update(req, res, next) {
  try { res.json({ success: true, data: await proposalService.updateProposal(req.params.id, currentUserId(req), req.body) }); }
  catch (error) { next(error); }
}

export async function shortlist(req, res, next) {
  try { res.json({ success: true, data: await proposalService.shortlistProposal(req.params.id, currentUserId(req)) }); }
  catch (error) { next(error); }
}

export async function accept(req, res, next) {
  try { res.json({ success: true, data: await proposalService.acceptProposal(req.params.id, currentUserId(req)), message: 'Proposal accepted and contract created' }); }
  catch (error) { next(error); }
}

export async function reject(req, res, next) {
  try { res.json({ success: true, data: await proposalService.rejectProposal(req.params.id, currentUserId(req)) }); }
  catch (error) { next(error); }
}

export async function withdraw(req, res, next) {
  try { res.json({ success: true, data: await proposalService.withdrawProposal(req.params.id, currentUserId(req)) }); }
  catch (error) { next(error); }
}
