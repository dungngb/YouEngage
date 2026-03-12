"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { EngagementStatus } from "@prisma/client";
import { logAction } from "@/lib/audit-log";
import {
  assertEngagementAccess,
  assertManagerRole,
} from "@/lib/authorization";
import { getTranslator } from "@/i18n";

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const CreateEngagementSchema = z.object({
  name: z.string().min(1),
  auditedEntity: z.string().min(1),
  description: z.string().optional(),
  scope: z.string().optional(),
  fiscalYear: z.coerce.number().int().optional(),
  plannedStart: z.string().optional(),
  plannedEnd: z.string().optional(),
});

const UpdateEngagementSchema = CreateEngagementSchema.partial();

// ---------------------------------------------------------------------------
// Valid status transitions
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<EngagementStatus, EngagementStatus[]> = {
  DRAFT: [EngagementStatus.ACTIVE],
  ACTIVE: [EngagementStatus.FIELDWORK, EngagementStatus.DRAFT],
  FIELDWORK: [EngagementStatus.REPORTING, EngagementStatus.ACTIVE],
  REPORTING: [EngagementStatus.CLOSED, EngagementStatus.FIELDWORK],
  CLOSED: [],
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function createEngagement(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  assertManagerRole(session.user.role);

  const parsed = CreateEngagementSchema.safeParse({
    name: formData.get("name"),
    auditedEntity: formData.get("auditedEntity"),
    description: formData.get("description"),
    scope: formData.get("scope"),
    fiscalYear: formData.get("fiscalYear") || undefined,
    plannedStart: formData.get("plannedStart") || undefined,
    plannedEnd: formData.get("plannedEnd") || undefined,
  });

  if (!parsed.success) {
    throw new Error(
      Object.values(parsed.error.flatten().fieldErrors).flat().join(", ")
    );
  }

  const data = parsed.data;

  const engagement = await prisma.engagement.create({
    data: {
      name: data.name,
      auditedEntity: data.auditedEntity,
      description: data.description || null,
      scope: data.scope || null,
      fiscalYear: data.fiscalYear || null,
      plannedStart: data.plannedStart ? new Date(data.plannedStart) : null,
      plannedEnd: data.plannedEnd ? new Date(data.plannedEnd) : null,
      members: {
        create: {
          userId: session.user.id,
          role: "lead",
        },
      },
    },
  });

  await logAction({
    action: "engagement.create",
    entityType: "engagement",
    entityId: engagement.id,
    userId: session.user.id,
    details: {
      name: engagement.name,
      auditedEntity: engagement.auditedEntity,
    },
  });

  redirect(`/dashboard/engagements/${engagement.id}`);
}

export async function updateEngagement(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  assertManagerRole(session.user.role);
  await assertEngagementAccess(id, session.user.id, session.user.role);

  const parsed = UpdateEngagementSchema.safeParse({
    name: formData.get("name") || undefined,
    auditedEntity: formData.get("auditedEntity") || undefined,
    description: formData.get("description"),
    scope: formData.get("scope"),
    fiscalYear: formData.get("fiscalYear") || undefined,
    plannedStart: formData.get("plannedStart") || undefined,
    plannedEnd: formData.get("plannedEnd") || undefined,
  });

  if (!parsed.success) {
    throw new Error(
      Object.values(parsed.error.flatten().fieldErrors).flat().join(", ")
    );
  }

  const data = parsed.data;

  await prisma.engagement.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.auditedEntity && { auditedEntity: data.auditedEntity }),
      description: data.description ?? undefined,
      scope: data.scope ?? undefined,
      ...(data.fiscalYear && { fiscalYear: data.fiscalYear }),
      ...(data.plannedStart && { plannedStart: new Date(data.plannedStart) }),
      ...(data.plannedEnd && { plannedEnd: new Date(data.plannedEnd) }),
    },
  });

  await logAction({
    action: "engagement.update",
    entityType: "engagement",
    entityId: id,
    userId: session.user.id,
    details: { changes: data },
  });

  revalidatePath(`/dashboard/engagements/${id}`);
  redirect(`/dashboard/engagements/${id}`);
}

export async function updateEngagementStatus(
  id: string,
  newStatus: EngagementStatus,
  reason?: string
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  assertManagerRole(session.user.role);
  await assertEngagementAccess(id, session.user.id, session.user.role);

  const engagement = await prisma.engagement.findUniqueOrThrow({
    where: { id },
  });

  const allowed = VALID_TRANSITIONS[engagement.status];
  if (!allowed.includes(newStatus)) {
    const t = await getTranslator();
    throw new Error(
      t("validation.invalidTransition", { from: engagement.status, to: newStatus })
    );
  }

  // B3: Backward transitions require a reason
  const statusOrder: EngagementStatus[] = ["DRAFT", "ACTIVE", "FIELDWORK", "REPORTING", "CLOSED"];
  const isBackward =
    statusOrder.indexOf(newStatus) < statusOrder.indexOf(engagement.status);
  if (isBackward && (!reason || reason.trim().length === 0)) {
    const t = await getTranslator();
    throw new Error(t("error.rollbackReasonRequired"));
  }

  // B1: Planning gate — validate before entering FIELDWORK
  if (newStatus === EngagementStatus.FIELDWORK) {
    const engagementDetail = await prisma.engagement.findUniqueOrThrow({
      where: { id },
      include: {
        members: {
          include: { user: { select: { id: true, email: true } } },
        },
        tasks: { select: { id: true } },
      },
    });

    const t = await getTranslator();
    const errors: string[] = [];

    if (!engagementDetail.description || engagementDetail.description.trim().length === 0) {
      errors.push(t("error.gate.missingDescription"));
    }
    if (!engagementDetail.scope || engagementDetail.scope.trim().length === 0) {
      errors.push(t("error.gate.missingScope"));
    }

    // Check for manager-level member
    // We need to check user roles — look up member user roles
    const memberUserIds = engagementDetail.members.map((m) => m.userId);
    const memberUsers = await prisma.user.findMany({
      where: { id: { in: memberUserIds } },
      select: { id: true, roleId: true },
    });
    const roles = await prisma.role.findMany({
      where: { id: { in: memberUsers.filter((u) => u.roleId).map((u) => u.roleId!) } },
      select: { id: true, name: true },
    });
    const roleMap = new Map(roles.map((r) => [r.id, r.name]));
    const memberRoles = memberUsers.map((u) => ({
      userId: u.id,
      roleName: u.roleId ? roleMap.get(u.roleId) || "auditor" : "auditor",
    }));

    const hasManager = memberRoles.some(
      (m) => m.roleName === "manager" || m.roleName === "chief_auditor" || m.roleName === "admin"
    );
    const hasAuditor = memberRoles.some(
      (m) => m.roleName === "auditor"
    );

    if (!hasManager) {
      errors.push(t("error.gate.missingManager"));
    }
    if (!hasAuditor) {
      errors.push(t("error.gate.missingAuditor"));
    }
    if (engagementDetail.tasks.length === 0) {
      errors.push(t("error.gate.missingTasks"));
    }

    if (errors.length > 0) {
      throw new Error(
        t("error.gate.planningTitle") + "\n• " + errors.join("\n• ")
      );
    }
  }

  // Close validation: all tasks must be APPROVED before closing
  if (newStatus === EngagementStatus.CLOSED) {
    const taskCounts = await prisma.task.groupBy({
      by: ["status"],
      where: { engagementId: id },
      _count: true,
    });

    const totalTasks = taskCounts.reduce((sum, g) => sum + g._count, 0);
    const approvedTasks =
      taskCounts.find((g) => g.status === "APPROVED")?._count ?? 0;

    if (totalTasks === 0) {
      const t = await getTranslator();
      throw new Error(t("error.gate.closeNoTasks"));
    }

    if (approvedTasks < totalTasks) {
      const unapproved = totalTasks - approvedTasks;
      const t = await getTranslator();
      throw new Error(t("error.gate.closeUnapproved", { count: unapproved }));
    }
  }

  await prisma.engagement.update({
    where: { id },
    data: { status: newStatus },
  });

  await logAction({
    action: isBackward ? "engagement.status_rollback" : "engagement.status_change",
    entityType: "engagement",
    entityId: id,
    userId: session.user.id,
    details: {
      from: engagement.status,
      to: newStatus,
      engagementName: engagement.name,
      ...(reason ? { reason: reason.trim() } : {}),
    },
  });

  revalidatePath(`/dashboard/engagements/${id}`);
}

export async function addEngagementMember(
  engagementId: string,
  userId: string,
  memberRole: string = "member"
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  assertManagerRole(session.user.role);
  await assertEngagementAccess(
    engagementId,
    session.user.id,
    session.user.role
  );

  await prisma.engagementMember.upsert({
    where: {
      engagementId_userId: { engagementId, userId },
    },
    update: { role: memberRole },
    create: {
      engagementId,
      userId,
      role: memberRole,
    },
  });

  // Fetch user info for audit log
  const addedUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  await logAction({
    action: "engagement.member_add",
    entityType: "engagement",
    entityId: engagementId,
    userId: session.user.id,
    details: {
      addedUserId: userId,
      addedUserName: addedUser?.name || addedUser?.email,
      memberRole,
    },
  });

  revalidatePath(`/dashboard/engagements/${engagementId}`);
}

export async function removeEngagementMember(
  engagementId: string,
  userId: string
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  assertManagerRole(session.user.role);
  await assertEngagementAccess(
    engagementId,
    session.user.id,
    session.user.role
  );

  // Fetch user info for audit log before deletion
  const removedUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  await prisma.engagementMember.delete({
    where: {
      engagementId_userId: { engagementId, userId },
    },
  });

  await logAction({
    action: "engagement.member_remove",
    entityType: "engagement",
    entityId: engagementId,
    userId: session.user.id,
    details: {
      removedUserId: userId,
      removedUserName: removedUser?.name || removedUser?.email,
    },
  });

  revalidatePath(`/dashboard/engagements/${engagementId}`);
}

export async function deleteEngagement(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  assertManagerRole(session.user.role);
  await assertEngagementAccess(id, session.user.id, session.user.role);

  const engagement = await prisma.engagement.findUniqueOrThrow({
    where: { id },
  });

  if (engagement.status !== EngagementStatus.DRAFT) {
    const t = await getTranslator();
    throw new Error(t("validation.locked.engagementDelete"));
  }

  await prisma.engagement.delete({ where: { id } });

  await logAction({
    action: "engagement.delete",
    entityType: "engagement",
    entityId: id,
    userId: session.user.id,
    details: { name: engagement.name },
  });

  redirect("/dashboard/engagements");
}
