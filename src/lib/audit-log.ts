import { prisma } from "@/lib/prisma";

export async function logAction(params: {
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  details?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      userId: params.userId,
      details: params.details ? JSON.stringify(params.details) : null,
    },
  });
}
