"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  RectangleGroupIcon,
  DocumentTextIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  UserCircleIcon,
  ClipboardDocumentListIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  allowedRoles?: string[];
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  {
    name: "Vessels",
    href: "/vessels",
    icon: RectangleGroupIcon,
    allowedRoles: ["Admin", "Encoder"],
  },
  {
    name: "Audit Types",
    href: "/audit-types",
    icon: DocumentTextIcon,
    allowedRoles: ["Admin", "Encoder"],
  },
  {
    name: "Audit Parties",
    href: "/audit-parties",
    icon: UserGroupIcon,
    allowedRoles: ["Admin", "Encoder"],
  },
  {
    name: "Audit Companies",
    href: "/audit-companies",
    icon: BuildingOffice2Icon,
    allowedRoles: ["Admin", "Encoder"],
  },
  {
    name: "Auditors",
    href: "/auditors",
    icon: UserCircleIcon,
    allowedRoles: ["Admin", "Encoder"],
  },
  {
    name: "Audit Results",
    href: "/audit-results",
    icon: ClipboardDocumentCheckIcon,
    allowedRoles: ["Admin", "Encoder"],
  },
  { name: "Audits", href: "/audits", icon: ClipboardDocumentListIcon },
  { name: "Findings", href: "/findings", icon: ExclamationTriangleIcon },
  { name: "Users", href: "/users", icon: UsersIcon, allowedRoles: ["Admin"] },
  {
    name: "Settings",
    href: "/settings",
    icon: Cog6ToothIcon,
    allowedRoles: ["Admin"],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();

  const filteredNavigation = navigation.filter(
    (item) => !item.allowedRoles || hasRole(item.allowedRoles),
  );

  return (
    <>
      <style jsx global>{`
        @media print {
          .app-layout-wrapper {
            display: none !important;
          }
        }
      `}</style>
      <div className="min-h-screen bg-gray-100 app-layout-wrapper">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-900">Audit Monitor</h1>
              <button
                className="lg:hidden text-gray-500 hover:text-gray-700"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
              {filteredNavigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname?.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }
                  `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* User info and logout */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center mb-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="mr-2 h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64 min-h-screen">
          {/* Top bar */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 lg:hidden">
            <div className="flex items-center justify-between h-16 px-4">
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setSidebarOpen(true)}
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">
                Audit Monitor
              </h1>
              <div className="w-6" /> {/* Spacer for centering */}
            </div>
          </div>

          {/* Page content */}
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </>
  );
}
