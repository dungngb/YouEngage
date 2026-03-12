import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { assertEngagementAccess } from "@/lib/authorization";
import { createTask } from "@/lib/actions/task";
import { FormSubmit } from "@/components/ui/form-submit";
import { getTranslator } from "@/i18n";

interface Props {
  params: { id: string };
}

export default async function NewTaskPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) notFound();
  const role = session.user.role;

  if (role !== "manager" && role !== "chief_auditor" && role !== "admin") {
    redirect(`/dashboard/engagements/${params.id}`);
  }

  try {
    await assertEngagementAccess(params.id, session.user.id, role);
  } catch {
    notFound();
  }

  const engagement = await prisma.engagement.findUnique({
    where: { id: params.id },
    include: {
      members: { include: { user: true } },
    },
  });

  if (!engagement) notFound();
  const t = await getTranslator();

  const createTaskWithEngagement = createTask.bind(null, engagement.id);

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
          {t("task.new")}
        </h1>
      </div>

      <FormSubmit action={createTaskWithEngagement} className="card space-y-5 p-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            {t("task.titleLabel")} *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder={t("task.titlePlaceholder")}
            className="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            {t("task.type")}
          </label>
          <select
            id="type"
            name="type"
            className="mt-1 block w-48 rounded-card border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          >
            <option value="TASK">Task</option>
            <option value="WORKPAPER">Workpaper</option>
          </select>
        </div>

        {/* Assignee */}
        <div>
          <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700">
            {t("task.assignTo")}
          </label>
          <select
            id="assigneeId"
            name="assigneeId"
            className="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          >
            <option value="">-- {t("task.unassigned")} --</option>
            {engagement.members.map((m) => (
              <option key={m.user.id} value={m.user.id}>
                {m.user.name || m.user.email} ({m.role})
              </option>
            ))}
          </select>
        </div>

        {/* Due date */}
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
            {t("task.dueDate")}
          </label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            className="mt-1 block w-48 rounded-card border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            {t("task.description")}
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder={t("task.descriptionPlaceholder")}
            className="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 border-t border-gray-100 pt-5">
          <button
            type="submit"
            className="btn-primary"
          >
            {t("task.create")}
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
