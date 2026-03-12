import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { assertEngagementAccess } from "@/lib/authorization";
import { createFinding } from "@/lib/actions/finding";
import { FormSubmit } from "@/components/ui/form-submit";
import { getTranslator } from "@/i18n";
import type { TranslationKey } from "@/i18n";

interface Props {
  params: { id: string };
}

export default async function NewFindingPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) notFound();

  try {
    await assertEngagementAccess(params.id, session.user.id, session.user.role);
  } catch {
    notFound();
  }

  const engagement = await prisma.engagement.findUnique({
    where: { id: params.id },
    select: { id: true, name: true },
  });

  if (!engagement) notFound();
  const t = await getTranslator();

  const createFindingWithId = createFinding.bind(null, engagement.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/dashboard/engagements/${engagement.id}`}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          &larr; {engagement.name}
        </Link>
        <h1 className="page-title mt-2">
          {t("finding.new")}
        </h1>
      </div>

      <FormSubmit
        action={createFindingWithId}
        className="card space-y-5 p-6"
      >
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            {t("finding.titleLabel")} *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            {t("finding.description")}
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="riskRating"
              className="block text-sm font-medium text-gray-700"
            >
              {t("finding.riskRating")}
            </label>
            <select
              id="riskRating"
              name="riskRating"
              defaultValue="MEDIUM"
              className="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="HIGH">{t(`risk.HIGH` as TranslationKey)}</option>
              <option value="MEDIUM">{t(`risk.MEDIUM` as TranslationKey)}</option>
              <option value="LOW">{t(`risk.LOW` as TranslationKey)}</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="dueDate"
              className="block text-sm font-medium text-gray-700"
            >
              {t("finding.dueDate")}
            </label>
            <input
              id="dueDate"
              name="dueDate"
              type="date"
              className="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="recommendation"
            className="block text-sm font-medium text-gray-700"
          >
            {t("finding.recommendation")}
          </label>
          <textarea
            id="recommendation"
            name="recommendation"
            rows={3}
            className="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div className="flex gap-3 border-t border-gray-100 pt-5">
          <button
            type="submit"
            className="btn-primary"
          >
            {t("finding.create")}
          </button>
          <Link
            href={`/dashboard/engagements/${engagement.id}`}
            className="btn-secondary"
          >
            {t("common.cancel")}
          </Link>
        </div>
      </FormSubmit>
    </div>
  );
}
