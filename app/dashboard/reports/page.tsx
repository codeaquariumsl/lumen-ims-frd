'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Download,
  FileSpreadsheet,
  Users,
  ShoppingBag,
  TrendingUp,
  Package,
  AlertTriangle,
  Layers,
  Search,
  RefreshCw,
  ArrowUpRight,
  Receipt,
  CheckCircle2,
  Clock,
  CreditCard,
  Banknote,
  QrCode,
  DollarSign
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import {
  formatLKR,
  formatDateStr,
  generateCustomerWiseSalesPDF,
  generateItemWiseSalesPDF,
  generateSalesSummaryPDF,
  generateStockSummaryPDF,
  generateLowStockPDF,
  generateCategoryStockValuationPDF,
  generatePaymentCollectionsPDF
} from '@/lib/pdf-reports';

export default function ReportsPage() {
  // Main Category: 'sales' | 'stock'
  const [mainTab, setMainTab] = useState<'sales' | 'stock'>('sales');

  // Sub-report selections
  const [salesSubTab, setSalesSubTab] = useState<'customer_wise' | 'item_wise' | 'sales_summary' | 'payment_collections'>('customer_wise');
  const [stockSubTab, setStockSubTab] = useState<'stock_summary' | 'low_stock' | 'category_valuation'>('stock_summary');

  // Filters
  const [dateRange, setDateRange] = useState('last30');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriesList, setCategoriesList] = useState<string[]>([]);

  // Report Data States
  const [isLoading, setIsLoading] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Sales Data
  const [customerSalesData, setCustomerSalesData] = useState<{ summary: any; records: any[] }>({ summary: {}, records: [] });
  const [itemSalesData, setItemSalesData] = useState<{ summary: any; records: any[] }>({ summary: {}, records: [] });
  const [salesSummaryData, setSalesSummaryData] = useState<{ summary: any; records: any[] }>({ summary: {}, records: [] });
  const [paymentCollectionsData, setPaymentCollectionsData] = useState<{ summary: any; records: any[] }>({ summary: {}, records: [] });

  // Stock Data
  const [stockSummaryData, setStockSummaryData] = useState<{ summary: any; records: any[] }>({ summary: {}, records: [] });
  const [lowStockData, setLowStockData] = useState<{ summary: any; records: any[] }>({ summary: {}, records: [] });
  const [categoryValuationData, setCategoryValuationData] = useState<{ summary: any; records: any[] }>({ summary: {}, records: [] });

  // Set default dates to last 30 days
  useEffect(() => {
    applyPresetRange('last30');
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const resp = await apiClient.get('/categories');
      if (resp.data?.data) {
        const catNames = Array.from(
          new Set(
            resp.data.data
              .map((c: any) => (c.name || c || '').trim())
              .filter((name: string) => Boolean(name))
          )
        ) as string[];
        setCategoriesList(catNames);
      }
    } catch {
      setCategoriesList(['Frames', 'Lenses', 'Contact Lenses', 'Sunglasses', 'Accessories', 'Solutions']);
    }
  };

  const applyPresetRange = (preset: string) => {
    setDateRange(preset);
    const end = new Date();
    const start = new Date();

    if (preset === 'today') {
      // today
    } else if (preset === 'yesterday') {
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
    } else if (preset === 'week') {
      start.setDate(start.getDate() - 7);
    } else if (preset === 'last30') {
      start.setDate(start.getDate() - 30);
    } else if (preset === 'thisMonth') {
      start.setDate(1);
    } else if (preset === 'lastMonth') {
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      end.setDate(0);
    } else if (preset === 'quarter') {
      start.setDate(start.getDate() - 90);
    } else if (preset === 'year') {
      start.setDate(start.getDate() - 365);
    } else {
      return;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const loadActiveReportData = async () => {
    try {
      setIsLoading(true);

      if (mainTab === 'sales') {
        if (salesSubTab === 'customer_wise') {
          const res = await apiClient.get('/reports/sales/customer-wise', {
            params: { startDate, endDate, search: searchQuery }
          });
          setCustomerSalesData(res.data?.data || { summary: {}, records: [] });
        } else if (salesSubTab === 'item_wise') {
          const res = await apiClient.get('/reports/sales/item-wise', {
            params: { startDate, endDate, category: selectedCategory, search: searchQuery }
          });
          setItemSalesData(res.data?.data || { summary: {}, records: [] });
        } else if (salesSubTab === 'sales_summary') {
          const res = await apiClient.get('/reports/sales/summary', {
            params: { startDate, endDate, search: searchQuery }
          });
          setSalesSummaryData(res.data?.data || { summary: {}, records: [] });
        } else if (salesSubTab === 'payment_collections') {
          const res = await apiClient.get('/reports/sales/payment-collections', {
            params: { startDate, endDate, paymentMethod: selectedPaymentMethod }
          });
          setPaymentCollectionsData(res.data?.data || { summary: {}, records: [] });
        }
      } else {
        if (stockSubTab === 'stock_summary') {
          const res = await apiClient.get('/reports/stock/summary', {
            params: { category: selectedCategory, search: searchQuery }
          });
          setStockSummaryData(res.data?.data || { summary: {}, records: [] });
        } else if (stockSubTab === 'low_stock') {
          const res = await apiClient.get('/reports/stock/low-stock', {
            params: { category: selectedCategory, search: searchQuery }
          });
          setLowStockData(res.data?.data || { summary: {}, records: [] });
        } else if (stockSubTab === 'category_valuation') {
          const res = await apiClient.get('/reports/stock/category-wise');
          setCategoryValuationData(res.data?.data || { summary: {}, records: [] });
        }
      }
    } catch (err: any) {
      console.error('Error loading report data:', err);
      toast.error('Failed to load report data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      loadActiveReportData();
    }
  }, [mainTab, salesSubTab, stockSubTab, startDate, endDate, selectedCategory, selectedPaymentMethod]);

  const handleApplyFilter = () => {
    loadActiveReportData();
  };

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      toast.info('Generating PDF report...');

      const filterMeta = {
        startDate,
        endDate,
        branchName: 'Main Practice Branch',
        category: selectedCategory !== 'all' ? selectedCategory : undefined
      };

      if (mainTab === 'sales') {
        if (salesSubTab === 'customer_wise') {
          generateCustomerWiseSalesPDF(customerSalesData.records, customerSalesData.summary, filterMeta);
        } else if (salesSubTab === 'item_wise') {
          generateItemWiseSalesPDF(itemSalesData.records, itemSalesData.summary, filterMeta);
        } else if (salesSubTab === 'sales_summary') {
          generateSalesSummaryPDF(salesSummaryData.records, salesSummaryData.summary, filterMeta);
        } else if (salesSubTab === 'payment_collections') {
          generatePaymentCollectionsPDF(paymentCollectionsData.records, paymentCollectionsData.summary, filterMeta);
        }
      } else {
        if (stockSubTab === 'stock_summary') {
          generateStockSummaryPDF(stockSummaryData.records, stockSummaryData.summary, filterMeta);
        } else if (stockSubTab === 'low_stock') {
          generateLowStockPDF(lowStockData.records, lowStockData.summary, filterMeta);
        } else if (stockSubTab === 'category_valuation') {
          generateCategoryStockValuationPDF(categoryValuationData.records, categoryValuationData.summary, filterMeta);
        }
      }

      toast.success('PDF report downloaded!');
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Failed to generate PDF.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportCSV = () => {
    try {
      let rows: any[] = [];
      let filename = 'Lumen_Report.csv';

      if (mainTab === 'sales') {
        if (salesSubTab === 'customer_wise') {
          filename = `Customer_Sales_${startDate}_${endDate}.csv`;
          rows = customerSalesData.records.map(r => ({
            'Customer Code': r.customer_code,
            'Customer Name': r.customer_name,
            'Phone': r.phone,
            'Total Invoices': r.total_invoices,
            'Total Sales (LKR)': r.total_net_amount,
            'Paid (LKR)': r.total_paid,
            'Balance (LKR)': r.total_balance,
            'Last Purchase Date': r.last_purchase_date
          }));
        } else if (salesSubTab === 'item_wise') {
          filename = `Item_Sales_${startDate}_${endDate}.csv`;
          rows = itemSalesData.records.map(r => ({
            'Product Code': r.product_code,
            'Product Name': r.product_name,
            'Category': r.category,
            'Quantity Sold': r.quantity_sold,
            'Avg Unit Price (LKR)': r.avg_unit_price,
            'Net Revenue (LKR)': r.total_revenue,
            'Gross Profit (LKR)': r.gross_profit
          }));
        } else if (salesSubTab === 'sales_summary') {
          filename = `Sales_Transactions_${startDate}_${endDate}.csv`;
          rows = salesSummaryData.records.map(r => ({
            'Invoice #': r.invoice_number,
            'Date': r.sale_date,
            'Customer': r.customer_name,
            'Net Amount (LKR)': r.net_amount,
            'Paid (LKR)': r.advance_amount,
            'Balance (LKR)': r.balance_amount,
            'Status': r.payment_status
          }));
        } else if (salesSubTab === 'payment_collections') {
          filename = `Payment_Daily_Collections_${startDate}_${endDate}.csv`;
          rows = paymentCollectionsData.records.map(r => ({
            'Collection Date': r.collection_date,
            'Total Invoices': r.total_invoices,
            'Cash Collected (LKR)': r.cash_collected,
            'Card Collected (LKR)': r.card_collected,
            'UPI / QR Collected (LKR)': r.upi_collected,
            'Cheque Collected (LKR)': r.cheque_collected,
            'Other Collected (LKR)': r.other_collected,
            'Total Collected (LKR)': r.total_collected,
            'Net Sales (LKR)': r.total_net_sales,
            'Balance Due (LKR)': r.total_balance
          }));
        }
      } else {
        if (stockSubTab === 'stock_summary') {
          filename = `Stock_Inventory_${new Date().toISOString().split('T')[0]}.csv`;
          rows = stockSummaryData.records.map(r => ({
            'Product Code': r.product_code,
            'Product Name': r.product_name,
            'Category': r.category,
            'Current Stock': r.current_stock,
            'Cost Price (LKR)': r.cost_price,
            'Selling Price (LKR)': r.selling_price,
            'Total Cost Value (LKR)': r.total_cost_value,
            'Status': r.stock_status
          }));
        } else if (stockSubTab === 'low_stock') {
          filename = `Low_Stock_Alerts_${new Date().toISOString().split('T')[0]}.csv`;
          rows = lowStockData.records.map(r => ({
            'Product Code': r.product_code,
            'Product Name': r.product_name,
            'Current Stock': r.current_stock,
            'Min Stock': r.min_stock,
            'Reorder Needed': r.reorder_needed,
            'Est. Cost (LKR)': r.estimated_reorder_cost
          }));
        } else if (stockSubTab === 'category_valuation') {
          filename = `Category_Valuation_${new Date().toISOString().split('T')[0]}.csv`;
          rows = categoryValuationData.records.map(r => ({
            'Category': r.category,
            'Total SKUs': r.total_skus,
            'Total Units': r.total_units,
            'Cost Value (LKR)': r.total_cost_value,
            'Retail Value (LKR)': r.total_retail_value,
            'Margin %': r.profit_margin_percentage
          }));
        }
      }

      if (rows.length === 0) {
        toast.warning('No data to export.');
        return;
      }

      const headers = Object.keys(rows[0]).join(',');
      const csvContent = [
        headers,
        ...rows.map(row => Object.values(row).map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV exported!');
    } catch (err) {
      console.error('Error exporting CSV:', err);
      toast.error('Failed to export CSV.');
    }
  };

  const filteredCustomerRecords = useMemo(() => {
    if (!searchQuery) return customerSalesData.records;
    const q = searchQuery.toLowerCase();
    return customerSalesData.records.filter(r =>
      r.customer_name?.toLowerCase().includes(q) ||
      r.customer_code?.toLowerCase().includes(q) ||
      r.phone?.toLowerCase().includes(q)
    );
  }, [customerSalesData.records, searchQuery]);

  const filteredItemRecords = useMemo(() => {
    if (!searchQuery) return itemSalesData.records;
    const q = searchQuery.toLowerCase();
    return itemSalesData.records.filter(r =>
      r.product_name?.toLowerCase().includes(q) ||
      r.product_code?.toLowerCase().includes(q) ||
      r.category?.toLowerCase().includes(q)
    );
  }, [itemSalesData.records, searchQuery]);

  const filteredSalesSummaryRecords = useMemo(() => {
    if (!searchQuery) return salesSummaryData.records;
    const q = searchQuery.toLowerCase();
    return salesSummaryData.records.filter(r =>
      r.invoice_number?.toLowerCase().includes(q) ||
      r.customer_name?.toLowerCase().includes(q) ||
      r.customer_phone?.toLowerCase().includes(q)
    );
  }, [salesSummaryData.records, searchQuery]);

  const filteredPaymentCollectionsRecords = useMemo(() => {
    if (!searchQuery) return paymentCollectionsData.records;
    const q = searchQuery.toLowerCase();
    return paymentCollectionsData.records.filter(r =>
      r.collection_date?.toLowerCase().includes(q)
    );
  }, [paymentCollectionsData.records, searchQuery]);

  const filteredStockSummaryRecords = useMemo(() => {
    if (!searchQuery) return stockSummaryData.records;
    const q = searchQuery.toLowerCase();
    return stockSummaryData.records.filter(r =>
      r.product_name?.toLowerCase().includes(q) ||
      r.product_code?.toLowerCase().includes(q) ||
      r.category?.toLowerCase().includes(q)
    );
  }, [stockSummaryData.records, searchQuery]);

  const filteredLowStockRecords = useMemo(() => {
    if (!searchQuery) return lowStockData.records;
    const q = searchQuery.toLowerCase();
    return lowStockData.records.filter(r =>
      r.product_name?.toLowerCase().includes(q) ||
      r.product_code?.toLowerCase().includes(q) ||
      r.category?.toLowerCase().includes(q)
    );
  }, [lowStockData.records, searchQuery]);

  return (
    <div className="space-y-3.5 pb-8 text-slate-800">
      {/* 1. COMPACT REPORT HEADER */}
      <div className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
            <Receipt className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">Reports & Analytics</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Sales reports & stock inventory intelligence</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="h-7 px-2.5 text-[11px] border-slate-200 hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
            disabled={isLoading}
          >
            <FileSpreadsheet className="h-3 w-3 mr-1 text-emerald-600" />
            CSV
          </Button>

          <Button
            size="sm"
            onClick={handleExportPDF}
            disabled={isLoading || isExportingPDF}
            className="h-7 px-2.5 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-2xs cursor-pointer"
          >
            {isExportingPDF ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-3 w-3 mr-1" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 2. COMPACT TABS NAVIGATION */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-lg">
          <button
            onClick={() => setMainTab('sales')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
              mainTab === 'sales'
                ? 'bg-white text-indigo-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <TrendingUp className="h-3 w-3" />
            Sales Reports
          </button>
          <button
            onClick={() => setMainTab('stock')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
              mainTab === 'stock'
                ? 'bg-white text-indigo-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Package className="h-3 w-3" />
            Stock Reports
          </button>
        </div>

        {/* Sub-Tabs Pills */}
        <div className="flex items-center gap-1">
          {mainTab === 'sales' ? (
            <>
              <button
                onClick={() => setSalesSubTab('customer_wise')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  salesSubTab === 'customer_wise'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Customer-Wise
              </button>
              <button
                onClick={() => setSalesSubTab('item_wise')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  salesSubTab === 'item_wise'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Item-Wise
              </button>
              <button
                onClick={() => setSalesSubTab('sales_summary')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  salesSubTab === 'sales_summary'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => setSalesSubTab('payment_collections')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  salesSubTab === 'payment_collections'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Daily Collections
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStockSubTab('stock_summary')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  stockSubTab === 'stock_summary'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Stock Valuation
              </button>
              <button
                onClick={() => setStockSubTab('low_stock')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  stockSubTab === 'low_stock'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Low Stock Alerts
              </button>
              <button
                onClick={() => setStockSubTab('category_valuation')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  stockSubTab === 'category_valuation'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Category Valuation
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3. COMPACT FILTER TOOLBAR */}
      <Card className="p-2.5 sm:p-3 bg-white border-slate-200/80 shadow-2xs rounded-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 items-end">
          {mainTab === 'sales' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Preset Period</label>
              <select
                value={dateRange}
                onChange={(e) => applyPresetRange(e.target.value)}
                className="w-full h-7 px-2 text-[11px] font-medium border border-slate-200 rounded-md bg-slate-50/50 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Last 7 Days</option>
                <option value="last30">Last 30 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="quarter">Last 90 Days</option>
                <option value="year">Last 1 Year</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          )}

          {mainTab === 'sales' && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDateRange('custom');
                  }}
                  className="h-7 text-[11px] border-slate-200"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDateRange('custom');
                  }}
                  className="h-7 text-[11px] border-slate-200"
                />
              </div>
            </>
          )}

          {(salesSubTab === 'item_wise' || mainTab === 'stock') && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-7 px-2 text-[11px] font-medium border border-slate-200 rounded-md bg-slate-50/50 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Categories</option>
                {categoriesList.map((cat, idx) => (
                  <option key={`${cat}-${idx}`} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          {salesSubTab === 'payment_collections' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payment Type</label>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="w-full h-7 px-2 text-[11px] font-medium border border-slate-200 rounded-md bg-slate-50/50 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Payment Types</option>
                <option value="cash">Cash Only</option>
                <option value="card">Card Only</option>
                <option value="upi">UPI / QR Only</option>
                <option value="cheque">Cheque Only</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Search Table</label>
            <div className="relative">
              <Search className="absolute left-2 top-2 h-3 w-3 text-slate-400" />
              <Input
                type="text"
                placeholder="Filter results..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 pl-7 text-[11px] border-slate-200"
              />
            </div>
          </div>

          <div>
            <Button
              size="sm"
              onClick={handleApplyFilter}
              disabled={isLoading}
              className="h-7 w-full bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold px-2 cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Apply
            </Button>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 1. SALES: CUSTOMER-WISE REPORT VIEW */}
      {/* ========================================================================= */}
      {mainTab === 'sales' && salesSubTab === 'customer_wise' && (
        <div className="space-y-3.5">
          {/* Customer Summary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">Active Customers</p>
                <span className="text-[10px] text-slate-400">In period</span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-slate-900">
                {(customerSalesData.summary?.totalCustomers || filteredCustomerRecords.length).toLocaleString()}
              </p>
            </Card>

            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">Total Invoices</p>
                <span className="text-[10px] text-slate-400">Issued</span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-slate-900">
                {(customerSalesData.summary?.totalInvoices || 0).toLocaleString()}
              </p>
            </Card>

            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">Total Net Sales</p>
                <span className="text-[10px] text-emerald-600 font-bold">Revenue</span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-emerald-600">
                {formatLKR(customerSalesData.summary?.totalSalesAmount || 0)}
              </p>
            </Card>

            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">Balance Due</p>
                <span className="text-[10px] text-amber-600 font-bold">Patient Credit</span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-amber-600">
                {formatLKR(customerSalesData.summary?.totalBalanceAmount || 0)}
              </p>
            </Card>
          </div>

          {/* Customer Table */}
          <Card className="bg-white border-slate-200/80 shadow-2xs overflow-hidden rounded-xl">
            <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Customer Sales Breakdown</h3>
              <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-[10px] py-0 px-1.5">
                {filteredCustomerRecords.length} Customers
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Code</th>
                    <th className="py-2 px-3">Customer Name</th>
                    <th className="py-2 px-3">Phone</th>
                    <th className="py-2 px-3 text-center">Invoices</th>
                    <th className="py-2 px-3 text-right">Net Sales</th>
                    <th className="py-2 px-3 text-right">Paid</th>
                    <th className="py-2 px-3 text-right">Balance Due</th>
                    <th className="py-2 px-3 text-center">Last Purchase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-[11px]">
                  {filteredCustomerRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400 font-medium">
                        No customer sales records found.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomerRecords.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-1.5 px-3 font-mono font-medium text-slate-500">{row.customer_code}</td>
                        <td className="py-1.5 px-3 font-semibold text-slate-900">{row.customer_name}</td>
                        <td className="py-1.5 px-3 text-slate-600">{row.phone || 'N/A'}</td>
                        <td className="py-1.5 px-3 text-center font-bold text-indigo-600">{row.total_invoices}</td>
                        <td className="py-1.5 px-3 text-right font-bold text-slate-900">{formatLKR(row.total_net_amount)}</td>
                        <td className="py-1.5 px-3 text-right text-emerald-600 font-medium">{formatLKR(row.total_paid)}</td>
                        <td className="py-1.5 px-3 text-right">
                          {parseFloat(row.total_balance || 0) > 0 ? (
                            <span className="inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              {formatLKR(row.total_balance)}
                            </span>
                          ) : (
                            <span className="text-slate-400">LKR 0.00</span>
                          )}
                        </td>
                        <td className="py-1.5 px-3 text-center text-slate-500">{formatDateStr(row.last_purchase_date)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SALES: ITEM-WISE REPORT VIEW */}
      {/* ========================================================================= */}
      {mainTab === 'sales' && salesSubTab === 'item_wise' && (
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">Products Sold</p>
                <span className="text-[10px] text-slate-400">SKUs</span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-slate-900">
                {(itemSalesData.summary?.totalUniqueItems || filteredItemRecords.length).toLocaleString()}
              </p>
            </Card>

            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">Units Sold</p>
                <span className="text-[10px] text-slate-400">Pieces</span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-slate-900">
                {(itemSalesData.summary?.totalQuantitySold || 0).toLocaleString()}
              </p>
            </Card>

            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">Net Revenue</p>
                <span className="text-[10px] text-emerald-600 font-bold">Sales</span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-emerald-600">
                {formatLKR(itemSalesData.summary?.totalRevenue || 0)}
              </p>
            </Card>

            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">Gross Margin</p>
                <span className="text-[9px] text-indigo-700 font-bold bg-indigo-50 px-1 rounded border border-indigo-100">
                  Profit: {formatLKR(itemSalesData.summary?.totalGrossProfit || 0)}
                </span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-indigo-600">
                {(itemSalesData.summary?.overallMargin || 0).toFixed(1)}%
              </p>
            </Card>
          </div>

          <Card className="bg-white border-slate-200/80 shadow-2xs overflow-hidden rounded-xl">
            <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Item-Wise Sales & Margin Performance</h3>
              <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-[10px] py-0 px-1.5">
                {filteredItemRecords.length} Products
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Item Code</th>
                    <th className="py-2 px-3">Product Name</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3 text-center">Units Sold</th>
                    <th className="py-2 px-3 text-right">Avg Unit Price</th>
                    <th className="py-2 px-3 text-right">Net Revenue</th>
                    <th className="py-2 px-3 text-right">Gross Profit</th>
                    <th className="py-2 px-3 text-center">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-[11px]">
                  {filteredItemRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400 font-medium">
                        No item sales records found.
                      </td>
                    </tr>
                  ) : (
                    filteredItemRecords.map((row, idx) => {
                      const rev = parseFloat(row.total_revenue || 0);
                      const profit = parseFloat(row.gross_profit || 0);
                      const marginPct = rev > 0 ? ((profit / rev) * 100).toFixed(1) : '0.0';

                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-1.5 px-3 font-mono font-medium text-slate-500">{row.product_code}</td>
                          <td className="py-1.5 px-3 font-semibold text-slate-900">{row.product_name}</td>
                          <td className="py-1.5 px-3 text-slate-600">{row.category}</td>
                          <td className="py-1.5 px-3 text-center font-bold text-indigo-600">{row.quantity_sold}</td>
                          <td className="py-1.5 px-3 text-right text-slate-600">{formatLKR(row.avg_unit_price)}</td>
                          <td className="py-1.5 px-3 text-right font-bold text-slate-900">{formatLKR(row.total_revenue)}</td>
                          <td className="py-1.5 px-3 text-right font-semibold text-emerald-600">{formatLKR(profit)}</td>
                          <td className="py-1.5 px-3 text-center font-bold text-slate-700">{marginPct}%</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SALES: SUMMARY TRANSACTIONS REPORT */}
      {/* ========================================================================= */}
      {mainTab === 'sales' && salesSubTab === 'sales_summary' && (
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">Invoices</p>
                <span className="text-[10px] text-slate-400">Total</span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-slate-900">
                {(salesSummaryData.summary?.totalOrders || filteredSalesSummaryRecords.length).toLocaleString()}
              </p>
            </Card>

            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">Net Sales</p>
                <span className="text-[10px] text-emerald-600 font-bold">Revenue</span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-emerald-600">
                {formatLKR(salesSummaryData.summary?.totalNetSales || 0)}
              </p>
            </Card>

            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">Collected</p>
                <span className="text-[10px] text-indigo-600 font-bold">Receipts</span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-indigo-600">
                {formatLKR(salesSummaryData.summary?.totalCollected || 0)}
              </p>
            </Card>

            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">Outstanding</p>
                <span className="text-[10px] text-amber-600 font-bold">Dues</span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-amber-600">
                {formatLKR(salesSummaryData.summary?.totalOutstanding || 0)}
              </p>
            </Card>
          </div>

          <Card className="bg-white border-slate-200/80 shadow-2xs overflow-hidden rounded-xl">
            <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Sales Transactions List</h3>
              <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-[10px] py-0 px-1.5">
                {filteredSalesSummaryRecords.length} Invoices
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Invoice #</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Customer</th>
                    <th className="py-2 px-3 text-right">Net Amount</th>
                    <th className="py-2 px-3 text-right">Paid</th>
                    <th className="py-2 px-3 text-right">Balance</th>
                    <th className="py-2 px-3 text-center">Method</th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-[11px]">
                  {filteredSalesSummaryRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400 font-medium">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    filteredSalesSummaryRecords.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-1.5 px-3 font-mono font-bold text-indigo-600">{row.invoice_number}</td>
                        <td className="py-1.5 px-3 text-slate-500">{formatDateStr(row.sale_date)}</td>
                        <td className="py-1.5 px-3 font-medium text-slate-900">{row.customer_name}</td>
                        <td className="py-1.5 px-3 text-right font-bold text-slate-900">{formatLKR(row.net_amount)}</td>
                        <td className="py-1.5 px-3 text-right text-emerald-600 font-medium">{formatLKR(row.advance_amount)}</td>
                        <td className="py-1.5 px-3 text-right font-medium text-amber-600">
                          {parseFloat(row.balance_amount || 0) > 0 ? formatLKR(row.balance_amount) : 'LKR 0.00'}
                        </td>
                        <td className="py-1.5 px-3 text-center">
                          <span className="inline-flex px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-700 uppercase">
                            {row.payment_method || 'cash'}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-center">
                          <span
                            className={`inline-flex px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                              row.payment_status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {(row.payment_status || 'completed').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SALES: PAYMENT TYPE WISE DAILY COLLECTIONS REPORT VIEW */}
      {/* ========================================================================= */}
      {mainTab === 'sales' && salesSubTab === 'payment_collections' && (
        <div className="space-y-3.5">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">Total Collections</p>
                <span className="text-[10px] text-emerald-600 font-bold">
                  {paymentCollectionsData.summary?.totalDays || 0} Days
                </span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-emerald-600">
                {formatLKR(paymentCollectionsData.summary?.totalCollected || 0)}
              </p>
            </Card>

            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">Cash Collections</p>
                <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1 rounded border border-emerald-100">
                  Cash
                </span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-slate-900">
                {formatLKR(paymentCollectionsData.summary?.totalCash || 0)}
              </p>
            </Card>

            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">Card Collections</p>
                <span className="text-[9px] text-blue-700 font-bold bg-blue-50 px-1 rounded border border-blue-100">
                  Card
                </span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-slate-900">
                {formatLKR(paymentCollectionsData.summary?.totalCard || 0)}
              </p>
            </Card>

            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">UPI / QR / Other</p>
                <span className="text-[9px] text-indigo-700 font-bold bg-indigo-50 px-1 rounded border border-indigo-100">
                  Digital & Other
                </span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-indigo-600">
                {formatLKR(
                  (paymentCollectionsData.summary?.totalUpi || 0) +
                  (paymentCollectionsData.summary?.totalCheque || 0) +
                  (paymentCollectionsData.summary?.totalOther || 0)
                )}
              </p>
            </Card>
          </div>

          {/* Visual Analytics / Recharts Section */}
          {paymentCollectionsData.records && paymentCollectionsData.records.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
              {/* Daily Trend Bar Chart */}
              <Card className="lg:col-span-2 p-3 bg-white border-slate-200/80 shadow-2xs rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Daily Collections by Payment Type</h4>
                  <span className="text-[10px] text-slate-400">Values in LKR</span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[...paymentCollectionsData.records].reverse().slice(-14).map(r => ({
                        date: formatDateStr(r.collection_date),
                        Cash: parseFloat(r.cash_collected || 0),
                        Card: parseFloat(r.card_collected || 0),
                        'UPI/Online': parseFloat(r.upi_collected || 0) + parseFloat(r.cheque_collected || 0) + parseFloat(r.other_collected || 0)
                      }))}
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: any) => [`LKR ${Number(value || 0).toLocaleString()}`, '']}
                        contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                      <Bar dataKey="Cash" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Card" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="UPI/Online" stackId="a" fill="#6366F1" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Payment Methods Distribution Pie Chart */}
              <Card className="p-3 bg-white border-slate-200/80 shadow-2xs rounded-xl flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Method Share</h4>
                  <span className="text-[10px] text-slate-400">Total Net Collections</span>
                </div>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentCollectionsData.summary?.paymentMethodsDistribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {(paymentCollectionsData.summary?.paymentMethodsDistribution || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color || '#6366F1'} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [`LKR ${Number(value || 0).toLocaleString()}`, '']}
                        contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-1 pt-1 border-t border-slate-100 text-[10px]">
                  {(paymentCollectionsData.summary?.paymentMethodsDistribution || []).map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600 font-medium">{item.name}:</span>
                      <span className="font-bold text-slate-900">{formatLKR(item.value)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Detailed Daily Collections Table */}
          <Card className="bg-white border-slate-200/80 shadow-2xs overflow-hidden rounded-xl">
            <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Payment Type-Wise Daily Collections Breakdown</h3>
              <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-[10px] py-0 px-1.5">
                {filteredPaymentCollectionsRecords.length} Days
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3 text-center">Invoices</th>
                    <th className="py-2 px-3 text-right">Cash</th>
                    <th className="py-2 px-3 text-right">Card</th>
                    <th className="py-2 px-3 text-right">UPI / QR</th>
                    <th className="py-2 px-3 text-right">Cheque</th>
                    <th className="py-2 px-3 text-right">Other</th>
                    <th className="py-2 px-3 text-right font-bold text-slate-900">Total Collected</th>
                    <th className="py-2 px-3 text-right">Net Sales</th>
                    <th className="py-2 px-3 text-right">Balance Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-[11px]">
                  {filteredPaymentCollectionsRecords.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-6 text-center text-slate-400 font-medium">
                        No daily collection records found for the selected period.
                      </td>
                    </tr>
                  ) : (
                    filteredPaymentCollectionsRecords.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2 px-3 font-semibold text-slate-900">{formatDateStr(row.collection_date)}</td>
                        <td className="py-2 px-3 text-center font-bold text-indigo-600">{row.total_invoices}</td>
                        <td className="py-2 px-3 text-right text-emerald-600 font-medium">{formatLKR(row.cash_collected)}</td>
                        <td className="py-2 px-3 text-right text-blue-600 font-medium">{formatLKR(row.card_collected)}</td>
                        <td className="py-2 px-3 text-right text-indigo-600 font-medium">{formatLKR(row.upi_collected)}</td>
                        <td className="py-2 px-3 text-right text-purple-600 font-medium">{formatLKR(row.cheque_collected)}</td>
                        <td className="py-2 px-3 text-right text-amber-600 font-medium">{formatLKR(row.other_collected)}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-700 bg-emerald-50/30">{formatLKR(row.total_collected)}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">{formatLKR(row.total_net_sales)}</td>
                        <td className="py-2 px-3 text-right">
                          {parseFloat(row.total_balance || 0) > 0 ? (
                            <span className="inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              {formatLKR(row.total_balance)}
                            </span>
                          ) : (
                            <span className="text-slate-400">LKR 0.00</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredPaymentCollectionsRecords.length > 0 && (
                  <tfoot className="bg-slate-100/80 font-bold border-t border-slate-300 text-slate-900 text-[11px]">
                    <tr>
                      <td className="py-2.5 px-3 uppercase tracking-wider">Total</td>
                      <td className="py-2.5 px-3 text-center text-indigo-700">
                        {paymentCollectionsData.summary?.totalInvoices || 0}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-700">
                        {formatLKR(paymentCollectionsData.summary?.totalCash || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-blue-700">
                        {formatLKR(paymentCollectionsData.summary?.totalCard || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-indigo-700">
                        {formatLKR(paymentCollectionsData.summary?.totalUpi || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-purple-700">
                        {formatLKR(paymentCollectionsData.summary?.totalCheque || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-700">
                        {formatLKR(paymentCollectionsData.summary?.totalOther || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-800 bg-emerald-100/50">
                        {formatLKR(paymentCollectionsData.summary?.totalCollected || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-900">
                        {formatLKR(paymentCollectionsData.summary?.totalNetSales || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-700">
                        {formatLKR(paymentCollectionsData.summary?.totalBalance || 0)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. STOCK: CURRENT STOCK VALUATION REPORT */}
      {/* ========================================================================= */}
      {mainTab === 'stock' && stockSubTab === 'stock_summary' && (
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">Products (SKUs)</p>
                <span className="text-[10px] text-slate-400">Catalog</span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-slate-900">
                {(stockSummaryData.summary?.totalProducts || filteredStockSummaryRecords.length).toLocaleString()}
              </p>
            </Card>

            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">In-Stock Units</p>
                <span className="text-[10px] text-slate-400">Inventory</span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-slate-900">
                {(stockSummaryData.summary?.totalUnits || 0).toLocaleString()}
              </p>
            </Card>

            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">Stock Cost Value</p>
                <span className="text-[10px] text-indigo-600 font-bold">Asset Cost</span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-indigo-600">
                {formatLKR(stockSummaryData.summary?.totalCostValue || 0)}
              </p>
            </Card>

            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">Stock Retail Value</p>
                <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1 rounded border border-emerald-100">
                  Exp: {formatLKR(stockSummaryData.summary?.potentialProfit || 0)}
                </span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-emerald-600">
                {formatLKR(stockSummaryData.summary?.totalRetailValue || 0)}
              </p>
            </Card>
          </div>

          <Card className="bg-white border-slate-200/80 shadow-2xs overflow-hidden rounded-xl">
            <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Product Stock Valuation & Status</h3>
              <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-[10px] py-0 px-1.5">
                {filteredStockSummaryRecords.length} Products
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Code</th>
                    <th className="py-2 px-3">Product Name</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3 text-center">On Hand</th>
                    <th className="py-2 px-3 text-center">Min Level</th>
                    <th className="py-2 px-3 text-right">Cost Price</th>
                    <th className="py-2 px-3 text-right">Selling Price</th>
                    <th className="py-2 px-3 text-right">Total Cost Value</th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-[11px]">
                  {filteredStockSummaryRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-slate-400 font-medium">
                        No stock records matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStockSummaryRecords.map((row, idx) => {
                      const qty = parseInt(row.current_stock || 0);
                      const min = parseInt(row.min_stock || 0);

                      let badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      let statusText = 'IN STOCK';
                      if (qty <= 0) {
                        badgeBg = 'bg-rose-50 text-rose-700 border-rose-200';
                        statusText = 'OUT OF STOCK';
                      } else if (qty <= min) {
                        badgeBg = 'bg-amber-50 text-amber-700 border-amber-200';
                        statusText = 'LOW STOCK';
                      }

                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-1.5 px-3 font-mono font-medium text-slate-500">{row.product_code}</td>
                          <td className="py-1.5 px-3 font-semibold text-slate-900">{row.product_name}</td>
                          <td className="py-1.5 px-3 text-slate-600">{row.category}</td>
                          <td className="py-1.5 px-3 text-center font-bold text-slate-900">{qty}</td>
                          <td className="py-1.5 px-3 text-center text-slate-400">{min}</td>
                          <td className="py-1.5 px-3 text-right text-slate-600">{formatLKR(row.cost_price)}</td>
                          <td className="py-1.5 px-3 text-right text-slate-900 font-medium">{formatLKR(row.selling_price)}</td>
                          <td className="py-1.5 px-3 text-right font-bold text-indigo-600">{formatLKR(row.total_cost_value)}</td>
                          <td className="py-1.5 px-3 text-center">
                            <span className={`inline-flex px-1.5 py-0.2 rounded text-[9px] font-bold border ${badgeBg}`}>
                              {statusText}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. STOCK: LOW STOCK & REORDER ALERTS REPORT */}
      {/* ========================================================================= */}
      {mainTab === 'stock' && stockSubTab === 'low_stock' && (
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">Low Stock SKUs</p>
                <span className="text-[10px] text-amber-600 font-bold">Alerts</span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-amber-600">
                {(lowStockData.summary?.totalLowStockSkus || filteredLowStockRecords.length).toLocaleString()}
              </p>
            </Card>

            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">Critical 0 Qty</p>
                <span className="text-[10px] text-rose-600 font-bold">Out of Stock</span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-rose-600">
                {(lowStockData.summary?.criticalCount || 0).toLocaleString()}
              </p>
            </Card>

            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">Units Needed</p>
                <span className="text-[10px] text-slate-400">Deficit</span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-slate-900">
                {(lowStockData.summary?.totalUnitsToReorder || 0).toLocaleString()}
              </p>
            </Card>

            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">Est. Restock Cost</p>
                <span className="text-[10px] text-indigo-600 font-bold">Est. PO</span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-indigo-600">
                {formatLKR(lowStockData.summary?.totalEstimatedReorderCost || 0)}
              </p>
            </Card>
          </div>

          <Card className="bg-white border-slate-200/80 shadow-2xs overflow-hidden rounded-xl">
            <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-rose-50/40">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Low Stock & Reorder Checklist</h3>
              <Badge variant="secondary" className="bg-rose-100 text-rose-700 text-[10px] py-0 px-1.5">
                {filteredLowStockRecords.length} Alerts
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-rose-50/50 text-slate-700 font-semibold border-b border-rose-100 text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Item Code</th>
                    <th className="py-2 px-3">Product Name</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3 text-center">Current Qty</th>
                    <th className="py-2 px-3 text-center">Min Level</th>
                    <th className="py-2 px-3 text-center">Reorder Needed</th>
                    <th className="py-2 px-3 text-right">Unit Cost</th>
                    <th className="py-2 px-3 text-right">Est. Reorder Cost</th>
                    <th className="py-2 px-3 text-center">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-[11px]">
                  {filteredLowStockRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-emerald-600 font-medium">
                        All inventory is currently above minimum stock levels!
                      </td>
                    </tr>
                  ) : (
                    filteredLowStockRecords.map((row, idx) => {
                      const qty = parseInt(row.current_stock || 0);
                      const isCritical = qty <= 0;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-1.5 px-3 font-mono font-medium text-slate-500">{row.product_code}</td>
                          <td className="py-1.5 px-3 font-semibold text-slate-900">{row.product_name}</td>
                          <td className="py-1.5 px-3 text-slate-600">{row.category}</td>
                          <td className="py-1.5 px-3 text-center font-bold text-rose-600">{qty}</td>
                          <td className="py-1.5 px-3 text-center text-slate-400">{row.min_stock}</td>
                          <td className="py-1.5 px-3 text-center font-bold text-indigo-600">{row.reorder_needed}</td>
                          <td className="py-1.5 px-3 text-right text-slate-600">{formatLKR(row.cost_price)}</td>
                          <td className="py-1.5 px-3 text-right font-bold text-slate-900">{formatLKR(row.estimated_reorder_cost)}</td>
                          <td className="py-1.5 px-3 text-center">
                            <span
                              className={`inline-flex px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                                isCritical
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {isCritical ? 'CRITICAL' : 'LOW STOCK'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. STOCK: CATEGORY VALUATION REPORT */}
      {/* ========================================================================= */}
      {mainTab === 'stock' && stockSubTab === 'category_valuation' && (
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">Categories</p>
                <span className="text-[10px] text-slate-400">Groups</span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-slate-900">
                {(categoryValuationData.summary?.totalCategories || categoryValuationData.records.length).toLocaleString()}
              </p>
            </Card>

            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">Total SKUs</p>
                <span className="text-[10px] text-slate-400">Lines</span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-slate-900">
                {(categoryValuationData.summary?.totalSkus || 0).toLocaleString()}
              </p>
            </Card>

            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">Total Cost Value</p>
                <span className="text-[10px] text-indigo-600 font-bold">Cost</span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-indigo-600">
                {formatLKR(categoryValuationData.summary?.totalCostValue || 0)}
              </p>
            </Card>

            <Card className="py-1.5 px-2.5 bg-white border-slate-200/80 shadow-2xs rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-slate-500">Potential Profit</p>
                <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1 rounded border border-emerald-100">
                  Margin: {(categoryValuationData.summary?.averageMargin || 0).toFixed(1)}%
                </span>
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-emerald-600">
                {formatLKR(categoryValuationData.summary?.totalPotentialProfit || 0)}
              </p>
            </Card>
          </div>

          <Card className="bg-white border-slate-200/80 shadow-2xs overflow-hidden rounded-xl">
            <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Category Valuation Breakdown</h3>
              <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-[10px] py-0 px-1.5">
                {categoryValuationData.records.length} Categories
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Category Name</th>
                    <th className="py-2 px-3 text-center">Total SKUs</th>
                    <th className="py-2 px-3 text-center">In-Stock Units</th>
                    <th className="py-2 px-3 text-right">Total Cost Value</th>
                    <th className="py-2 px-3 text-right">Total Retail Value</th>
                    <th className="py-2 px-3 text-right">Potential Profit</th>
                    <th className="py-2 px-3 text-center">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-[11px]">
                  {categoryValuationData.records.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400 font-medium">
                        No category valuation data.
                      </td>
                    </tr>
                  ) : (
                    categoryValuationData.records.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-1.5 px-3 font-semibold text-slate-900">{row.category}</td>
                        <td className="py-1.5 px-3 text-center text-slate-600">{row.total_skus}</td>
                        <td className="py-1.5 px-3 text-center font-bold text-indigo-600">{row.total_units}</td>
                        <td className="py-1.5 px-3 text-right font-medium text-slate-700">{formatLKR(row.total_cost_value)}</td>
                        <td className="py-1.5 px-3 text-right font-semibold text-slate-900">{formatLKR(row.total_retail_value)}</td>
                        <td className="py-1.5 px-3 text-right font-bold text-emerald-600">{formatLKR(row.potential_profit)}</td>
                        <td className="py-1.5 px-3 text-center font-bold text-slate-700">{row.profit_margin_percentage}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
