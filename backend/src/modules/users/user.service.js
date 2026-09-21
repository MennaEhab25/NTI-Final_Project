import User from './user.model.js';
import { AppError } from '../../utils/errors.js';

const safeSelect = '-passwordHash -refreshToken -passwordResetToken -passwordResetExpires';

export function getMe(id) {
  return User.findById(id).select(safeSelect).populate('skills.skillId', 'name category').lean();
}

export async function updateMe(id, data) {
  if (data.roles) data.roles = [...new Set(data.roles)];
  if (data.activeRole && data.roles && !data.roles.includes(data.activeRole)) {
    throw new AppError('activeRole must exist in roles', 400);
  }

  const user = await User.findById(id);
  if (!user) throw new AppError('User not found', 404);
  if (data.activeRole && !user.roles.includes(data.activeRole) && !data.roles?.includes(data.activeRole)) {
    throw new AppError('Add this role before making it active', 400);
  }

  for (const key of ['name', 'bio', 'title', 'avatarUrl', 'activeRole', 'roles', 'portfolio']) {
    if (data[key] !== undefined) user[key] = data[key];
  }
  await user.save();
  return getMe(id);
}

export function getPublicUser(id) {
  return User.findById(id)
    .select('name avatarUrl bio title roles activeRole skills portfolio ratingAverage reviewsCount clientStats freelancerStats')
    .populate('skills.skillId', 'name category')
    .lean();
}

export async function listFreelancers(query) {
  const filter = { roles: 'freelancer', status: 'active' };
  if (query.search) {
    const value = String(query.search).trim();
    filter.$or = [
      { name: { $regex: value, $options: 'i' } },
      { title: { $regex: value, $options: 'i' } },
      { bio: { $regex: value, $options: 'i' } },
    ];
  }

  return User.find(filter)
    .select('name avatarUrl bio title skills ratingAverage reviewsCount freelancerStats')
    .populate('skills.skillId', 'name category')
    .sort({ ratingAverage: -1, createdAt: -1 })
    .limit(100)
    .lean();
}
