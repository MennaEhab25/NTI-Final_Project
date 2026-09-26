import mongoose from 'mongoose';
import User from '../users/user.model.js';
import Project from '../projects/project.model.js';
import Proposal from '../proposals/proposal.model.js';
import Contract from '../contracts/contract.model.js';
import Skill from '../skills/skill.model.js';
import Withdrawal from '../withdrawals/withdrawal.model.js';
import WalletTransaction from '../wallet/walletTransaction.model.js';
import Payment from '../payments/payment.model.js';
import PlatformRevenueTransaction from '../platformRevenue/platformRevenueTransaction.model.js';
import { approveWithdrawal, rejectWithdrawal } from '../withdrawals/withdrawal.service.js';
import { AppError } from '../../utils/errors.js';

const SAFE_USER_SELECT = [
  '-passwordHash',
  '-refreshToken',
  '-passwordResetToken',
  '-passwordResetExpires',
].join(' ');

export async function dashboardStats() {
  const [
    users,
    projects,
    payments,
    pendingWithdrawals,
    revenueSummary,
    freelancerPayoutSummary,
  ] = await Promise.all([
    User.countDocuments(),
    Project.countDocuments(),
    Payment.countDocuments(),
    Withdrawal.countDocuments({ status: 'PENDING' }),
    PlatformRevenueTransaction.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    WalletTransaction.aggregate([
      { $match: { type: 'CREDIT', reason: 'PAYMENT_RELEASE' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  return {
    users,
    projects,
    payments,
    pendingWithdrawals,
    platformRevenue: Number(revenueSummary[0]?.total || 0),
    commissionTransactions: Number(revenueSummary[0]?.count || 0),
    freelancerPayouts: Number(freelancerPayoutSummary[0]?.total || 0),
  };
}

export async function usersList() {
  const users = await User.find({})
    .select(SAFE_USER_SELECT)
    .populate('skills.skillId', 'name category')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const userIds = users.map((user) => user._id);
  const [projectCounts, proposalCounts] = await Promise.all([
    Project.aggregate([
      { $match: { clientId: { $in: userIds } } },
      { $group: { _id: '$clientId', count: { $sum: 1 } } },
    ]),
    Proposal.aggregate([
      { $match: { freelancerId: { $in: userIds } } },
      { $group: { _id: '$freelancerId', count: { $sum: 1 } } },
    ]),
  ]);

  const projectCountByUser = new Map(projectCounts.map((row) => [String(row._id), row.count]));
  const proposalCountByUser = new Map(proposalCounts.map((row) => [String(row._id), row.count]));

  return users.map((user) => ({
    ...user,
    projectCount: projectCountByUser.get(String(user._id)) || 0,
    proposalCount: proposalCountByUser.get(String(user._id)) || 0,
  }));
}

export async function updateUser(id, data, actorId) {
  const target = await User.findById(id).select('isAdmin status isVerifiedEmail').lean();
  if (!target) throw new AppError('User not found', 404);

  const isSelf = String(actorId) === String(target._id);
  const allowed = {};

  if (['active', 'suspended'].includes(data.status)) {
    if (isSelf && data.status === 'suspended') {
      throw new AppError('You cannot suspend your own admin account', 409);
    }
    if (data.status === 'suspended' && target.isAdmin) {
      await assertNotLastAdmin(target._id);
    }
    allowed.status = data.status;
  }

  if (typeof data.isAdmin === 'boolean') {
    if (!data.isAdmin) {
      if (isSelf) throw new AppError('You cannot remove your own admin access', 409);
      if (target.isAdmin) await assertNotLastAdmin(target._id);
      allowed.isAdmin = false;
    } else if (!target.isAdmin) {
      if (!target.isVerifiedEmail) {
        throw new AppError('Cannot grant admin access to an unverified account', 409);
      }
      allowed.isAdmin = true;
    }
  }

  const user = await User.findByIdAndUpdate(id, allowed, { new: true, runValidators: true })
    .select(SAFE_USER_SELECT)
    .lean();
  if (!user) throw new AppError('User not found', 404);
  return user;
}

async function assertNotLastAdmin(excludedId) {
  const remainingAdmins = await User.countDocuments({
    isAdmin: true,
    _id: { $ne: excludedId },
  });
  if (remainingAdmins < 1) {
    throw new AppError('At least one admin account must remain', 409);
  }
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
  const skill = await Skill.findById(id);
  if (!skill) throw new AppError('Skill not found', 404);

  const [profiles, projects] = await Promise.all([
    User.countDocuments({ 'skills.skillId': skill._id }),
    Project.countDocuments({ requiredSkills: skill._id }),
  ]);
  if (profiles > 0 || projects > 0) {
    const references = [
      profiles > 0 ? `${profiles} freelancer profile${profiles === 1 ? '' : 's'}` : null,
      projects > 0 ? `${projects} project${projects === 1 ? '' : 's'}` : null,
    ].filter(Boolean).join(' and ');
    throw new AppError(`Skill is in use by ${references} and cannot be deleted`, 409);
  }

  await skill.deleteOne();
  return skill;
}

export function transactionsList() {
  return WalletTransaction.find({})
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
}


export function platformRevenueList() {
  return PlatformRevenueTransaction.find({})
    .populate('clientId', 'name email')
    .populate('freelancerId', 'name email')
    .populate('contractId', 'projectId amount commissionRate commissionAmount freelancerAmount')
    .sort({ recognizedAt: -1 })
    .limit(200)
    .lean();
}

export function withdrawalsList() {
  return Withdrawal.find({})
    .populate('freelancerId', 'name email')
    .sort({ createdAt: -1 })
    .lean();
}

const OVERSIGHT_DEFAULT_LIMIT = 20;
const OVERSIGHT_MAX_LIMIT = 100;

function resolvePagination(query = {}) {
  const requestedPage = Number.parseInt(query.page, 10);
  const requestedLimit = Number.parseInt(query.limit, 10);

  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
    ? Math.min(requestedLimit, OVERSIGHT_MAX_LIMIT)
    : OVERSIGHT_DEFAULT_LIMIT;

  return { page, limit, skip: (page - 1) * limit };
}

function paginatedResult(items, total, { page, limit }) {
  return {
    data: items,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function asObjectIdClause(value) {
  return mongoose.Types.ObjectId.isValid(value) ? [{ _id: new mongoose.Types.ObjectId(value) }] : [];
}

async function resolveSearchIds(search) {
  const pattern = new RegExp(escapeRegex(search), 'i');
  const [projects, users] = await Promise.all([
    Project.find({ $or: [{ title: pattern }, { category: pattern }] }, '_id').lean(),
    User.find({ $or: [{ name: pattern }, { email: pattern }] }, '_id').lean(),
  ]);
  return {
    projectIds: projects.map((row) => row._id),
    userIds: users.map((row) => row._id),
  };
}

export async function proposalsList(query = {}) {
  const pagination = resolvePagination(query);
  const search = typeof query.search === 'string' ? query.search.trim() : '';

  const filter = {};
  if (search) {
    const { projectIds, userIds } = await resolveSearchIds(search);
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [
      { projectId: { $in: projectIds } },
      { freelancerId: { $in: userIds } },
      { coverLetter: pattern },
      ...asObjectIdClause(search),
    ];
  }
  if (query.status) filter.status = query.status;

  const [items, total] = await Promise.all([
    Proposal.find(filter)
      .populate('projectId', 'title status budget')
      .populate('freelancerId', 'name email title')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    Proposal.countDocuments(filter),
  ]);
  return paginatedResult(items, total, pagination);
}

export async function contractsList(query = {}) {
  const pagination = resolvePagination(query);
  const search = typeof query.search === 'string' ? query.search.trim() : '';

  const filter = {};
  if (search) {
    const { projectIds, userIds } = await resolveSearchIds(search);
    filter.$or = [
      { projectId: { $in: projectIds } },
      { clientId: { $in: userIds } },
      { freelancerId: { $in: userIds } },
      ...asObjectIdClause(search),
    ];
  }
  if (query.status) filter.status = query.status;

  const [items, total] = await Promise.all([
    Contract.find(filter)
      .populate('projectId', 'title status budget')
      .populate('proposalId', 'price duration')
      .populate('clientId', 'name email')
      .populate('freelancerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    Contract.countDocuments(filter),
  ]);
  return paginatedResult(items, total, pagination);
}

export async function paymentsList(query = {}) {
  const pagination = resolvePagination(query);
  const search = typeof query.search === 'string' ? query.search.trim() : '';

  const filter = {};
  if (search) {
    const { userIds, projectIds } = await resolveSearchIds(search);
    const pattern = new RegExp(escapeRegex(search), 'i');
    const contractIds = projectIds.length
      ? (await Contract.find({ projectId: { $in: projectIds } }, '_id').lean())
        .map((contract) => contract._id)
      : [];
    filter.$or = [
      { clientId: { $in: userIds } },
      { freelancerId: { $in: userIds } },
      { contractId: { $in: contractIds } },
      { merchantRefNumber: pattern },
      { paymobOrderId: pattern },
      { paymobTransactionId: pattern },
      ...asObjectIdClause(search),
    ];
  }
  if (query.status) filter.status = query.status;

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    Payment.countDocuments(filter),
  ]);
  if (!payments.length) return paginatedResult(payments, total, pagination);

  const userIds = new Set();
  for (const payment of payments) {
    if (payment.clientId) userIds.add(String(payment.clientId));
    if (payment.freelancerId) userIds.add(String(payment.freelancerId));
  }

  const users = await User.find({ _id: { $in: [...userIds] } })
    .select('name email')
    .lean();
  const usersById = new Map(users.map((user) => [String(user._id), user]));

  const items = payments.map((payment) => ({
    ...payment,
    clientId: usersById.get(String(payment.clientId)) || payment.clientId,
    freelancerId: usersById.get(String(payment.freelancerId)) || payment.freelancerId,
  }));

  return paginatedResult(items, total, pagination);
}

export { approveWithdrawal, rejectWithdrawal };
