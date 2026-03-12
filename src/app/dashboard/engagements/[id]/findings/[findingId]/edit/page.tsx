import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { assertEngagementAccess } from "@/lib/authorization";
import { updateFinding } from "@/lib/actions/finding";
import { FormSubmit } from "@/components/ui/form-submit";

interface Props {
  params: { id: string; findingId: string };
}

export default async function EditFindingPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) notFound();

  try {
    await assertEngagementAccess(params.id, session.user.id, session.user.role);
  } catch {
    notFound();
  }

  const finding = await prisma.finding.findUnique({
    where: { id: params.findingId },
    include: { engagement: { select: { name: true } } },
  });

  if (!finding || finding.engagementId !== params.id) notFound();

  if (finding.status === "CLOSED") {
    notFound(); // closed findings cannot be edited
  }

  const updateFindingWithIds = updateFinding.bind(
    null,
    params.id,
    params.findingId
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/dashboard/engagements/${params.id}/findings/${params.findingId}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; {finding.title}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Sửa Finding
        </h1>
      </div>

      <FormSubmit
        action={updateFindingWithIds}
        className="space-y-4 rounded-lg border border-gray-200 bg-white p-6"
      >
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Tiêu đề finding *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={finding.title}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Mô tả chi tiết
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={finding.description || ""}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="riskRating"
              className="block text-sm font-medium text-gray-700"
            >
              Mức độ rủi ro
            </label>
            <select
              id="riskRating"
              name="riskRating"
              defaultValue={finding.riskRating}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="HIGH">Cao</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="LOW">Thấp</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="dueDate"
              className="block text-sm font-medium text-gray-700"
            >
              Hạn khắc phục
            </label>
            <input
              id="dueDate"
              name="dueDate"
              type="date"
              defaultValue={
                finding.dueDate
                  ? new Date(finding.dueDate).toISOString().split("T")[0]
                  : ""
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="recommendation"
            className="block text-sm font-medium text-gray-700"
          >
            Khuyến nghị
          </label>
          <textarea
            id="recommendation"
            name="recommendation"
            rows={3}
            defaultValue={finding.recommendation || ""}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div>
          <label
            htmlFor="managementResponse"
            className="block text-sm font-medium text-gray-700"
          >
            Phản hồi quản lý
          </label>
          <textarea
            id="managementResponse"
            name="managementResponse"
            rows={3}
            defaultValue={finding.managementResponse || ""}
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
            href={`/dashboard/engagements/${params.id}/findings/${params.findingId}`}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Hủy
          </Link>
        </div>
      </FormSubmit>
    </div>
  );
}
