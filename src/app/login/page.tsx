import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslator } from "@/i18n";

const DEV_AUTH_ENABLED = process.env.DEV_AUTH === "true";

const DEMO_USERS = [
  { email: "chief@demo.local", label: "Nguyen Van An — Chief Auditor" },
  { email: "manager1@demo.local", label: "Tran Thi Binh — Manager 1" },
  { email: "manager2@demo.local", label: "Le Van Cuong — Manager 2" },
  { email: "auditor1@demo.local", label: "Pham Minh Duc — Auditor 1" },
  { email: "auditor2@demo.local", label: "Hoang Thi Em — Auditor 2" },
  { email: "auditor3@demo.local", label: "Vo Van Phat — Auditor 3" },
];

export default async function LoginPage() {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  }

  const t = await getTranslator();

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="card w-full max-w-md space-y-8 p-8 shadow-card">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary-700">YouEngage</h1>
          <p className="mt-2 text-sm text-gray-500">
            {t("login.subtitle")}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200/80" />

        {/* Sign in form */}
        <div className="space-y-4">
          <p className="text-center text-sm text-gray-600">
            {t("login.microsoftHint")}
          </p>

          <form
            action={async () => {
              "use server";
              await signIn("microsoft-entra-id", {
                redirectTo: "/dashboard",
              });
            }}
          >
            <button
              type="submit"
              className="btn-primary flex w-full items-center justify-center gap-3 py-3"
            >
              <svg className="h-5 w-5" viewBox="0 0 21 21" fill="none">
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
              {t("login.microsoftButton")}
            </button>
          </form>
        </div>

        {/* Dev Login Section */}
        {DEV_AUTH_ENABLED && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-amber-300" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 font-semibold uppercase tracking-wide text-amber-600">
                  {t("login.devSection")}
                </span>
              </div>
            </div>

            <div className="rounded-card border-2 border-amber-300 bg-amber-50 p-4">
              <form
                action={async (formData: FormData) => {
                  "use server";
                  const email = formData.get("email") as string;
                  if (!email) return;
                  await signIn("dev-credentials", {
                    email,
                    redirectTo: "/dashboard",
                  });
                }}
                className="space-y-3"
              >
                <label
                  htmlFor="dev-user"
                  className="block text-sm font-medium text-amber-800"
                >
                  {t("login.devSelectUser")}
                </label>
                <select
                  id="dev-user"
                  name="email"
                  className="block w-full rounded-card border border-amber-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {DEMO_USERS.map((u) => (
                    <option key={u.email} value={u.email}>
                      {u.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="btn btn-sm w-full bg-amber-500 py-2.5 text-white hover:bg-amber-600"
                >
                  {t("login.devButton")}
                </button>
              </form>
            </div>
          </>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400">
          {t("login.footer")}
        </p>
      </div>
    </div>
  );
}
