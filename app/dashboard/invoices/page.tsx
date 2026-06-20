'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Calendar, Eye, Printer, X, Receipt, Building } from 'lucide-react';
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
  staff_id: number;
  invoice_number: string;
  total_amount: string;
  tax_amount: string;
  discount_amount: string;
  net_amount: string;
  payment_method: string;
  payment_status: string;
  notes: string | null;
  sale_date: string;
  first_name: string | null;
  last_name: string | null;
  staff_name: string;
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

    const formatted = method.toUpperCase();
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[method.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {formatted}
      </span>
    );
  };

  return (
    <>
      {/* 1. Main Page Content (Hidden when printing) */}
      <div className="space-y-6 print:hidden">
        {/* Header with Blue-to-Violet Gradient */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-100 via-indigo-100 to-violet-100 p-8 shadow-md border border-blue-200">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-indigo-600 p-3 text-white shadow-lg shadow-indigo-200">
              <Receipt size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-700 to-violet-700 bg-clip-text text-transparent">
                Sales Invoices
              </h1>
              <p className="mt-1 text-indigo-700 font-medium">Review customer invoices, filter histories, and print receipts</p>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        <Card className="p-6 bg-white border border-gray-100 shadow-sm">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search Invoice # or Customer..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 h-11 border-gray-200 focus-visible:ring-indigo-500 rounded-lg"
              />
            </div>

            {/* Start Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-3.5 text-gray-400 pointer-events-none" size={18} />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 h-11 border-gray-200 focus-visible:ring-indigo-500 rounded-lg text-gray-600"
              />
            </div>

            {/* End Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-3.5 text-gray-400 pointer-events-none" size={18} />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 h-11 border-gray-200 focus-visible:ring-indigo-500 rounded-lg text-gray-600"
              />
            </div>

            {/* Branch Filter (Admin Only) */}
            {user?.role === 'admin' ? (
              <div className="relative">
                <Building className="absolute left-3 top-3.5 text-gray-400 pointer-events-none" size={18} />
                <select
                  value={selectedBranch}
                  onChange={(e) => {
                    setSelectedBranch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 h-11 border border-gray-200 rounded-lg bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
              <div className="flex items-center text-sm text-gray-500 px-3 bg-gray-50 border border-gray-200 rounded-lg h-11">
                <span>Branch Filter Restricted</span>
              </div>
            )}
          </div>
        </Card>

        {/* Invoices Table Card */}
        <Card className="overflow-hidden border border-gray-100 shadow-sm rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4 text-left">Invoice No</th>
                  <th className="px-6 py-4 text-left">Date</th>
                  <th className="px-6 py-4 text-left">Customer</th>
                  <th className="px-6 py-4 text-left">Staff/Cashier</th>
                  <th className="px-6 py-4 text-left">Payment</th>
                  <th className="px-6 py-4 text-right">Net Amount</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                        <span>Loading invoices...</span>
                      </div>
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="font-medium">No Invoices Found</span>
                        <span className="text-xs text-gray-400">Try adjusting your filters or search queries.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice, idx) => (
                    <tr
                      key={invoice.id}
                      className={`hover:bg-indigo-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
                    >
                      <td className="px-6 py-4 font-semibold text-gray-900">{invoice.invoice_number}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(invoice.sale_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        {invoice.first_name ? (
                          <div>
                            <p className="font-medium text-gray-800">
                              {invoice.first_name} {invoice.last_name || ''}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Walk-in Customer</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{invoice.staff_name}</td>
                      <td className="px-6 py-4">{getPaymentMethodBadge(invoice.payment_method)}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        LKR.{parseFloat(invoice.net_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg gap-1.5 shadow-sm"
                            onClick={() => handleViewDetails(invoice)}
                          >
                            <Eye size={14} />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg gap-1.5"
                            onClick={() => handleViewDetails(invoice).then(() => setTimeout(() => window.print(), 300))}
                          >
                            <Printer size={14} />
                            Print
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
          <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
            <p className="text-xs text-gray-500 font-medium">
              Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} invoices
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-9 rounded-lg"
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
                    className={`h-9 w-9 rounded-lg ${currentPage === page ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-9 rounded-lg"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Details Modal Overlay Dialog (Sleek Glassmorphic Backdrop) */}
      {isDetailOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
          <Card className="w-full max-w-2xl bg-white border border-gray-200 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-700 to-violet-700 text-white flex justify-between items-center shadow-md">
              <div className="flex items-center gap-2">
                <Receipt size={20} />
                <h3 className="font-bold text-lg">Invoice Details</h3>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isDetailLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                  <span className="text-gray-500 font-medium">Fetching details...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Columns */}
                  <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Invoice Meta</p>
                      <p className="font-semibold text-gray-900 mt-1">{selectedInvoice.invoice_number}</p>
                      <p className="text-gray-600 text-xs mt-0.5">
                        Date: {new Date(selectedInvoice.sale_date).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Customer Info</p>
                      {selectedInvoice.first_name ? (
                        <p className="font-semibold text-gray-900 mt-1">
                          {selectedInvoice.first_name} {selectedInvoice.last_name || ''}
                        </p>
                      ) : (
                        <p className="text-gray-500 italic mt-1">Walk-in Customer</p>
                      )}
                      <p className="text-gray-600 text-xs mt-0.5">
                        Cashier: {selectedInvoice.staff_name}
                      </p>
                    </div>
                  </div>

                  {/* Purchased Items Table */}
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm mb-3">Purchased Items</h4>
                    <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-gray-600 font-semibold text-xs border-b border-gray-100">
                            <th className="px-4 py-3 text-left">Product / Code</th>
                            <th className="px-4 py-3 text-center">Qty</th>
                            <th className="px-4 py-3 text-right">Unit Price</th>
                            <th className="px-4 py-3 text-right">Discount</th>
                            <th className="px-4 py-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedInvoice.items?.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/50">
                              <td className="px-4 py-3">
                                <p className="font-medium text-gray-800">{item.name}</p>
                                <p className="text-xs text-gray-400 font-mono mt-0.5">{item.code}</p>
                              </td>
                              <td className="px-4 py-3 text-center font-medium">{item.quantity}</td>
                              <td className="px-4 py-3 text-right text-gray-600">
                                LKR.{parseFloat(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-600">
                                {parseFloat(item.discount_percentage) > 0 ? `${parseFloat(item.discount_percentage)}%` : '-'}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-gray-900">
                                LKR.{parseFloat(item.line_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Total Breakdowns */}
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal:</span>
                        <span>LKR.{parseFloat(selectedInvoice.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Tax Amount:</span>
                        <span>LKR.{parseFloat(selectedInvoice.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Discount:</span>
                        <span>-LKR.{parseFloat(selectedInvoice.discount_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-100 pt-2 mt-1">
                        <span>Grand Total:</span>
                        <span className="text-indigo-600">LKR.{parseFloat(selectedInvoice.net_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 font-semibold uppercase tracking-wider pt-2">
                        <span>Payment Method:</span>
                        <span className="text-gray-900">{selectedInvoice.payment_method.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <Button
                variant="outline"
                className="border-gray-200 text-gray-700 hover:bg-gray-100 rounded-lg h-10"
                onClick={() => setIsDetailOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={handlePrint}
                disabled={isDetailLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-10 gap-1.5 shadow-sm"
              >
                <Printer size={16} />
                Print Invoice
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
            <p className="text-xs text-gray-500">Colombo, Sri Lanka</p>
            <p className="text-xs">Phone: +94 11 234 5678</p>
            <p className="text-xs text-gray-400 font-mono mt-2">SALES RECEIPT</p>
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
            <div className="flex justify-between w-48 text-gray-500">
              <span>Subtotal:</span>
              <span>LKR.{parseFloat(selectedInvoice.total_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-48 text-gray-500">
              <span>Tax (5%):</span>
              <span>LKR.{parseFloat(selectedInvoice.tax_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-48 text-gray-500">
              <span>Discount:</span>
              <span>-LKR.{parseFloat(selectedInvoice.discount_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-48 font-bold border-t border-dashed pt-1 mt-1">
              <span>Grand Total:</span>
              <span>LKR.{parseFloat(selectedInvoice.net_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-48 text-[10px] text-gray-400 mt-1">
              <span>Payment Type:</span>
              <span>{selectedInvoice.payment_method.toUpperCase()}</span>
            </div>
          </div>

          <div className="text-center text-[10px] text-gray-400 mt-6 space-y-1">
            <p>Thank you for shopping with Lumen Opticals!</p>
            <p>Keep this receipt for lens warranty checks.</p>
          </div>
        </div>
      )}
    </>
  );
}
