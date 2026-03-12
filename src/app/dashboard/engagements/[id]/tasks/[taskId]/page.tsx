import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { assertEngagementAccess } from "@/lib/authorization";
import { TASK_STATUS_COLORS } from "@/lib/constants";
import { getTranslator, getLocale } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import { StatusBadge } from "@/components/ui/status-badge";
import { TaskStatusSelect } from "@/components/ui/task-status-select";
import { FileUpload } from "@/components/ui/file-upload";
import { DeleteAttachmentButton } from "@/components/ui/delete-attachment-button";
import { SignoffActions } from "@/components/ui/signoff-actions";
import { SignoffHistory } from "@/components/ui/signoff-history";
import type { TaskStatus, TaskType } from "@prisma/client";

interface Props {
  params: { id: string; taskId: string };
}

export default async function TaskDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) notFound();
  const role = session.user.role ?? "auditor";
  const userId = session.user.id;
  const t = await getTranslator();
  const locale = await getLocale();

  // Authorization: verify user is a member (or admin/chief_auditor)
  try {
    await assertEngagementAccess(params.id, userId, role);
  } catch {
    notFound();
  }

  const task = await prisma.task.findUnique({
    where: { id: params.taskId },
    include: {
      engagement: true,
      assignee: true,
      attachments: {
        include: { uploadedBy: true },
        orderBy: { createdAt: "desc" },
      },
      signoffs: {
        include: { signedBy: true },
        orderBy: { signedAt: "desc" },
      },
    },
  });

  if (!task || task.engagementId !== params.id) notFound();

  const canManage =
    role === "manager" || role === "chief_auditor" || role === "admin";
  const isAssignee = userId === task.assigneeId;
  const canEdit = canManage || isAssignee;

  // Find the last preparer signoff for reviewer ≠ preparer check
  const lastPreparerSignoff = task.signoffs.find(
    (s) => s.type === "PREPARER" && s.status === "SIGNED"
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500">
        <Link href="/dashboard/engagements" className="hover:text-gray-700 transition-colors">
          {t("nav.engagements")}
        </Link>
        <span className="text-gray-300">/</span>
        <Link
          href={`/dashboard/engagements/${params.id}`}
          className="hover:text-gray-700 transition-colors"
        >
          {task.engagement.name}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-medium text-gray-700">{task.title}</span>
      </nav>

      {/* Task header */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="page-title text-xl">{task.title}</h1>
              <span className="badge bg-gray-100 text-gray-500">
                {t(`taskType.${task.type}` as TranslationKey)}
              </span>
            </div>
            {task.description && (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                {task.description}
              </p>
            )}
          </div>
          <StatusBadge
            label={t(`status.task.${task.status}` as TranslationKey)}
            colorClass={TASK_STATUS_COLORS[task.status as TaskStatus]}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-gray-100 pt-5 text-sm text-gray-600">
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {t("task.assignee")}
            </span>
            <p className="mt-0.5">
              {task.assignee
                ? task.assignee.name || task.assignee.email
                : t("task.unassigned")}
            </p>
          </div>
          {task.dueDate && (
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                {t("task.dueDate")}
              </span>
              <p className="mt-0.5">
                {new Date(task.dueDate).toLocaleDateString(locale)}
              </p>
            </div>
          )}
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {t("task.createdAt")}
            </span>
            <p className="mt-0.5">
              {new Date(task.createdAt).toLocaleDateString(locale)}
            </p>
          </div>
        </div>

        {/* Manual status change (only for non-signoff statuses) */}
        {canEdit && (
          <div className="mt-5 border-t border-gray-100 pt-5">
            <span className="mr-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              {t("task.status")}:
            </span>
            <TaskStatusSelect
              engagementId={params.id}
              taskId={task.id}
              currentStatus={task.status as TaskStatus}
            />
          </div>
        )}
      </div>

      {/* Signoff section */}
      <div className="card p-6">
        <h2 className="card-title mb-4">
          {t("task.signoffWorkflow")}
        </h2>

        {/* Signoff flow visualization */}
        <div className="mb-4 flex items-center gap-2 text-xs text-gray-400">
          <StepIndicator
            label={t("task.stepExecution")}
            active={task.status === "IN_PROGRESS"}
            done={["COMPLETED", "PENDING_REVIEW", "APPROVED", "REJECTED"].includes(task.status)}
          />
          <span className="text-gray-300">&rarr;</span>
          <StepIndicator
            label={t("signoff.stepPreparer")}
            active={task.status === "COMPLETED" || task.status === "REJECTED"}
            done={["PENDING_REVIEW", "APPROVED"].includes(task.status)}
          />
          <span className="text-gray-300">&rarr;</span>
          <StepIndicator
            label={t("signoff.stepReviewer")}
            active={task.status === "PENDING_REVIEW"}
            done={task.status === "APPROVED"}
          />
        </div>

        {/* Signoff action buttons */}
        {userId && (
          <SignoffActions
            engagementId={params.id}
            taskId={task.id}
            taskStatus={task.status}
            currentUserId={userId}
            currentUserRole={role}
            preparerUserId={lastPreparerSignoff?.signedById}
          />
        )}
      </div>

      {/* Signoff history */}
      {task.signoffs.length > 0 && (
        <div className="card p-6">
          <h2 className="card-title mb-4">
            {t("task.signoffHistory")}
          </h2>
          <SignoffHistory signoffs={task.signoffs} />
        </div>
      )}

      {/* Attachments */}
      <div className="card p-6">
        <div className="card-header">
          <h2 className="card-title">
            {t("task.attachments")}
          </h2>
          {canEdit && task.status !== "APPROVED" && task.status !== "PENDING_REVIEW" && (
            <FileUpload
              engagementId={params.id}
              taskId={task.id}
              category="evidence"
            />
          )}
        </div>

        {task.attachments.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            {t("task.noAttachments")}
          </p>
        ) : (
          <div className="space-y-2">
            {task.attachments.map((att) => (
              <div
                key={att.id}
                className="list-row"
              >
                <div className="min-w-0 flex-1">
                  <a
                    href={`/api/files/${att.id}`}
                    className="truncate text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    {att.originalName}
                  </a>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {(att.size / 1024).toFixed(0)} KB —{" "}
                    {att.uploadedBy.name || att.uploadedBy.email} —{" "}
                    {new Date(att.createdAt).toLocaleDateString(locale)}
                  </p>
                </div>
                {canEdit && task.status !== "APPROVED" && task.status !== "PENDING_REVIEW" && (
                  <DeleteAttachmentButton
                    engagementId={params.id}
                    attachmentId={att.id}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StepIndicator({
  label,
  active,
  done,
}: {
  label: string;
  active: boolean;
  done: boolean;
}) {
  const colorClass = done
    ? "bg-green-100 text-green-700 border-green-300"
    : active
      ? "bg-blue-100 text-blue-700 border-blue-300"
      : "bg-gray-50 text-gray-400 border-gray-200";

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${colorClass}`}
    >
      {done ? "\u2713 " : ""}
      {label}
    </span>
  );
}
