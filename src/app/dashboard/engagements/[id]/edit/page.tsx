import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { assertEngagementAccess } from "@/lib/authorization";
import { updateEngagement } from "@/lib/actions/engagement";
import { FormSubmit } from "@/components/ui/form-submit";
import { getTranslator } from "@/i18n";

interface Props {
  params: { id: string };
}

export default async function EditEngagementPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) notFound();
  const role = session.user.role;

  if (role !== "manager" && role !== "chief_auditor" && role !== "admin") {
    redirect(`/dashboard/engagements/${params.id}`);
  }
  const t = await getTranslator();

  try {
    await assertEngagementAccess(params.id, session.user.id, role);
  } catch {
    notFound();
  }

  const engagement = await prisma.engagement.findUnique({
    where: { id: params.id },
  });

  if (!engagement) notFound();

  const updateWithId = updateEngagement.bind(null, engagement.id);

  const fmt = (d: Date | null) =>
    d ? d.toISOString().split("T")[0] : "";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/dashboard/engagements/${engagement.id}`}
          className="btn-ghost inline-flex items-center text-gray-500 hover:text-gray-700"
        >
          &larr; {t("common.back")}
        </Link>
        <h1 className="page-title mt-2">
          {t("engagement.edit")}
        </h1>
      </div>

      <div className="card p-6">
        <FormSubmit action={updateWithId} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              {t("engagement.name")} *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={engagement.name}
              className="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="auditedEntity" className="block text-sm font-medium text-gray-700">
              {t("engagement.auditedEntity")} *
            </label>
            <input
              id="auditedEntity"
              name="auditedEntity"
              type="text"
              required
              defaultValue={engagement.auditedEntity}
              className="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="fiscalYear" className="block text-sm font-medium text-gray-700">
              {t("engagement.fiscalYear")}
            </label>
            <input
              id="fiscalYear"
              name="fiscalYear"
              type="number"
              defaultValue={engagement.fiscalYear ?? ""}
              className="mt-1 block w-40 rounded-card border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="plannedStart" className="block text-sm font-medium text-gray-700">
                {t("engagement.plannedStart")}
              </label>
              <input
                id="plannedStart"
                name="plannedStart"
                type="date"
                defaultValue={fmt(engagement.plannedStart)}
                className="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label htmlFor="plannedEnd" className="block text-sm font-medium text-gray-700">
                {t("engagement.plannedEnd")}
              </label>
              <input
                id="plannedEnd"
                name="plannedEnd"
                type="date"
                defaultValue={fmt(engagement.plannedEnd)}
                className="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="scope" className="block text-sm font-medium text-gray-700">
              {t("engagement.scope")}
            </label>
            <textarea
              id="scope"
              name="scope"
              rows={3}
              defaultValue={engagement.scope ?? ""}
              className="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              {t("engagement.description")}
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={engagement.description ?? ""}
              className="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-3 border-t border-gray-100 pt-5">
            <button
              type="submit"
              className="btn-primary"
            >
              {t("common.save")}
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
    </div>
  );
}
