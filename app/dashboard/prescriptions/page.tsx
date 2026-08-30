'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Eye, Download, X, Search, Printer, ShoppingCart, FileText, CheckCircle2, PackageCheck } from 'lucide-react';
import { generatePrescriptionPDF, PrescriptionItem } from '@/lib/pdf/prescription-pdf';
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
  customer_phone?: string;
  address?: string;
  city?: string;
  staffId?: string;
  staff_id?: string;
  clinicianName?: string;
  optometrist_name?: string;
  staff_name?: string;
  age?: number;
  prescriptionDate: string;
  expiryDate: string;

  // Order & items association
  hasOrder?: boolean;
  has_order?: boolean;
  orderId?: string | number;
  order_id?: string | number;
  orderNo?: string | number;
  order_no?: string | number;
  orderDate?: string;
  order_date?: string;
  orderTime?: string;
  order_time?: string;
  totalAmount?: number;
  total_amount?: number;
  netAmount?: number;
  net_amount?: number;
  advanceAmount?: number;
  advance_amount?: number;
  balanceAmount?: number;
  balance_amount?: number;
  paymentStatus?: string;
  payment_status?: string;
  paymentMethod?: string;
  payment_method?: string;
  items?: PrescriptionItem[];

  // Refractive OD
  od_sph: number;
  od_cyl: number;
  od_axis: number;
  od_add?: number;
  od_va?: string;

  // Refractive OS
  os_sph: number;
  os_cyl: number;
  os_axis: number;
  os_add?: number;
  os_va?: string;

  // PD
  pd: number;
  pd_right?: number;
  pd_left?: number;
  pd_near?: number;
  pd_near_right?: number;
  pd_near_left?: number;

  // Heights
  fittingHeight?: number;
  segmentHeight?: number;
  fh_right?: number;
  fh_left?: number;
  sh_right?: number;
  sh_left?: number;

  // Frame Specs
  a_val?: string;
  b_val?: string;
  dbl_val?: string;
  dia_right?: string;
  dia_left?: string;
  base_curve_right?: string;
  base_curve_left?: string;
  panto_angle?: string;
  wrap_angle?: string;

  prescriptionType: string;
  remarks?: string;
}

const initialFormData = {
  customerId: '',
  customerName: '',
  age: '',
  prescriptionDate: new Date().toISOString().split('T')[0],
  prescriptionType: 'single',

  // Right Eye (OD)
  od_sph: '0.00',
  od_cyl: '0.00',
  od_axis: '0',
  od_add: '0.00',
  od_va: '6/6',

  // Left Eye (OS)
  os_sph: '0.00',
  os_cyl: '0.00',
  os_axis: '0',
  os_add: '0.00',
  os_va: '6/6',

  // PD
  pd: '62',
  pd_right: '31',
  pd_left: '31',
  pd_near: '0',
  pd_near_right: '0',
  pd_near_left: '0',

  // Heights
  fittingHeight: '',
  segmentHeight: '',
  fh_right: '',
  fh_left: '',
  sh_right: '',
  sh_left: '',

  // Frame specs
  a_val: '',
  b_val: '',
  dbl_val: '',
  dia_right: '',
  dia_left: '',
  base_curve_right: '',
  base_curve_left: '',
  panto_angle: '',
  wrap_angle: '',
  remarks: ''
};

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

  const [formData, setFormData] = useState(initialFormData);

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
          id: String(p.id),
          prescriptionNumber: p.prescription_number || p.prescriptionNumber || String(p.id),
          customerName: `${p.first_name} ${p.last_name || ''}`.trim(),
          customer_phone: p.customer_phone || p.phone || '',
          address: p.address || '',
          city: p.city || '',
          customerId: String(p.customer_id),
          staffId: p.staff_id ? String(p.staff_id) : (p.optometrist_id ? String(p.optometrist_id) : undefined),
          staff_id: p.staff_id ? String(p.staff_id) : (p.optometrist_id ? String(p.optometrist_id) : undefined),
          clinicianName: p.clinician_name || p.optometrist_name || p.staff_name || '',
          optometrist_name: p.optometrist_name || p.clinician_name || '',
          staff_name: p.staff_name || p.clinician_name || '',
          age: p.date_of_birth ? calculateAge(p.date_of_birth) : undefined,
          prescriptionDate: p.prescription_date ? p.prescription_date.split('T')[0] : '',
          expiryDate: p.expiry_date ? p.expiry_date.split('T')[0] : '',

          // Order details & items
          hasOrder: Boolean(p.has_order || p.hasOrder || p.order_id || p.orderId),
          has_order: Boolean(p.has_order || p.hasOrder || p.order_id || p.orderId),
          orderId: p.order_id || p.orderId,
          order_id: p.order_id || p.orderId,
          orderNo: p.order_no || p.orderNo,
          order_no: p.order_no || p.orderNo,
          orderDate: p.order_date || p.orderDate,
          order_date: p.order_date || p.orderDate,
          orderTime: p.order_time || p.orderTime,
          order_time: p.order_time || p.orderTime,
          totalAmount: p.totalAmount !== undefined ? p.totalAmount : (p.net_amount ? parseFloat(p.net_amount) : (p.total_amount ? parseFloat(p.total_amount) : 0)),
          total_amount: p.total_amount !== undefined ? parseFloat(p.total_amount) : undefined,
          netAmount: p.net_amount !== undefined ? parseFloat(p.net_amount) : undefined,
          net_amount: p.net_amount !== undefined ? parseFloat(p.net_amount) : undefined,
          advanceAmount: p.advance_amount !== undefined ? parseFloat(p.advance_amount) : undefined,
          advance_amount: p.advance_amount !== undefined ? parseFloat(p.advance_amount) : undefined,
          balanceAmount: p.balance_amount !== undefined ? parseFloat(p.balance_amount) : undefined,
          balance_amount: p.balance_amount !== undefined ? parseFloat(p.balance_amount) : undefined,
          paymentStatus: p.payment_status || p.paymentStatus,
          payment_status: p.payment_status || p.paymentStatus,
          paymentMethod: p.payment_method || p.paymentMethod,
          payment_method: p.payment_method || p.paymentMethod,
          items: p.items || [],

          // Refractive OD
          od_sph: parseFloat(p.od_sph || '0'),
          od_cyl: parseFloat(p.od_cyl || '0'),
          od_axis: p.od_axis || 0,
          od_add: p.od_add !== undefined && p.od_add !== null ? parseFloat(String(p.od_add)) : 0,
          od_va: p.od_va || '6/6',

          // Refractive OS
          os_sph: parseFloat(p.os_sph || '0'),
          os_cyl: parseFloat(p.os_cyl || '0'),
          os_axis: p.os_axis || 0,
          os_add: p.os_add !== undefined && p.os_add !== null ? parseFloat(String(p.os_add)) : 0,
          os_va: p.os_va || '6/6',

          // PD
          pd: parseFloat(p.pd || '62'),
          pd_right: p.pd_right ? parseFloat(p.pd_right) : undefined,
          pd_left: p.pd_left ? parseFloat(p.pd_left) : undefined,
          pd_near: p.pd_near ? parseFloat(p.pd_near) : undefined,
          pd_near_right: p.pd_near_right ? parseFloat(p.pd_near_right) : undefined,
          pd_near_left: p.pd_near_left ? parseFloat(p.pd_near_left) : undefined,

          // Heights
          fittingHeight: p.fitting_height ? parseFloat(p.fitting_height) : undefined,
          segmentHeight: p.segment_height ? parseFloat(p.segment_height) : undefined,
          fh_right: p.fh_right ? parseFloat(p.fh_right) : undefined,
          fh_left: p.fh_left ? parseFloat(p.fh_left) : undefined,
          sh_right: p.sh_right ? parseFloat(p.sh_right) : undefined,
          sh_left: p.sh_left ? parseFloat(p.sh_left) : undefined,

          // Frame specs
          a_val: p.a_val || '',
          b_val: p.b_val || '',
          dbl_val: p.dbl_val || '',
          dia_right: p.dia_right || '',
          dia_left: p.dia_left || '',
          base_curve_right: p.base_curve_right || '',
          base_curve_left: p.base_curve_left || '',
          panto_angle: p.panto_angle || '',
          wrap_angle: p.wrap_angle || '',

          prescriptionType: p.prescription_type || 'single',
          remarks: p.remarks || ''
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
        staffId: user?.id,
        optometristId: user?.id,
        prescriptionDate: formData.prescriptionDate,
        prescriptionType: formData.prescriptionType,

        od_sph: parseFloat(String(formData.od_sph)) || 0,
        od_cyl: parseFloat(String(formData.od_cyl)) || 0,
        od_axis: parseInt(String(formData.od_axis), 10) || 0,
        od_add: isNaN(parseFloat(String(formData.od_add))) ? 0 : parseFloat(String(formData.od_add)),
        od_va: formData.od_va,

        os_sph: parseFloat(String(formData.os_sph)) || 0,
        os_cyl: parseFloat(String(formData.os_cyl)) || 0,
        os_axis: parseInt(String(formData.os_axis), 10) || 0,
        os_add: isNaN(parseFloat(String(formData.os_add))) ? 0 : parseFloat(String(formData.os_add)),
        os_va: formData.os_va,

        pd: parseFloat(String(formData.pd)) || 62,
        pd_right: formData.pd_right !== '' ? parseFloat(String(formData.pd_right)) : undefined,
        pd_left: formData.pd_left !== '' ? parseFloat(String(formData.pd_left)) : undefined,
        pd_near: formData.pd_near !== '' ? parseFloat(String(formData.pd_near)) : undefined,
        pd_near_right: formData.pd_near_right !== '' ? parseFloat(String(formData.pd_near_right)) : undefined,
        pd_near_left: formData.pd_near_left !== '' ? parseFloat(String(formData.pd_near_left)) : undefined,

        fittingHeight: formData.fittingHeight ? parseFloat(String(formData.fittingHeight)) : undefined,
        segmentHeight: formData.segmentHeight ? parseFloat(String(formData.segmentHeight)) : undefined,
        fh_right: formData.fh_right ? parseFloat(String(formData.fh_right)) : undefined,
        fh_left: formData.fh_left ? parseFloat(String(formData.fh_left)) : undefined,
        sh_right: formData.sh_right ? parseFloat(String(formData.sh_right)) : undefined,
        sh_left: formData.sh_left ? parseFloat(String(formData.sh_left)) : undefined,

        a_val: formData.a_val,
        b_val: formData.b_val,
        dbl_val: formData.dbl_val,
        dia_right: formData.dia_right,
        dia_left: formData.dia_left,
        base_curve_right: formData.base_curve_right,
        base_curve_left: formData.base_curve_left,
        panto_angle: formData.panto_angle,
        wrap_angle: formData.wrap_angle,
        remarks: formData.remarks
      };

      let response;
      if (editingId) {
        response = await apiClient.put(`/prescriptions/${editingId}`, payload);
      } else {
        response = await apiClient.post('/prescriptions', payload);
      }

      if (response.data?.success) {
        setFormData(initialFormData);
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
    setShowCustomerDropdown(false);
    setFormData({
      customerId: prescription.customerId || '',
      customerName: prescription.customerName,
      age: prescription.age ? prescription.age.toString() : '',
      prescriptionDate: prescription.prescriptionDate,
      prescriptionType: prescription.prescriptionType,
      od_sph: prescription.od_sph !== undefined ? String(prescription.od_sph) : '0.00',
      od_cyl: prescription.od_cyl !== undefined ? String(prescription.od_cyl) : '0.00',
      od_axis: prescription.od_axis !== undefined ? String(prescription.od_axis) : '0',
      od_add: prescription.od_add !== undefined && prescription.od_add !== null ? (Number(prescription.od_add) > 0 ? `+${Number(prescription.od_add).toFixed(2)}` : Number(prescription.od_add).toFixed(2)) : '0.00',
      od_va: prescription.od_va || '6/6',
      os_sph: prescription.os_sph !== undefined ? String(prescription.os_sph) : '0.00',
      os_cyl: prescription.os_cyl !== undefined ? String(prescription.os_cyl) : '0.00',
      os_axis: prescription.os_axis !== undefined ? String(prescription.os_axis) : '0',
      os_add: prescription.os_add !== undefined && prescription.os_add !== null ? (Number(prescription.os_add) > 0 ? `+${Number(prescription.os_add).toFixed(2)}` : Number(prescription.os_add).toFixed(2)) : '0.00',
      os_va: prescription.os_va || '6/6',
      pd: prescription.pd !== undefined ? String(prescription.pd) : '62',
      pd_right: prescription.pd_right !== undefined ? String(prescription.pd_right) : '',
      pd_left: prescription.pd_left !== undefined ? String(prescription.pd_left) : '',
      pd_near: prescription.pd_near !== undefined ? String(prescription.pd_near) : '',
      pd_near_right: prescription.pd_near_right !== undefined ? String(prescription.pd_near_right) : '',
      pd_near_left: prescription.pd_near_left !== undefined ? String(prescription.pd_near_left) : '',
      fittingHeight: prescription.fittingHeight !== undefined ? String(prescription.fittingHeight) : '',
      segmentHeight: prescription.segmentHeight !== undefined ? String(prescription.segmentHeight) : '',
      fh_right: prescription.fh_right !== undefined ? String(prescription.fh_right) : '',
      fh_left: prescription.fh_left !== undefined ? String(prescription.fh_left) : '',
      sh_right: prescription.sh_right !== undefined ? String(prescription.sh_right) : '',
      sh_left: prescription.sh_left !== undefined ? String(prescription.sh_left) : '',
      a_val: prescription.a_val || '',
      b_val: prescription.b_val || '',
      dbl_val: prescription.dbl_val || '',
      dia_right: prescription.dia_right || '',
      dia_left: prescription.dia_left || '',
      base_curve_right: prescription.base_curve_right || '',
      base_curve_left: prescription.base_curve_left || '',
      panto_angle: prescription.panto_angle || '',
      wrap_angle: prescription.wrap_angle || '',
      remarks: prescription.remarks || ''
    });
    setIsAddingPrescription(true);
  };

  const handleDeletePrescription = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this prescription? This action cannot be undone.')) {
      try {
        const response = await apiClient.delete(`/prescriptions/${id}`);
        if (response.data?.success) {
          if (editingId === id) {
            setEditingId(null);
            setIsAddingPrescription(false);
            setFormData(initialFormData);
          }
          if (viewingPrescription?.id === id) {
            setIsViewingPrescription(false);
            setViewingPrescription(null);
          }
          fetchPrescriptions();
        }
      } catch (error: any) {
        console.error('Error deleting prescription:', error);
        alert(error?.response?.data?.message || 'Failed to delete prescription');
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
    <div className="space-y-4">
      {/* Header Section - Modern Compact Slate Theme */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Optical Prescriptions</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage and track all customer eye prescriptions</p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setFormData(initialFormData);
            setIsAddingPrescription(!isAddingPrescription)
          }}
          className="gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm text-sm px-4 py-2"
        >
          <Plus size={18} />
          New Prescription
        </Button>
      </div>

      {/* Add/Edit Prescription Modal Dialog */}
      {isAddingPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <Card className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-auto p-0 border-0">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <FileText size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    {editingId ? 'Edit Prescription' : 'Create New Prescription'}
                  </h2>
                  <p className="text-[11px] text-slate-400">Enter customer optical parameters, sphere, cylinder, axis & measurements</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddingPrescription(false);
                  setEditingId(null);
                }}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-4 space-y-2 max-h-[80vh] overflow-y-auto">
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
                      disabled={!!editingId}
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
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-600"></span>
                      Right Eye (OD)
                    </h3>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">Oculus Dexter</span>
                  </div>
                  <div className="grid gap-2 grid-cols-5">
                    <div>
                      <label className="text-[10px] font-medium text-slate-600 mb-0.5 block">SPH</label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={formData.od_sph}
                        onChange={(e) =>
                          setFormData({ ...formData, od_sph: e.target.value })
                        }
                        placeholder="-1.50"
                        className="text-xs h-8 px-1.5 text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-600 mb-0.5 block">CYL</label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={formData.od_cyl}
                        onChange={(e) =>
                          setFormData({ ...formData, od_cyl: e.target.value })
                        }
                        placeholder="-0.75"
                        className="text-xs h-8 px-1.5 text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-600 mb-0.5 block">AXIS</label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formData.od_axis}
                        onChange={(e) =>
                          setFormData({ ...formData, od_axis: e.target.value })
                        }
                        placeholder="180"
                        className="text-xs h-8 px-1.5 text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-600 mb-0.5 block">ADD</label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={formData.od_add}
                        onChange={(e) =>
                          setFormData({ ...formData, od_add: e.target.value })
                        }
                        placeholder="+2.00 / -0.50"
                        className="text-xs h-8 px-1.5 text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-600 mb-0.5 block">V/A</label>
                      <Input
                        type="text"
                        value={formData.od_va}
                        onChange={(e) =>
                          setFormData({ ...formData, od_va: e.target.value })
                        }
                        placeholder="6/6"
                        className="text-xs h-8 px-1.5 text-center font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Left Eye (OS) */}
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-indigo-600"></span>
                      Left Eye (OS)
                    </h3>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">Oculus Sinister</span>
                  </div>
                  <div className="grid gap-2 grid-cols-5">
                    <div>
                      <label className="text-[10px] font-medium text-slate-600 mb-0.5 block">SPH</label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={formData.os_sph}
                        onChange={(e) =>
                          setFormData({ ...formData, os_sph: e.target.value })
                        }
                        placeholder="-1.25"
                        className="text-xs h-8 px-1.5 text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-600 mb-0.5 block">CYL</label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={formData.os_cyl}
                        onChange={(e) =>
                          setFormData({ ...formData, os_cyl: e.target.value })
                        }
                        placeholder="-0.50"
                        className="text-xs h-8 px-1.5 text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-600 mb-0.5 block">AXIS</label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formData.os_axis}
                        onChange={(e) =>
                          setFormData({ ...formData, os_axis: e.target.value })
                        }
                        placeholder="175"
                        className="text-xs h-8 px-1.5 text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-600 mb-0.5 block">ADD</label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={formData.os_add}
                        onChange={(e) =>
                          setFormData({ ...formData, os_add: e.target.value })
                        }
                        placeholder="+2.00 / -0.50"
                        className="text-xs h-8 px-1.5 text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-600 mb-0.5 block">V/A</label>
                      <Input
                        type="text"
                        value={formData.os_va}
                        onChange={(e) =>
                          setFormData({ ...formData, os_va: e.target.value })
                        }
                        placeholder="6/6"
                        className="text-xs h-8 px-1.5 text-center font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pupillary Distance (PD) & Monocular PDs Row */}
              <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200 space-y-2">
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Pupillary Distance (PD) Parameters</h4>
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Total PD (mm)</label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={formData.pd}
                      onChange={(e) => setFormData({ ...formData, pd: e.target.value })}
                      placeholder="62"
                      className="text-xs h-8 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">PD Right (mm)</label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={formData.pd_right}
                      onChange={(e) => setFormData({ ...formData, pd_right: e.target.value })}
                      placeholder="31"
                      className="text-xs h-8 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">PD Left (mm)</label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={formData.pd_left}
                      onChange={(e) => setFormData({ ...formData, pd_left: e.target.value })}
                      placeholder="31"
                      className="text-xs h-8 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">PD Near (mm)</label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={formData.pd_near}
                      onChange={(e) => setFormData({ ...formData, pd_near: e.target.value })}
                      placeholder="58"
                      className="text-xs h-8 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Fitting Heights, Segment Heights & Technical Frame Specs section (Hidden for Single Vision) */}
              {formData.prescriptionType !== 'single' && (
                <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200 space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                    Frame Technical Metrics & Lens Heights
                  </h4>

                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Section 1: Lens Heights */}
                    <div className="bg-white p-2.5 rounded-md border border-slate-200/80 space-y-2">
                      <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-1">
                        Lens Heights
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">FH R/L (mm)</label>
                          <div className="flex gap-1">
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={formData.fh_right}
                              onChange={(e) => setFormData({ ...formData, fh_right: e.target.value, fittingHeight: e.target.value })}
                              placeholder="R"
                              className="text-xs h-8 px-1.5 text-center font-mono"
                            />
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={formData.fh_left}
                              onChange={(e) => setFormData({ ...formData, fh_left: e.target.value })}
                              placeholder="L"
                              className="text-xs h-8 px-1.5 text-center font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">SH R/L (mm)</label>
                          <div className="flex gap-1">
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={formData.sh_right}
                              onChange={(e) => setFormData({ ...formData, sh_right: e.target.value, segmentHeight: e.target.value })}
                              placeholder="R"
                              className="text-xs h-8 px-1.5 text-center font-mono"
                            />
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={formData.sh_left}
                              onChange={(e) => setFormData({ ...formData, sh_left: e.target.value })}
                              placeholder="L"
                              className="text-xs h-8 px-1.5 text-center font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Frame Box Dimensions */}
                    <div className="bg-white p-2.5 rounded-md border border-slate-200/80 space-y-2">
                      <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-1">
                        Frame Box Dimensions
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">A (mm)</label>
                          <Input
                            type="text"
                            value={formData.a_val}
                            onChange={(e) => setFormData({ ...formData, a_val: e.target.value })}
                            placeholder="52"
                            className="text-xs h-8 font-mono text-center px-1"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">B (mm)</label>
                          <Input
                            type="text"
                            value={formData.b_val}
                            onChange={(e) => setFormData({ ...formData, b_val: e.target.value })}
                            placeholder="38"
                            className="text-xs h-8 font-mono text-center px-1"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">DBL</label>
                          <Input
                            type="text"
                            value={formData.dbl_val}
                            onChange={(e) => setFormData({ ...formData, dbl_val: e.target.value })}
                            placeholder="18"
                            className="text-xs h-8 font-mono text-center px-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Lens & Base Curve */}
                    <div className="bg-white p-2.5 rounded-md border border-slate-200/80 space-y-2">
                      <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-1">
                        Lens & Base Curve
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">DIA R/L (mm)</label>
                          <div className="flex gap-1">
                            <Input
                              type="text"
                              value={formData.dia_right}
                              onChange={(e) => setFormData({ ...formData, dia_right: e.target.value })}
                              placeholder="70"
                              className="text-xs h-8 px-1.5 text-center font-mono"
                            />
                            <Input
                              type="text"
                              value={formData.dia_left}
                              onChange={(e) => setFormData({ ...formData, dia_left: e.target.value })}
                              placeholder="70"
                              className="text-xs h-8 px-1.5 text-center font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Base Curve R/L</label>
                          <div className="flex gap-1">
                            <Input
                              type="text"
                              value={formData.base_curve_right}
                              onChange={(e) => setFormData({ ...formData, base_curve_right: e.target.value })}
                              placeholder="4"
                              className="text-xs h-8 px-1.5 text-center font-mono"
                            />
                            <Input
                              type="text"
                              value={formData.base_curve_left}
                              onChange={(e) => setFormData({ ...formData, base_curve_left: e.target.value })}
                              placeholder="4"
                              className="text-xs h-8 px-1.5 text-center font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Frame Angles */}
                    <div className="bg-white p-2.5 rounded-md border border-slate-200/80 space-y-2">
                      <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-1">
                        Frame Angles
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Panto (°)</label>
                          <Input
                            type="text"
                            value={formData.panto_angle}
                            onChange={(e) => setFormData({ ...formData, panto_angle: e.target.value })}
                            placeholder="8"
                            className="text-xs h-8 font-mono text-center px-1"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Wrap (°)</label>
                          <Input
                            type="text"
                            value={formData.wrap_angle}
                            onChange={(e) => setFormData({ ...formData, wrap_angle: e.target.value })}
                            placeholder="5"
                            className="text-xs h-8 font-mono text-center px-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Full-Width Remarks & Instructions Field */}
              <div className="pt-1.5 border-t border-slate-200/60">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Prescription Remarks & Clinical Instructions
                </label>
                <Input
                  type="text"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Enter special instructions (e.g., Anti-Reflective coating, Blue Light filter, Hydrophobic, Prism notes, specific tint)..."
                  className="w-full text-xs h-9 bg-white border-slate-300 focus:ring-slate-900 font-medium text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Modal Footer Toolbar */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <Button
                onClick={() => {
                  setIsAddingPrescription(false);
                  setEditingId(null);
                  setFormData(initialFormData);
                }}
                variant="outline"
                size="sm"
                className="h-9 text-xs px-4"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPrescription}
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 text-white h-9 text-xs font-semibold px-5 shadow-sm"
              >
                {editingId ? 'Update Prescription' : 'Save Prescription'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Create Customer Modal */}
      {isCreatingCustomer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
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
              className={`px-3 h-8 text-xs rounded-lg font-medium border transition-colors ${filterType === type
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
                <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Type</th>
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
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
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
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {prescription.age && (
                            <span className="text-xs text-slate-500">Age: {prescription.age} yrs</span>
                          )}
                          <span className="text-xs text-indigo-600 font-medium">
                            Rx #{prescription.prescriptionNumber || prescription.id}
                          </span>
                        </div>
                        {prescription.hasOrder && prescription.orderNo ? (
                          <div className="mt-1 flex items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              <PackageCheck size={12} className="text-emerald-600" />
                              Order #{prescription.orderNo} ({prescription.items?.length || 0} items)
                            </span>
                          </div>
                        ) : (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] text-slate-400 bg-slate-100">
                              No order linked
                            </span>
                          </div>
                        )}
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
                      <p className="text-sm text-slate-900 font-bold text-emerald-600">
                        {prescription.prescriptionType === "single" ? "Single Vision" : prescription.prescriptionType === "bifocal" ? "Bifocal" : "Progressive"}
                      </p>
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
                          title="View Prescription Details"
                        >
                          <Eye size={15} />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditPrescription(prescription)}
                          className="text-slate-700 hover:text-slate-900 border-slate-300 h-8 px-2.5"
                          title="Edit Prescription"
                        >
                          <Edit size={15} />
                        </Button>

                        <Button
                          size="sm"
                          className="bg-slate-900 hover:bg-slate-800 text-white h-8 px-2.5"
                          onClick={() => generatePrescriptionPDF(prescription, user?.companyDetails)}
                          title="Print Prescription PDF"
                        >
                          <Printer size={15} />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeletePrescription(prescription.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 border-slate-300 h-8 px-2.5"
                          title="Delete Prescription"
                        >
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <Card className="w-full max-w-3xl px-4 shadow-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-900 text-white">
                  <Eye size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Prescription Details - Rx #{viewingPrescription.prescriptionNumber || viewingPrescription.id}
                  </h2>
                  <p className="text-xs text-slate-500">Customer refractive measurements & technical specs</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsViewingPrescription(false);
                  setViewingPrescription(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Customer Name</p>
                  <p className="font-semibold text-slate-900 text-xs mt-0.5">{viewingPrescription.customerName}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Age</p>
                  <p className="font-semibold text-slate-900 text-xs mt-0.5">{viewingPrescription.age ? `${viewingPrescription.age} years` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Rx Date</p>
                  <p className="font-semibold text-slate-900 text-xs mt-0.5">{new Date(viewingPrescription.prescriptionDate).toLocaleDateString('en-GB')}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Rx Type</p>
                  <p className="font-semibold text-slate-900 text-xs capitalize mt-0.5">{viewingPrescription.prescriptionType}</p>
                </div>
              </div>

              {/* Eye Refraction Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="px-3.5 py-2 text-left text-[11px] uppercase font-bold">Eye</th>
                      <th className="px-3.5 py-2 text-center text-[11px] uppercase font-bold">SPH</th>
                      <th className="px-3.5 py-2 text-center text-[11px] uppercase font-bold">CYL</th>
                      <th className="px-3.5 py-2 text-center text-[11px] uppercase font-bold">AXIS</th>
                      <th className="px-3.5 py-2 text-center text-[11px] uppercase font-bold">ADD</th>
                      <th className="px-3.5 py-2 text-center text-[11px] uppercase font-bold">V/A</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    <tr>
                      <td className="px-3.5 py-2.5 font-bold font-sans text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        Right (OD)
                      </td>
                      <td className="px-3.5 py-2.5 text-center font-bold">
                        {viewingPrescription.od_sph > 0 ? `+${viewingPrescription.od_sph.toFixed(2)}` : viewingPrescription.od_sph.toFixed(2)}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        {viewingPrescription.od_cyl > 0 ? `+${viewingPrescription.od_cyl.toFixed(2)}` : viewingPrescription.od_cyl.toFixed(2)}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">{viewingPrescription.od_axis}°</td>
                      <td className="px-3.5 py-2.5 text-center text-indigo-600 font-bold">
                        {viewingPrescription.od_add !== undefined && viewingPrescription.od_add !== null
                          ? (Number(viewingPrescription.od_add) > 0 ? `+${Number(viewingPrescription.od_add).toFixed(2)}` : Number(viewingPrescription.od_add).toFixed(2))
                          : '0.00'}
                      </td>
                      <td className="px-3.5 py-2.5 text-center font-bold text-slate-700">{viewingPrescription.od_va || '6/6'}</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 font-bold font-sans text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        Left (OS)
                      </td>
                      <td className="px-3.5 py-2.5 text-center font-bold">
                        {viewingPrescription.os_sph > 0 ? `+${viewingPrescription.os_sph.toFixed(2)}` : viewingPrescription.os_sph.toFixed(2)}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        {viewingPrescription.os_cyl > 0 ? `+${viewingPrescription.os_cyl.toFixed(2)}` : viewingPrescription.os_cyl.toFixed(2)}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">{viewingPrescription.os_axis}°</td>
                      <td className="px-3.5 py-2.5 text-center text-indigo-600 font-bold">
                        {viewingPrescription.os_add !== undefined && viewingPrescription.os_add !== null
                          ? (Number(viewingPrescription.os_add) > 0 ? `+${Number(viewingPrescription.os_add).toFixed(2)}` : Number(viewingPrescription.os_add).toFixed(2))
                          : '0.00'}
                      </td>
                      <td className="px-3.5 py-2.5 text-center font-bold text-slate-700">{viewingPrescription.os_va || '6/6'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* PD Summary */}
              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pupillary Distance (PD) Summary</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-sans uppercase block font-bold">Total PD</span>
                    <span className="text-sm font-bold text-slate-900">{viewingPrescription.pd} mm</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-sans uppercase block font-bold">Mono PD (R / L)</span>
                    <span className="text-sm font-bold text-slate-900">
                      {viewingPrescription.pd_right || Math.round(viewingPrescription.pd / 2)} / {viewingPrescription.pd_left || Math.round(viewingPrescription.pd / 2)} mm
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-sans uppercase block font-bold">Near PD Total</span>
                    <span className="text-sm font-bold text-slate-900">
                      {viewingPrescription.pd_near ? `${viewingPrescription.pd_near} mm` : 'N/A'}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-sans uppercase block font-bold">Near PD (R / L)</span>
                    <span className="text-sm font-bold text-slate-900">
                      {viewingPrescription.pd_near_right || 'N/A'} / {viewingPrescription.pd_near_left || 'N/A'} mm
                    </span>
                  </div>
                </div>
              </div>

              {/* Technical Frame Specs & Lens Heights Section (Hidden for Single Vision) */}
              {viewingPrescription.prescriptionType !== 'single' && (
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                    Frame Technical Metrics & Lens Heights
                  </h4>

                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Section 1: Lens Heights */}
                    <div className="bg-white p-2.5 rounded-md border border-slate-200/80 space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-1">
                        Lens Heights
                      </div>
                      <div className="text-xs space-y-1 font-mono">
                        <div className="flex justify-between">
                          <span className="text-[10px] text-slate-500 font-sans">FH (R / L):</span>
                          <span className="font-bold">{viewingPrescription.fh_right || viewingPrescription.fittingHeight || 'N/A'} / {viewingPrescription.fh_left || viewingPrescription.fittingHeight || 'N/A'} mm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[10px] text-slate-500 font-sans">SH (R / L):</span>
                          <span className="font-bold">{viewingPrescription.sh_right || viewingPrescription.segmentHeight || 'N/A'} / {viewingPrescription.sh_left || viewingPrescription.segmentHeight || 'N/A'} mm</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Frame Box Dimensions */}
                    <div className="bg-white p-2.5 rounded-md border border-slate-200/80 space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-1">
                        Frame Box Dimensions
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-center font-mono text-xs">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-sans">A</span>
                          <span className="font-bold">{viewingPrescription.a_val || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-sans">B</span>
                          <span className="font-bold">{viewingPrescription.b_val || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-sans">DBL</span>
                          <span className="font-bold">{viewingPrescription.dbl_val || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Lens & Base Curve */}
                    <div className="bg-white p-2.5 rounded-md border border-slate-200/80 space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-1">
                        Lens & Base Curve
                      </div>
                      <div className="text-xs space-y-1 font-mono">
                        <div className="flex justify-between">
                          <span className="text-[10px] text-slate-500 font-sans">DIA (R / L):</span>
                          <span className="font-bold">{viewingPrescription.dia_right || '-'}/{viewingPrescription.dia_left || viewingPrescription.dia_right || '-'} mm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[10px] text-slate-500 font-sans">Base Curve (R / L):</span>
                          <span className="font-bold">{viewingPrescription.base_curve_right || '-'}/{viewingPrescription.base_curve_left || viewingPrescription.base_curve_right || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Frame Angles */}
                    <div className="bg-white p-2.5 rounded-md border border-slate-200/80 space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-1">
                        Frame Angles
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-center font-mono text-xs">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-sans">PANTO</span>
                          <span className="font-bold">{viewingPrescription.panto_angle ? `${viewingPrescription.panto_angle}°` : '-'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-sans">WRAP</span>
                          <span className="font-bold">{viewingPrescription.wrap_angle ? `${viewingPrescription.wrap_angle}°` : '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Remarks & Special Instructions */}
              {viewingPrescription.remarks && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Remarks / Special Instructions</p>
                  <p className="text-slate-800 font-medium">{viewingPrescription.remarks}</p>
                </div>
              )}

              {/* Associated Order & Products / Items Section */}
              {viewingPrescription.hasOrder ? (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                        <PackageCheck size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          Associated Order #{viewingPrescription.orderNo || viewingPrescription.orderId}
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              viewingPrescription.paymentStatus === 'completed'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {viewingPrescription.paymentStatus || 'Ordered'}
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Order Date:{' '}
                          {viewingPrescription.orderDate
                            ? new Date(viewingPrescription.orderDate).toLocaleDateString('en-GB')
                            : 'N/A'}{' '}
                          {viewingPrescription.orderTime ? `• ${viewingPrescription.orderTime}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans uppercase font-bold">Total Net</span>
                        <span className="font-bold text-slate-900">
                          LKR {(viewingPrescription.totalAmount || viewingPrescription.netAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {viewingPrescription.balanceAmount !== undefined && Number(viewingPrescription.balanceAmount) > 0 && (
                        <div>
                          <span className="text-[10px] text-red-500 block font-sans uppercase font-bold">Balance Due</span>
                          <span className="font-bold text-red-600">
                            LKR {Number(viewingPrescription.balanceAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Items Table */}
                  {viewingPrescription.items && viewingPrescription.items.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-2 text-left text-[11px]">Type / Code</th>
                            <th className="px-3 py-2 text-left text-[11px]">Description</th>
                            <th className="px-3 py-2 text-right text-[11px]">Rate</th>
                            <th className="px-3 py-2 text-center text-[11px]">Qty</th>
                            <th className="px-3 py-2 text-right text-[11px]">Dis. %</th>
                            <th className="px-3 py-2 text-right text-[11px]">Dis. Amt</th>
                            <th className="px-3 py-2 text-right text-[11px]">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {viewingPrescription.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="px-3 py-2 font-medium text-slate-800">
                                {item.type ? <span className="font-bold text-indigo-600 mr-1.5">{item.type}</span> : null}
                                {item.code || '-'}
                              </td>
                              <td className="px-3 py-2 font-sans text-slate-900 font-medium">
                                {item.description || (item as any).name || 'Optical Item'}
                              </td>
                              <td className="px-3 py-2 text-right text-slate-700">
                                {(typeof item.rate === 'number' ? item.rate : (parseFloat(String((item as any).unit_price || 0)) || 0)).toFixed(2)}
                              </td>
                              <td className="px-3 py-2 text-center font-bold text-slate-800">
                                {item.qty ?? (item as any).quantity ?? 1}
                              </td>
                              <td className="px-3 py-2 text-right text-slate-600">
                                {(item.discountPercent !== undefined ? Number(item.discountPercent) : (Number((item as any).discount_percentage) || 0)).toFixed(2)}%
                              </td>
                              <td className="px-3 py-2 text-right text-slate-600">
                                {(item.discountAmount !== undefined ? Number(item.discountAmount) : (Number((item as any).discount_amount) || 0)).toFixed(2)}
                              </td>
                              <td className="px-3 py-2 text-right font-bold text-slate-900">
                                {(typeof item.amount === 'number' ? item.amount : (parseFloat(String((item as any).line_total || 0)) || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No line items recorded for this order.</p>
                  )}
                </div>
              ) : null}

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button
                  onClick={() => generatePrescriptionPDF({
                    ...viewingPrescription,
                    clinicianName: viewingPrescription.clinicianName || viewingPrescription.optometrist_name || viewingPrescription.staff_name || user?.name || ''
                  }, user?.companyDetails)}
                  className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-medium text-xs h-9 px-4"
                >
                  <Printer size={15} />
                  Print Prescription PDF
                </Button>
                <Button
                  onClick={() => {
                    const pxId = viewingPrescription.id;
                    const cId = viewingPrescription.customerId || '';
                    setIsViewingPrescription(false);
                    router.push(`/dashboard/pos?prescriptionId=${pxId}&customerId=${cId}`);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium text-xs h-9 px-4"
                >
                  <ShoppingCart size={15} />
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
