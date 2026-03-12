import Link from "next/link";
import { getTranslator } from "@/i18n";

export default async function DashboardNotFound() {
  const t = await getTranslator();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-300">404</h2>
        <p className="mt-3 text-sm text-gray-500">
          {t("error.dashboardNotFound")}
        </p>
        <Link
          href="/dashboard"
          className="btn-primary mt-5 inline-block"
        >
          {t("error.backToDashboard")}
        </Link>
      </div>
    </div>
  );
}
