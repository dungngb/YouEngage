import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { assertEngagementAccess } from "@/lib/authorization";
import { REPORT_STATUS_COLORS } from "@/lib/constants";
import { getTranslator, getLocale } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import { StatusBadge } from "@/components/ui/status-badge";
import { ReportStatusTransition } from "@/components/ui/report-status-transition";
import { FileUpload } from "@/components/ui/file-upload";
import { DeleteAttachmentButton } from "@/components/ui/delete-attachment-button";
import type { ReportStatus } from "@prisma/client";

interface Props {
  params: { id: string; reportId: string };
}

export default async function ReportDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) notFound();
  const role = session.user.role ?? "auditor";
  const t = await getTranslator();
  const locale = await getLocale();

  // Authorization: verify user is a member (or admin/chief_auditor)
  try {
    await assertEngagementAccess(params.id, session.user.id, role);
  } catch {
    notFound();
  }

  const report = await prisma.report.findUnique({
    where: { id: params.reportId },
    include: {
      engagement: { select: { id: true, name: true } },
      createdBy: { select: { name: true, email: true } },
      attachments: {
        include: { uploadedBy: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!report || report.engagementId !== params.id) notFound();

  const canManage =
    role === "manager" || role === "chief_auditor" || role === "admin";
  const isLocked = report.status === "ISSUED";
  const status = report.status as ReportStatus;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500">
        <Link href="/dashboard/engagements" className="hover:text-gray-700 transition-colors">
          Engagements
        </Link>
        <span className="text-gray-300">/</span>
        <Link
          href={`/dashboard/engagements/${params.id}`}
          className="hover:text-gray-700 transition-colors"
        >
          {report.engagement.name}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-medium text-gray-700">{report.title}</span>
      </nav>

      {/* Report header */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="page-title text-xl">{report.title}</h1>
            {report.description && (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                {report.description}
              </p>
            )}
          </div>
          <StatusBadge
            label={t(`status.report.${status}` as TranslationKey)}
            colorClass={REPORT_STATUS_COLORS[status]}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-gray-100 pt-5 text-sm text-gray-600">
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {t("report.createdBy")}
            </span>
            <p className="mt-0.5">
              {report.createdBy.name || report.createdBy.email}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {t("report.createdAt")}
            </span>
            <p className="mt-0.5">
              {new Date(report.createdAt).toLocaleDateString(locale)}
            </p>
          </div>
        </div>

        {/* Edit link */}
        {canManage && !isLocked && (
          <div className="mt-5 border-t border-gray-100 pt-5">
            <Link
              href={`/dashboard/engagements/${params.id}/reports/${report.id}/edit`}
              className="btn-secondary inline-flex items-center text-sm"
            >
              {t("report.edit")}
            </Link>
          </div>
        )}
      </div>

      {/* Status transition */}
      {canManage && (
        <div className="card p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
            {t("report.statusLabel")}
          </p>
          <ReportStatusTransition
            engagementId={params.id}
            reportId={report.id}
            currentStatus={status}
          />
        </div>
      )}

      {/* Locked notice */}
      {isLocked && (
        <div className="rounded-card border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">
            {t("report.lockedNotice")}
          </p>
        </div>
      )}

      {/* Attachments */}
      <div className="card p-6">
        <div className="card-header">
          <h2 className="card-title">
            {t("report.attachments")}
          </h2>
          {canManage && !isLocked && (
            <FileUpload
              engagementId={params.id}
              reportId={report.id}
              category="report"
            />
          )}
        </div>

        {report.attachments.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            {t("report.noAttachments")}
          </p>
        ) : (
          <div className="space-y-2">
            {report.attachments.map((att) => (
              <div
                key={att.id}
                className="list-row"
              >
                <div className="min-w-0 flex-1">
                  <a
                    href={`/api/files/${att.id}`}
                    className="truncate text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    {att.originalName}
                  </a>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {(att.size / 1024).toFixed(0)} KB —{" "}
                    {att.uploadedBy.name || att.uploadedBy.email} —{" "}
                    {new Date(att.createdAt).toLocaleDateString(locale)}
                  </p>
                </div>
                {canManage && !isLocked && (
                  <DeleteAttachmentButton
                    engagementId={params.id}
                    attachmentId={att.id}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
