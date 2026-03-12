import Link from "next/link";
import { getTranslator } from "@/i18n";

export default async function NotFound() {
  const t = await getTranslator();

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300">404</h1>
        <p className="mt-4 text-lg text-gray-600">{t("error.notFound")}</p>
        <Link
          href="/dashboard"
          className="btn-primary mt-6 inline-block"
        >
          {t("error.backToDashboard")}
        </Link>
      </div>
    </div>
  );
}
