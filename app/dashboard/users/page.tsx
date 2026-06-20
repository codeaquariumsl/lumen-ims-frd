'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Shield, Settings } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'active' | 'inactive';
  joinDate: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions'>('users');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff',
  });

  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
  });

  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@optical.com',
      phone: '9876543210',
      role: 'admin',
      status: 'active',
      joinDate: '2024-01-15',
    },
    {
      id: '2',
      name: 'Manager User',
      email: 'manager@optical.com',
      phone: '9876543211',
      role: 'manager',
      status: 'active',
      joinDate: '2024-02-20',
    },
    {
      id: '3',
      name: 'Optometrist User',
      email: 'optometrist@optical.com',
      phone: '9876543212',
      role: 'optometrist',
      status: 'active',
      joinDate: '2024-03-10',
    },
  ]);

  const [roles, setRoles] = useState<Role[]>([
    {
      id: '1',
      name: 'Admin',
      description: 'Full system access',
      permissions: ['view_all', 'edit_all', 'delete_all', 'manage_users', 'manage_roles'],
    },
    {
      id: '2',
      name: 'Manager',
      description: 'Manage operations and staff',
      permissions: ['view_all', 'edit_inventory', 'manage_staff', 'view_reports'],
    },
    {
      id: '3',
      name: 'Optometrist',
      description: 'Eye examinations and prescriptions',
      permissions: ['view_customers', 'create_prescriptions', 'view_prescriptions'],
    },
    {
      id: '4',
      name: 'Sales',
      description: 'Sales and customer management',
      permissions: ['view_customers', 'edit_customers', 'create_orders', 'view_pos'],
    },
  ]);

  const availablePermissions = [
    'view_all',
    'edit_all',
    'delete_all',
    'manage_users',
    'manage_roles',
    'view_inventory',
    'edit_inventory',
    'view_customers',
    'edit_customers',
    'create_orders',
    'view_pos',
    'create_prescriptions',
    'view_prescriptions',
    'view_reports',
    'manage_staff',
  ];

  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = users.slice(startIndex, startIndex + itemsPerPage);

  const handleAddUser = () => {
    if (formData.name && formData.email) {
      const newUser: User = {
        id: Date.now().toString(),
        ...formData,
        status: 'active',
        joinDate: new Date().toISOString().split('T')[0],
      };
      setUsers([...users, newUser]);
      setFormData({ name: '', email: '', phone: '', role: 'staff' });
      setIsAddingUser(false);
      setCurrentPage(1);
    }
  };

  const handleAddRole = () => {
    if (roleFormData.name) {
      const newRole: Role = {
        id: Date.now().toString(),
        name: roleFormData.name,
        description: roleFormData.description,
        permissions: [],
      };
      setRoles([...roles, newRole]);
      setRoleFormData({ name: '', description: '' });
      setIsAddingRole(false);
    }
  };

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter((u) => u.id !== id));
    setCurrentPage(1);
  };

  const handleDeleteRole = (id: string) => {
    setRoles(roles.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 p-8 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">User & Role Management</h1>
            <p className="mt-2 text-purple-100">Manage system users, roles, and permissions</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'roles'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Roles
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'permissions'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Permissions
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">System Users</h2>
            <Button
              onClick={() => setIsAddingUser(!isAddingUser)}
              className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus size={20} />
              Add User
            </Button>
          </div>

          {isAddingUser && (
            <Card className="p-6 bg-gray-50 border-2 border-purple-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Create New User</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <Input
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="rounded-md border border-gray-300 px-3 py-2 font-medium text-sm"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.name.toLowerCase()}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={handleAddUser} className="bg-green-600 hover:bg-green-700">
                  Save User
                </Button>
                <Button onClick={() => setIsAddingUser(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          {/* Users Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                    <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Contact</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Join Date</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedUsers.map((user, index) => (
                    <tr
                      key={user.id}
                      className={`hover:bg-purple-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{user.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          <a href={`mailto:${user.email}`} className="text-blue-600 hover:underline">
                            {user.email}
                          </a>
                          <p className="text-xs text-gray-500">{user.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 capitalize">
                          <Shield size={14} />
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            user.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {new Date(user.joinDate).toLocaleDateString('en-IN')}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <Edit size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, users.length)} of{' '}
                {users.length} users
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? 'bg-purple-600 hover:bg-purple-700' : ''}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">System Roles</h2>
            <Button
              onClick={() => setIsAddingRole(!isAddingRole)}
              className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus size={20} />
              Add Role
            </Button>
          </div>

          {isAddingRole && (
            <Card className="p-6 bg-gray-50 border-2 border-purple-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Create New Role</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  placeholder="Role Name"
                  value={roleFormData.name}
                  onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                />
                <Input
                  placeholder="Description"
                  value={roleFormData.description}
                  onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                />
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={handleAddRole} className="bg-green-600 hover:bg-green-700">
                  Save Role
                </Button>
                <Button onClick={() => setIsAddingRole(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          {/* Roles Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {roles.map((role) => (
              <Card key={role.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{role.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteRole(role.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
                <div className="border-t pt-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Permissions</p>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">No permissions assigned</p>
                    ) : (
                      role.permissions.map((perm) => (
                        <span
                          key={perm}
                          className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded font-semibold"
                        >
                          {perm.replace(/_/g, ' ')}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Available Permissions</h2>
            <Card className="p-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availablePermissions.map((perm) => (
                  <div key={perm} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <input type="checkbox" id={perm} className="w-4 h-4" />
                    <label htmlFor={perm} className="text-sm font-medium text-gray-900 cursor-pointer">
                      {perm.replace(/_/g, ' ').charAt(0).toUpperCase() + perm.replace(/_/g, ' ').slice(1)}
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex gap-2">
                <Button className="bg-purple-600 hover:bg-purple-700">Save Permissions</Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
