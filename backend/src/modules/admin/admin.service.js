import User from '../users/user.model.js';
import Project from '../projects/project.model.js';
import Skill from '../skills/skill.model.js';
import Withdrawal from '../withdrawals/withdrawal.model.js';
import WalletTransaction from '../wallet/walletTransaction.model.js';
import Payment from '../payments/payment.model.js';
import { approveWithdrawal, rejectWithdrawal } from '../withdrawals/withdrawal.service.js';
import { AppError } from '../../utils/errors.js';

export async function dashboardStats() {
  const [users, projects, payments, pendingWithdrawals] = await Promise.all([
    User.countDocuments(),
    Project.countDocuments(),
    Payment.countDocuments(),
    Withdrawal.countDocuments({ status: 'PENDING' }),
  ]);
  return { users, projects, payments, pendingWithdrawals };
}

export function usersList() {
  return User.find({})
    .select('-passwordHash -refreshToken -passwordResetToken -passwordResetExpires')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
}

export async function updateUser(id, data) {
  const allowed = {};
  if (['active', 'suspended'].includes(data.status)) allowed.status = data.status;
  if (typeof data.isAdmin === 'boolean') allowed.isAdmin = data.isAdmin;

  const user = await User.findByIdAndUpdate(id, allowed, { new: true, runValidators: true })
    .select('-passwordHash -refreshToken -passwordResetToken -passwordResetExpires')
    .lean();
  if (!user) throw new AppError('User not found', 404);
  return user;
}

export function projectsList() {
  return Project.find({}).sort({ createdAt: -1 }).limit(100).lean();
}

export function skillsList() {
  return Skill.find({}).sort({ name: 1 }).lean();
}

export function addSkill(data) {
  return Skill.create({
    name: data.name,
    category: data.category || 'General',
    questions: data.questions || [],
  });
}

export async function updateSkill(id, data) {
  const update = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.category !== undefined) update.category = data.category;
  if (data.questions !== undefined) update.questions = data.questions;

  const skill = await Skill.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  });
  if (!skill) throw new AppError('Skill not found', 404);
  return skill;
}

export async function deleteSkill(id) {
  const skill = await Skill.findByIdAndDelete(id);
  if (!skill) throw new AppError('Skill not found', 404);
  return skill;
}

export function transactionsList() {
  return WalletTransaction.find({})
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
}

export function withdrawalsList() {
  return Withdrawal.find({})
    .populate('freelancerId', 'name email')
    .sort({ createdAt: -1 })
    .lean();
}

export { approveWithdrawal, rejectWithdrawal };
