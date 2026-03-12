import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { REPORT_STATUS_COLORS } from "@/lib/constants";
import { getTranslator, getLocale } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import { StatusBadge } from "@/components/ui/status-badge";
import { engagementChildScopeFilter } from "@/lib/authorization";
import type { ReportStatus } from "@prisma/client";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role;
  const t = await getTranslator();
  const locale = await getLocale();

  if (role !== "manager" && role !== "chief_auditor" && role !== "admin") {
    return (
      <div className="py-12 text-center text-sm text-gray-400">
        {t("common.noAccess")}
      </div>
    );
  }

  const scopeFilter = await engagementChildScopeFilter(
    session.user.id,
    session.user.role
  );

  const reports = await prisma.report.findMany({
    where: scopeFilter,
    include: {
      engagement: { select: { id: true, name: true } },
      createdBy: { select: { name: true, email: true } },
      _count: { select: { attachments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t("reports.title")}</h1>
      </div>

      <div className="card">
        {reports.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            {t("reports.empty")}
          </p>
        ) : (
          <div className="space-y-1 p-2">
            {reports.map((report) => (
              <Link
                key={report.id}
                href={`/dashboard/engagements/${report.engagementId}/reports/${report.id}`}
                className="list-row"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    {report.title}
                  </span>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                    <span>{report.engagement.name}</span>
                    <span>
                      {report.createdBy.name || report.createdBy.email}
                    </span>
                    {report._count.attachments > 0 && (
                      <span>{report._count.attachments} files</span>
                    )}
                    <span>
                      {new Date(report.createdAt).toLocaleDateString(locale)}
                    </span>
                  </div>
                </div>
                <StatusBadge
                  label={t(`status.report.${report.status}` as TranslationKey)}
                  colorClass={
                    REPORT_STATUS_COLORS[report.status as ReportStatus]
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
