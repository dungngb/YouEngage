import { prisma } from "@/lib/prisma";
import { engagementChildScopeFilter } from "@/lib/authorization";

export interface NotificationCounts {
  pendingReviews: number;
  rejectedTasks: number;
  openFindings: number;
}

export async function getNotificationCounts(
  userId: string,
  role: string
): Promise<NotificationCounts> {
  const childScope = await engagementChildScopeFilter(userId, role);

  const isManager =
    role === "manager" || role === "chief_auditor" || role === "admin";

  const [pendingReviews, rejectedTasks, openFindings] = await Promise.all([
    // Pending review tasks (relevant for managers)
    isManager
      ? prisma.task.count({
          where: { ...childScope, status: "PENDING_REVIEW" },
        })
      : 0,

    // Rejected tasks assigned to current user (relevant for auditors)
    role === "auditor"
      ? prisma.task.count({
          where: { ...childScope, assigneeId: userId, status: "REJECTED" },
        })
      : 0,

    // Open findings (relevant for managers/chief)
    isManager
      ? prisma.finding.count({
          where: {
            ...childScope,
            status: { in: ["OPEN", "IN_PROGRESS"] },
          },
        })
      : 0,
  ]);

  return { pendingReviews, rejectedTasks, openFindings };
}
