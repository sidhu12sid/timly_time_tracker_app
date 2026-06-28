import { prisma } from "../lib/prisma.js";

export function listProjects(userId: string) {
  return prisma.project.findMany({
    where: { client: { userId } },
    orderBy: { name: "asc" },
    include: { client: true },
  });
}

// Fetch a project with its client so the rate (client default) can be resolved
// in the service layer.
export function getProjectForRateResolution(projectId: string, userId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, client: { userId } },
    include: { client: true },
  });
}

export function createProject(data: {
  clientId: string;
  name: string;
  isBillableDefault: boolean;
}) {
  return prisma.project.create({ data });
}

// Scoped to the owner (via the project's client). Returns the updated row or
// null if not found / not owned.
export async function updateProject(
  userId: string,
  id: string,
  data: { name: string; isBillableDefault: boolean },
) {
  const { count } = await prisma.project.updateMany({
    where: { id, client: { userId } },
    data,
  });
  if (count === 0) return null;
  return prisma.project.findUnique({ where: { id }, include: { client: true } });
}

// Scoped to the owner (via the project's client). Cascades to time entries.
export async function deleteProject(userId: string, id: string) {
  const { count } = await prisma.project.deleteMany({
    where: { id, client: { userId } },
  });
  return count;
}
