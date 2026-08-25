'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Building2,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  Check,
  Filter,
  Layers,
  Sparkles,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  AlertCircle
} from 'lucide-react';

interface User {
  id: number | string;
  full_name: string;
  name: string;
  username: string;
  email: string;
  phone: string | null;
  role: string;
  branch_id: number | null;
  branch_name?: string;
  branch_code?: string;
  is_active: number | boolean;
  last_login: string | null;
  created_at: string;
}

interface Role {
  key: string;
  name: string;
  description: string;
  isSystem?: boolean;
  badgeColor?: string;
  permissions: string[];
  userCount?: number;
}

interface PermissionItem {
  key: string;
  label: string;
}

interface PermissionModule {
  module: string;
  permissions: PermissionItem[];
}

interface Branch {
  id: number;
  name: string;
  code: string;
  city?: string;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'matrix'>('users');

  // Loading states
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalRoles: 0
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionsCatalog, setPermissionsCatalog] = useState<PermissionModule[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [isDeleteRoleOpen, setIsDeleteRoleOpen] = useState(false);

  // Target items for modals
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoleKey, setSelectedRoleKey] = useState<string>('admin');
  const [selectedRoleToDelete, setSelectedRoleToDelete] = useState<Role | null>(null);

  // User Form Data
  const [userFormData, setUserFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'staff',
    branchId: '',
    isActive: true
  });

  // Password reset form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Role Form Data
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  // Permissions Matrix Form Data
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<string[]>([]);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  // Fetch Users & Summary
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (branchFilter !== 'all') params.append('branchId', branchFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await apiClient.get(`/users?${params.toString()}`);
      if (res.data?.success && res.data?.data) {
        setUsers(res.data.data.users || []);
        if (res.data.data.summary) {
          setSummary(res.data.data.summary);
        }
      }
    } catch (err: any) {
      console.error('Failed to load users', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fetch Roles & Master Permissions
  const fetchRolesAndPermissions = async () => {
    setIsLoadingRoles(true);
    try {
      const res = await apiClient.get('/users/roles');
      if (res.data?.success && res.data?.data) {
        const fetchedRoles: Role[] = res.data.data.roles || [];
        setRoles(fetchedRoles);
        setPermissionsCatalog(res.data.data.permissionsCatalog || []);

        if (fetchedRoles.length > 0) {
          const current = fetchedRoles.find(r => r.key === selectedRoleKey) || fetchedRoles[0];
          setSelectedRoleKey(current.key);
          setSelectedRolePermissions(current.permissions || []);
        }
      }
    } catch (err: any) {
      console.error('Failed to load roles', err);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  // Fetch Branches
  const fetchBranches = async () => {
    try {
      const res = await apiClient.get('/branches');
      if (res.data?.success) {
        setBranches(res.data.data.branches || res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load branches', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRolesAndPermissions();
    fetchBranches();
  }, []);

  // Debounced search / filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, roleFilter, branchFilter, statusFilter]);

  // Sync permissions when selected role changes in matrix tab
  useEffect(() => {
    const role = roles.find(r => r.key === selectedRoleKey);
    if (role) {
      setSelectedRolePermissions(role.permissions || []);
    }
  }, [selectedRoleKey, roles]);

  // Generate strong random password
  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleGeneratePasswordForCreate = () => {
    const pwd = generateStrongPassword();
    setUserFormData(prev => ({ ...prev, password: pwd }));
    navigator.clipboard.writeText(pwd);
    setCopiedPassword(true);
    toast.success('Generated and copied password to clipboard!');
    setTimeout(() => setCopiedPassword(false), 2500);
  };

  const handleGeneratePasswordForReset = () => {
    const pwd = generateStrongPassword();
    setNewPassword(pwd);
    setConfirmPassword(pwd);
    navigator.clipboard.writeText(pwd);
    setCopiedPassword(true);
    toast.success('Generated and copied password to clipboard!');
    setTimeout(() => setCopiedPassword(false), 2500);
  };

  // Open Create User Modal
  const handleOpenAddUser = () => {
    const autoPwd = generateStrongPassword();
    setUserFormData({
      fullName: '',
      username: '',
      email: '',
      phone: '',
      password: autoPwd,
      role: roles[0]?.key || 'staff',
      branchId: branches[0]?.id?.toString() || '',
      isActive: true
    });
    setShowPassword(true);
    setIsAddUserOpen(true);
  };

  // Open Edit User Modal
  const handleOpenEditUser = (u: User) => {
    setSelectedUser(u);
    setUserFormData({
      fullName: u.full_name || u.name || '',
      username: u.username || '',
      email: u.email || '',
      phone: u.phone || '',
      password: '',
      role: u.role || 'staff',
      branchId: u.branch_id ? u.branch_id.toString() : '',
      isActive: Boolean(u.is_active)
    });
    setIsEditUserOpen(true);
  };

  // Open Reset Password Modal
  const handleOpenResetPassword = (u: User) => {
    setSelectedUser(u);
    const initialPwd = generateStrongPassword();
    setNewPassword(initialPwd);
    setConfirmPassword(initialPwd);
    setShowPassword(true);
    setIsResetPasswordOpen(true);
  };

  // Open Delete User Modal
  const handleOpenDeleteUser = (u: User) => {
    setSelectedUser(u);
    setIsDeleteUserOpen(true);
  };

  // Handle Save New User
  const handleSaveAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.fullName.trim()) {
      toast.error('Full Name is required');
      return;
    }
    if (!userFormData.username.trim()) {
      toast.error('Username is required');
      return;
    }
    if (!userFormData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!userFormData.password || userFormData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        fullName: userFormData.fullName.trim(),
        name: userFormData.fullName.trim(),
        username: userFormData.username.trim().toLowerCase(),
        email: userFormData.email.trim().toLowerCase(),
        phone: userFormData.phone.trim() || null,
        password: userFormData.password,
        role: userFormData.role,
        branchId: userFormData.branchId ? parseInt(userFormData.branchId) : null,
        isActive: userFormData.isActive
      };

      const res = await apiClient.post('/users', payload);
      if (res.data?.success) {
        toast.success(`User "${payload.fullName}" created successfully!`);
        setIsAddUserOpen(false);
        fetchUsers();
        fetchRolesAndPermissions();
      }
    } catch (err: any) {
      console.error('Error creating user', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Save Edit User
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!userFormData.fullName.trim()) {
      toast.error('Full Name is required');
      return;
    }
    if (!userFormData.username.trim()) {
      toast.error('Username is required');
      return;
    }
    if (!userFormData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        fullName: userFormData.fullName.trim(),
        name: userFormData.fullName.trim(),
        username: userFormData.username.trim().toLowerCase(),
        email: userFormData.email.trim().toLowerCase(),
        phone: userFormData.phone.trim() || null,
        role: userFormData.role,
        branchId: userFormData.branchId ? parseInt(userFormData.branchId) : null,
        isActive: userFormData.isActive
      };

      const res = await apiClient.put(`/users/${selectedUser.id}`, payload);
      if (res.data?.success) {
        toast.success(`User "${payload.fullName}" updated successfully!`);
        setIsEditUserOpen(false);
        fetchUsers();
        fetchRolesAndPermissions();
      }
    } catch (err: any) {
      console.error('Error updating user', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Submit Password Reset
  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSaving(true);
    try {
      const res = await apiClient.patch(`/users/${selectedUser.id}/password`, {
        password: newPassword
      });
      if (res.data?.success) {
        toast.success(`Password reset successfully for ${selectedUser.full_name || selectedUser.name}`);
        setIsResetPasswordOpen(false);
      }
    } catch (err: any) {
      console.error('Error resetting password', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Quick Toggle Status
  const handleToggleStatus = async (u: User) => {
    const nextStatus = !Boolean(u.is_active);
    try {
      const res = await apiClient.patch(`/users/${u.id}/status`, { isActive: nextStatus });
      if (res.data?.success) {
        toast.success(`User ${nextStatus ? 'activated' : 'deactivated'} successfully`);
        fetchUsers();
      }
    } catch (err: any) {
      console.error('Failed to toggle status', err);
    }
  };

  // Handle Delete User
  const handleConfirmDeleteUser = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      const res = await apiClient.delete(`/users/${selectedUser.id}`);
      if (res.data?.success) {
        toast.success(`User "${selectedUser.full_name || selectedUser.name}" deleted successfully`);
        setIsDeleteUserOpen(false);
        fetchUsers();
        fetchRolesAndPermissions();
      }
    } catch (err: any) {
      console.error('Error deleting user', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Create Custom Role
  const handleSaveAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleFormData.name.trim()) {
      toast.error('Role name is required');
      return;
    }

    setIsSaving(true);
    try {
      const res = await apiClient.post('/users/roles', {
        name: roleFormData.name.trim(),
        description: roleFormData.description.trim(),
        permissions: roleFormData.permissions
      });

      if (res.data?.success) {
        toast.success(`Role "${roleFormData.name}" created successfully!`);
        setIsAddRoleOpen(false);
        setRoleFormData({ name: '', description: '', permissions: [] });
        fetchRolesAndPermissions();
      }
    } catch (err: any) {
      console.error('Error creating role', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Custom Role
  const handleConfirmDeleteRole = async () => {
    if (!selectedRoleToDelete) return;
    setIsSaving(true);
    try {
      const res = await apiClient.delete(`/users/roles/${selectedRoleToDelete.key}`);
      if (res.data?.success) {
        toast.success(`Role "${selectedRoleToDelete.name}" deleted successfully`);
        setIsDeleteRoleOpen(false);
        fetchRolesAndPermissions();
      }
    } catch (err: any) {
      console.error('Error deleting role', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Toggle Permission in Matrix
  const handleTogglePermission = (permKey: string) => {
    if (selectedRoleKey === 'admin') {
      toast.info('Administrator retains all permissions by default.');
      return;
    }

    setSelectedRolePermissions(prev => {
      if (prev.includes(permKey)) {
        return prev.filter(k => k !== permKey);
      } else {
        return [...prev, permKey];
      }
    });
  };

  // Handle Toggle All in a Module
  const handleToggleModulePermissions = (modulePermissions: PermissionItem[]) => {
    if (selectedRoleKey === 'admin') return;

    const moduleKeys = modulePermissions.map(p => p.key);
    const allSelected = moduleKeys.every(k => selectedRolePermissions.includes(k));

    if (allSelected) {
      // Unselect all in this module
      setSelectedRolePermissions(prev => prev.filter(k => !moduleKeys.includes(k)));
    } else {
      // Select all in this module
      setSelectedRolePermissions(prev => Array.from(new Set([...prev, ...moduleKeys])));
    }
  };

  // Save Permissions for selected role
  const handleSavePermissions = async () => {
    setIsSavingPermissions(true);
    try {
      const res = await apiClient.put(`/users/roles/${selectedRoleKey}`, {
        permissions: selectedRolePermissions
      });
      if (res.data?.success) {
        toast.success('Role permissions saved successfully!');
        fetchRolesAndPermissions();
      }
    } catch (err: any) {
      console.error('Error saving role permissions', err);
    } finally {
      setIsSavingPermissions(false);
    }
  };

  // Role Badge Helper
  const getRoleBadge = (roleKey: string) => {
    const roleObj = roles.find(r => r.key === roleKey);
    const name = roleObj ? roleObj.name : roleKey.toUpperCase();

    const colorMap: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800 border-purple-200',
      manager: 'bg-blue-100 text-blue-800 border-blue-200',
      optometrist: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      sales: 'bg-amber-100 text-amber-800 border-amber-200',
      staff: 'bg-slate-100 text-slate-800 border-slate-200',
      pharmacist: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      accountant: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };

    const colorClass = colorMap[roleKey.toLowerCase()] || 'bg-violet-100 text-violet-800 border-violet-200';

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>
        <Shield size={12} className="shrink-0" />
        {name}
      </span>
    );
  };

  // Pagination calculations
  const totalPages = Math.ceil(users.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return users.slice(start, start + itemsPerPage);
  }, [users, currentPage]);

  const activeRoleObj = roles.find(r => r.key === selectedRoleKey);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950 p-8 shadow-xl text-white">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-10 h-60 w-60 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-purple-200 border border-white/10 mb-3">
              <ShieldCheck size={14} className="text-purple-300" />
              <span>Access Control & Security Suite</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              User & Role Management
            </h1>
            <p className="mt-2 text-sm lg:text-base text-purple-200 max-w-2xl">
              Control system access, create user credentials, configure branch permissions, and define fine-grained role privileges.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleOpenAddUser}
              className="bg-gradient-to-r from-[#f47b20] to-[#e0660e] hover:from-[#e0660e] hover:to-[#c85507] text-white shadow-lg shadow-orange-500/25 font-semibold px-5 py-2.5 h-auto rounded-xl gap-2 transition-all hover:scale-105"
            >
              <UserPlus size={18} />
              Add New User
            </Button>
            <Button
              onClick={() => setIsAddRoleOpen(true)}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md rounded-xl font-medium px-4 py-2.5 h-auto gap-2"
            >
              <Shield size={16} />
              Add Custom Role
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Users</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{summary.total}</h3>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Users size={12} className="text-indigo-600" /> All system accounts
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users size={22} />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Accounts</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{summary.active}</h3>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <UserCheck size={12} className="text-emerald-500" /> Currently operational
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 size={22} />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Inactive Accounts</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{summary.inactive}</h3>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <UserX size={12} className="text-amber-500" /> Deactivated logins
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <XCircle size={22} />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Defined Roles</p>
              <h3 className="text-2xl font-bold text-purple-600 mt-1">{roles.length}</h3>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Shield size={12} className="text-purple-500" /> System & custom roles
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Shield size={22} />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 rounded-2xl shadow-sm">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-xl transition-all ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Users size={18} />
          <span>Users Directory</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
            activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {summary.total}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-xl transition-all ${
            activeTab === 'roles'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Shield size={18} />
          <span>Roles & Access</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
            activeTab === 'roles' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {roles.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-xl transition-all ${
            activeTab === 'matrix'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Key size={18} />
          <span>Permissions Matrix</span>
        </button>
      </div>

      {/* ======================= TAB 1: USERS DIRECTORY ======================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search and Filters Bar */}
          <Card className="p-4 bg-white border border-gray-200/80 rounded-2xl shadow-sm">
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[280px]">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by full name, username, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-gray-50 border-gray-200 rounded-xl focus:bg-white text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Role Filter */}
                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                  <Shield size={14} className="text-gray-500" />
                  <span className="text-xs font-semibold text-gray-500">Role:</span>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer"
                  >
                    <option value="all">All Roles</option>
                    {roles.map(r => (
                      <option key={r.key} value={r.key}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {/* Branch Filter */}
                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                  <Building2 size={14} className="text-gray-500" />
                  <span className="text-xs font-semibold text-gray-500">Branch:</span>
                  <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer"
                  >
                    <option value="all">All Branches</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id.toString()}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                  <SlidersHorizontal size={14} className="text-gray-500" />
                  <span className="text-xs font-semibold text-gray-500">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>

                <Button
                  onClick={fetchUsers}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-gray-200 text-gray-600 hover:text-indigo-600 gap-1"
                  title="Refresh users list"
                >
                  <RefreshCw size={14} className={isLoadingUsers ? 'animate-spin' : ''} />
                </Button>
              </div>
            </div>
          </Card>

          {/* Users Table */}
          <Card className="overflow-hidden border border-gray-200/80 rounded-2xl shadow-sm bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">User Profile</th>
                    <th className="px-6 py-4">Username & Email</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Branch Location</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4">Last Activity</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {isLoadingUsers ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                          <p className="font-medium text-gray-600">Loading system users...</p>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-16 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                          <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
                            <Users size={28} />
                          </div>
                          <h4 className="text-base font-bold text-gray-900">No users match your criteria</h4>
                          <p className="text-xs text-gray-500 mt-1 mb-4">
                            Try adjusting your search terms, role filters, or branch selection.
                          </p>
                          <Button
                            onClick={() => {
                              setSearchTerm('');
                              setRoleFilter('all');
                              setBranchFilter('all');
                              setStatusFilter('all');
                            }}
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                          >
                            Reset All Filters
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u) => {
                      const isActive = Boolean(u.is_active);
                      const displayName = u.full_name || u.name;
                      const initial = displayName ? displayName.charAt(0).toUpperCase() : 'U';

                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-indigo-50/40 transition-colors group"
                        >
                          {/* Profile */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                                  {initial}
                                </div>
                                <span
                                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                    isActive ? 'bg-emerald-500' : 'bg-gray-300'
                                  }`}
                                  title={isActive ? 'Active User' : 'Inactive User'}
                                />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 leading-tight">
                                  {displayName}
                                </p>
                                <p className="text-xs text-gray-500 font-mono mt-0.5">
                                  ID: #{u.id}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Username & Email */}
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md inline-flex font-mono">
                                <span>@{u.username || 'n/a'}</span>
                              </div>
                              <div className="text-xs text-gray-600 flex items-center gap-1.5">
                                <Mail size={12} className="text-gray-400" />
                                <a href={`mailto:${u.email}`} className="hover:underline hover:text-indigo-600">
                                  {u.email}
                                </a>
                              </div>
                            </div>
                          </td>

                          {/* Phone */}
                          <td className="px-6 py-4">
                            {u.phone ? (
                              <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                                <Phone size={12} className="text-gray-400" />
                                {u.phone}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 italic">—</span>
                            )}
                          </td>

                          {/* Role */}
                          <td className="px-6 py-4">
                            {getRoleBadge(u.role)}
                          </td>

                          {/* Branch */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-gray-700">
                              <Building2 size={13} className="text-gray-400 shrink-0" />
                              <span className="font-medium">
                                {u.branch_name || (u.branch_id ? `Branch #${u.branch_id}` : 'Global (All Branches)')}
                              </span>
                            </div>
                          </td>

                          {/* Status Toggle */}
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                              }`}
                              title="Click to toggle status"
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              {isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>

                          {/* Last Activity */}
                          <td className="px-6 py-4 text-xs text-gray-500">
                            {u.last_login ? (
                              <div>
                                <p className="font-medium text-gray-700">
                                  {new Date(u.last_login).toLocaleDateString('en-IN', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                                <p className="text-[11px] text-gray-400">
                                  {new Date(u.last_login).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Never logged in</span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Button */}
                              <Button
                                onClick={() => handleOpenEditUser(u)}
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-gray-200"
                                title="Edit User Details"
                              >
                                <Edit2 size={14} />
                              </Button>

                              {/* Reset Password Button */}
                              <Button
                                onClick={() => handleOpenResetPassword(u)}
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-gray-200"
                                title="Reset User Password"
                              >
                                <Key size={14} />
                              </Button>

                              {/* Delete User Button */}
                              <Button
                                onClick={() => handleOpenDeleteUser(u)}
                                size="sm"
                                variant="outline"
                                disabled={currentUser?.id?.toString() === u.id.toString()}
                                className="h-8 w-8 p-0 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 border-gray-200 disabled:opacity-30"
                                title={currentUser?.id?.toString() === u.id.toString() ? 'Cannot delete yourself' : 'Delete User'}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-gray-50/80 border-t border-gray-200 text-xs text-gray-600">
                <div>
                  Showing <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-bold">{Math.min(currentPage * itemsPerPage, users.length)}</span> of{' '}
                  <span className="font-bold">{users.length}</span> total users
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    size="sm"
                    variant="outline"
                    className="h-8 px-2 rounded-lg text-xs"
                  >
                    <ChevronLeft size={14} className="mr-1" /> Previous
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      size="sm"
                      variant={currentPage === p ? 'default' : 'outline'}
                      className={`h-8 w-8 p-0 rounded-lg text-xs font-semibold ${
                        currentPage === p ? 'bg-indigo-600 text-white' : 'border-gray-200'
                      }`}
                    >
                      {p}
                    </Button>
                  ))}

                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    size="sm"
                    variant="outline"
                    className="h-8 px-2 rounded-lg text-xs"
                  >
                    Next <ChevronRight size={14} className="ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ======================= TAB 2: ROLES & ACCESS ======================= */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">System Roles & Profiles</h2>
              <p className="text-xs text-gray-500 mt-1">
                Roles dictate user capabilities and operational scope within the Lumen Opticals MIS platform.
              </p>
            </div>
            <Button
              onClick={() => setIsAddRoleOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold gap-2 shadow-md shadow-indigo-600/20"
            >
              <Shield size={16} />
              Create Custom Role
            </Button>
          </div>

          {/* Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {roles.map((role) => {
              const isSys = role.isSystem !== false;
              const permissionsCount = role.permissions?.length || 0;

              return (
                <Card
                  key={role.key}
                  className="p-6 bg-white border border-gray-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900">{role.name}</h3>
                          {isSys ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full border border-gray-200 uppercase">
                              System
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full border border-purple-200 uppercase">
                              Custom
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-gray-400 mt-0.5">{role.key}</p>
                      </div>

                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                        <Shield size={20} />
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-600 min-h-[36px] line-clamp-2">
                      {role.description || 'No specific description provided for this role.'}
                    </p>

                    {/* Assigned Users Stat */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-medium flex items-center gap-1.5">
                        <Users size={14} className="text-gray-400" /> Assigned Users:
                      </span>
                      <span className="font-bold text-gray-900 px-2 py-0.5 bg-white rounded-md border border-gray-200 shadow-2xs">
                        {role.userCount || 0} account(s)
                      </span>
                    </div>

                    {/* Permissions Preview Chips */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          Active Permissions ({permissionsCount})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-hidden">
                        {permissionsCount === 0 ? (
                          <span className="text-xs text-gray-400 italic">No permissions assigned</span>
                        ) : (
                          role.permissions.slice(0, 5).map((p) => (
                            <span
                              key={p}
                              className="text-[11px] px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-medium font-mono"
                            >
                              {p}
                            </span>
                          ))
                        )}
                        {permissionsCount > 5 && (
                          <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-semibold">
                            +{permissionsCount - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                    <Button
                      onClick={() => {
                        setSelectedRoleKey(role.key);
                        setActiveTab('matrix');
                      }}
                      size="sm"
                      variant="outline"
                      className="text-xs font-semibold rounded-xl gap-1 text-indigo-600 hover:bg-indigo-50 border-indigo-200"
                    >
                      <Key size={13} /> Manage Permissions
                    </Button>

                    {!isSys && (
                      <Button
                        onClick={() => {
                          setSelectedRoleToDelete(role);
                          setIsDeleteRoleOpen(true);
                        }}
                        size="sm"
                        variant="outline"
                        className="text-xs font-semibold rounded-xl text-red-600 hover:bg-red-50 border-red-200 h-8 px-2"
                        title="Delete Custom Role"
                      >
                        <Trash2 size={13} />
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================= TAB 3: PERMISSIONS MATRIX ======================= */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Role Selector Header Card */}
          <Card className="p-6 bg-white border border-gray-200/80 rounded-2xl shadow-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Key className="text-indigo-600" size={22} />
                  Permissions Matrix Configurator
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Configure granular capability flags for each user role across the enterprise suite.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSavePermissions}
                  disabled={isSavingPermissions}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold px-6 shadow-md shadow-indigo-600/20 gap-2"
                >
                  <Check size={16} />
                  {isSavingPermissions ? 'Saving Permissions...' : 'Save Role Permissions'}
                </Button>
              </div>
            </div>

            {/* Role Pills Selector */}
            <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-500 self-center mr-2 uppercase tracking-wider">
                Select Role:
              </span>
              {roles.map((r) => {
                const isSelected = r.key === selectedRoleKey;
                return (
                  <button
                    key={r.key}
                    onClick={() => setSelectedRoleKey(r.key)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Shield size={12} />
                    {r.name}
                    {r.key === 'admin' && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-white/20 rounded font-mono">ALL</span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Role Status Banner */}
          {selectedRoleKey === 'admin' && (
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex items-center gap-3 text-purple-900 text-xs font-medium">
              <ShieldAlert className="text-purple-600 shrink-0" size={20} />
              <span>
                <strong>Administrator Role:</strong> System Administrators possess omnipotent access across all existing and future modules. Privileges cannot be revoked from this role.
              </span>
            </div>
          )}

          {/* Module-wise Permissions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {permissionsCatalog.map((module) => {
              const moduleKeys = module.permissions.map(p => p.key);
              const selectedCount = moduleKeys.filter(k => selectedRolePermissions.includes(k)).length;
              const isAllSelected = selectedCount === moduleKeys.length && moduleKeys.length > 0;

              return (
                <Card
                  key={module.module}
                  className="p-6 bg-white border border-gray-200/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {/* Module Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                          <Layers size={16} className="text-indigo-600" />
                          {module.module}
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {selectedCount} of {module.permissions.length} granted
                        </p>
                      </div>

                      {selectedRoleKey !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleToggleModulePermissions(module.permissions)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline px-2 py-1 rounded"
                        >
                          {isAllSelected ? 'Deselect All' : 'Select All'}
                        </button>
                      )}
                    </div>

                    {/* Permission Items */}
                    <div className="space-y-2.5">
                      {module.permissions.map((perm) => {
                        const isGranted = selectedRoleKey === 'admin' || selectedRolePermissions.includes(perm.key);

                        return (
                          <div
                            key={perm.key}
                            onClick={() => handleTogglePermission(perm.key)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              isGranted
                                ? 'bg-indigo-50/60 border-indigo-200 text-indigo-950'
                                : 'bg-gray-50/50 border-gray-200/70 text-gray-600 hover:bg-gray-100/70'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <p className="font-semibold text-xs text-gray-900 leading-tight">
                                {perm.label}
                              </p>
                              <p className="font-mono text-[10px] text-gray-400">
                                {perm.key}
                              </p>
                            </div>

                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                                isGranted
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                                  : 'bg-white border-gray-300'
                              }`}
                            >
                              {isGranted && <Check size={14} strokeWidth={3} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Sticky Save Bar */}
          <div className="sticky bottom-4 z-20 flex justify-end">
            <Card className="p-3 bg-gray-900/90 backdrop-blur-md text-white border border-gray-800 rounded-2xl shadow-2xl flex items-center gap-4">
              <span className="text-xs text-gray-300 px-2 font-medium">
                Editing: <strong className="text-white">{activeRoleObj?.name}</strong> ({selectedRolePermissions.length} active permissions)
              </span>
              <Button
                onClick={handleSavePermissions}
                disabled={isSavingPermissions}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs h-9 px-4 gap-1.5 shadow-md shadow-indigo-600/30"
              >
                <Check size={14} />
                {isSavingPermissions ? 'Saving...' : 'Apply Changes'}
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* ======================= MODAL: ADD USER ======================= */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border-0 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserPlus size={20} />
                  Create New System User
                </h3>
                <p className="text-xs text-purple-200 mt-1">
                  Add staff, optometrist, sales, or manager with secure login access.
                </p>
              </div>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddUser} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Dr. Kasun Wijesinghe"
                    value={userFormData.fullName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setUserFormData(prev => ({
                        ...prev,
                        fullName: val,
                        // Auto suggest username if currently empty or matching previous suggestion
                        username: (!prev.username || prev.username === prev.fullName.toLowerCase().replace(/[^a-z0-9]/g, ''))
                          ? val.toLowerCase().replace(/[^a-z0-9]/g, '')
                          : prev.username
                      }));
                    }}
                    required
                    className="rounded-xl text-sm"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">@</span>
                    <Input
                      placeholder="kasunw"
                      value={userFormData.username}
                      onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value.toLowerCase() })}
                      required
                      className="pl-7 rounded-xl text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="kasun@lumenopticals.com"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    required
                    className="rounded-xl text-sm"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <Input
                    placeholder="0771234567"
                    value={userFormData.phone}
                    onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                    className="rounded-xl text-sm"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Assigned Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-600 outline-none"
                    required
                  >
                    {roles.map((r) => (
                      <option key={r.key} value={r.key}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {/* Branch Location */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Branch Assignment
                  </label>
                  <select
                    value={userFormData.branchId}
                    onChange={(e) => setUserFormData({ ...userFormData, branchId: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-600 outline-none"
                  >
                    <option value="">Global / Head Office (All Branches)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id.toString()}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Initial Password with Generator */}
                <div className="md:col-span-2 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <Lock size={13} className="text-indigo-600" />
                      Login Password <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePasswordForCreate}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Sparkles size={13} />
                      {copiedPassword ? 'Copied to Clipboard!' : 'Generate Random Password'}
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      value={userFormData.password}
                      onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                      required
                      className="pr-10 rounded-xl text-sm font-mono bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    The user can change this password upon logging in.
                  </p>
                </div>

                {/* Active Switch */}
                <div className="md:col-span-2 flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <p className="text-xs font-bold text-gray-800">Account Status</p>
                    <p className="text-[11px] text-gray-500">Allow this user to sign into the system immediately</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUserFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                      userFormData.isActive ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        userFormData.isActive ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddUserOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold px-5"
                >
                  {isSaving ? 'Creating User...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ======================= MODAL: EDIT USER ======================= */}
      {isEditUserOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border-0 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit2 size={18} />
                  Edit User Details
                </h3>
                <p className="text-xs text-blue-200 mt-1">
                  Update account information for #{selectedUser.id} ({selectedUser.username})
                </p>
              </div>
              <button
                onClick={() => setIsEditUserOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Full Name"
                    value={userFormData.fullName}
                    onChange={(e) => setUserFormData({ ...userFormData, fullName: e.target.value })}
                    required
                    className="rounded-xl text-sm"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">@</span>
                    <Input
                      placeholder="username"
                      value={userFormData.username}
                      onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value.toLowerCase() })}
                      required
                      className="pl-7 rounded-xl text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    required
                    className="rounded-xl text-sm"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <Input
                    placeholder="Phone"
                    value={userFormData.phone}
                    onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                    className="rounded-xl text-sm"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-600 outline-none"
                    required
                  >
                    {roles.map((r) => (
                      <option key={r.key} value={r.key}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {/* Branch Location */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Branch Assignment
                  </label>
                  <select
                    value={userFormData.branchId}
                    onChange={(e) => setUserFormData({ ...userFormData, branchId: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-600 outline-none"
                  >
                    <option value="">Global / Head Office (All Branches)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id.toString()}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Active Switch */}
                <div className="md:col-span-2 flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <p className="text-xs font-bold text-gray-800">Account Status</p>
                    <p className="text-[11px] text-gray-500">Allow this user to sign into the system</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUserFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                      userFormData.isActive ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        userFormData.isActive ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditUserOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold px-5"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ======================= MODAL: RESET PASSWORD ======================= */}
      {isResetPasswordOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-0 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Key size={20} />
                  Reset User Password
                </h3>
                <p className="text-xs text-amber-100 mt-1">
                  Set new password for {selectedUser.full_name || selectedUser.name}
                </p>
              </div>
              <button
                onClick={() => setIsResetPasswordOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveResetPassword} className="p-6 space-y-4">
              {/* User Identity Preview */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                  {(selectedUser.full_name || selectedUser.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="text-xs">
                  <p className="font-bold text-gray-900">{selectedUser.full_name || selectedUser.name}</p>
                  <p className="text-amber-800 font-mono">@{selectedUser.username} &bull; {selectedUser.email}</p>
                </div>
              </div>

              {/* Password Generator Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleGeneratePasswordForReset}
                  className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1"
                >
                  <Sparkles size={13} />
                  {copiedPassword ? 'Copied to Clipboard!' : 'Generate Random Password'}
                </button>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new secure password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="pr-10 rounded-xl text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-type password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="rounded-xl text-sm font-mono"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsResetPasswordOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold px-5"
                >
                  {isSaving ? 'Updating Password...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ======================= MODAL: DELETE USER ======================= */}
      {isDeleteUserOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-0 overflow-hidden my-8 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900">Delete User Account?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to permanently delete{' '}
                <strong className="text-gray-800">
                  {selectedUser.full_name || selectedUser.name} (@{selectedUser.username})
                </strong>? This action cannot be undone.
              </p>
            </div>

            <div className="p-3 bg-red-50 rounded-xl text-xs text-red-700 border border-red-200">
              <p className="font-semibold">Notice:</p>
              <p className="mt-0.5">
                Past invoices, prescriptions, and lab records associated with this staff member will remain intact for audit logs.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteUserOpen(false)}
                className="rounded-xl flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={isSaving}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex-1"
              >
                {isSaving ? 'Deleting...' : 'Yes, Delete User'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ======================= MODAL: CREATE CUSTOM ROLE ======================= */}
      {isAddRoleOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border-0 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Shield size={20} />
                  Create Custom Role
                </h3>
                <p className="text-xs text-purple-200 mt-1">
                  Define a new operational role tailored for your optical practice.
                </p>
              </div>
              <button
                onClick={() => setIsAddRoleOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddRole} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Role Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Senior Optical Technician"
                  value={roleFormData.name}
                  onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                  required
                  className="rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Summarize the core duties and authority of this role..."
                  value={roleFormData.description}
                  onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddRoleOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold px-5"
                >
                  {isSaving ? 'Creating Role...' : 'Create Role'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ======================= MODAL: DELETE CUSTOM ROLE ======================= */}
      {isDeleteRoleOpen && selectedRoleToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-0 overflow-hidden my-8 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900">Delete Custom Role?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to delete role{' '}
                <strong className="text-gray-800">"{selectedRoleToDelete.name}"</strong>?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteRoleOpen(false)}
                className="rounded-xl flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDeleteRole}
                disabled={isSaving}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex-1"
              >
                {isSaving ? 'Deleting...' : 'Yes, Delete Role'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
