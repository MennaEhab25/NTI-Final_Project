import mongoose from 'mongoose';
import Proposal from './proposal.model.js';
import Project from '../projects/project.model.js';
import Contract from '../contracts/contract.model.js';
import { AppError } from '../../utils/errors.js';

export async function createProposal(projectId, freelancerId, data) {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Project not found', 404);
  if (project.status !== 'OPEN') throw new AppError('Project is not open for proposals', 400);
  if (String(project.clientId) === String(freelancerId)) {
    throw new AppError('You cannot submit a proposal to your own project', 400);
  }

  let proposal;
  try {
    proposal = await Proposal.create({
      projectId,
      freelancerId,
      price: data.price,
      duration: data.duration,
      coverLetter: data.coverLetter,
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError('You already submitted a proposal for this project', 400);
    }
    throw error;
  }

  await Project.findByIdAndUpdate(projectId, { $inc: { proposalsCount: 1 } });
  return proposal;
}

export async function getProjectProposals(projectId, clientId) {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Project not found', 404);
  if (String(project.clientId) !== String(clientId)) {
    throw new AppError('Only project owner can view proposals', 403);
  }
  return Proposal.find({ projectId })
    .populate('freelancerId', 'name title ratingAverage')
    .sort({ createdAt: -1 })
    .lean();
}

export function getMyProposals(freelancerId) {
  return Proposal.find({ freelancerId }).populate('projectId', 'title budget status').sort({ createdAt: -1 }).lean();
}

export async function updateProposal(id, freelancerId, data) {
  const proposal = await Proposal.findById(id);
  if (!proposal) throw new AppError('Proposal not found', 404);
  if (String(proposal.freelancerId) !== String(freelancerId)) {
    throw new AppError('You can only edit your own proposal', 403);
  }
  if (proposal.status !== 'PENDING') throw new AppError('Only pending proposals can be edited', 400);
  for (const key of ['price', 'duration', 'coverLetter']) if (data[key] !== undefined) proposal[key] = data[key];
  await proposal.save();
  return proposal;
}

async function projectOwnedByClient(proposal, clientId) {
  const project = await Project.findById(proposal.projectId);
  if (!project) throw new AppError('Project not found', 404);
  if (String(project.clientId) !== String(clientId)) {
    throw new AppError('Only project owner can do this action', 403);
  }
  return project;
}

export async function shortlistProposal(id, clientId) {
  const proposal = await Proposal.findById(id);
  if (!proposal) throw new AppError('Proposal not found', 404);
  await projectOwnedByClient(proposal, clientId);
  if (proposal.status !== 'PENDING') throw new AppError('Only pending proposals can be shortlisted', 400);
  proposal.status = 'SHORTLISTED';
  await proposal.save();
  return proposal;
}

export async function rejectProposal(id, clientId) {
  const proposal = await Proposal.findById(id);
  if (!proposal) throw new AppError('Proposal not found', 404);
  await projectOwnedByClient(proposal, clientId);
  if (!['PENDING', 'SHORTLISTED'].includes(proposal.status)) throw new AppError('Only pending or shortlisted proposals can be rejected', 400);
  proposal.status = 'REJECTED';
  await proposal.save();
  return proposal;
}

export async function withdrawProposal(id, freelancerId) {
  const proposal = await Proposal.findById(id);
  if (!proposal) throw new AppError('Proposal not found', 404);
  if (String(proposal.freelancerId) !== String(freelancerId)) {
    throw new AppError('You can only withdraw your own proposal', 403);
  }
  if (!['PENDING', 'SHORTLISTED'].includes(proposal.status)) throw new AppError('Only pending or shortlisted proposals can be withdrawn', 400);
  proposal.status = 'WITHDRAWN';
  await proposal.save();
  return proposal;
}

export async function acceptProposal(id, clientId) {
  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      const proposal = await Proposal.findById(id).session(session);
      if (!proposal) throw new AppError('Proposal not found', 404);

      const project = await Project.findById(proposal.projectId).session(session);
      if (!project) throw new AppError('Project not found', 404);
      if (String(project.clientId) !== String(clientId)) {
        throw new AppError('Only project owner can do this action', 403);
      }
      if (!['PENDING', 'SHORTLISTED'].includes(proposal.status)) {
        throw new AppError('Only pending or shortlisted proposals can be accepted', 400);
      }
      if (project.status !== 'OPEN' || project.acceptedProposalId) {
        throw new AppError('Project already has an accepted proposal', 400);
      }

      const commissionRate = 10;
      const commissionAmount = Number((proposal.price * commissionRate / 100).toFixed(2));
      const freelancerAmount = Number((proposal.price - commissionAmount).toFixed(2));

      const [contract] = await Contract.create([{
        projectId: project._id,
        clientId: project.clientId,
        freelancerId: proposal.freelancerId,
        proposalId: proposal._id,
        amount: proposal.price,
        commissionRate,
        commissionAmount,
        freelancerAmount,
        revisionLimit: 2,
        durationDays: proposal.duration,
        deadline: null,
      }], { session });

      proposal.status = 'ACCEPTED';
      project.status = 'AWARDED';
      project.acceptedProposalId = proposal._id;

      await proposal.save({ session });
      await project.save({ session });
      await Proposal.updateMany(
        {
          projectId: project._id,
          _id: { $ne: proposal._id },
          status: { $in: ['PENDING', 'SHORTLISTED'] },
        },
        { status: 'REJECTED' },
        { session },
      );

      result = { proposal, contract };
    });

    return result;
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError('Project already has an accepted proposal', 400);
    }
    throw error;
  } finally {
    await session.endSession();
  }
}
