'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Eye, Download, X } from 'lucide-react';
import { generatePrescriptionPDF } from '@/lib/pdf/prescription-pdf';
import apiClient from '@/lib/api-client';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthday?: string;
}

interface Prescription {
  id: string;
  customerName: string;
  customerId?: string;
  age?: number;
  prescriptionDate: string;
  expiryDate: string;
  od_sph: number;
  od_cyl: number;
  od_axis: number;
  os_sph: number;
  os_cyl: number;
  os_axis: number;
  pd: number;
  prescriptionType: string;
}

export default function PrescriptionsPage() {
  const [isAddingPrescription, setIsAddingPrescription] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [searchCustomer, setSearchCustomer] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    birthday: '',
  });

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    age: '',
    prescriptionDate: new Date().toISOString().split('T')[0],
    prescriptionType: 'single',
    // Right Eye (OD)
    od_sph: 0,
    od_cyl: 0,
    od_axis: 0,
    // Left Eye (OS)
    os_sph: 0,
    os_cyl: 0,
    os_axis: 0,
    pd: 62,
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

  const fetchCustomers = async (search: string) => {
    try {
      const response = await apiClient.get('/customers', {
        params: { search, limit: 10 }
      });
      if (response.data?.success) {
        const mapped = (response.data.data || []).map((c: any) => ({
          id: c.id,
          name: `${c.first_name} ${c.last_name || ''}`.trim(),
          email: c.email || '',
          phone: c.phone || '',
          birthday: c.date_of_birth ? c.date_of_birth.split('T')[0] : ''
        }));
        setCustomers(mapped);
      }
    } catch (err) {
      console.error('Error fetching customers for prescriptions:', err);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const response = await apiClient.get('/prescriptions', {
        params: {
          page: currentPage,
          limit: itemsPerPage
        }
      });
      if (response.data?.success) {
        const mapped = (response.data.data || []).map((p: any) => ({
          id: p.id,
          customerName: `${p.first_name} ${p.last_name || ''}`.trim(),
          customerId: p.customer_id,
          age: p.date_of_birth ? calculateAge(p.date_of_birth) : undefined,
          prescriptionDate: p.prescription_date ? p.prescription_date.split('T')[0] : '',
          expiryDate: p.expiry_date ? p.expiry_date.split('T')[0] : '',
          od_sph: parseFloat(p.od_sph || '0'),
          od_cyl: parseFloat(p.od_cyl || '0'),
          od_axis: p.od_axis || 0,
          os_sph: parseFloat(p.os_sph || '0'),
          os_cyl: parseFloat(p.os_cyl || '0'),
          os_axis: p.os_axis || 0,
          pd: parseFloat(p.pd || '62'),
          prescriptionType: p.prescription_type || 'single'
        }));
        setPrescriptions(mapped);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalItems(response.data.pagination?.totalItems || 0);
      }
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
    }
  };

  useEffect(() => {
    fetchCustomers(searchCustomer);
  }, [searchCustomer]);

  useEffect(() => {
    fetchPrescriptions();
  }, [currentPage]);

  const handleCreateCustomer = async () => {
    if (newCustomerForm.name) {
      try {
        const parts = newCustomerForm.name.split(' ');
        const firstName = parts[0];
        const lastName = parts.slice(1).join(' ') || '';

        const payload = {
          firstName,
          lastName,
          email: newCustomerForm.email,
          phone: newCustomerForm.phone,
          dateOfBirth: newCustomerForm.birthday || undefined
        };

        const response = await apiClient.post('/customers', payload);
        if (response.data?.success) {
          const newCustomer = response.data.data;
          const calculatedAge = newCustomer.date_of_birth ? calculateAge(newCustomer.date_of_birth) : undefined;
          setFormData({
            ...formData,
            customerId: newCustomer.id,
            customerName: `${newCustomer.first_name} ${newCustomer.last_name || ''}`.trim(),
            age: calculatedAge ? calculatedAge.toString() : '',
          });
          setNewCustomerForm({ name: '', email: '', phone: '', birthday: '' });
          setIsCreatingCustomer(false);
        }
      } catch (error) {
        console.error('Error quick creating customer:', error);
      }
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    const calculatedAge = customer.birthday ? calculateAge(customer.birthday) : '';
    setFormData({ 
      ...formData, 
      customerId: customer.id, 
      customerName: customer.name,
      age: calculatedAge ? calculatedAge.toString() : '',
    });
    setShowCustomerDropdown(false);
    setSearchCustomer('');
  };

  const filteredCustomers = customers;

  const handleAddPrescription = async () => {
    if (formData.customerName && formData.customerId) {
      try {
        const payload = {
          customerId: formData.customerId,
          prescriptionDate: formData.prescriptionDate,
          prescriptionType: formData.prescriptionType,
          od_sph: formData.od_sph,
          od_cyl: formData.od_cyl,
          od_axis: formData.od_axis,
          os_sph: formData.os_sph,
          os_cyl: formData.os_cyl,
          os_axis: formData.os_axis,
          pd: formData.pd
        };

        const response = await apiClient.post('/prescriptions', payload);
        if (response.data?.success) {
          setFormData({
            customerId: '',
            customerName: '',
            age: '',
            prescriptionDate: new Date().toISOString().split('T')[0],
            prescriptionType: 'single',
            od_sph: 0,
            od_cyl: 0,
            od_axis: 0,
            os_sph: 0,
            os_cyl: 0,
            os_axis: 0,
            pd: 62,
          });
          setIsAddingPrescription(false);
          fetchPrescriptions();
        }
      } catch (error) {
        console.error('Error adding prescription:', error);
      }
    }
  };

  const handleDeletePrescription = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this prescription?')) {
      try {
        const response = await apiClient.delete(`/prescriptions/${id}`);
        if (response.data?.success) {
          fetchPrescriptions();
        }
      } catch (error) {
        console.error('Error deleting prescription:', error);
      }
    }
  };

  // Pagination helper
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPrescriptions = prescriptions;

  return (
    <div className="space-y-6">
      {/* Header Section with Pastel Gradient */}
      <div className="rounded-2xl bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 p-8 shadow-md border border-pink-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">Optical Prescriptions</h1>
            <p className="mt-2 text-purple-700">Manage and track all customer prescriptions with ease</p>
          </div>
          <Button 
            onClick={() => setIsAddingPrescription(!isAddingPrescription)}
            className="gap-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg"
          >
            <Plus size={20} />
            New Prescription
          </Button>
        </div>
      </div>

      {/* Add Prescription Form */}
      {isAddingPrescription && (
        <Card className="p-6 bg-gradient-to-br from-pink-50 to-blue-50 border-2 border-purple-200 shadow-lg">
          <h2 className="mb-6 text-lg font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Create New Prescription</h2>
          <div className="space-y-6">
            {/* Customer Selection */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Customer
                </label>
                <div className="relative">
                  <Input
                    placeholder="Search or select customer..."
                    value={searchCustomer || formData.customerName}
                    onChange={(e) => setSearchCustomer(e.target.value)}
                    onFocus={() => setShowCustomerDropdown(true)}
                    className="w-full"
                  />
                  {showCustomerDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {filteredCustomers.length > 0 ? (
                        <>
                          {filteredCustomers.map((customer) => (
                            <button
                              key={customer.id}
                              onClick={() => handleSelectCustomer(customer)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
                            >
                              <p className="font-medium text-gray-900">{customer.name}</p>
                              <p className="text-xs text-gray-600">{customer.phone}</p>
                            </button>
                          ))}
                          <button
                            onClick={() => {
                              setShowCustomerDropdown(false);
                              setIsCreatingCustomer(true);
                            }}
                            className="w-full text-left px-4 py-2 bg-blue-50 text-blue-600 font-medium hover:bg-blue-100 flex items-center gap-2"
                          >
                            <Plus size={16} />
                            Create New Customer
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setShowCustomerDropdown(false);
                            setIsCreatingCustomer(true);
                          }}
                          className="w-full text-left px-4 py-2 bg-blue-50 text-blue-600 font-medium hover:bg-blue-100 flex items-center gap-2"
                        >
                          <Plus size={16} />
                          Create New Customer
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {formData.customerName && (
                  <p className="text-xs text-green-600 mt-1">✓ {formData.customerName} selected</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age (Years)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="120"
                  placeholder="Enter patient age"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  disabled={formData.customerId ? true : false}
                  className="bg-gray-50"
                />
                {formData.customerId && formData.age && (
                  <p className="text-xs text-blue-600 mt-1">Auto-calculated from customer birthday</p>
                )}
              </div>
            </div>

            {/* Date and Prescription Type */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prescription Date
                </label>
                <Input
                  type="date"
                  value={formData.prescriptionDate}
                  onChange={(e) => setFormData({ ...formData, prescriptionDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prescription Type
                </label>
                <select
                  value={formData.prescriptionType}
                  onChange={(e) =>
                    setFormData({ ...formData, prescriptionType: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="single">Single Vision</option>
                  <option value="bifocal">Bifocal</option>
                  <option value="progressive">Progressive</option>
                </select>
              </div>
            </div>

            {/* Right Eye (OD) */}
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 p-4 border-l-4 border-blue-300">
              <h3 className="mb-4 font-bold text-blue-900 flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-blue-400"></span>
                Right Eye (OD - Oculus Dexter)
              </h3>
              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Sphere (SPH)
                  </label>
                  <Input
                    type="number"
                    step="0.25"
                    value={formData.od_sph}
                    onChange={(e) =>
                      setFormData({ ...formData, od_sph: parseFloat(e.target.value) })
                    }
                    placeholder="-1.50"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Cylinder (CYL)
                  </label>
                  <Input
                    type="number"
                    step="0.25"
                    value={formData.od_cyl}
                    onChange={(e) =>
                      setFormData({ ...formData, od_cyl: parseFloat(e.target.value) })
                    }
                    placeholder="-0.75"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Axis
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="180"
                    value={formData.od_axis}
                    onChange={(e) =>
                      setFormData({ ...formData, od_axis: parseInt(e.target.value) })
                    }
                    placeholder="180"
                  />
                </div>
              </div>
            </div>

            {/* Left Eye (OS) */}
            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 border-l-4 border-amber-300">
              <h3 className="mb-4 font-bold text-amber-900 flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-amber-400"></span>
                Left Eye (OS - Oculus Sinister)
              </h3>
              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Sphere (SPH)
                  </label>
                  <Input
                    type="number"
                    step="0.25"
                    value={formData.os_sph}
                    onChange={(e) =>
                      setFormData({ ...formData, os_sph: parseFloat(e.target.value) })
                    }
                    placeholder="-1.25"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Cylinder (CYL)
                  </label>
                  <Input
                    type="number"
                    step="0.25"
                    value={formData.os_cyl}
                    onChange={(e) =>
                      setFormData({ ...formData, os_cyl: parseFloat(e.target.value) })
                    }
                    placeholder="-0.50"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Axis
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="180"
                    value={formData.os_axis}
                    onChange={(e) =>
                      setFormData({ ...formData, os_axis: parseInt(e.target.value) })
                    }
                    placeholder="175"
                  />
                </div>
              </div>
            </div>

            {/* PD */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pupillary Distance (PD) - mm
              </label>
              <Input
                type="number"
                step="0.5"
                value={formData.pd}
                onChange={(e) => setFormData({ ...formData, pd: parseFloat(e.target.value) })}
                placeholder="62"
                className="max-w-xs"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleAddPrescription} className="bg-green-600 hover:bg-green-700">
                Save Prescription
              </Button>
              <Button onClick={() => setIsAddingPrescription(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Create Customer Modal */}
      {isCreatingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Quick Customer Registration</h2>
              <button
                onClick={() => setIsCreatingCustomer(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <Input
                  placeholder="Enter customer name"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="Enter email"
                  value={newCustomerForm.email}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <Input
                  placeholder="Enter phone number"
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <Input
                  type="date"
                  value={newCustomerForm.birthday}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, birthday: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateCustomer} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Save & Continue
                </Button>
                <Button 
                  onClick={() => {
                    setIsCreatingCustomer(false);
                    setNewCustomerForm({ name: '', email: '', phone: '', birthday: '' });
                  }} 
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Prescriptions List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Table Header */}
            <thead>
              <tr className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <th className="px-6 py-4 text-left text-sm font-semibold">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Dates</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Right Eye (OD)</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Left Eye (OS)</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">PD</th>
                <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-200">
              {paginatedPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <Eye size={48} className="mx-auto mb-2 text-gray-400" />
                    <p>No prescriptions found</p>
                  </td>
                </tr>
              ) : (
                paginatedPrescriptions.map((prescription, index) => (
                  <tr
                    key={prescription.id}
                    className={`hover:bg-purple-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{prescription.customerName}</p>
                        <p className="text-xs text-gray-500">
                          {prescription.age && `Age: ${prescription.age} years`}
                        </p>
                        <p className="text-xs text-gray-500">Rx ID: {prescription.id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(prescription.prescriptionDate).toLocaleDateString('en-IN')}
                        </p>
                        <p className="text-xs text-gray-500">
                          Exp: {new Date(prescription.expiryDate).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        {prescription.od_sph}/{prescription.od_cyl}@{prescription.od_axis}°
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        {prescription.os_sph}/{prescription.os_cyl}@{prescription.os_axis}°
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{prescription.pd}mm</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => generatePrescriptionPDF(prescription)}
                        >
                          <Download size={16} />
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <Edit size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeletePrescription(prescription.id)}
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
            {totalItems} prescriptions
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
    </div>
  );
}
