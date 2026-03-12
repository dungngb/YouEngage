import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { assertEngagementAccess } from "@/lib/authorization";
import { createReport } from "@/lib/actions/report";
import { FormSubmit } from "@/components/ui/form-submit";
import { getTranslator } from "@/i18n";

interface Props {
  params: { id: string };
}

export default async function NewReportPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) notFound();
  const role = session.user.role;

  if (role !== "manager" && role !== "chief_auditor" && role !== "admin") {
    notFound();
  }

  try {
    await assertEngagementAccess(params.id, session.user.id, role);
  } catch {
    notFound();
  }

  const engagement = await prisma.engagement.findUnique({
    where: { id: params.id },
    select: { id: true, name: true },
  });

  if (!engagement) notFound();
  const t = await getTranslator();

  const createReportWithId = createReport.bind(null, engagement.id);

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
          {t("report.new")}
        </h1>
      </div>

      <FormSubmit
        action={createReportWithId}
        className="card space-y-5 p-6"
      >
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            {t("report.titleLabel")} *
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
            {t("report.description")}
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div className="flex gap-3 border-t border-gray-100 pt-5">
          <button
            type="submit"
            className="btn-primary"
          >
            {t("report.create")}
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
