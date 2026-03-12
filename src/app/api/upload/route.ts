import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import path from "path";
import crypto from "crypto";
import { logAction } from "@/lib/audit-log";
import { getTranslator } from "@/i18n";
import {
  MAX_FILE_SIZE_MB,
  ALLOWED_FILE_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  sanitizeFilename,
  hasDoubleExtension,
} from "@/lib/constants";

const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const t = await getTranslator();
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const engagementId = formData.get("engagementId") as string | null;
  const taskId = formData.get("taskId") as string | null;
  const reportId = formData.get("reportId") as string | null;
  const findingId = formData.get("findingId") as string | null;
  const category = (formData.get("category") as string) || "general";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File quá lớn (tối đa ${MAX_FILE_SIZE_MB}MB)` },
      { status: 400 }
    );
  }

  // Sanitize filename (strip path traversal, control chars, etc.)
  const safeName = sanitizeFilename(file.name);

  // Detect double extensions (e.g., "report.pdf.exe")
  if (hasDoubleExtension(safeName)) {
    return NextResponse.json(
      { error: t("upload.doubleExtension") },
      { status: 400 }
    );
  }

  // Validate file extension
  const ext = path.extname(safeName).toLowerCase();
  if (!ALLOWED_FILE_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      {
        error: t("upload.extensionNotAllowed", { ext, allowed: ALLOWED_FILE_EXTENSIONS.join(", ") }),
      },
      { status: 400 }
    );
  }

  // Cross-validate MIME type against expected types for this extension
  const expectedMimes = ALLOWED_MIME_TYPES[ext];
  const actualMime = file.type || "application/octet-stream";
  if (
    expectedMimes &&
    actualMime !== "application/octet-stream" &&
    !expectedMimes.includes(actualMime)
  ) {
    return NextResponse.json(
      {
        error: t("upload.mimeMismatch", { mime: actualMime, ext }),
      },
      { status: 400 }
    );
  }

  if (!engagementId && !taskId && !reportId && !findingId) {
    return NextResponse.json(
      { error: "Cần engagementId, taskId, reportId hoặc findingId" },
      { status: 400 }
    );
  }

  // Resolve engagementId from child entities if not directly provided
  let resolvedEngagementId = engagementId;

  // Lock state checks + resolve engagement from child entities
  if (taskId) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { status: true, engagementId: true },
    });
    if (!task) {
      return NextResponse.json({ error: t("upload.entityNotFound") }, { status: 404 });
    }
    if (task.status === "APPROVED" || task.status === "PENDING_REVIEW") {
      return NextResponse.json(
        { error: t("validation.locked.attachmentSignoff") },
        { status: 403 }
      );
    }
    if (!resolvedEngagementId) resolvedEngagementId = task.engagementId;
  }

  if (reportId) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: { status: true, engagementId: true },
    });
    if (!report) {
      return NextResponse.json({ error: t("upload.entityNotFound") }, { status: 404 });
    }
    if (report.status === "ISSUED") {
      return NextResponse.json(
        { error: t("validation.locked.attachmentIssued") },
        { status: 403 }
      );
    }
    if (!resolvedEngagementId) resolvedEngagementId = report.engagementId;
  }

  if (findingId) {
    const finding = await prisma.finding.findUnique({
      where: { id: findingId },
      select: { status: true, engagementId: true },
    });
    if (!finding) {
      return NextResponse.json({ error: t("upload.entityNotFound") }, { status: 404 });
    }
    if (finding.status === "CLOSED") {
      return NextResponse.json(
        { error: t("validation.locked.attachmentClosed") },
        { status: 403 }
      );
    }
    if (!resolvedEngagementId) resolvedEngagementId = finding.engagementId;
  }

  // Data scope: verify user is member of engagement (or admin/chief_auditor)
  if (resolvedEngagementId && session.user.role !== "admin" && session.user.role !== "chief_auditor") {
    const member = await prisma.engagementMember.findUnique({
      where: {
        engagementId_userId: {
          engagementId: resolvedEngagementId,
          userId: session.user.id,
        },
      },
    });
    if (!member) {
      return NextResponse.json(
        { error: t("error.engagementNotMember") },
        { status: 403 }
      );
    }
  }

  // Generate unique filename
  const uniqueName = `${crypto.randomUUID()}${ext}`;
  const subDir = resolvedEngagementId || "general";
  const blobPathname = `uploads/${subDir}/${uniqueName}`;

  // Upload to Vercel Blob
  const blob = await put(blobPathname, file, {
    access: "public",
    contentType: actualMime,
  });

  // Save metadata to DB (storagePath = blob URL for cloud storage)
  const attachment = await prisma.attachment.create({
    data: {
      filename: uniqueName,
      originalName: safeName,
      mimeType: actualMime,
      size: file.size,
      storagePath: blob.url,
      category,
      engagementId: engagementId || null,
      taskId: taskId || null,
      reportId: reportId || null,
      findingId: findingId || null,
      uploadedById: session.user.id,
    },
  });

  // Audit log
  await logAction({
    action: "file.upload",
    entityType: "attachment",
    entityId: attachment.id,
    userId: session.user.id,
    details: {
      originalName: safeName,
      size: file.size,
      category,
      engagementId,
      taskId,
      reportId,
      findingId,
    },
  });

  return NextResponse.json({ attachment }, { status: 201 });
}
