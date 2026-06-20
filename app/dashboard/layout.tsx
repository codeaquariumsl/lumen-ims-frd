'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', href: '/dashboard', roles: ['admin', 'manager', 'staff'] },
    { icon: ShoppingCart, label: 'POS & Billing', href: '/dashboard/pos', roles: ['admin', 'manager', 'sales', 'staff'] },
    { icon: Receipt, label: 'Sales Invoices', href: '/dashboard/invoices', roles: ['admin', 'manager', 'sales', 'staff'] },
    { icon: Package, label: 'Inventory', href: '/dashboard/inventory', roles: ['admin', 'manager', 'staff'] },
    { icon: Users, label: 'Customers', href: '/dashboard/customers', roles: ['admin', 'manager', 'sales', 'staff'] },
    { icon: Eye, label: 'Prescriptions', href: '/dashboard/prescriptions', roles: ['admin', 'manager', 'optometrist', 'staff'] },
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
        className="fixed top-4 left-4 z-50 md:hidden print:hidden"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`print:hidden fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="border-b border-gray-800 p-4 flex flex-col items-center text-center">
            {/* <div className="bg-white p-2 rounded-lg mb-3 w-full flex justify-center">
              <img src="/assets/logo.jpg" alt="Lumen Optical Logo" className="h-16 w-auto object-contain" />
            </div> */}
            <h1 className="text-xl font-bold">Lumen Optical</h1>
            <p className="mt-1 text-xs text-gray-400">Management Information System</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 overflow-y-auto p-4">
            {filteredMenuItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <button className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-xs font-medium hover:bg-gray-800 transition-colors">
                  <item.icon size={20} />
                  {item.label}
                </button>
              </Link>
            ))}
          </nav>

          {/* User & Logout */}
          <div className="border-t border-gray-800 p-2">
            <div className="rounded-lg bg-gray-800 p-3 mb-3">
              <p className="text-xs text-gray-400">Logged in as</p>
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-center gap-2 text-red-500 hover:bg-red-200 hover:text-red-500"
            >
              <LogOut size={16} />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
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
      <main className="flex-1 md:ml-64 print:ml-0">
        <div className="p-6 print:p-0">{children}</div>
      </main>
    </div>
  );
}
