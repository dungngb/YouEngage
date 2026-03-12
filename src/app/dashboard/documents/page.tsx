import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  engagementScopeFilter,
  engagementChildScopeFilter,
} from "@/lib/authorization";
import { getTranslator, getLocale } from "@/i18n";
import type { TranslationKey } from "@/i18n";

interface Props {
  searchParams: { q?: string; engagement?: string; category?: string };
}

export default async function DocumentsPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const t = await getTranslator();
  const locale = await getLocale();

  const { q, engagement, category } = searchParams;

  // Scope filter: only engagements the user is a member of
  const attachmentScope = await engagementChildScopeFilter(
    session.user.id,
    session.user.role
  );
  const engagementScope = await engagementScopeFilter(
    session.user.id,
    session.user.role
  );

  // Build where clause for search/filter
  const where: Record<string, unknown> = { ...attachmentScope };
  if (q) {
    where.originalName = { contains: q, mode: "insensitive" };
  }
  if (engagement) {
    where.engagementId = engagement;
  }
  if (category) {
    where.category = category;
  }

  const [attachments, engagements] = await Promise.all([
    prisma.attachment.findMany({
      where,
      include: {
        uploadedBy: { select: { name: true, email: true } },
        engagement: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        report: { select: { id: true, title: true } },
        finding: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.engagement.findMany({
      where: engagementScope,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Distinct categories for filter
  const categories = Array.from(new Set(attachments.map((a) => a.category))).sort();

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t("documents.title")}</h1>
      </div>

      {/* Search & Filter */}
      <form className="card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label
              htmlFor="q"
              className="block text-xs font-medium text-gray-500"
            >
              {t("documents.search")}
            </label>
            <input
              id="q"
              name="q"
              type="text"
              defaultValue={q || ""}
              placeholder={t("documents.searchPlaceholder")}
              className="mt-1 block w-full rounded-card border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
          </div>
          <div>
            <label
              htmlFor="engagement"
              className="block text-xs font-medium text-gray-500"
            >
              Engagement
            </label>
            <select
              id="engagement"
              name="engagement"
              defaultValue={engagement || ""}
              className="mt-1 block w-full rounded-card border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
            >
              <option value="">{t("common.all")}</option>
              {engagements.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="category"
              className="block text-xs font-medium text-gray-500"
            >
              {t("documents.category")}
            </label>
            <select
              id="category"
              name="category"
              defaultValue={category || ""}
              className="mt-1 block w-full rounded-card border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
            >
              <option value="">{t("common.all")}</option>
              {["general", "planning", "evidence", "report", "remediation"].map((key) => (
                <option key={key} value={key}>
                  {t(`docCategory.${key}` as TranslationKey)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="submit"
            className="btn-primary"
          >
            {t("documents.search")}
          </button>
          <Link
            href="/dashboard/documents"
            className="btn-secondary"
          >
            {t("documents.clearFilter")}
          </Link>
        </div>
      </form>

      {/* Results */}
      <div className="card">
        <div className="border-b border-gray-100 px-5 py-3">
          <p className="text-xs text-gray-400">
            {t("documents.count", { count: attachments.length })}
            {q && ` — "${q}"`}
          </p>
        </div>
        {attachments.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            {t("documents.empty")}
          </p>
        ) : (
          <div className="space-y-1 p-2">
            {attachments.map((att) => {
              // Determine context link
              let contextLabel = "";
              let contextHref = "";
              if (att.engagement) {
                contextHref = `/dashboard/engagements/${att.engagement.id}`;
                contextLabel = att.engagement.name;
              }
              if (att.task) {
                contextHref = `/dashboard/engagements/${att.engagementId}/tasks/${att.task.id}`;
                contextLabel += ` / ${att.task.title}`;
              }
              if (att.report) {
                contextHref = `/dashboard/engagements/${att.engagementId}/reports/${att.report.id}`;
                contextLabel += ` / ${att.report.title}`;
              }
              if (att.finding) {
                contextHref = `/dashboard/engagements/${att.engagementId}/findings/${att.finding.id}`;
                contextLabel += ` / ${att.finding.title}`;
              }

              return (
                <div
                  key={att.id}
                  className="list-row"
                >
                  <div className="min-w-0 flex-1">
                    <a
                      href={`/api/files/${att.id}`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      {att.originalName}
                    </a>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                      <span>
                        {(att.size / 1024).toFixed(0)} KB
                      </span>
                      <span>
                        {att.uploadedBy.name || att.uploadedBy.email}
                      </span>
                      <span>
                        {new Date(att.createdAt).toLocaleDateString(locale)}
                      </span>
                      <span className="badge bg-gray-100 text-gray-600">
                        {t(`docCategory.${att.category}` as TranslationKey)}
                      </span>
                    </div>
                    {contextLabel && (
                      <Link
                        href={contextHref}
                        className="mt-0.5 block text-xs text-gray-400 hover:text-gray-600"
                      >
                        {contextLabel}
                      </Link>
                    )}
                  </div>
                  <a
                    href={`/api/files/${att.id}`}
                    className="btn-secondary btn-sm ml-4 flex-shrink-0"
                  >
                    {t("documents.download")}
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
