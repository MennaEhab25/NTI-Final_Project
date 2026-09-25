import * as projectService from "./project.service.js";

function currentUserId(req) {
  return req.user?.id || req.headers["x-user-id"];
}

export async function create(req, res, next) {
  try {
    const userId = currentUserId(req);
    if (!userId)
      return res.status(401).json({ message: "User id is required" });
    const project = await projectService.createProject(userId, req.body);
    res
      .status(201)
      .json({ success: true, data: project, message: "Project created" });
  } catch (error) {
    next(error);
  }
}

export async function list(req, res, next) {
  try {
    res.json({
      success: true,
      data: await projectService.getProjects(req.query),
    });
  } catch (error) {
    next(error);
  }
}

export async function mine(req, res, next) {
  try {
    const userId = currentUserId(req);
    if (!userId)
      return res.status(401).json({ message: "User id is required" });
    res.json({
      success: true,
      data: await projectService.getMyProjects(userId),
    });
  } catch (error) {
    next(error);
  }
}

export async function details(req, res, next) {
  try {
    const project = await projectService.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const userId = currentUserId(req);
    const project = await projectService.updateProject(
      req.params.id,
      userId,
      req.body,
    );
    res.json({ success: true, data: project, message: "Project updated" });
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    await projectService.deleteProject(req.params.id, currentUserId(req));
    res.json({ success: true, message: "Project deleted" });
  } catch (error) {
    next(error);
  }
}
