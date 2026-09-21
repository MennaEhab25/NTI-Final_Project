import * as service from './chat.service.js';

export const getMessages = async (req, res) => {
  try {
    res.json(await service.list(req.params.contractId));
  } catch (err) {
    res.status(400).json({ success: false, message: 'Invalid contract id' });
  }
};