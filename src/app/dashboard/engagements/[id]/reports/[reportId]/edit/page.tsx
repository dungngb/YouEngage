import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { assertEngagementAccess } from "@/lib/authorization";
import { updateReport } from "@/lib/actions/report";
import { FormSubmit } from "@/components/ui/form-submit";

interface Props {
  params: { id: string; reportId: string };
}

export default async function EditReportPage({ params }: Props) {
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

  const report = await prisma.report.findUnique({
    where: { id: params.reportId },
    include: { engagement: { select: { name: true } } },
  });

  if (!report || report.engagementId !== params.id) notFound();

  if (report.status === "ISSUED") {
    notFound(); // locked reports cannot be edited
  }

  const updateReportWithIds = updateReport.bind(
    null,
    params.id,
    params.reportId
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/dashboard/engagements/${params.id}/reports/${params.reportId}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; {report.title}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Sửa báo cáo
        </h1>
      </div>

      <FormSubmit
        action={updateReportWithIds}
        className="space-y-4 rounded-lg border border-gray-200 bg-white p-6"
      >
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Tiêu đề báo cáo *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={report.title}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Mô tả
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={report.description || ""}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Lưu
          </button>
          <Link
            href={`/dashboard/engagements/${params.id}/reports/${params.reportId}`}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Hủy
          </Link>
        </div>
      </FormSubmit>
    </div>
  );
}
