import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getTranslator, getLocale } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import {
  ENGAGEMENT_STATUS_COLORS,
  FINDING_STATUS_COLORS,
  RISK_RATING_COLORS,
  TASK_STATUS_COLORS,
} from "@/lib/constants";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  engagementScopeFilter,
  engagementChildScopeFilter,
} from "@/lib/authorization";
import type {
  EngagementStatus,
  FindingStatus,
  RiskRating,
  TaskStatus,
} from "@prisma/client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const t = await getTranslator();
  const locale = await getLocale();
  const role = session.user.role ?? "auditor";
  const userId = session.user.id;

  // Scope filters — auditor/manager only see their engagements' data
  const engScope = await engagementScopeFilter(userId, role);
  const childScope = await engagementChildScopeFilter(userId, role);

  // ── Aggregate stats ────────────────────────────────────────────────────
  const [engagements, tasks, findings, reports] = await Promise.all([
    prisma.engagement.findMany({
      where: engScope,
      select: { id: true, name: true, status: true, auditedEntity: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.task.findMany({
      where: childScope,
      select: {
        id: true,
        title: true,
        status: true,
        engagementId: true,
        assigneeId: true,
        dueDate: true,
        engagement: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.finding.findMany({
      where: childScope,
      select: {
        id: true,
        title: true,
        status: true,
        riskRating: true,
        dueDate: true,
        engagementId: true,
        engagement: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.report.findMany({
      where: childScope,
      select: { id: true, status: true },
    }),
  ]);

  const stats = {
    engagementsActive: engagements.filter(
      (e) => e.status !== "DRAFT" && e.status !== "CLOSED"
    ).length,
    tasksPendingReview: tasks.filter((t) => t.status === "PENDING_REVIEW")
      .length,
    findingsOpen: findings.filter((f) => f.status !== "CLOSED").length,
    reportsDraft: reports.filter((r) => r.status === "DRAFT").length,
  };

  // Tasks pending review (for manager/chief_auditor)
  const pendingReviewTasks = tasks.filter(
    (t) => t.status === "PENDING_REVIEW"
  );

  // My tasks (for auditor)
  const myTasks = tasks.filter(
    (t) => t.assigneeId === userId && t.status !== "APPROVED"
  );

  // Open findings (high risk first)
  const openFindings = findings
    .filter((f) => f.status !== "CLOSED")
    .sort((a, b) => {
      const riskOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return (
        riskOrder[a.riskRating as keyof typeof riskOrder] -
        riskOrder[b.riskRating as keyof typeof riskOrder]
      );
    });

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("dashboard.title")}</h1>
          <p className="page-subtitle mt-1">
            {t("dashboard.greeting")}{" "}
            <span className="font-medium text-gray-700">{session?.user?.name}</span>{" "}
            — {t(`role.${role}` as TranslationKey)}
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("dashboard.statEngagements")}
          value={stats.engagementsActive}
          description={t("dashboard.statEngagementsDesc")}
          accent="bg-primary-50 text-primary-600"
        />
        <StatCard
          title={t("dashboard.statTasks")}
          value={stats.tasksPendingReview}
          description={t("dashboard.statTasksDesc")}
          accent="bg-purple-50 text-purple-600"
        />
        <StatCard
          title={t("dashboard.statFindings")}
          value={stats.findingsOpen}
          description={t("dashboard.statFindingsDesc")}
          accent="bg-red-50 text-red-600"
        />
        <StatCard
          title={t("dashboard.statReports")}
          value={stats.reportsDraft}
          description={t("dashboard.statReportsDesc")}
          accent="bg-amber-50 text-amber-600"
        />
      </div>

      {/* ── Chief Auditor / Admin: Engagement overview ──────────────────── */}
      {(role === "chief_auditor" || role === "admin") && (
        <section className="card p-5">
          <div className="card-header">
            <h2 className="card-title">
              {t("dashboard.engagementOverview")}
            </h2>
            <Link
              href="/dashboard/engagements"
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              {t("actions.viewAll")} &rarr;
            </Link>
          </div>
          {engagements.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              {t("dashboard.emptyEngagements")}
            </p>
          ) : (
            <div className="space-y-1.5">
              {engagements.slice(0, 10).map((eng) => (
                <Link
                  key={eng.id}
                  href={`/dashboard/engagements/${eng.id}`}
                  className="list-row"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {eng.name}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">
                      {eng.auditedEntity}
                    </span>
                  </div>
                  <StatusBadge
                    label={
                      t(`status.engagement.${eng.status}` as TranslationKey)
                    }
                    colorClass={
                      ENGAGEMENT_STATUS_COLORS[eng.status as EngagementStatus]
                    }
                  />
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Findings summary (chief_auditor / manager) ─────────────────── */}
      {(role === "chief_auditor" || role === "manager" || role === "admin") && (
        <section className="card p-5">
          <div className="card-header">
            <h2 className="card-title">
              {t("dashboard.openFindings")}
            </h2>
            <Link
              href="/dashboard/findings"
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              {t("actions.viewAll")} &rarr;
            </Link>
          </div>
          {openFindings.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              {t("dashboard.emptyFindings")}
            </p>
          ) : (
            <div className="space-y-1.5">
              {openFindings.slice(0, 8).map((f) => (
                <Link
                  key={f.id}
                  href={`/dashboard/engagements/${f.engagementId}/findings/${f.id}`}
                  className="list-row"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {f.title}
                      </span>
                      <StatusBadge
                        label={t(`risk.${f.riskRating}` as TranslationKey)}
                        colorClass={
                          RISK_RATING_COLORS[f.riskRating as RiskRating]
                        }
                      />
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                      <span>{f.engagement.name}</span>
                      {f.dueDate && (
                        <span>
                          {t("dashboard.dueDate")}{" "}
                          {new Date(f.dueDate).toLocaleDateString(locale)}
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusBadge
                    label={
                      t(`status.finding.${f.status}` as TranslationKey)
                    }
                    colorClass={
                      FINDING_STATUS_COLORS[f.status as FindingStatus]
                    }
                  />
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Pending Reviews (manager / chief_auditor) ──────────────────── */}
      {(role === "manager" || role === "chief_auditor") && (
        <section className="card p-5">
          <div className="card-header">
            <h2 className="card-title">
              {t("dashboard.pendingReview")}
            </h2>
          </div>
          {pendingReviewTasks.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              {t("dashboard.emptyPendingReview")}
            </p>
          ) : (
            <div className="space-y-1.5">
              {pendingReviewTasks.slice(0, 10).map((t_task) => (
                <Link
                  key={t_task.id}
                  href={`/dashboard/engagements/${t_task.engagementId}/tasks/${t_task.id}`}
                  className="list-row"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {t_task.title}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">
                      {t_task.engagement.name}
                    </span>
                  </div>
                  <StatusBadge
                    label={t(`status.task.${t_task.status}` as TranslationKey)}
                    colorClass={TASK_STATUS_COLORS[t_task.status as TaskStatus]}
                  />
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── My Tasks (auditor) ─────────────────────────────────────────── */}
      {role === "auditor" && (
        <section className="card p-5">
          <div className="card-header">
            <h2 className="card-title">
              {t("dashboard.myTasks")}
            </h2>
          </div>
          {myTasks.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              {t("dashboard.emptyMyTasks")}
            </p>
          ) : (
            <div className="space-y-1.5">
              {myTasks.slice(0, 10).map((t_task) => (
                <Link
                  key={t_task.id}
                  href={`/dashboard/engagements/${t_task.engagementId}/tasks/${t_task.id}`}
                  className="list-row"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {t_task.title}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">
                      {t_task.engagement.name}
                    </span>
                    {t_task.dueDate && (
                      <span className="ml-2 text-xs text-gray-400">
                        {t("dashboard.dueDate")}{" "}
                        {new Date(t_task.dueDate).toLocaleDateString(locale)}
                      </span>
                    )}
                  </div>
                  <StatusBadge
                    label={t(`status.task.${t_task.status}` as TranslationKey)}
                    colorClass={TASK_STATUS_COLORS[t_task.status as TaskStatus]}
                  />
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  accent = "bg-primary-50 text-primary-600",
}: {
  title: string;
  value: number;
  description: string;
  accent?: string;
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        {title}
      </p>
      <p className={`mt-2 text-3xl font-bold ${accent.split(" ").pop()}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-gray-400">{description}</p>
    </div>
  );
}
