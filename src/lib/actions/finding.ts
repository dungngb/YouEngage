"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { FindingStatus } from "@prisma/client";
import { logAction } from "@/lib/audit-log";
import { assertEngagementAccess } from "@/lib/authorization";
import { getTranslator } from "@/i18n";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const CreateFindingSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  riskRating: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  recommendation: z.string().optional(),
  dueDate: z.string().optional(),
});

const UpdateFindingSchema = CreateFindingSchema.partial().extend({
  managementResponse: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Valid status transitions
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<FindingStatus, FindingStatus[]> = {
  OPEN: [FindingStatus.IN_PROGRESS],
  IN_PROGRESS: [FindingStatus.REMEDIATED, FindingStatus.OPEN],
  REMEDIATED: [FindingStatus.CLOSED, FindingStatus.IN_PROGRESS],
  CLOSED: [], // closed findings cannot transition
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function createFinding(
  engagementId: string,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await assertEngagementAccess(engagementId, session.user.id, session.user.role);

  const parsed = CreateFindingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    riskRating: formData.get("riskRating") || "MEDIUM",
    recommendation: formData.get("recommendation") || undefined,
    dueDate: formData.get("dueDate") || undefined,
  });

  if (!parsed.success) {
    throw new Error(
      Object.values(parsed.error.flatten().fieldErrors).flat().join(", ")
    );
  }

  const data = parsed.data;

  const finding = await prisma.finding.create({
    data: {
      engagementId,
      title: data.title,
      description: data.description || null,
      riskRating: data.riskRating,
      recommendation: data.recommendation || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      createdById: session.user.id,
    },
  });

  await logAction({
    action: "finding.create",
    entityType: "finding",
    entityId: finding.id,
    userId: session.user.id,
    details: {
      title: finding.title,
      riskRating: finding.riskRating,
      engagementId,
    },
  });

  redirect(
    `/dashboard/engagements/${engagementId}/findings/${finding.id}`
  );
}

export async function updateFinding(
  engagementId: string,
  findingId: string,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await assertEngagementAccess(engagementId, session.user.id, session.user.role);

  const finding = await prisma.finding.findUniqueOrThrow({
    where: { id: findingId },
  });

  if (finding.status === FindingStatus.CLOSED) {
    const t = await getTranslator();
    throw new Error(t("validation.locked.findingClosed"));
  }

  const parsed = UpdateFindingSchema.safeParse({
    title: formData.get("title") || undefined,
    description: formData.get("description"),
    riskRating: formData.get("riskRating") || undefined,
    recommendation: formData.get("recommendation"),
    managementResponse: formData.get("managementResponse"),
    dueDate: formData.get("dueDate") || undefined,
  });

  if (!parsed.success) {
    throw new Error(
      Object.values(parsed.error.flatten().fieldErrors).flat().join(", ")
    );
  }

  const data = parsed.data;

  await prisma.finding.update({
    where: { id: findingId },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && {
        description: data.description || null,
      }),
      ...(data.riskRating && { riskRating: data.riskRating }),
      ...(data.recommendation !== undefined && {
        recommendation: data.recommendation || null,
      }),
      ...(data.managementResponse !== undefined && {
        managementResponse: data.managementResponse || null,
      }),
      ...(data.dueDate !== undefined && {
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      }),
    },
  });

  await logAction({
    action: "finding.update",
    entityType: "finding",
    entityId: findingId,
    userId: session.user.id,
    details: { engagementId, changes: data },
  });

  revalidatePath(
    `/dashboard/engagements/${engagementId}/findings/${findingId}`
  );
  redirect(`/dashboard/engagements/${engagementId}/findings/${findingId}`);
}

export async function updateFindingStatus(
  engagementId: string,
  findingId: string,
  newStatus: FindingStatus
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await assertEngagementAccess(engagementId, session.user.id, session.user.role);

  const finding = await prisma.finding.findUniqueOrThrow({
    where: { id: findingId },
    include: { _count: { select: { attachments: true } } },
  });

  const allowed = VALID_TRANSITIONS[finding.status];
  if (!allowed.includes(newStatus)) {
    const t = await getTranslator();
    throw new Error(
      t("validation.invalidTransition", { from: finding.status, to: newStatus })
    );
  }

  // Close validation: only manager/chief_auditor can close, must have remediation evidence
  if (newStatus === FindingStatus.CLOSED) {
    const role = session.user.role;
    if (role !== "manager" && role !== "chief_auditor" && role !== "admin") {
      const t = await getTranslator();
      throw new Error(t("validation.findingCloseRole"));
    }
    if (finding._count.attachments === 0) {
      const t = await getTranslator();
      throw new Error(t("validation.findingCloseEvidence"));
    }
  }

  const updateData: Record<string, unknown> = { status: newStatus };
  if (newStatus === FindingStatus.CLOSED) {
    updateData.closedById = session.user.id;
    updateData.closedAt = new Date();
  }

  await prisma.finding.update({
    where: { id: findingId },
    data: updateData,
  });

  await logAction({
    action: "finding.status_change",
    entityType: "finding",
    entityId: findingId,
    userId: session.user.id,
    details: {
      from: finding.status,
      to: newStatus,
      findingTitle: finding.title,
    },
  });

  revalidatePath(
    `/dashboard/engagements/${engagementId}/findings/${findingId}`
  );
}

export async function deleteFinding(
  engagementId: string,
  findingId: string
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await assertEngagementAccess(engagementId, session.user.id, session.user.role);

  const finding = await prisma.finding.findUniqueOrThrow({
    where: { id: findingId },
  });

  if (finding.status === FindingStatus.CLOSED) {
    const t = await getTranslator();
    throw new Error(t("validation.locked.findingDelete"));
  }

  await prisma.finding.delete({ where: { id: findingId } });

  await logAction({
    action: "finding.delete",
    entityType: "finding",
    entityId: findingId,
    userId: session.user.id,
    details: { title: finding.title },
  });

  redirect(`/dashboard/engagements/${engagementId}`);
}
