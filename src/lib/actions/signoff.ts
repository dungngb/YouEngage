"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAction } from "@/lib/audit-log";
import { assertEngagementAccess } from "@/lib/authorization";
import { getTranslator } from "@/i18n";

// ============================================================================
// Preparer Signoff
// ============================================================================
// Business rules:
// - Task must be COMPLETED (work finished)
// - Only the task assignee or a manager can do preparer signoff
// - After preparer signoff → task status = PENDING_REVIEW

export async function preparerSignoff(engagementId: string, taskId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await assertEngagementAccess(engagementId, session.user.id, session.user.role);

  const task = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    include: { signoffs: true },
  });

  if (task.engagementId !== engagementId) {
    const t = await getTranslator();
    throw new Error(t("error.taskNotInEngagement"));
  }

  // A2: Only allow preparer signoff from COMPLETED — not directly from REJECTED.
  // Rework flow: REJECTED → auditor changes to COMPLETED → preparer signoff
  if (task.status !== "COMPLETED") {
    const t = await getTranslator();
    throw new Error(
      t("error.preparerStatusRequired") +
        (task.status === "REJECTED" ? " " + t("error.preparerReworkHint") : "")
    );
  }

  // Create signoff record
  await prisma.signoff.create({
    data: {
      taskId,
      type: "PREPARER",
      status: "SIGNED",
      signedById: session.user.id,
    },
  });

  // Update task status
  await prisma.task.update({
    where: { id: taskId },
    data: { status: "PENDING_REVIEW" },
  });

  // Audit log
  await logAction({
    action: "signoff.preparer",
    entityType: "task",
    entityId: taskId,
    userId: session.user.id,
    details: { engagementId, taskTitle: task.title },
  });

  revalidatePath(`/dashboard/engagements/${engagementId}`);
}

// ============================================================================
// Reviewer Signoff (Approve)
// ============================================================================
// Business rules:
// - Task must be PENDING_REVIEW (preparer already signed)
// - Reviewer ≠ Preparer (enforced)
// - After reviewer signoff → task status = APPROVED

export async function reviewerSignoff(engagementId: string, taskId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = session.user.role;
  if (role !== "manager" && role !== "chief_auditor" && role !== "admin") {
    const t = await getTranslator();
    throw new Error(t("error.reviewerRoleRequired"));
  }

  await assertEngagementAccess(engagementId, session.user.id, role);

  const task = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    include: {
      signoffs: {
        where: { type: "PREPARER", status: "SIGNED" },
        orderBy: { signedAt: "desc" },
        take: 1,
      },
    },
  });

  if (task.engagementId !== engagementId) {
    const t = await getTranslator();
    throw new Error(t("error.taskNotInEngagement"));
  }

  if (task.status !== "PENDING_REVIEW") {
    const t = await getTranslator();
    throw new Error(t("error.reviewerStatusRequired"));
  }

  // Preparer ≠ Reviewer check
  const lastPreparerSignoff = task.signoffs[0];
  if (!lastPreparerSignoff) {
    const t = await getTranslator();
    throw new Error(t("error.preparerMissing"));
  }

  if (lastPreparerSignoff.signedById === session.user.id) {
    const t = await getTranslator();
    throw new Error(t("error.preparerReviewerSame"));
  }

  // Create signoff record
  await prisma.signoff.create({
    data: {
      taskId,
      type: "REVIEWER",
      status: "SIGNED",
      signedById: session.user.id,
    },
  });

  // Update task status
  await prisma.task.update({
    where: { id: taskId },
    data: { status: "APPROVED" },
  });

  // Audit log
  await logAction({
    action: "signoff.reviewer.approve",
    entityType: "task",
    entityId: taskId,
    userId: session.user.id,
    details: { engagementId, taskTitle: task.title },
  });

  revalidatePath(`/dashboard/engagements/${engagementId}`);
}

// ============================================================================
// Reviewer Reject
// ============================================================================
// Business rules:
// - Task must be PENDING_REVIEW
// - Reviewer ≠ Preparer
// - Must provide review comment
// - After rejection → task status = REJECTED (auditor must rework)

export async function rejectSignoff(
  engagementId: string,
  taskId: string,
  comment: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = session.user.role;
  if (role !== "manager" && role !== "chief_auditor" && role !== "admin") {
    const t = await getTranslator();
    throw new Error(t("error.rejectRoleRequired"));
  }

  if (!comment || comment.trim().length === 0) {
    const t = await getTranslator();
    throw new Error(t("error.rejectReasonRequired"));
  }

  await assertEngagementAccess(engagementId, session.user.id, role);

  const task = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    include: {
      signoffs: {
        where: { type: "PREPARER", status: "SIGNED" },
        orderBy: { signedAt: "desc" },
        take: 1,
      },
    },
  });

  if (task.engagementId !== engagementId) {
    const t = await getTranslator();
    throw new Error(t("error.taskNotInEngagement"));
  }

  if (task.status !== "PENDING_REVIEW") {
    const t = await getTranslator();
    throw new Error(t("error.reviewerStatusRequired"));
  }

  // Preparer ≠ Reviewer check
  const lastPreparerSignoff = task.signoffs[0];
  if (lastPreparerSignoff && lastPreparerSignoff.signedById === session.user.id) {
    const t = await getTranslator();
    throw new Error(t("error.preparerReviewerSame"));
  }

  // Create rejection record
  await prisma.signoff.create({
    data: {
      taskId,
      type: "REVIEWER",
      status: "REJECTED",
      signedById: session.user.id,
      comment: comment.trim(),
    },
  });

  // Update task status back to REJECTED
  await prisma.task.update({
    where: { id: taskId },
    data: { status: "REJECTED" },
  });

  // Audit log
  await logAction({
    action: "signoff.reviewer.reject",
    entityType: "task",
    entityId: taskId,
    userId: session.user.id,
    details: { engagementId, taskTitle: task.title, comment: comment.trim() },
  });

  revalidatePath(`/dashboard/engagements/${engagementId}`);
}
