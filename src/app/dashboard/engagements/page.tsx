import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getTranslator, getLocale } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import {
  ENGAGEMENT_STATUS_COLORS,
} from "@/lib/constants";
import { engagementScopeFilter } from "@/lib/authorization";
import type { EngagementStatus } from "@prisma/client";

export default async function EngagementsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role;
  const t = await getTranslator();
  const locale = await getLocale();

  const scopeFilter = await engagementScopeFilter(session.user.id, role);

  const engagements = await prisma.engagement.findMany({
    where: scopeFilter,
    include: {
      members: { include: { user: true } },
      _count: { select: { tasks: true, attachments: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const canCreate = role === "manager" || role === "chief_auditor" || role === "admin";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("engagement.title")}</h1>
          <p className="page-subtitle">
            {t("engagement.subtitle")}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/dashboard/engagements/new"
            className="btn-primary"
          >
            {t("engagement.createNew")}
          </Link>
        )}
      </div>

      {/* Engagement list */}
      {engagements.length === 0 ? (
        <div className="card border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-sm text-gray-500">{t("engagement.empty")}</p>
          {canCreate && (
            <Link
              href="/dashboard/engagements/new"
              className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              {t("engagement.createFirst")}
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {engagements.map((eng) => {
            const status = eng.status as EngagementStatus;
            const lead = eng.members.find((m) => m.role === "lead");
            return (
              <Link
                key={eng.id}
                href={`/dashboard/engagements/${eng.id}`}
                className="card card-hover block p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-gray-900">
                      {eng.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {eng.auditedEntity}
                      {eng.fiscalYear && ` — FY${eng.fiscalYear}`}
                    </p>
                  </div>
                  <span
                    className={`badge ml-3 ${ENGAGEMENT_STATUS_COLORS[status]}`}
                  >
                    {t(`status.engagement.${status}` as TranslationKey)}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                  {lead && <span>{t("engagement.lead")} {lead.user.name || lead.user.email}</span>}
                  <span>{eng.members.length} {t("engagement.members")}</span>
                  <span>{eng._count.tasks} {t("engagement.tasks")}</span>
                  <span>{eng._count.attachments} {t("engagement.files")}</span>
                  {eng.plannedStart && (
                    <span>
                      {new Date(eng.plannedStart).toLocaleDateString(locale)}
                      {eng.plannedEnd &&
                        ` → ${new Date(eng.plannedEnd).toLocaleDateString(locale)}`}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
