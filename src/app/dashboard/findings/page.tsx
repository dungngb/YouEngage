import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { FINDING_STATUS_COLORS, RISK_RATING_COLORS } from "@/lib/constants";
import { getTranslator, getLocale } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import { StatusBadge } from "@/components/ui/status-badge";
import { engagementChildScopeFilter } from "@/lib/authorization";
import type { FindingStatus, RiskRating } from "@prisma/client";

export default async function FindingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const t = await getTranslator();
  const locale = await getLocale();

  const scopeFilter = await engagementChildScopeFilter(
    session.user.id,
    session.user.role
  );

  const findings = await prisma.finding.findMany({
    where: scopeFilter,
    include: {
      engagement: { select: { id: true, name: true } },
      createdBy: { select: { name: true, email: true } },
      _count: { select: { attachments: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  // Summary stats
  const stats = {
    total: findings.length,
    open: findings.filter((f) => f.status === "OPEN").length,
    inProgress: findings.filter((f) => f.status === "IN_PROGRESS").length,
    remediated: findings.filter((f) => f.status === "REMEDIATED").length,
    closed: findings.filter((f) => f.status === "CLOSED").length,
    high: findings.filter(
      (f) => f.riskRating === "HIGH" && f.status !== "CLOSED"
    ).length,
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t("findings.title")}</h1>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard label={t("findings.total")} value={stats.total} />
        <StatCard label={t("findings.open")} value={stats.open} color="text-red-600" />
        <StatCard
          label={t("findings.inProgress")}
          value={stats.inProgress}
          color="text-amber-600"
        />
        <StatCard
          label={t("findings.remediated")}
          value={stats.remediated}
          color="text-blue-600"
        />
        <StatCard label={t("findings.closed")} value={stats.closed} color="text-green-600" />
        <StatCard
          label={t("findings.highRisk")}
          value={stats.high}
          color="text-red-700"
        />
      </div>

      {/* Findings list */}
      <div className="card">
        {findings.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            {t("findings.empty")}
          </p>
        ) : (
          <div className="space-y-1 p-2">
            {findings.map((finding) => (
              <Link
                key={finding.id}
                href={`/dashboard/engagements/${finding.engagementId}/findings/${finding.id}`}
                className="list-row"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {finding.title}
                    </span>
                    <StatusBadge
                      label={t(`risk.${finding.riskRating}` as TranslationKey)}
                      colorClass={
                        RISK_RATING_COLORS[finding.riskRating as RiskRating]
                      }
                    />
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                    <span>{finding.engagement.name}</span>
                    <span>
                      {finding.createdBy.name || finding.createdBy.email}
                    </span>
                    {finding.dueDate && (
                      <span>
                        {t("finding.dueDate")}:{" "}
                        {new Date(finding.dueDate).toLocaleDateString(locale)}
                      </span>
                    )}
                    {finding._count.attachments > 0 && (
                      <span>{finding._count.attachments} files</span>
                    )}
                  </div>
                </div>
                <StatusBadge
                  label={t(`status.finding.${finding.status}` as TranslationKey)}
                  colorClass={
                    FINDING_STATUS_COLORS[finding.status as FindingStatus]
                  }
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color = "text-gray-900",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
