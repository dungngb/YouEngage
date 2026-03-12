import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { assertEngagementAccess } from "@/lib/authorization";
import { FINDING_STATUS_COLORS, RISK_RATING_COLORS } from "@/lib/constants";
import { getTranslator, getLocale } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import { StatusBadge } from "@/components/ui/status-badge";
import { FindingStatusTransition } from "@/components/ui/finding-status-transition";
import { FileUpload } from "@/components/ui/file-upload";
import { DeleteAttachmentButton } from "@/components/ui/delete-attachment-button";
import type { FindingStatus, RiskRating } from "@prisma/client";

interface Props {
  params: { id: string; findingId: string };
}

export default async function FindingDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) notFound();
  const role = session.user.role ?? "auditor";
  const userId = session.user.id;
  const t = await getTranslator();
  const locale = await getLocale();

  // Authorization: verify user is a member (or admin/chief_auditor)
  try {
    await assertEngagementAccess(params.id, userId, role);
  } catch {
    notFound();
  }

  const finding = await prisma.finding.findUnique({
    where: { id: params.findingId },
    include: {
      engagement: { select: { id: true, name: true } },
      createdBy: { select: { name: true, email: true } },
      closedBy: { select: { name: true, email: true } },
      attachments: {
        include: { uploadedBy: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!finding || finding.engagementId !== params.id) notFound();

  const canManage =
    role === "manager" || role === "chief_auditor" || role === "admin";
  const isClosed = finding.status === "CLOSED";
  const status = finding.status as FindingStatus;
  const risk = finding.riskRating as RiskRating;

  // Can close: must be manager/chief_auditor AND finding must have attachments (remediation evidence)
  const canClose = canManage && finding.attachments.length > 0;

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
          {finding.engagement.name}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-medium text-gray-700">{finding.title}</span>
      </nav>

      {/* Finding header */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="page-title text-xl">
                {finding.title}
              </h1>
              <StatusBadge
                label={t(`risk.${risk}` as TranslationKey)}
                colorClass={RISK_RATING_COLORS[risk]}
              />
            </div>
            {finding.description && (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                {finding.description}
              </p>
            )}
          </div>
          <StatusBadge
            label={t(`status.finding.${status}` as TranslationKey)}
            colorClass={FINDING_STATUS_COLORS[status]}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-gray-100 pt-5 text-sm text-gray-600">
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {t("finding.createdBy")}
            </span>
            <p className="mt-0.5">
              {finding.createdBy.name || finding.createdBy.email}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {t("finding.createdAt")}
            </span>
            <p className="mt-0.5">
              {new Date(finding.createdAt).toLocaleDateString(locale)}
            </p>
          </div>
          {finding.dueDate && (
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                {t("finding.dueDate")}
              </span>
              <p className="mt-0.5">
                {new Date(finding.dueDate).toLocaleDateString(locale)}
              </p>
            </div>
          )}
          {finding.closedBy && finding.closedAt && (
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                {t("finding.closedBy")}
              </span>
              <p className="mt-0.5">
                {finding.closedBy.name || finding.closedBy.email} —{" "}
                {new Date(finding.closedAt).toLocaleDateString(locale)}
              </p>
            </div>
          )}
        </div>

        {/* Edit link */}
        {!isClosed && (
          <div className="mt-5 border-t border-gray-100 pt-5">
            <Link
              href={`/dashboard/engagements/${params.id}/findings/${finding.id}/edit`}
              className="btn-secondary inline-flex items-center text-sm"
            >
              {t("finding.edit")}
            </Link>
          </div>
        )}
      </div>

      {/* Recommendation & Management Response */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="card-title">{t("finding.recommendation")}</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
            {finding.recommendation || t("finding.noRecommendation")}
          </p>
        </div>
        <div className="card p-6">
          <h2 className="card-title">
            {t("finding.managementResponse")}
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
            {finding.managementResponse || t("finding.noResponse")}
          </p>
        </div>
      </div>

      {/* Status transition */}
      <div className="card p-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
          {t("finding.statusLabel")}
        </p>
        <FindingStatusTransition
          engagementId={params.id}
          findingId={finding.id}
          currentStatus={status}
          canClose={canClose}
        />
        {status === "REMEDIATED" && !canClose && (
          <p className="mt-2 text-xs text-amber-600">
            {!canManage
              ? t("finding.closePermission")
              : t("finding.closeEvidence")}
          </p>
        )}
      </div>

      {/* Remediation evidence attachments */}
      <div className="card p-6">
        <div className="card-header">
          <h2 className="card-title">
            {t("finding.remediationEvidence")}
          </h2>
          {!isClosed && (
            <FileUpload
              engagementId={params.id}
              findingId={finding.id}
              category="remediation"
            />
          )}
        </div>

        {finding.attachments.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            {t("finding.noEvidence")}
          </p>
        ) : (
          <div className="space-y-2">
            {finding.attachments.map((att) => (
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
                {!isClosed && (
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
