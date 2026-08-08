'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Eye, Download, X, Search, Printer, ShoppingCart } from 'lucide-react';
import { generatePrescriptionPDF } from '@/lib/pdf/prescription-pdf';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/lib/auth/auth-context';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthday?: string;
}

interface Prescription {
  id: string;
  prescriptionNumber?: string;
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
  fittingHeight?: number;
  segmentHeight?: number;
  prescriptionType: string;
}

export default function PrescriptionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isAddingPrescription, setIsAddingPrescription] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [searchCustomer, setSearchCustomer] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isViewingPrescription, setIsViewingPrescription] = useState(false);
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null);

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
    fittingHeight: '',
    segmentHeight: '',
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
          prescriptionNumber: p.prescription_number || p.prescriptionNumber || p.id,
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
          fittingHeight: p.fitting_height ? parseFloat(p.fitting_height) : undefined,
          segmentHeight: p.segment_height ? parseFloat(p.segment_height) : undefined,
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
    if (!formData.customerId || !formData.customerName) {
      alert('Please select a customer before saving the prescription.');
      return;
    }
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
          pd: formData.pd,
          fittingHeight: formData.fittingHeight ? parseFloat(formData.fittingHeight) : undefined,
          segmentHeight: formData.segmentHeight ? parseFloat(formData.segmentHeight) : undefined,
        };

        let response;
        if (editingId) {
          response = await apiClient.put(`/prescriptions/${editingId}`, payload);
        } else {
          response = await apiClient.post('/prescriptions', payload);
        }

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
            fittingHeight: '',
            segmentHeight: '',
          });
          setEditingId(null);
          setIsAddingPrescription(false);
          fetchPrescriptions();
        }
      } catch (error) {
        console.error('Error saving prescription:', error);
      }
  };

  const handleEditPrescription = (prescription: Prescription) => {
    setEditingId(prescription.id);
    setFormData({
      customerId: prescription.customerId || '',
      customerName: prescription.customerName,
      age: prescription.age ? prescription.age.toString() : '',
      prescriptionDate: prescription.prescriptionDate,
      prescriptionType: prescription.prescriptionType,
      od_sph: prescription.od_sph,
      od_cyl: prescription.od_cyl,
      od_axis: prescription.od_axis,
      os_sph: prescription.os_sph,
      os_cyl: prescription.os_cyl,
      os_axis: prescription.os_axis,
      pd: prescription.pd,
      fittingHeight: prescription.fittingHeight ? prescription.fittingHeight.toString() : '',
      segmentHeight: prescription.segmentHeight ? prescription.segmentHeight.toString() : '',
    });
    setIsAddingPrescription(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Client-side search & filter
  const filteredPrescriptions = prescriptions.filter((p) => {
    const matchesSearch =
      tableSearch.trim() === '' ||
      p.customerName.toLowerCase().includes(tableSearch.toLowerCase()) ||
      String(p.prescriptionNumber || '').toLowerCase().includes(tableSearch.toLowerCase());
    const matchesType = filterType === 'all' || p.prescriptionType === filterType;
    return matchesSearch && matchesType;
  });

  // Pagination helper
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPrescriptions = filteredPrescriptions;

  return (
    <div className="space-y-5">
      {/* Header Section - Modern Compact Slate Theme */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Optical Prescriptions</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage and track all customer eye prescriptions</p>
        </div>
        <Button
          onClick={() => setIsAddingPrescription(!isAddingPrescription)}
          className="gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm text-sm px-4 py-2"
        >
          <Plus size={18} />
          New Prescription
        </Button>
      </div>

      {/* Add/Edit Prescription Form - Modern Compact Panel */}
      {isAddingPrescription && (
        <Card className="p-4 bg-white border border-slate-200 shadow-sm rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-900"></span>
              <h2 className="text-sm font-semibold text-slate-900">
                {editingId ? 'Edit Prescription' : 'Create New Prescription'}
              </h2>
            </div>
            <button
              onClick={() => {
                setIsAddingPrescription(false);
                setEditingId(null);
              }}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Top Control Panel: Customer, Age, Date, Type */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Customer <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    placeholder="Search customer..."
                    value={searchCustomer || formData.customerName}
                    onChange={(e) => setSearchCustomer(e.target.value)}
                    onFocus={() => setShowCustomerDropdown(true)}
                    className="w-full text-xs h-9"
                  />
                  {showCustomerDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                      {filteredCustomers.length > 0 ? (
                        <>
                          {filteredCustomers.map((customer) => (
                            <button
                              key={customer.id}
                              onClick={() => handleSelectCustomer(customer)}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 text-xs"
                            >
                              <p className="font-medium text-slate-900">{customer.name}</p>
                              <p className="text-[11px] text-slate-500">{customer.phone}</p>
                            </button>
                          ))}
                          <button
                            onClick={() => {
                              setShowCustomerDropdown(false);
                              setIsCreatingCustomer(true);
                            }}
                            className="w-full text-left px-3 py-1.5 bg-slate-50 text-slate-900 font-medium hover:bg-slate-100 flex items-center gap-1.5 text-xs"
                          >
                            <Plus size={14} />
                            Create New Customer
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setShowCustomerDropdown(false);
                            setIsCreatingCustomer(true);
                          }}
                          className="w-full text-left px-3 py-1.5 bg-slate-50 text-slate-900 font-medium hover:bg-slate-100 flex items-center gap-1.5 text-xs"
                        >
                          <Plus size={14} />
                          Create New Customer
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {formData.customerName && (
                  <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">✓ {formData.customerName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Age (Years)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="120"
                  placeholder="Age"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  disabled={formData.customerId ? true : false}
                  className="bg-slate-50 text-xs h-9"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Date
                </label>
                <Input
                  type="date"
                  value={formData.prescriptionDate}
                  onChange={(e) => setFormData({ ...formData, prescriptionDate: e.target.value })}
                  className="text-xs h-9"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Type
                </label>
                <select
                  value={formData.prescriptionType}
                  onChange={(e) =>
                    setFormData({ ...formData, prescriptionType: e.target.value })
                  }
                  className="w-full px-3 h-9 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="single">Single Vision</option>
                  <option value="bifocal">Bifocal</option>
                  <option value="progressive">Progressive</option>
                </select>
              </div>
            </div>

            {/* Side-by-Side Eye Measurement Panels (OD & OS) */}
            <div className="grid gap-3 md:grid-cols-2">
              {/* Right Eye (OD) */}
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-600"></span>
                    Right Eye (OD)
                  </h3>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">Oculus Dexter</span>
                </div>
                <div className="grid gap-2 grid-cols-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 mb-0.5 block">SPH</label>
                    <Input
                      type="number"
                      step="0.25"
                      value={formData.od_sph}
                      onChange={(e) =>
                        setFormData({ ...formData, od_sph: parseFloat(e.target.value) })
                      }
                      placeholder="-1.50"
                      className="text-xs h-8 px-2"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 mb-0.5 block">CYL</label>
                    <Input
                      type="number"
                      step="0.25"
                      value={formData.od_cyl}
                      onChange={(e) =>
                        setFormData({ ...formData, od_cyl: parseFloat(e.target.value) })
                      }
                      placeholder="-0.75"
                      className="text-xs h-8 px-2"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 mb-0.5 block">AXIS</label>
                    <Input
                      type="number"
                      min="0"
                      max="180"
                      value={formData.od_axis}
                      onChange={(e) =>
                        setFormData({ ...formData, od_axis: parseInt(e.target.value) })
                      }
                      placeholder="180"
                      className="text-xs h-8 px-2"
                    />
                  </div>
                </div>
              </div>

              {/* Left Eye (OS) */}
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-indigo-600"></span>
                    Left Eye (OS)
                  </h3>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">Oculus Sinister</span>
                </div>
                <div className="grid gap-2 grid-cols-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 mb-0.5 block">SPH</label>
                    <Input
                      type="number"
                      step="0.25"
                      value={formData.os_sph}
                      onChange={(e) =>
                        setFormData({ ...formData, os_sph: parseFloat(e.target.value) })
                      }
                      placeholder="-1.25"
                      className="text-xs h-8 px-2"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 mb-0.5 block">CYL</label>
                    <Input
                      type="number"
                      step="0.25"
                      value={formData.os_cyl}
                      onChange={(e) =>
                        setFormData({ ...formData, os_cyl: parseFloat(e.target.value) })
                      }
                      placeholder="-0.50"
                      className="text-xs h-8 px-2"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 mb-0.5 block">AXIS</label>
                    <Input
                      type="number"
                      min="0"
                      max="180"
                      value={formData.os_axis}
                      onChange={(e) =>
                        setFormData({ ...formData, os_axis: parseInt(e.target.value) })
                      }
                      placeholder="175"
                      className="text-xs h-8 px-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Inline Additional Measurements Row (PD, Fitting Height, Segment Height) */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 bg-slate-50/50 p-3 rounded-lg border border-slate-200">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Pupillary Distance (PD)
                </label>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.pd}
                    onChange={(e) => setFormData({ ...formData, pd: parseFloat(e.target.value) })}
                    placeholder="62"
                    className="text-xs h-8"
                  />
                  <span className="text-xs text-slate-500 font-medium">mm</span>
                </div>
              </div>

              {(formData.prescriptionType === 'bifocal' || formData.prescriptionType === 'progressive') && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Fitting Height (FH)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.fittingHeight}
                        onChange={(e) => setFormData({ ...formData, fittingHeight: e.target.value })}
                        placeholder="22.5"
                        className="text-xs h-8"
                      />
                      <span className="text-xs text-slate-500 font-medium">mm</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Segment Height (SH)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.segmentHeight}
                        onChange={(e) => setFormData({ ...formData, segmentHeight: e.target.value })}
                        placeholder="18.0"
                        className="text-xs h-8"
                      />
                      <span className="text-xs text-slate-500 font-medium">mm</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                onClick={() => {
                  setIsAddingPrescription(false);
                  setEditingId(null);
                  setFormData({
                    customerId: '', customerName: '', age: '',
                    prescriptionDate: new Date().toISOString().split('T')[0],
                    prescriptionType: 'single',
                    od_sph: 0, od_cyl: 0, od_axis: 0,
                    os_sph: 0, os_cyl: 0, os_axis: 0,
                    pd: 62, fittingHeight: '', segmentHeight: ''
                  });
                }}
                variant="outline"
                size="sm"
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPrescription}
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 text-white h-8 text-xs font-medium px-4"
              >
                {editingId ? 'Update Prescription' : 'Save Prescription'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Create Customer Modal */}
      {isCreatingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md p-6 shadow-2xl bg-white rounded-xl">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-3">
              <h2 className="text-base font-semibold text-slate-900">Quick Customer Registration</h2>
              <button
                onClick={() => setIsCreatingCustomer(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone
                </label>
                <Input
                  placeholder="Enter phone number"
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Date of Birth
                </label>
                <Input
                  type="date"
                  value={newCustomerForm.birthday}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, birthday: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <Button onClick={handleCreateCustomer} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white">
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

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2 items-center bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by customer name or Rx number..."
            value={tableSearch}
            onChange={(e) => { setTableSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-8 pr-3 h-9 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder-slate-400"
          />
          {tableSearch && (
            <button
              onClick={() => setTableSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Type:</span>
          {(['all', 'single', 'bifocal', 'progressive'] as const).map((type) => (
            <button
              key={type}
              onClick={() => { setFilterType(type); setCurrentPage(1); }}
              className={`px-3 h-8 text-xs rounded-lg font-medium border transition-colors ${
                filterType === type
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'
              }`}
            >
              {type === 'all' ? 'All' : type === 'single' ? 'Single' : type === 'bifocal' ? 'Bifocal' : 'Progressive'}
            </button>
          ))}
        </div>
        {(tableSearch || filterType !== 'all') && (
          <button
            onClick={() => { setTableSearch(''); setFilterType('all'); setCurrentPage(1); }}
            className="text-xs text-slate-500 hover:text-slate-900 underline whitespace-nowrap shrink-0"
          >
            Clear all
          </button>
        )}
        <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
          {filteredPrescriptions.length} result{filteredPrescriptions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Prescriptions List Table */}
      <Card className="overflow-hidden border border-slate-200 shadow-sm rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Customer</th>
                <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Dates</th>
                <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Right Eye (OD)</th>
                <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Left Eye (OS)</th>
                <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">PD</th>
                <th className="px-5 py-3.5 text-center font-semibold text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200">
              {paginatedPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    <Eye size={40} className="mx-auto mb-2 text-slate-400" />
                    <p className="text-sm">No prescriptions found</p>
                  </td>
                </tr>
              ) : (
                paginatedPrescriptions.map((prescription, index) => (
                  <tr
                    key={prescription.id}
                    className={`hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      }`}
                  >
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-semibold text-slate-900">{prescription.customerName}</p>
                        <p className="text-xs text-slate-500">
                          {prescription.age && `Age: ${prescription.age} years`}
                        </p>
                        <p className="text-xs text-indigo-600 font-medium">Rx #: {prescription.prescriptionNumber || prescription.id}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {new Date(prescription.prescriptionDate).toLocaleDateString('en-IN')}
                        </p>
                        <p className="text-xs text-slate-500">
                          Exp: {new Date(prescription.expiryDate).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      <p className="text-sm text-slate-900">
                        {prescription.od_sph}/{prescription.od_cyl}@{prescription.od_axis}°
                      </p>
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      <p className="text-sm text-slate-900">
                        {prescription.os_sph}/{prescription.os_cyl}@{prescription.os_axis}°
                      </p>
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      <p className="text-sm font-medium text-slate-900">{prescription.pd}mm</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-center gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => router.push(`/dashboard/pos?prescriptionId=${prescription.id}&customerId=${prescription.customerId || ''}`)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-2.5 gap-1.5 font-medium shadow-sm"
                          title="Create Order for this Prescription"
                        >
                          <ShoppingCart size={15} />
                          <span className="hidden sm:inline text-xs">Create Order</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setViewingPrescription(prescription);
                            setIsViewingPrescription(true);
                          }}
                          className="text-slate-700 hover:text-slate-900 border-slate-300 h-8 px-2.5"
                        >
                          <Eye size={15} />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditPrescription(prescription)}
                          className="text-slate-700 hover:text-slate-900 border-slate-300 h-8 px-2.5"
                        >
                          <Edit size={15} />
                        </Button>

                        <Button
                          size="sm"
                          className="bg-slate-900 hover:bg-slate-800 text-white h-8 px-2.5"
                          onClick={() => generatePrescriptionPDF(prescription, user?.companyDetails)}
                        >
                          <Printer size={15} />
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
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalItems)} of{' '}
            {totalItems} prescriptions
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
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
                      ? 'bg-slate-900 hover:bg-slate-800 text-white'
                      : ''
                  }
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* View Prescription Modal */}
      {isViewingPrescription && viewingPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Prescription Details</h2>
              <button
                onClick={() => {
                  setIsViewingPrescription(false);
                  setViewingPrescription(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Customer Name</p>
                  <p className="font-semibold text-slate-900 text-sm">{viewingPrescription.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Age</p>
                  <p className="font-semibold text-slate-900 text-sm">{viewingPrescription.age ? `${viewingPrescription.age} years` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Prescription Date</p>
                  <p className="font-semibold text-slate-900 text-sm">{new Date(viewingPrescription.prescriptionDate).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Prescription Type</p>
                  <p className="font-semibold text-slate-900 text-sm capitalize">{viewingPrescription.prescriptionType}</p>
                </div>
              </div>

              {/* Eye Details Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs uppercase font-semibold">Eye</th>
                      <th className="px-4 py-2.5 text-left text-xs uppercase font-semibold">Sphere (SPH)</th>
                      <th className="px-4 py-2.5 text-left text-xs uppercase font-semibold">Cylinder (CYL)</th>
                      <th className="px-4 py-2.5 text-left text-xs uppercase font-semibold">Axis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="px-4 py-3 font-semibold text-slate-900">Right (OD)</td>
                      <td className="px-4 py-3">{viewingPrescription.od_sph.toFixed(2)}</td>
                      <td className="px-4 py-3">{viewingPrescription.od_cyl.toFixed(2)}</td>
                      <td className="px-4 py-3">{viewingPrescription.od_axis}°</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-slate-900">Left (OS)</td>
                      <td className="px-4 py-3">{viewingPrescription.os_sph.toFixed(2)}</td>
                      <td className="px-4 py-3">{viewingPrescription.os_cyl.toFixed(2)}</td>
                      <td className="px-4 py-3">{viewingPrescription.os_axis}°</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">PD</p>
                  <p className="text-base font-medium text-slate-900">{viewingPrescription.pd} mm</p>
                </div>
                {(viewingPrescription.prescriptionType === 'bifocal' || viewingPrescription.prescriptionType === 'progressive') && (
                  <>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Fitting Height</p>
                      <p className="text-base font-medium text-slate-900">{viewingPrescription.fittingHeight || 'N/A'} {viewingPrescription.fittingHeight ? 'mm' : ''}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Segment Height</p>
                      <p className="text-base font-medium text-slate-900">{viewingPrescription.segmentHeight || 'N/A'} {viewingPrescription.segmentHeight ? 'mm' : ''}</p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  onClick={() => {
                    const pxId = viewingPrescription.id;
                    const cId = viewingPrescription.customerId || '';
                    setIsViewingPrescription(false);
                    router.push(`/dashboard/pos?prescriptionId=${pxId}&customerId=${cId}`);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium"
                >
                  <ShoppingCart size={16} />
                  Create Order for this Prescription
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
