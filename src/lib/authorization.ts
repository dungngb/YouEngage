import { prisma } from "@/lib/prisma";
import { getTranslator } from "@/i18n";

/**
 * Returns a Prisma `where` filter for engagement-scoped queries.
 * - admin / chief_auditor → {} (no filter, see everything)
 * - manager / auditor     → { id: { in: [...memberEngagementIds] } }
 */
export async function engagementScopeFilter(
  userId: string,
  userRole: string
): Promise<{ id?: { in: string[] } }> {
  if (userRole === "admin" || userRole === "chief_auditor") return {};

  const memberships = await prisma.engagementMember.findMany({
    where: { userId },
    select: { engagementId: true },
  });

  return { id: { in: memberships.map((m) => m.engagementId) } };
}

/**
 * Returns engagementId IN filter for child entities (tasks, findings, etc.).
 * - admin / chief_auditor → {} (no filter)
 * - manager / auditor     → { engagementId: { in: [...] } }
 */
export async function engagementChildScopeFilter(
  userId: string,
  userRole: string
): Promise<{ engagementId?: { in: string[] } }> {
  if (userRole === "admin" || userRole === "chief_auditor") return {};

  const memberships = await prisma.engagementMember.findMany({
    where: { userId },
    select: { engagementId: true },
  });

  return { engagementId: { in: memberships.map((m) => m.engagementId) } };
}

/**
 * Check if a user is a member of the given engagement (or is admin).
 * Throws an error if not authorized.
 */
export async function assertEngagementAccess(
  engagementId: string,
  userId: string,
  userRole: string
): Promise<void> {
  // Admin and Chief Auditor can access all engagements
  if (userRole === "admin" || userRole === "chief_auditor") return;

  const member = await prisma.engagementMember.findUnique({
    where: {
      engagementId_userId: { engagementId, userId },
    },
  });

  if (!member) {
    const t = await getTranslator();
    throw new Error(t("error.engagementNotMember"));
  }
}

/**
 * Check if user has manager-level role (manager, chief_auditor, admin).
 */
export function assertManagerRole(userRole: string): void {
  if (
    userRole !== "manager" &&
    userRole !== "chief_auditor" &&
    userRole !== "admin"
  ) {
    throw new Error("Unauthorized");
  }
}
