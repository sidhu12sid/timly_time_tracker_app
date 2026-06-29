import { prisma } from "../lib/prisma.js";

export function listClients(userId: string) {
  return prisma.client.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: { projects: true },
  });
}

export function createClient(userId: string, data: { name: string }) {
  return prisma.client.create({
    data: { userId, name: data.name },
  });
}

// Scoped to the owner. Returns the updated row or null if not found / not owned.
export async function updateClient(userId: string, id: string, data: { name: string }) {
  const { count } = await prisma.client.updateMany({ where: { id, userId }, data });
  if (count === 0) return null;
  return prisma.client.findUnique({ where: { id } });
}

// Scoped to the owner. Cascades to the client's projects and their time entries.
// Returns the number of rows deleted (0 if not found / not owned).
export async function deleteClient(userId: string, id: string) {
  const { count } = await prisma.client.deleteMany({ where: { id, userId } });
  return count;
}
