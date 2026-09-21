import { getContract, startContract } from './contract.service.js';
import { sendContractPdf } from './contract.pdf.service.js';

function currentUserId(req) { return req.user?.id || req.headers['x-user-id']; }

export async function details(req, res, next) {
  try {
    const contract = await getContract(req.params.id);
    if (!contract) return res.status(404).json({ message: 'Contract not found' });
    res.json({ success: true, data: contract });
  } catch (error) { next(error); }
}

export async function pdf(req, res, next) {
  try {
    const contract = await getContract(req.params.id);
    if (!contract) return res.status(404).json({ message: 'Contract not found' });
    sendContractPdf(res, contract);
  } catch (error) { next(error); }
}

export async function start(req, res, next) {
  try { res.json({ success: true, data: await startContract(req.params.id, currentUserId(req)), message: 'Contract started' }); }
  catch (error) { next(error); }
}
