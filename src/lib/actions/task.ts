"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { logAction } from "@/lib/audit-log";
import {
  assertEngagementAccess,
  assertManagerRole,
} from "@/lib/authorization";
import { getTranslator } from "@/i18n";

const CreateTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["TASK", "WORKPAPER"]).default("TASK"),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]).optional(),
});

export async function createTask(engagementId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // Only managers can create tasks
  assertManagerRole(session.user.role);
  await assertEngagementAccess(engagementId, session.user.id, session.user.role);

  const parsed = CreateTaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    type: formData.get("type") || "TASK",
    assigneeId: formData.get("assigneeId") || undefined,
    dueDate: formData.get("dueDate") || undefined,
  });

  if (!parsed.success) {
    throw new Error(
      Object.values(parsed.error.flatten().fieldErrors).flat().join(", ")
    );
  }

  const data = parsed.data;

  // If assigning, verify assignee is engagement member
  if (data.assigneeId) {
    const isMember = await prisma.engagementMember.findUnique({
      where: {
        engagementId_userId: {
          engagementId,
          userId: data.assigneeId,
        },
      },
    });
    if (!isMember) {
      const t = await getTranslator();
      throw new Error(t("error.assigneeNotMember"));
    }
  }

  const maxSort = await prisma.task.aggregate({
    where: { engagementId },
    _max: { sortOrder: true },
  });

  const task = await prisma.task.create({
    data: {
      engagementId,
      title: data.title,
      description: data.description || null,
      type: data.type,
      assigneeId: data.assigneeId || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
    },
  });

  await logAction({
    action: "task.create",
    entityType: "task",
    entityId: task.id,
    userId: session.user.id,
    details: {
      engagementId,
      title: task.title,
      type: task.type,
      assigneeId: task.assigneeId,
    },
  });

  revalidatePath(`/dashboard/engagements/${engagementId}`);
  redirect(`/dashboard/engagements/${engagementId}`);
}

export async function updateTask(
  engagementId: string,
  taskId: string,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await assertEngagementAccess(engagementId, session.user.id, session.user.role);

  const task = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
  });

  if (task.engagementId !== engagementId) {
    const t = await getTranslator();
    throw new Error(t("error.taskNotInEngagement"));
  }

  // A1: Lock task when PENDING_REVIEW or APPROVED — no edits allowed
  if (task.status === "PENDING_REVIEW" || task.status === "APPROVED") {
    const t = await getTranslator();
    throw new Error(t("error.taskLocked"));
  }

  // Only managers can edit, or assignee can edit own task
  const canManage =
    session.user.role === "manager" ||
    session.user.role === "chief_auditor" ||
    session.user.role === "admin";
  if (!canManage && task.assigneeId !== session.user.id) {
    const t = await getTranslator();
    throw new Error(t("error.taskEditDenied"));
  }

  const parsed = UpdateTaskSchema.safeParse({
    title: formData.get("title") || undefined,
    description: formData.get("description"),
    type: formData.get("type") || undefined,
    status: formData.get("status") || undefined,
    assigneeId: formData.get("assigneeId") || undefined,
    dueDate: formData.get("dueDate") || undefined,
  });

  if (!parsed.success) {
    throw new Error(
      Object.values(parsed.error.flatten().fieldErrors).flat().join(", ")
    );
  }

  const data = parsed.data;

  // Track assignment change for audit log
  const oldAssigneeId = task.assigneeId;
  const newAssigneeId =
    data.assigneeId !== undefined ? data.assigneeId || null : undefined;

  await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && {
        description: data.description || null,
      }),
      ...(data.type && { type: data.type }),
      ...(data.status && { status: data.status }),
      ...(data.assigneeId !== undefined && {
        assigneeId: data.assigneeId || null,
      }),
      ...(data.dueDate !== undefined && {
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      }),
    },
  });

  await logAction({
    action: "task.update",
    entityType: "task",
    entityId: taskId,
    userId: session.user.id,
    details: { engagementId, title: task.title, changes: data },
  });

  // Log assignment change separately if it changed
  if (
    newAssigneeId !== undefined &&
    newAssigneeId !== oldAssigneeId
  ) {
    await logAction({
      action: "task.assignment_change",
      entityType: "task",
      entityId: taskId,
      userId: session.user.id,
      details: {
        engagementId,
        taskTitle: task.title,
        from: oldAssigneeId,
        to: newAssigneeId,
      },
    });
  }

  revalidatePath(`/dashboard/engagements/${engagementId}`);
}

export async function updateTaskStatus(
  engagementId: string,
  taskId: string,
  status: "TODO" | "IN_PROGRESS" | "COMPLETED"
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await assertEngagementAccess(engagementId, session.user.id, session.user.role);

  const task = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
  });

  if (task.engagementId !== engagementId) {
    const t = await getTranslator();
    throw new Error(t("error.taskNotInEngagement"));
  }

  // A1: Lock task when PENDING_REVIEW or APPROVED — no manual status change
  if (task.status === "PENDING_REVIEW" || task.status === "APPROVED") {
    const t = await getTranslator();
    throw new Error(t("error.taskLockedStatus"));
  }

  // Only managers or the assignee can change status
  const canManage =
    session.user.role === "manager" ||
    session.user.role === "chief_auditor" ||
    session.user.role === "admin";
  if (!canManage && task.assigneeId !== session.user.id) {
    const t = await getTranslator();
    throw new Error(t("error.taskStatusDenied"));
  }

  const oldStatus = task.status;

  await prisma.task.update({
    where: { id: taskId },
    data: { status },
  });

  await logAction({
    action: "task.status_change",
    entityType: "task",
    entityId: taskId,
    userId: session.user.id,
    details: {
      engagementId,
      taskTitle: task.title,
      from: oldStatus,
      to: status,
    },
  });

  revalidatePath(`/dashboard/engagements/${engagementId}`);
}

export async function deleteTask(engagementId: string, taskId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  assertManagerRole(session.user.role);
  await assertEngagementAccess(engagementId, session.user.id, session.user.role);

  const task = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
  });

  if (task.engagementId !== engagementId) {
    const t = await getTranslator();
    throw new Error(t("error.taskNotInEngagement"));
  }

  // Cannot delete tasks in signoff flow
  if (task.status === "APPROVED" || task.status === "PENDING_REVIEW") {
    const t = await getTranslator();
    throw new Error(t("error.taskDeleteLocked"));
  }

  await prisma.task.delete({ where: { id: taskId } });

  await logAction({
    action: "task.delete",
    entityType: "task",
    entityId: taskId,
    userId: session.user.id,
    details: { engagementId, title: task.title },
  });

  revalidatePath(`/dashboard/engagements/${engagementId}`);
}

// ============================================================================
// A1: Reopen Task (Manager/Chief Auditor only)
// ============================================================================
// Allows reopening a PENDING_REVIEW or APPROVED task back to IN_PROGRESS.
// Requires a reason comment. Invalidates the last reviewer signoff cycle.

export async function reopenTask(
  engagementId: string,
  taskId: string,
  reason: string
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  assertManagerRole(session.user.role);
  await assertEngagementAccess(engagementId, session.user.id, session.user.role);

  if (!reason || reason.trim().length === 0) {
    const t = await getTranslator();
    throw new Error(t("error.reopenReasonRequired"));
  }

  const task = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
  });

  if (task.engagementId !== engagementId) {
    const t = await getTranslator();
    throw new Error(t("error.taskNotInEngagement"));
  }

  if (task.status !== "PENDING_REVIEW" && task.status !== "APPROVED") {
    const t = await getTranslator();
    throw new Error(t("error.reopenOnlySignoff"));
  }

  const oldStatus = task.status;

  // Invalidate the latest signoff cycle by marking reviewer signoffs as voided
  await prisma.signoff.create({
    data: {
      taskId,
      type: "REVIEWER",
      status: "REJECTED",
      signedById: session.user.id,
      comment: `[REOPEN] ${reason.trim()}`,
    },
  });

  // Set task back to IN_PROGRESS
  await prisma.task.update({
    where: { id: taskId },
    data: { status: "IN_PROGRESS" },
  });

  await logAction({
    action: "task.reopen",
    entityType: "task",
    entityId: taskId,
    userId: session.user.id,
    details: {
      engagementId,
      taskTitle: task.title,
      from: oldStatus,
      to: "IN_PROGRESS",
      reason: reason.trim(),
    },
  });

  revalidatePath(`/dashboard/engagements/${engagementId}`);
}

export async function deleteAttachment(
  engagementId: string,
  attachmentId: string
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await assertEngagementAccess(engagementId, session.user.id, session.user.role);

  const attachment = await prisma.attachment.findUniqueOrThrow({
    where: { id: attachmentId },
    include: {
      task: { select: { status: true } },
      report: { select: { status: true } },
      finding: { select: { status: true } },
    },
  });

  // Lock checks: cannot delete attachments on locked tasks, issued reports, closed findings
  if (attachment.task?.status === "APPROVED" || attachment.task?.status === "PENDING_REVIEW") {
    const t = await getTranslator();
    throw new Error(t("validation.locked.attachmentSignoff"));
  }
  if (attachment.report?.status === "ISSUED") {
    const t = await getTranslator();
    throw new Error(t("validation.locked.attachmentIssued"));
  }
  if (attachment.finding?.status === "CLOSED") {
    const t = await getTranslator();
    throw new Error(t("validation.locked.attachmentClosed"));
  }

  // Delete file from Vercel Blob storage
  try {
    const { del } = await import("@vercel/blob");
    await del(attachment.storagePath);
  } catch {
    // File may already be deleted from storage
  }

  await prisma.attachment.delete({ where: { id: attachmentId } });

  await logAction({
    action: "file.delete",
    entityType: "attachment",
    entityId: attachmentId,
    userId: session.user.id,
    details: {
      engagementId,
      originalName: attachment.originalName,
      category: attachment.category,
    },
  });

  revalidatePath(`/dashboard/engagements/${engagementId}`);
}
