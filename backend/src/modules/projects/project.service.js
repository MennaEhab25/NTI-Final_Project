import Project from './project.model.js';
import { AppError } from '../../utils/errors.js';

export function createProject(clientId, data) {
  return Project.create({ ...data, clientId });
}

export async function getProjects(query) {
  const filter = { status: 'OPEN' };

  if (query.category) filter.category = query.category;
  if (query.minBudget || query.maxBudget) {
    filter.budget = {};
    if (query.minBudget) filter.budget.$gte = Number(query.minBudget);
    if (query.maxBudget) filter.budget.$lte = Number(query.maxBudget);
  }
  if (query.maxDuration) filter.duration = { $lte: Number(query.maxDuration) };
  if (query.skills) {
    const skills = String(query.skills).split(',').filter(Boolean);
    if (skills.length) filter.requiredSkills = { $in: skills };
  }
  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
    ];
  }

  return Project.find(filter).sort({ createdAt: -1 }).lean();
}

export function getProjectById(id) {
  return Project.findById(id).populate('requiredSkills', 'name category').lean();
}

export function getMyProjects(clientId) {
  return Project.find({ clientId }).sort({ createdAt: -1 }).lean();
}

export async function updateProject(id, clientId, data) {
  const project = await Project.findById(id);
  if (!project) throw new AppError('Project not found', 404);
  if (String(project.clientId) !== String(clientId)) {
    throw new AppError('You can only edit your own projects', 403);
  }
  if (['AWARDED', 'IN_PROGRESS', 'COMPLETED'].includes(project.status)) {
    throw new AppError('This project can no longer be edited', 400);
  }

  const allowed = ['title', 'description', 'category', 'requiredSkills', 'budget', 'duration', 'attachments', 'deadline'];
  for (const key of allowed) if (data[key] !== undefined) project[key] = data[key];
  await project.save();
  return project;
}

export async function deleteProject(id, clientId) {
  const project = await Project.findById(id);
  if (!project) throw new AppError('Project not found', 404);
  if (String(project.clientId) !== String(clientId)) {
    throw new AppError('You can only delete your own projects', 403);
  }
  if (project.proposalsCount > 0 || project.status === 'AWARDED') {
    throw new AppError('Project with proposals cannot be deleted', 400);
  }
  await project.deleteOne();
}
