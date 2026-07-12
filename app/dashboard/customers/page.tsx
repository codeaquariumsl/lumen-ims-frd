'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, Trash2, Eye, X } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  city: string;
  birthday?: string;
  totalSpent: number;
  lastVisit: string;
}

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isViewingCustomer, setIsViewingCustomer] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    city: '',
    birthday: '',
  });

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/customers', {
        params: {
          search: searchTerm,
          page: currentPage,
          limit: itemsPerPage,
        },
      });
      if (response.data?.success) {
        const mapped = (response.data.data || []).map((c: any) => ({
          id: c.id,
          firstName: c.first_name,
          lastName: c.last_name || '',
          phone: c.phone || '',
          email: c.email || '',
          city: c.city || '',
          birthday: c.date_of_birth ? c.date_of_birth.split('T')[0] : '',
          totalSpent: parseFloat(c.total_spent || '0'),
          lastVisit: c.last_visit ? new Date(c.last_visit).toLocaleDateString('en-IN') : 'No visits',
        }));
        setCustomers(mapped);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalItems(response.data.pagination?.totalItems || 0);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm, currentPage]);

  const handleAddCustomer = async () => {
    if (formData.firstName && formData.phone) {
      try {
        const payload = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
          city: formData.city,
          dateOfBirth: formData.birthday || undefined
        };
        let response;
        if (editingId) {
          response = await apiClient.put(`/customers/${editingId}`, payload);
        } else {
          response = await apiClient.post('/customers', payload);
        }
        if (response.data?.success) {
          setFormData({ firstName: '', lastName: '', phone: '', email: '', city: '', birthday: '' });
          setEditingId(null);
          setIsAddingCustomer(false);
          setCurrentPage(1);
          fetchCustomers();
        }
      } catch (error) {
        console.error('Error adding customer:', error);
      }
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingId(customer.id);
    setFormData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      email: customer.email,
      city: customer.city,
      birthday: customer.birthday || '',
    });
    setIsAddingCustomer(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCustomer = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        const response = await apiClient.delete(`/customers/${id}`);
        if (response.data?.success) {
          fetchCustomers();
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
      }
    }
  };

  // Pagination helper matching rendering
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = customers;

  return (
    <div className="space-y-6">
      {/* Header with Pastel Gradient */}
      <div className="rounded-2xl bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 p-8 shadow-md border border-pink-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
              Customer Management
            </h1>
            <p className="mt-2 text-purple-700">Manage your customer database and relationships</p>
          </div>
          <Button
            onClick={() => setIsAddingCustomer(!isAddingCustomer)}
            className="gap-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg"
          >
            <Plus size={20} />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Add/Edit Customer Form */}
      {isAddingCustomer && (
        <Card className="p-6 bg-gradient-to-br from-pink-50 to-blue-50 border-2 border-purple-200 shadow-lg">
          <h2 className="mb-6 text-lg font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            {editingId ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
            <Input
              placeholder="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
            <Input
              placeholder="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              placeholder="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              placeholder="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              type="date"
              placeholder="Date of Birth"
              value={formData.birthday}
              onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleAddCustomer} className="bg-green-600 hover:bg-green-700">
              {editingId ? 'Update Customer' : 'Save Customer'}
            </Button>
            <Button 
              onClick={() => {
                setIsAddingCustomer(false);
                setEditingId(null);
                setFormData({ firstName: '', lastName: '', phone: '', email: '', city: '', birthday: '' });
              }} 
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <Input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Customers Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Table Header */}
            <thead>
              <tr className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Contact</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Location</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Age</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Total Spent</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Last Visit</th>
                <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-200">
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No customers found
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((customer, index) => (
                  <tr
                    key={customer.id}
                    className={`hover:bg-purple-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {customer.firstName} {customer.lastName}
                        </p>
                        <p className="text-xs text-gray-500">ID: {customer.id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline font-medium text-sm">
                          {customer.phone}
                        </a>
                        <p className="text-xs text-gray-500">
                          <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                            {customer.email}
                          </a>
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{customer.city}</p>
                        {customer.birthday && (
                          <p className="text-xs text-gray-500">
                            {new Date(customer.birthday).toLocaleDateString('en-IN')}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {customer.birthday ? `${calculateAge(customer.birthday)} years` : '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-green-600">
                        LKR.{customer.totalSpent.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{customer.lastVisit}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setViewingCustomer(customer);
                            setIsViewingCustomer(true);
                          }}
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleEditCustomer(customer)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalItems)} of{' '}
            {totalItems} customers
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
                  className={
                    currentPage === page
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : ''
                  }
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

      {/* View Customer Modal */}
      {isViewingCustomer && viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <Card className="w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Customer Details</h2>
              <button
                onClick={() => {
                  setIsViewingCustomer(false);
                  setViewingCustomer(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-semibold text-gray-900">{viewingCustomer.firstName} {viewingCustomer.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer ID</p>
                  <p className="font-semibold text-gray-900">{viewingCustomer.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <a href={`tel:${viewingCustomer.phone}`} className="font-semibold text-blue-600 hover:underline">{viewingCustomer.phone}</a>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a href={`mailto:${viewingCustomer.email}`} className="font-semibold text-blue-600 hover:underline">{viewingCustomer.email || 'N/A'}</a>
                </div>
                <div>
                  <p className="text-sm text-gray-500">City</p>
                  <p className="font-semibold text-gray-900">{viewingCustomer.city || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-semibold text-gray-900">{viewingCustomer.birthday ? new Date(viewingCustomer.birthday).toLocaleDateString('en-IN') : 'N/A'} {viewingCustomer.birthday && `(${calculateAge(viewingCustomer.birthday)} yrs)`}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Total Spent</p>
                  <p className="text-lg font-bold text-green-600">LKR.{viewingCustomer.totalSpent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Last Visit</p>
                  <p className="text-lg font-medium">{viewingCustomer.lastVisit}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
