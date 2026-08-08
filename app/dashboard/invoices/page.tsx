'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Calendar, Eye, Printer, X, Receipt, Building, CheckCircle2, Clock, AlertCircle, Eye as EyeIcon, DollarSign, FileText } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/lib/auth/auth-context';

interface InvoiceItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
  tax_percentage: string;
  discount_percentage: string;
  line_total: string;
  name: string;
  code: string;
  category: string;
}

interface Invoice {
  id: number;
  branch_id: number;
  customer_id: number | null;
  prescription_id?: number | null;
  staff_id: number;
  invoice_number: string;
  total_amount: string;
  tax_amount: string;
  discount_amount: string;
  net_amount: string;
  prescription_charges?: string;
  advance_amount?: string;
  balance_amount?: string;
  payment_method: string;
  payment_status: string;
  notes: string | null;
  sale_date: string;
  first_name: string | null;
  last_name: string | null;
  customer_phone?: string;
  customer_email?: string;
  staff_name: string;

  // Prescription Details (from backend SQL JOIN)
  prescription_number?: string;
  prescription_date?: string;
  expiry_date?: string;
  prescription_type?: string;
  od_sph?: string;
  od_cyl?: string;
  od_axis?: number;
  os_sph?: string;
  os_cyl?: string;
  os_axis?: number;
  pd?: string;
  fitting_height?: string;
  segment_height?: string;

  items?: InvoiceItem[];
}

interface Branch {
  id: number;
  name: string;
  code: string;
}

export default function InvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Fetch branches for admin role
  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchBranches = async () => {
        try {
          const response = await apiClient.get('/branches');
          if (response.data?.success) {
            setBranches(response.data.data || []);
          }
        } catch (error) {
          console.error('Error fetching branches:', error);
        }
      };
      fetchBranches();
    }
  }, [user]);

  // Fetch invoices on query change
  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/sales', {
        params: {
          search: searchTerm,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          branchId: user?.role === 'admin' ? (selectedBranch || undefined) : undefined,
          page: currentPage,
          limit: itemsPerPage
        }
      });

      if (response.data?.success) {
        setInvoices(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalItems(response.data.pagination?.totalItems || 0);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [searchTerm, startDate, endDate, selectedBranch, currentPage, user]);

  // View invoice details
  const handleViewDetails = async (invoice: Invoice) => {
    setIsDetailOpen(true);
    setIsDetailLoading(true);
    setSelectedInvoice(invoice);
    try {
      const response = await apiClient.get(`/sales/${invoice.id}`);
      if (response.data?.success) {
        setSelectedInvoice(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching invoice details:', error);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper payment method style
  const getPaymentMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      cash: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      card: 'bg-blue-100 text-blue-800 border-blue-200',
      upi: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      credit: 'bg-amber-100 text-amber-800 border-amber-200',
      cheque: 'bg-purple-100 text-purple-800 border-purple-200'
    };

    const formatted = (method || 'CASH').toUpperCase();
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${colors[method.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {formatted}
      </span>
    );
  };

  // Helper payment status style
  const getPaymentStatusBadge = (status: string) => {
    const s = (status || 'completed').toLowerCase();
    if (s === 'partial' || s === 'advance') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
          <Clock size={11} />
          ADVANCE
        </span>
      );
    }
    if (s === 'pending' || s === 'unpaid') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
          <AlertCircle size={11} />
          UNPAID
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <CheckCircle2 size={11} />
        COMPLETED
      </span>
    );
  };

  return (
    <>
      {/* 1. Main Page Content (Hidden when printing) */}
      <div className="space-y-4 print:hidden">
        {/* Header Section - Modern Compact Slate Theme */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-900 p-2.5 text-white">
              <Receipt size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Sales Invoices
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">Review customer invoices, advance payments, linked prescriptions, and print receipts</p>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
              <Input
                type="text"
                placeholder="Search Invoice #, Customer, or Rx #..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 h-9 text-xs border-slate-300 rounded-lg"
              />
            </div>

            {/* Start Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 h-9 text-xs border-slate-300 rounded-lg text-slate-600"
              />
            </div>

            {/* End Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 h-9 text-xs border-slate-300 rounded-lg text-slate-600"
              />
            </div>

            {/* Branch Filter (Admin Only) */}
            {user?.role === 'admin' ? (
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                <select
                  value={selectedBranch}
                  onChange={(e) => {
                    setSelectedBranch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-8 h-9 border border-slate-300 rounded-lg bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="">All Branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center text-xs text-slate-500 px-3 bg-slate-50 border border-slate-200 rounded-lg h-9">
                <span>Branch Filter Restricted</span>
              </div>
            )}
          </div>
        </div>

        {/* Invoices Table Card */}
        <Card className="overflow-hidden border border-slate-200 shadow-sm rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-800 text-white text-xs font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3.5 text-left">Invoice No</th>
                  <th className="px-5 py-3.5 text-left">Date</th>
                  <th className="px-5 py-3.5 text-left">Customer</th>
                  <th className="px-5 py-3.5 text-left">Prescription</th>
                  <th className="px-5 py-3.5 text-left">Staff/Cashier</th>
                  <th className="px-5 py-3.5 text-left">Status</th>
                  <th className="px-5 py-3.5 text-right">Net Amount</th>
                  <th className="px-5 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                        <span className="text-xs">Loading invoices...</span>
                      </div>
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="font-semibold text-slate-900 text-sm">No Invoices Found</span>
                        <span className="text-xs text-slate-400">Try adjusting your filters or search queries.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice, idx) => (
                    <tr
                      key={invoice.id}
                      className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                    >
                      <td className="px-5 py-3 font-semibold text-slate-900">{invoice.invoice_number}</td>
                      <td className="px-5 py-3 text-slate-600 text-xs">
                        {new Date(invoice.sale_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-5 py-3">
                        {invoice.first_name ? (
                          <p className="font-medium text-slate-900 text-sm">
                            {invoice.first_name} {invoice.last_name || ''}
                          </p>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Walk-in Customer</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {invoice.prescription_number || invoice.prescription_id ? (
                          <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded">
                            <EyeIcon size={12} />
                            Rx #{invoice.prescription_number || invoice.prescription_id}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-600 text-xs">{invoice.staff_name}</td>
                      <td className="px-5 py-3">{getPaymentStatusBadge(invoice.payment_status)}</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-900 font-mono">
                        LKR.{parseFloat(invoice.net_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg gap-1.5 h-8 px-2.5 text-xs"
                            onClick={() => handleViewDetails(invoice)}
                          >
                            <Eye size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg gap-1.5 h-8 px-2.5 text-xs"
                            onClick={() => handleViewDetails(invoice).then(() => setTimeout(() => window.print(), 300))}
                          >
                            <Printer size={14} />
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

        {/* Pagination bar */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
            <p className="text-xs text-slate-500 font-medium">
              Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} invoices
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-8 rounded-lg text-xs"
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
                    className={`h-8 w-8 rounded-lg text-xs ${currentPage === page ? 'bg-slate-900 hover:bg-slate-800 text-white' : ''}`}
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
                className="h-8 rounded-lg text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Details Modal Overlay Dialog */}
      {isDetailOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 print:hidden">
          <Card className="w-full max-w-4xl bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Receipt size={20} className="text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">Invoice Details & Complete Record</h3>
                  <p className="text-[11px] text-slate-400">Invoice #{selectedInvoice.invoice_number}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {isDetailLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                  <span className="text-slate-500 font-medium">Fetching complete invoice details...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary Columns */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Invoice Meta</p>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedInvoice.invoice_number}</p>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Date: {new Date(selectedInvoice.sale_date).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Customer Info</p>
                      {selectedInvoice.first_name ? (
                        <p className="font-bold text-slate-900 text-sm mt-0.5">
                          {selectedInvoice.first_name} {selectedInvoice.last_name || ''}
                        </p>
                      ) : (
                        <p className="text-slate-500 italic mt-0.5">Walk-in Customer</p>
                      )}
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        {selectedInvoice.customer_phone || 'No Phone'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Payment & Cashier</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getPaymentMethodBadge(selectedInvoice.payment_method)}
                        {getPaymentStatusBadge(selectedInvoice.payment_status)}
                      </div>
                      <p className="text-slate-600 text-[11px] mt-1">
                        Cashier: <strong className="text-slate-800">{selectedInvoice.staff_name}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Linked Prescription Card (If linked) */}
                  {(selectedInvoice.prescription_id || selectedInvoice.prescription_number || selectedInvoice.od_sph) && (
                    <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 space-y-2 shadow-md">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <div className="flex items-center gap-2">
                          <EyeIcon size={16} className="text-emerald-400" />
                          <span className="font-bold text-xs text-white uppercase tracking-wider">Attached Prescription Details</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded border border-emerald-500/30">
                          Rx #{selectedInvoice.prescription_number || selectedInvoice.prescription_id}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-slate-400 text-[10px] uppercase font-semibold block">Type</span>
                          <span className="font-semibold text-slate-100 capitalize block">
                            {selectedInvoice.prescription_type || 'Single Vision'}
                          </span>
                        </div>
                        <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-slate-400 text-[10px] uppercase font-semibold block">Right Eye (OD)</span>
                          <span className="font-mono font-bold text-blue-400 block">
                            {selectedInvoice.od_sph || '0.00'}/{selectedInvoice.od_cyl || '0.00'}@{selectedInvoice.od_axis || 0}°
                          </span>
                        </div>
                        <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-slate-400 text-[10px] uppercase font-semibold block">Left Eye (OS)</span>
                          <span className="font-mono font-bold text-indigo-400 block">
                            {selectedInvoice.os_sph || '0.00'}/{selectedInvoice.os_cyl || '0.00'}@{selectedInvoice.os_axis || 0}°
                          </span>
                        </div>
                        <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-slate-400 text-[10px] uppercase font-semibold block">Pupillary Distance</span>
                          <span className="font-mono font-bold text-slate-100 block">
                            {selectedInvoice.pd || '62'} mm
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment & Order Notes Banner */}
                  {selectedInvoice.notes && (
                    <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-xl text-xs space-y-1 text-amber-900">
                      <p className="font-semibold uppercase tracking-wider text-[10px] text-amber-700">Order & Payment Remarks</p>
                      <p className="font-medium leading-relaxed">{selectedInvoice.notes}</p>
                    </div>
                  )}

                  {/* Purchased Items Table */}
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">Purchased Items</h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-semibold text-[11px] border-b border-slate-200 uppercase">
                            <th className="px-3.5 py-2.5 text-left">Product / Code</th>
                            <th className="px-3.5 py-2.5 text-center">Qty</th>
                            <th className="px-3.5 py-2.5 text-right">Unit Price</th>
                            <th className="px-3.5 py-2.5 text-right">Discount</th>
                            <th className="px-3.5 py-2.5 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                            selectedInvoice.items.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50/50">
                                <td className="px-3.5 py-2">
                                  <p className="font-semibold text-slate-900">{item.name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">{item.code}</p>
                                </td>
                                <td className="px-3.5 py-2 text-center font-bold">{item.quantity}</td>
                                <td className="px-3.5 py-2 text-right text-slate-600 font-mono">
                                  LKR.{parseFloat(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-3.5 py-2 text-right text-slate-600">
                                  {parseFloat(item.discount_percentage) > 0 ? `${parseFloat(item.discount_percentage)}%` : '-'}
                                </td>
                                <td className="px-3.5 py-2 text-right font-bold text-slate-900 font-mono">
                                  LKR.{parseFloat(item.line_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-3.5 py-3 text-center text-slate-400 italic">
                                No inventory line items (Prescription fee order)
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Financial Details Breakdown */}
                  <div className="flex justify-end pt-2">
                    <div className="w-80 space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Items Subtotal:</span>
                        <span className="font-mono font-semibold">
                          LKR.{parseFloat(selectedInvoice.total_amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {parseFloat(selectedInvoice.prescription_charges || '0') > 0 && (
                        <div className="flex justify-between text-indigo-700 font-semibold">
                          <span>Prescription Fee:</span>
                          <span className="font-mono">
                            + LKR.{parseFloat(selectedInvoice.prescription_charges || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      {parseFloat(selectedInvoice.discount_amount || '0') > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Discount:</span>
                          <span className="font-mono">
                            - LKR.{parseFloat(selectedInvoice.discount_amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between font-bold text-slate-900 text-sm border-t border-slate-200 pt-2">
                        <span>Grand Net Total:</span>
                        <span className="text-slate-900 font-mono">
                          LKR.{parseFloat(selectedInvoice.net_amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Advance Paid & Balance Due Details */}
                      <div className="pt-2 border-t border-slate-200 space-y-1.5">
                        <div className="flex justify-between text-emerald-800 font-bold bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                          <span>Advance Paid:</span>
                          <span className="font-mono">
                            LKR.{parseFloat(selectedInvoice.advance_amount || selectedInvoice.net_amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {parseFloat(selectedInvoice.balance_amount || '0') > 0 && (
                          <div className="flex justify-between text-red-800 font-bold bg-red-100/70 px-2.5 py-1 rounded-lg">
                            <span>Balance Due:</span>
                            <span className="font-mono">
                              LKR.{parseFloat(selectedInvoice.balance_amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg h-8 text-xs"
                onClick={() => setIsDetailOpen(false)}
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={handlePrint}
                disabled={isDetailLoading}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg h-8 text-xs gap-1.5 shadow-sm"
              >
                <Printer size={15} />
                Print Complete Invoice
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 3. Dedicated print component (hidden in normal UI, visible ONLY in print mode) */}
      {selectedInvoice && (
        <div className="hidden print:block p-8 bg-white text-black text-sm max-w-lg mx-auto border-none">
          <div className="text-center space-y-2 mb-6 border-b pb-4">
            <h2 className="text-xl font-bold uppercase tracking-wide">Lumen Opticals</h2>
            <p className="text-xs text-gray-500 font-mono">Colombo, Sri Lanka</p>
            <p className="text-xs font-mono">Phone: +94 11 234 5678</p>
            <p className="text-xs text-gray-400 font-mono mt-2">SALES INVOICE</p>
          </div>

          <div className="space-y-1 mb-4 text-xs font-mono">
            <div className="flex justify-between">
              <span>Invoice No:</span>
              <span className="font-bold">{selectedInvoice.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{new Date(selectedInvoice.sale_date).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span>{selectedInvoice.staff_name}</span>
            </div>
            <div className="flex justify-between border-t border-dashed pt-1 mt-1">
              <span>Customer:</span>
              <span>{selectedInvoice.first_name ? `${selectedInvoice.first_name} ${selectedInvoice.last_name || ''}` : 'Walk-in'}</span>
            </div>
          </div>

          {/* Print Attached Prescription */}
          {(selectedInvoice.prescription_number || selectedInvoice.od_sph) && (
            <div className="border-t border-dashed py-2 mb-3 text-xs font-mono">
              <p className="font-bold text-center mb-1 uppercase">Eye Prescription Details</p>
              <div className="flex justify-between">
                <span>Rx #:</span>
                <span>{selectedInvoice.prescription_number || selectedInvoice.prescription_id}</span>
              </div>
              <div className="flex justify-between">
                <span>OD (Right):</span>
                <span>{selectedInvoice.od_sph || '0.00'}/{selectedInvoice.od_cyl || '0.00'}@{selectedInvoice.od_axis || 0}°</span>
              </div>
              <div className="flex justify-between">
                <span>OS (Left):</span>
                <span>{selectedInvoice.os_sph || '0.00'}/{selectedInvoice.os_cyl || '0.00'}@{selectedInvoice.os_axis || 0}°</span>
              </div>
              <div className="flex justify-between">
                <span>PD:</span>
                <span>{selectedInvoice.pd || 62} mm</span>
              </div>
            </div>
          )}

          {selectedInvoice.notes && (
            <div className="border-t border-dashed py-2 mb-3 text-xs font-mono">
              <p className="font-bold text-center mb-1 uppercase">Remarks / Payment Notes</p>
              <p className="text-[11px] text-gray-700">{selectedInvoice.notes}</p>
            </div>
          )}

          <div className="border-t border-b border-dashed py-2 mb-4">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-dashed text-gray-500">
                  <th className="text-left pb-1">Item Description</th>
                  <th className="text-center pb-1">Qty</th>
                  <th className="text-right pb-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="py-1">
                      <div>{item.name}</div>
                      <div className="text-[10px] text-gray-400">@{parseFloat(item.unit_price).toFixed(2)}</div>
                    </td>
                    <td className="text-center py-1">{item.quantity}</td>
                    <td className="text-right py-1">LKR.{parseFloat(item.line_total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-1.5 text-xs font-mono border-b border-dashed pb-3 mb-4 flex flex-col items-end">
            <div className="flex justify-between w-56 text-gray-500">
              <span>Subtotal:</span>
              <span>LKR.{parseFloat(selectedInvoice.total_amount || '0').toFixed(2)}</span>
            </div>
            {parseFloat(selectedInvoice.prescription_charges || '0') > 0 && (
              <div className="flex justify-between w-56 text-gray-600 font-semibold">
                <span>Rx Fee:</span>
                <span>LKR.{parseFloat(selectedInvoice.prescription_charges || '0').toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between w-56 font-bold border-t border-dashed pt-1 mt-1">
              <span>Grand Total:</span>
              <span>LKR.{parseFloat(selectedInvoice.net_amount || '0').toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-56 font-semibold text-emerald-700 border-t border-dashed pt-1 mt-1">
              <span>Advance Paid:</span>
              <span>LKR.{parseFloat(selectedInvoice.advance_amount || selectedInvoice.net_amount || '0').toFixed(2)}</span>
            </div>
            {parseFloat(selectedInvoice.balance_amount || '0') > 0 && (
              <div className="flex justify-between w-56 font-bold text-red-600">
                <span>Balance Due:</span>
                <span>LKR.{parseFloat(selectedInvoice.balance_amount || '0').toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between w-56 text-[10px] text-gray-400 mt-1">
              <span>Payment Type:</span>
              <span>{selectedInvoice.payment_method.toUpperCase()}</span>
            </div>
            <div className="flex justify-between w-56 text-[10px] font-bold">
              <span>Status:</span>
              <span>{selectedInvoice.payment_status.toUpperCase()}</span>
            </div>
          </div>

          <div className="text-center text-[10px] text-gray-400 mt-6 space-y-1">
            <p>Thank you for shopping with Lumen Opticals!</p>
            <p>Keep this receipt for lens warranty and balance collection.</p>
          </div>
        </div>
      )}
    </>
  );
}
