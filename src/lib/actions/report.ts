"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { ReportStatus } from "@prisma/client";
import { logAction } from "@/lib/audit-log";
import {
  assertEngagementAccess,
  assertManagerRole,
} from "@/lib/authorization";
import { getTranslator } from "@/i18n";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const CreateReportSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

const UpdateReportSchema = CreateReportSchema.partial();

// ---------------------------------------------------------------------------
// Valid status transitions
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  DRAFT: [ReportStatus.REVIEW],
  REVIEW: [ReportStatus.FINAL, ReportStatus.DRAFT],
  FINAL: [ReportStatus.ISSUED, ReportStatus.REVIEW],
  ISSUED: [], // locked — no transitions
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function createReport(engagementId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  assertManagerRole(session.user.role);
  await assertEngagementAccess(engagementId, session.user.id, session.user.role);

  const parsed = CreateReportSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    throw new Error(
      Object.values(parsed.error.flatten().fieldErrors).flat().join(", ")
    );
  }

  const report = await prisma.report.create({
    data: {
      engagementId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      createdById: session.user.id,
    },
  });

  await logAction({
    action: "report.create",
    entityType: "report",
    entityId: report.id,
    userId: session.user.id,
    details: { title: report.title, engagementId },
  });

  redirect(`/dashboard/engagements/${engagementId}/reports/${report.id}`);
}

export async function updateReport(
  engagementId: string,
  reportId: string,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  assertManagerRole(session.user.role);
  await assertEngagementAccess(engagementId, session.user.id, session.user.role);

  const report = await prisma.report.findUniqueOrThrow({
    where: { id: reportId },
  });

  if (report.status === ReportStatus.ISSUED) {
    const t = await getTranslator();
    throw new Error(t("validation.locked.reportIssued"));
  }

  const parsed = UpdateReportSchema.safeParse({
    title: formData.get("title") || undefined,
    description: formData.get("description"),
  });

  if (!parsed.success) {
    throw new Error(
      Object.values(parsed.error.flatten().fieldErrors).flat().join(", ")
    );
  }

  const data = parsed.data;

  await prisma.report.update({
    where: { id: reportId },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && {
        description: data.description || null,
      }),
    },
  });

  await logAction({
    action: "report.update",
    entityType: "report",
    entityId: reportId,
    userId: session.user.id,
    details: { engagementId, changes: data },
  });

  revalidatePath(`/dashboard/engagements/${engagementId}/reports/${reportId}`);
  redirect(`/dashboard/engagements/${engagementId}/reports/${reportId}`);
}

export async function updateReportStatus(
  engagementId: string,
  reportId: string,
  newStatus: ReportStatus,
  reason?: string
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  assertManagerRole(session.user.role);
  await assertEngagementAccess(engagementId, session.user.id, session.user.role);

  const report = await prisma.report.findUniqueOrThrow({
    where: { id: reportId },
  });

  const allowed = VALID_TRANSITIONS[report.status];
  if (!allowed.includes(newStatus)) {
    const t = await getTranslator();
    throw new Error(
      t("validation.invalidTransition", { from: report.status, to: newStatus })
    );
  }

  // B3: Backward transitions require a reason
  const statusOrder: ReportStatus[] = ["DRAFT", "REVIEW", "FINAL", "ISSUED"];
  const isBackward =
    statusOrder.indexOf(newStatus) < statusOrder.indexOf(report.status);
  if (isBackward && (!reason || reason.trim().length === 0)) {
    const t = await getTranslator();
    throw new Error(t("error.rollbackReasonRequired"));
  }

  // B2: Report issuance gate — validate before ISSUED
  if (newStatus === ReportStatus.ISSUED) {
    // Check engagement status is REPORTING
    const engagement = await prisma.engagement.findUniqueOrThrow({
      where: { id: engagementId },
      include: {
        tasks: { select: { id: true, status: true } },
      },
    });

    const t = await getTranslator();
    const errors: string[] = [];

    if (engagement.status !== "REPORTING") {
      errors.push(t("error.gate.notReporting"));
    }

    if (engagement.tasks.length === 0) {
      errors.push(t("error.gate.missingTasks"));
    } else {
      const unapproved = engagement.tasks.filter(
        (task) => task.status !== "APPROVED"
      ).length;
      if (unapproved > 0) {
        errors.push(
          t("error.gate.tasksNotApproved", { count: unapproved })
        );
      }
    }

    if (errors.length > 0) {
      throw new Error(
        t("error.gate.issuanceTitle") + "\n• " + errors.join("\n• ")
      );
    }
  }

  await prisma.report.update({
    where: { id: reportId },
    data: { status: newStatus },
  });

  await logAction({
    action: isBackward ? "report.status_rollback" : "report.status_change",
    entityType: "report",
    entityId: reportId,
    userId: session.user.id,
    details: {
      from: report.status,
      to: newStatus,
      reportTitle: report.title,
      ...(reason ? { reason: reason.trim() } : {}),
    },
  });

  revalidatePath(`/dashboard/engagements/${engagementId}/reports/${reportId}`);
}

export async function deleteReport(engagementId: string, reportId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  assertManagerRole(session.user.role);
  await assertEngagementAccess(engagementId, session.user.id, session.user.role);

  const report = await prisma.report.findUniqueOrThrow({
    where: { id: reportId },
  });

  if (report.status === ReportStatus.ISSUED) {
    const t = await getTranslator();
    throw new Error(t("validation.locked.reportDelete"));
  }

  await prisma.report.delete({ where: { id: reportId } });

  await logAction({
    action: "report.delete",
    entityType: "report",
    entityId: reportId,
    userId: session.user.id,
    details: { title: report.title },
  });

  redirect(`/dashboard/engagements/${engagementId}`);
}
