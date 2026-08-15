'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  BarChart3,
  ShoppingCart,
  Users,
  Package,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Eye,
  Boxes,
  TrendingUp,
  Shield,
  Building2,
  Receipt,
} from 'lucide-react';

export function DashboardSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', href: '/dashboard', roles: ['admin', 'manager', 'staff'] },
    { icon: Eye, label: 'Prescriptions', href: '/dashboard/prescriptions', roles: ['admin', 'manager', 'optometrist', 'staff'] },
    { icon: ShoppingCart, label: 'POS & Billing', href: '/dashboard/pos', roles: ['admin', 'manager', 'sales', 'staff'] },
    { icon: Receipt, label: 'Sales Invoices', href: '/dashboard/invoices', roles: ['admin', 'manager', 'sales', 'staff'] },
    { icon: Users, label: 'Customers', href: '/dashboard/customers', roles: ['admin', 'manager', 'sales', 'staff'] },
    { icon: Package, label: 'Inventory', href: '/dashboard/inventory', roles: ['admin', 'manager', 'staff'] },
    { icon: Boxes, label: 'Lab Orders', href: '/dashboard/lab-orders', roles: ['admin', 'manager', 'staff'] },
    { icon: FileText, label: 'Reports', href: '/dashboard/reports', roles: ['admin', 'manager', 'accountant'] },
    { icon: Shield, label: 'User Management', href: '/dashboard/users', roles: ['admin'] },
    { icon: Building2, label: 'Company Settings', href: '/dashboard/settings', roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden print:hidden p-2 rounded-lg bg-gray-900 text-white shadow-md"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Auto-Expanding Hover Sidebar */}
      <aside
        className={`group/sidebar print:hidden fixed left-0 top-0 h-screen z-40 bg-gray-900 text-white transition-all duration-300 ease-in-out shadow-xl ${isOpen
          ? 'w-64 translate-x-0'
          : '-translate-x-full md:translate-x-0 w-16 hover:w-64'
          }`}
      >
        <div className="flex h-full flex-col overflow-hidden">
          {/* Logo */}
          <div className="border-b border-gray-800 p-3.5 flex items-center justify-start gap-3 h-16 shrink-0">
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md overflow-hidden">
              <img
                src="/assets/logo.jpg"
                alt="Lumen Opticals"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="truncate opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
              <h1 className="text-sm font-bold leading-none truncate text-white">Lumen Optical</h1>
              <p className="text-[10px] text-gray-400 mt-1 truncate">MIS ERP Suite</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1.5 overflow-y-auto p-2 no-scrollbar">
            {filteredMenuItems.map((item) => {
              const isActive = item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname?.startsWith(item.href);

              return (
                <Link key={item.href} href={item.href} title={item.label}>
                  <button
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition-all relative ${
                      isActive
                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                        : 'text-gray-300 hover:bg-gray-800/90 hover:text-indigo-300 font-medium'
                    }`}
                  >
                    <item.icon
                      size={20}
                      className={`shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-gray-400 group-hover/sidebar:text-indigo-400'
                      }`}
                    />
                    <span className="truncate opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      {item.label}
                    </span>
                    {isActive && (
                      <span className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-white opacity-0 group-hover/sidebar:opacity-100 transition-opacity"></span>
                    )}
                  </button>
                </Link>
              );
            })}
          </nav>

          {/* User & Logout */}
          <div className="border-t border-gray-800 p-2 shrink-0">
            <div className="rounded-xl bg-gray-800/60 p-2 mb-2 flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="truncate opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
                <p className="text-xs font-semibold truncate text-white">{user?.name}</p>
                <p className="text-[10px] text-gray-400 capitalize truncate">{user?.role}</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-center gap-2 text-red-400 border-gray-800 hover:bg-red-500/20 hover:text-red-300 h-9 px-2 text-xs"
              title="Logout"
            >
              <LogOut size={16} className="shrink-0" />
              <span className="truncate opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
                Logout
              </span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    setShouldRender(true);
  }, [user, isLoading, router]);

  if (isLoading || !shouldRender) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600 mx-auto" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 md:ml-16 print:ml-0 transition-all duration-300">
        <div className="p-6 print:p-0">{children}</div>
      </main>
    </div>
  );
}
