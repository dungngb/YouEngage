"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { handleSignOut } from "@/lib/actions";
import type { NotificationCounts } from "@/lib/notifications";
import { useLocale } from "@/i18n/locale-context";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import type { TranslationKey } from "@/i18n/vi";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
  };
  notifications: NotificationCounts;
}

interface NavItem {
  labelKey: TranslationKey;
  href: string;
  roles: string[];
  badgeKey?: keyof NotificationCounts;
}

const NAV_ITEMS: NavItem[] = [
  {
    labelKey: "nav.dashboard",
    href: "/dashboard",
    roles: ["chief_auditor", "manager", "auditor", "admin"],
  },
  {
    labelKey: "nav.engagements",
    href: "/dashboard/engagements",
    roles: ["chief_auditor", "manager", "auditor"],
    badgeKey: "pendingReviews",
  },
  {
    labelKey: "nav.findings",
    href: "/dashboard/findings",
    roles: ["chief_auditor", "manager", "auditor"],
    badgeKey: "openFindings",
  },
  {
    labelKey: "nav.reports",
    href: "/dashboard/reports",
    roles: ["chief_auditor", "manager"],
  },
  {
    labelKey: "nav.documents",
    href: "/dashboard/documents",
    roles: ["chief_auditor", "manager", "auditor"],
  },
  {
    labelKey: "nav.admin",
    href: "/admin",
    roles: ["admin"],
  },
];

const ROLE_LABEL_KEYS: Record<string, TranslationKey> = {
  chief_auditor: "role.chief_auditor_short",
  manager: "role.manager",
  auditor: "role.auditor",
  admin: "role.admin",
};

export function Sidebar({ user, notifications }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLocale();

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <aside className="flex h-full w-60 flex-col border-r border-gray-200/80 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200/80 px-5">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight text-primary-700">
          YouEngage
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const badgeCount = item.badgeKey ? notifications[item.badgeKey] : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center justify-between rounded-card px-3 py-2 text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-surface-hover hover:text-gray-900"
              )}
            >
              <span>{t(item.labelKey)}</span>
              {badgeCount > 0 && (
                <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Language + User info + Sign out */}
      <div className="border-t border-gray-200/80 p-4">
        <div className="mb-3">
          <LanguageSwitcher />
        </div>
        <div className="mb-3">
          <p className="truncate text-sm font-medium text-gray-900">
            {user.name}
          </p>
          <p className="truncate text-xs text-gray-500">{user.email}</p>
          <span className="mt-1 inline-block rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
            {t(ROLE_LABEL_KEYS[user.role] ?? "role.auditor")}
          </span>
        </div>
        <form action={handleSignOut}>
          <button
            type="submit"
            className="btn-secondary btn-sm w-full"
          >
            {t("nav.signOut")}
          </button>
        </form>
      </div>
    </aside>
  );
}
