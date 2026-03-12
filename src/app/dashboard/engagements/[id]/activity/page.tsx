import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { assertEngagementAccess } from "@/lib/authorization";
import { getTranslator, getLocale } from "@/i18n";
import type { TranslationKey } from "@/i18n";

interface Props {
  params: { id: string };
}

export default async function ActivityPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) notFound();
  const t = await getTranslator();
  const locale = await getLocale();

  const engagement = await prisma.engagement.findUnique({
    where: { id: params.id },
    select: { id: true, name: true },
  });

  if (!engagement) notFound();

  await assertEngagementAccess(
    engagement.id,
    session.user.id,
    session.user.role
  );

  // Fetch audit logs for this engagement and its child entities
  const [tasks, reports, findings] = await Promise.all([
    prisma.task.findMany({
      where: { engagementId: engagement.id },
      select: { id: true },
    }),
    prisma.report.findMany({
      where: { engagementId: engagement.id },
      select: { id: true },
    }),
    prisma.finding.findMany({
      where: { engagementId: engagement.id },
      select: { id: true },
    }),
  ]);

  const childEntityIds = [
    engagement.id,
    ...tasks.map((t) => t.id),
    ...reports.map((r) => r.id),
    ...findings.map((f) => f.id),
  ];

  const logs = await prisma.auditLog.findMany({
    where: {
      entityId: { in: childEntityIds },
    },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/engagements/${engagement.id}`}
          className="text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          &larr; {engagement.name}
        </Link>
        <h1 className="page-title mt-2">
          {t("activity.title")}
        </h1>
      </div>

      <div className="card">
        {logs.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            {t("activity.empty")}
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const details = log.details
                ? (JSON.parse(log.details) as Record<string, any>)
                : null;

              return (
                <div key={log.id} className="px-5 py-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-gray-900">
                        {t(`audit.${log.action}` as TranslationKey)}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        {log.entityType}
                      </span>
                    </div>
                    <span className="ml-4 flex-shrink-0 text-xs text-gray-400">
                      {new Date(log.createdAt).toLocaleString(locale)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {log.user.name || log.user.email}
                  </p>
                  {details && (
                    <div className="mt-1 text-xs text-gray-400">
                      {details.originalName && (
                        <span>File: {String(details.originalName)} </span>
                      )}
                      {details.oldStatus && details.newStatus && (
                        <span>
                          {String(details.oldStatus)} → {String(details.newStatus)}
                        </span>
                      )}
                      {details.comment && (
                        <span className="italic">
                          &quot;{String(details.comment)}&quot;
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
