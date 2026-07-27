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
    <div className="space-y-5">
      {/* Header Section - Compact Slate Theme */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your customer database and relationships</p>
        </div>
        <Button
          onClick={() => setIsAddingCustomer(!isAddingCustomer)}
          className="gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm text-sm px-4 py-2"
        >
          <Plus size={18} />
          Add Customer
        </Button>
      </div>

      {/* Add/Edit Customer Form */}
      {isAddingCustomer && (
        <Card className="p-4 bg-white border border-slate-200 shadow-sm rounded-xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-900"></span>
              <h2 className="text-sm font-semibold text-slate-900">
                {editingId ? 'Edit Customer' : 'Add New Customer'}
              </h2>
            </div>
            <button onClick={() => { setIsAddingCustomer(false); setEditingId(null); }} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">First Name</label>
              <Input placeholder="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="h-9 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Last Name</label>
              <Input placeholder="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="h-9 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Phone</label>
              <Input placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-9 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Email</label>
              <Input placeholder="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-9 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">City</label>
              <Input placeholder="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="h-9 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Date of Birth</label>
              <Input type="date" value={formData.birthday} onChange={(e) => setFormData({ ...formData, birthday: e.target.value })} className="h-9 text-xs" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-100">
            <Button onClick={() => { setIsAddingCustomer(false); setEditingId(null); setFormData({ firstName: '', lastName: '', phone: '', email: '', city: '', birthday: '' }); }} variant="outline" size="sm" className="h-8 text-xs">Cancel</Button>
            <Button onClick={handleAddCustomer} size="sm" className="bg-slate-900 hover:bg-slate-800 text-white h-8 text-xs font-medium px-4">
              {editingId ? 'Update Customer' : 'Save Customer'}
            </Button>
          </div>
        </Card>
      )}

      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 h-9 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder-slate-400"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>
        <span className="text-xs text-slate-400 whitespace-nowrap">{paginatedCustomers.length} result{paginatedCustomers.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Customers Table */}
      <Card className="overflow-hidden border border-slate-200 shadow-sm rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Name</th>
                <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Contact</th>
                <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Location</th>
                <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Age</th>
                <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Total Spent</th>
                <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Last Visit</th>
                <th className="px-5 py-3.5 text-center font-semibold text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200">
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    <p className="text-sm">No customers found</p>
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((customer, index) => (
                  <tr
                    key={customer.id}
                    className={`hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                  >
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{customer.firstName} {customer.lastName}</p>
                        <p className="text-xs text-slate-500">ID: {customer.id}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <a href={`tel:${customer.phone}`} className="text-indigo-600 hover:underline font-medium text-sm">{customer.phone}</a>
                        <p className="text-xs text-slate-500">
                          <a href={`mailto:${customer.email}`} className="text-indigo-600 hover:underline">{customer.email}</a>
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-slate-900">{customer.city}</p>
                      {customer.birthday && (
                        <p className="text-xs text-slate-500">{new Date(customer.birthday).toLocaleDateString('en-IN')}</p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-slate-900">{customer.birthday ? `${calculateAge(customer.birthday)} years` : '-'}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-semibold text-emerald-600">LKR.{customer.totalSpent.toLocaleString()}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-slate-600">{customer.lastVisit}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-center gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => { setViewingCustomer(customer); setIsViewingCustomer(true); }} className="text-slate-700 hover:text-slate-900 border-slate-300 h-8 px-2.5">
                          <Eye size={15} />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEditCustomer(customer)} className="text-slate-700 hover:text-slate-900 border-slate-300 h-8 px-2.5">
                          <Edit size={15} />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteCustomer(customer.id)} className="text-red-500 hover:text-red-700 border-slate-300 h-8 px-2.5">
                          <Trash2 size={15} />
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
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-slate-500">Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} customers</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1}>Previous</Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(page)}
                  className={currentPage === page ? 'bg-slate-900 hover:bg-slate-800 text-white' : ''}>
                  {page}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>Next</Button>
          </div>
        </div>
      )}

      {/* View Customer Modal */}
      {isViewingCustomer && viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Customer Details</h2>
              <button onClick={() => { setIsViewingCustomer(false); setViewingCustomer(null); }} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-slate-500">Name</p><p className="font-semibold text-slate-900 text-sm">{viewingCustomer.firstName} {viewingCustomer.lastName}</p></div>
                <div><p className="text-xs text-slate-500">Customer ID</p><p className="font-semibold text-slate-900 text-sm">{viewingCustomer.id}</p></div>
                <div><p className="text-xs text-slate-500">Phone</p><a href={`tel:${viewingCustomer.phone}`} className="font-semibold text-indigo-600 hover:underline text-sm">{viewingCustomer.phone}</a></div>
                <div><p className="text-xs text-slate-500">Email</p><a href={`mailto:${viewingCustomer.email}`} className="font-semibold text-indigo-600 hover:underline text-sm">{viewingCustomer.email || 'N/A'}</a></div>
                <div><p className="text-xs text-slate-500">City</p><p className="font-semibold text-slate-900 text-sm">{viewingCustomer.city || 'N/A'}</p></div>
                <div><p className="text-xs text-slate-500">Date of Birth</p><p className="font-semibold text-slate-900 text-sm">{viewingCustomer.birthday ? new Date(viewingCustomer.birthday).toLocaleDateString('en-IN') : 'N/A'} {viewingCustomer.birthday && `(${calculateAge(viewingCustomer.birthday)} yrs)`}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div><p className="text-xs text-slate-500 uppercase font-semibold">Total Spent</p><p className="text-base font-bold text-emerald-600">LKR.{viewingCustomer.totalSpent.toLocaleString()}</p></div>
                <div><p className="text-xs text-slate-500 uppercase font-semibold">Last Visit</p><p className="text-base font-medium text-slate-900">{viewingCustomer.lastVisit}</p></div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
