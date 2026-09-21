import Proposal from './proposal.model.js';
import Project from '../projects/project.model.js';
import Contract from '../contracts/contract.model.js';

export async function createProposal(projectId, freelancerId, data) {
  const project = await Project.findById(projectId);
  if (!project) throw Object.assign(new Error('Project not found'), { statusCode: 404 });
  if (project.status !== 'OPEN') throw Object.assign(new Error('Project is not open for proposals'), { statusCode: 400 });
  if (String(project.clientId) === String(freelancerId)) {
    throw Object.assign(new Error('You cannot submit a proposal to your own project'), { statusCode: 400 });
  }

  const proposal = await Proposal.create({
    projectId,
    freelancerId,
    price: data.price,
    duration: data.duration,
    coverLetter: data.coverLetter,
  });

  project.proposalsCount += 1;
  await project.save();
  return proposal;
}

export function getProjectProposals(projectId) {
  return Proposal.find({ projectId }).sort({ createdAt: -1 }).lean();
}

export function getMyProposals(freelancerId) {
  return Proposal.find({ freelancerId }).populate('projectId', 'title budget status').sort({ createdAt: -1 }).lean();
}

export async function updateProposal(id, freelancerId, data) {
  const proposal = await Proposal.findById(id);
  if (!proposal) throw Object.assign(new Error('Proposal not found'), { statusCode: 404 });
  if (String(proposal.freelancerId) !== String(freelancerId)) {
    throw Object.assign(new Error('You can only edit your own proposal'), { statusCode: 403 });
  }
  if (proposal.status !== 'PENDING') throw Object.assign(new Error('Only pending proposals can be edited'), { statusCode: 400 });
  for (const key of ['price', 'duration', 'coverLetter']) if (data[key] !== undefined) proposal[key] = data[key];
  await proposal.save();
  return proposal;
}

async function projectOwnedByClient(proposal, clientId) {
  const project = await Project.findById(proposal.projectId);
  if (!project) throw Object.assign(new Error('Project not found'), { statusCode: 404 });
  if (String(project.clientId) !== String(clientId)) {
    throw Object.assign(new Error('Only project owner can do this action'), { statusCode: 403 });
  }
  return project;
}

export async function shortlistProposal(id, clientId) {
  const proposal = await Proposal.findById(id);
  if (!proposal) throw Object.assign(new Error('Proposal not found'), { statusCode: 404 });
  await projectOwnedByClient(proposal, clientId);
  proposal.status = 'SHORTLISTED';
  await proposal.save();
  return proposal;
}

export async function rejectProposal(id, clientId) {
  const proposal = await Proposal.findById(id);
  if (!proposal) throw Object.assign(new Error('Proposal not found'), { statusCode: 404 });
  await projectOwnedByClient(proposal, clientId);
  if (proposal.status === 'ACCEPTED') throw Object.assign(new Error('Accepted proposal cannot be rejected'), { statusCode: 400 });
  proposal.status = 'REJECTED';
  await proposal.save();
  return proposal;
}

export async function withdrawProposal(id, freelancerId) {
  const proposal = await Proposal.findById(id);
  if (!proposal) throw Object.assign(new Error('Proposal not found'), { statusCode: 404 });
  if (String(proposal.freelancerId) !== String(freelancerId)) {
    throw Object.assign(new Error('You can only withdraw your own proposal'), { statusCode: 403 });
  }
  if (proposal.status === 'ACCEPTED') throw Object.assign(new Error('Accepted proposal cannot be withdrawn'), { statusCode: 400 });
  proposal.status = 'WITHDRAWN';
  await proposal.save();
  return proposal;
}

export async function acceptProposal(id, clientId) {
  const proposal = await Proposal.findById(id);
  if (!proposal) throw Object.assign(new Error('Proposal not found'), { statusCode: 404 });
  const project = await projectOwnedByClient(proposal, clientId);
  if (project.acceptedProposalId) throw Object.assign(new Error('Project already has an accepted proposal'), { statusCode: 400 });

  proposal.status = 'ACCEPTED';
  project.status = 'AWARDED';
  project.acceptedProposalId = proposal._id;

  const commissionRate = 10;
  const commissionAmount = Number((proposal.price * commissionRate / 100).toFixed(2));
  const freelancerAmount = Number((proposal.price - commissionAmount).toFixed(2));

  const contract = await Contract.create({
    projectId: project._id,
    clientId: project.clientId,
    freelancerId: proposal.freelancerId,
    proposalId: proposal._id,
    amount: proposal.price,
    commissionRate,
    commissionAmount,
    freelancerAmount,
    revisionLimit: 2,
    deadline: new Date(Date.now() + proposal.duration * 24 * 60 * 60 * 1000),
  });

  await Promise.all([
    proposal.save(),
    project.save(),
    Proposal.updateMany({ projectId: project._id, _id: { $ne: proposal._id }, status: { $in: ['PENDING', 'SHORTLISTED'] } }, { status: 'REJECTED' }),
  ]);

  return { proposal, contract };
}
