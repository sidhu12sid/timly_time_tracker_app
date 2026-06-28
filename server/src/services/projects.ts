import * as projectsData from "../data/projects.js";
import { HttpError } from "../lib/httpError.js";
import type { CreateProjectInput, UpdateProjectInput } from "../schemas/index.js";

export function listProjects(userId: string) {
  return projectsData.listProjects(userId);
}

export function createProject(input: CreateProjectInput) {
  return projectsData.createProject({
    clientId: input.clientId,
    name: input.name,
    isBillableDefault: input.isBillableDefault ?? true,
  });
}

export async function updateProject(userId: string, id: string, input: UpdateProjectInput) {
  const updated = await projectsData.updateProject(userId, id, {
    name: input.name,
    isBillableDefault: input.isBillableDefault ?? true,
  });
  if (!updated) throw new HttpError(404, "Project not found");
  return updated;
}

export async function deleteProject(userId: string, id: string) {
  const count = await projectsData.deleteProject(userId, id);
  if (count === 0) throw new HttpError(404, "Project not found");
}
