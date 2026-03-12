import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { assertEngagementAccess } from "@/lib/authorization";
import { EmptyState } from "@/components/ui/empty-state";
import { getTranslator, getLocale } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import {
  ENGAGEMENT_STATUS_COLORS,
  TASK_STATUS_COLORS,
  REPORT_STATUS_COLORS,
  FINDING_STATUS_COLORS,
  RISK_RATING_COLORS,
} from "@/lib/constants";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatusTransition } from "@/components/ui/status-transition";
import { TeamManager } from "@/components/ui/team-manager";
import { FileUpload } from "@/components/ui/file-upload";
import { TaskStatusSelect } from "@/components/ui/task-status-select";
import type {
  EngagementStatus,
  TaskStatus,
  TaskType,
  ReportStatus,
  FindingStatus,
  RiskRating,
} from "@prisma/client";

interface Props {
  params: { id: string };
}

export default async function EngagementDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) notFound();
  const role = session.user.role;
  const t = await getTranslator();
  const locale = await getLocale();

  // Authorization: verify user is a member (or admin/chief_auditor)
  try {
    await assertEngagementAccess(params.id, session.user.id, role);
  } catch {
    notFound();
  }

  const engagement = await prisma.engagement.findUnique({
    where: { id: params.id },
    include: {
      members: { include: { user: true }, orderBy: { assignedAt: "asc" } },
      tasks: {
        include: {
          assignee: true,
          _count: { select: { attachments: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
      attachments: {
        where: { taskId: null, reportId: null, findingId: null },
        include: { uploadedBy: true },
        orderBy: { createdAt: "desc" },
      },
      reports: {
        include: {
          createdBy: { select: { name: true, email: true } },
          _count: { select: { attachments: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      findings: {
        include: {
          createdBy: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!engagement) notFound();

  const canManage =
    role === "manager" || role === "chief_auditor" || role === "admin";

  // Fetch all users for team manager
  const allUsers = canManage
    ? await prisma.user.findMany({
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      })
    : [];

  const status = engagement.status as EngagementStatus;

  // Task stats
  const taskStats = {
    total: engagement.tasks.length,
    todo: engagement.tasks.filter((t) => t.status === "TODO").length,
    inProgress: engagement.tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "REJECTED").length,
    pendingReview: engagement.tasks.filter((t) => t.status === "PENDING_REVIEW" || t.status === "COMPLETED").length,
    approved: engagement.tasks.filter((t) => t.status === "APPROVED").length,
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div>
        <Link
          href="/dashboard/engagements"
          className="btn-ghost inline-flex items-center text-gray-500 hover:text-gray-700"
        >
          &larr; Engagements
        </Link>
        <div className="page-header mt-2">
          <div>
            <h1 className="page-title">
              {engagement.name}
            </h1>
            <p className="page-subtitle">
              {engagement.auditedEntity}
              {engagement.fiscalYear && ` — FY${engagement.fiscalYear}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge
              label={t(`status.engagement.${status}` as TranslationKey)}
              colorClass={ENGAGEMENT_STATUS_COLORS[status]}
            />
            <Link
              href={`/dashboard/engagements/${engagement.id}/activity`}
              className="btn-secondary btn-sm"
            >
              {t("activity.title")}
            </Link>
            {canManage && (
              <Link
                href={`/dashboard/engagements/${engagement.id}/edit`}
                className="btn-secondary btn-sm"
              >
                {t("actions.edit")}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Status transition */}
      {canManage && (
        <div className="card p-4">
          <p className="mb-2 text-xs font-medium uppercase text-gray-400">
            {t("engagement.statusTransition")}
          </p>
          <StatusTransition
            engagementId={engagement.id}
            currentStatus={status}
          />
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Scope & Description */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="card-title">
            {t("engagement.generalInfo")}
          </h2>
          {engagement.scope && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-400">{t("engagement.scope")}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                {engagement.scope}
              </p>
            </div>
          )}
          {engagement.description && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-400">{t("engagement.description")}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                {engagement.description}
              </p>
            </div>
          )}
          {engagement.plannedStart && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-400">{t("engagement.timeline")}</p>
              <p className="mt-1 text-sm text-gray-700">
                {new Date(engagement.plannedStart).toLocaleDateString(locale)}
                {engagement.plannedEnd &&
                  ` → ${new Date(engagement.plannedEnd).toLocaleDateString(locale)}`}
              </p>
            </div>
          )}
        </div>

        {/* Task stats */}
        <div className="card p-5">
          <h2 className="card-title">{t("engagement.taskProgress")}</h2>
          <div className="mt-3 space-y-2">
            <StatRow label={t("finding.statTotal")} value={taskStats.total} />
            <StatRow label={t("status.task.TODO")} value={taskStats.todo} color="text-gray-500" />
            <StatRow label={t("status.task.IN_PROGRESS")} value={taskStats.inProgress} color="text-blue-600" />
            <StatRow label={t("status.task.PENDING_REVIEW")} value={taskStats.pendingReview} color="text-purple-600" />
            <StatRow label={t("status.task.APPROVED")} value={taskStats.approved} color="text-green-600" />
          </div>
          {taskStats.total > 0 && (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{
                  width: `${(taskStats.approved / taskStats.total) * 100}%`,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Team section */}
      <div className="card p-5">
        <div className="card-header">
          <h2 className="card-title">
            {t("team.title")}
          </h2>
        </div>
        <TeamManager
          engagementId={engagement.id}
          members={engagement.members.map((m) => ({
            id: m.id,
            role: m.role,
            user: {
              id: m.user.id,
              name: m.user.name,
              email: m.user.email,
            },
          }))}
          allUsers={allUsers}
          canManage={canManage}
        />
      </div>

      {/* Tasks section */}
      <div className="card p-5">
        <div className="card-header">
          <h2 className="card-title">
            {t("engagement.tasksAndWorkpapers")}
          </h2>
          {canManage && (
            <Link
              href={`/dashboard/engagements/${engagement.id}/tasks/new`}
              className="btn-primary btn-sm"
            >
              {t("task.createTitle")}
            </Link>
          )}
        </div>

        {engagement.tasks.length === 0 ? (
          <EmptyState
            title={t("engagement.emptyTasks")}
            description={t("engagement.emptyTasksDesc")}
            actionLabel={canManage ? t("task.createTitle") : undefined}
            actionHref={canManage ? `/dashboard/engagements/${engagement.id}/tasks/new` : undefined}
          />
        ) : (
          <div className="space-y-2">
            {engagement.tasks.map((task) => (
              <Link
                key={task.id}
                href={`/dashboard/engagements/${engagement.id}/tasks/${task.id}`}
                className="list-row"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {task.title}
                    </span>
                    <span className="text-xs text-gray-400">
                      {t(`taskType.${task.type as TaskType}` as TranslationKey)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                    {task.assignee && (
                      <span>{task.assignee.name || task.assignee.email}</span>
                    )}
                    {task.dueDate && (
                      <span>
                        Due:{" "}
                        {new Date(task.dueDate).toLocaleDateString(locale)}
                      </span>
                    )}
                    {task._count.attachments > 0 && (
                      <span>{task._count.attachments} {t("engagement.files")}</span>
                    )}
                  </div>
                </div>
                <StatusBadge
                  label={t(`status.task.${task.status as TaskStatus}` as TranslationKey)}
                  colorClass={TASK_STATUS_COLORS[task.status as TaskStatus]}
                />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Reports section */}
      <div className="card p-5">
        <div className="card-header">
          <h2 className="card-title">
            {t("report.title")}
          </h2>
          {canManage && (
            <Link
              href={`/dashboard/engagements/${engagement.id}/reports/new`}
              className="btn-primary btn-sm"
            >
              {t("report.createButton")}
            </Link>
          )}
        </div>

        {engagement.reports.length === 0 ? (
          <EmptyState
            title={t("engagement.emptyReports")}
            description={t("engagement.emptyReportsDesc")}
            actionLabel={canManage ? t("report.createButton") : undefined}
            actionHref={canManage ? `/dashboard/engagements/${engagement.id}/reports/new` : undefined}
          />
        ) : (
          <div className="space-y-2">
            {engagement.reports.map((report) => (
              <Link
                key={report.id}
                href={`/dashboard/engagements/${engagement.id}/reports/${report.id}`}
                className="list-row"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    {report.title}
                  </span>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                    <span>
                      {report.createdBy.name || report.createdBy.email}
                    </span>
                    {report._count.attachments > 0 && (
                      <span>{report._count.attachments} {t("engagement.files")}</span>
                    )}
                    <span>
                      {new Date(report.createdAt).toLocaleDateString(locale)}
                    </span>
                  </div>
                </div>
                <StatusBadge
                  label={t(`status.report.${report.status as ReportStatus}` as TranslationKey)}
                  colorClass={REPORT_STATUS_COLORS[report.status as ReportStatus]}
                />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Findings section */}
      <div className="card p-5">
        <div className="card-header">
          <h2 className="card-title">
            {t("finding.title")}
          </h2>
          <Link
            href={`/dashboard/engagements/${engagement.id}/findings/new`}
            className="btn-primary btn-sm"
          >
            {t("finding.createButton")}
          </Link>
        </div>

        {engagement.findings.length === 0 ? (
          <EmptyState
            title={t("engagement.emptyFindings")}
            description={t("engagement.emptyFindingsDesc")}
            actionLabel={t("finding.createButton")}
            actionHref={`/dashboard/engagements/${engagement.id}/findings/new`}
          />
        ) : (
          <div className="space-y-2">
            {engagement.findings.map((finding) => (
              <Link
                key={finding.id}
                href={`/dashboard/engagements/${engagement.id}/findings/${finding.id}`}
                className="list-row"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {finding.title}
                    </span>
                    <StatusBadge
                      label={t(`risk.${finding.riskRating as RiskRating}` as TranslationKey)}
                      colorClass={RISK_RATING_COLORS[finding.riskRating as RiskRating]}
                    />
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                    <span>
                      {finding.createdBy.name || finding.createdBy.email}
                    </span>
                    {finding.dueDate && (
                      <span>
                        Due: {new Date(finding.dueDate).toLocaleDateString(locale)}
                      </span>
                    )}
                  </div>
                </div>
                <StatusBadge
                  label={t(`status.finding.${finding.status as FindingStatus}` as TranslationKey)}
                  colorClass={FINDING_STATUS_COLORS[finding.status as FindingStatus]}
                />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Documents section */}
      <div className="card p-5">
        <div className="card-header">
          <h2 className="card-title">
            {t("engagement.documents")}
          </h2>
          <FileUpload
            engagementId={engagement.id}
            category="planning"
          />
        </div>

        {engagement.attachments.length === 0 ? (
          <EmptyState
            title={t("engagement.emptyDocuments")}
            description={t("engagement.emptyDocumentsDesc")}
          />
        ) : (
          <div className="space-y-2">
            {engagement.attachments.map((att) => (
              <div
                key={att.id}
                className="list-row"
              >
                <div>
                  <a
                    href={`/api/files/${att.id}`}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    {att.originalName}
                  </a>
                  <p className="text-xs text-gray-400">
                    {(att.size / 1024).toFixed(0)} KB —{" "}
                    {att.uploadedBy.name || att.uploadedBy.email} —{" "}
                    {new Date(att.createdAt).toLocaleDateString(locale)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  color = "text-gray-900",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}
