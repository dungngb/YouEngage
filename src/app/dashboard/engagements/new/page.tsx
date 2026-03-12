import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createEngagement } from "@/lib/actions/engagement";
import Link from "next/link";
import { FormSubmit } from "@/components/ui/form-submit";
import { getTranslator } from "@/i18n";

export default async function NewEngagementPage() {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== "manager" && role !== "chief_auditor" && role !== "admin") {
    redirect("/dashboard/engagements");
  }
  const t = await getTranslator();

  const currentYear = new Date().getFullYear();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/dashboard/engagements"
          className="btn-ghost inline-flex items-center text-gray-500 hover:text-gray-700"
        >
          &larr; {t("common.backToList")}
        </Link>
        <h1 className="page-title mt-2">
          {t("engagement.new")}
        </h1>
      </div>

      <div className="card p-6">
        <FormSubmit action={createEngagement} className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              {t("engagement.name")} *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder={t("engagement.namePlaceholder")}
              className="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Audited Entity */}
          <div>
            <label htmlFor="auditedEntity" className="block text-sm font-medium text-gray-700">
              {t("engagement.auditedEntity")} *
            </label>
            <input
              id="auditedEntity"
              name="auditedEntity"
              type="text"
              required
              placeholder={t("engagement.auditedEntityPlaceholder")}
              className="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Fiscal Year */}
          <div>
            <label htmlFor="fiscalYear" className="block text-sm font-medium text-gray-700">
              {t("engagement.fiscalYear")}
            </label>
            <input
              id="fiscalYear"
              name="fiscalYear"
              type="number"
              defaultValue={currentYear}
              className="mt-1 block w-40 rounded-card border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Planned dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="plannedStart" className="block text-sm font-medium text-gray-700">
                {t("engagement.plannedStart")}
              </label>
              <input
                id="plannedStart"
                name="plannedStart"
                type="date"
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
                className="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Scope */}
          <div>
            <label htmlFor="scope" className="block text-sm font-medium text-gray-700">
              {t("engagement.scope")}
            </label>
            <textarea
              id="scope"
              name="scope"
              rows={3}
              placeholder={t("engagement.scopePlaceholder")}
              className="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              {t("engagement.description")}
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder={t("engagement.descriptionPlaceholder")}
              className="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 border-t border-gray-100 pt-5">
            <button
              type="submit"
              className="btn-primary"
            >
              {t("engagement.create")}
            </button>
            <Link
              href="/dashboard/engagements"
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
