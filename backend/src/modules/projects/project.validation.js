export function validateProject(req, res, next) {
  const required = ['title', 'description', 'category', 'budget', 'duration'];
  const missing = required.filter((key) => req.body[key] === undefined || req.body[key] === '');
  if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(', ')}` });
  if (Number(req.body.budget) <= 0 || Number(req.body.duration) <= 0) {
    return res.status(400).json({ message: 'Budget and duration must be greater than zero' });
  }
  next();
}
