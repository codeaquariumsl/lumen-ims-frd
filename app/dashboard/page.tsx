'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ShoppingCart, Users, Package, TrendingUp, Activity, Target, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';

const COLORS = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8'];

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<any>({
    totalRevenue: 0,
    totalSalesCount: 0,
    totalCustomers: 0,
    lowStockCount: 0,
    activeLabOrders: 0
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [salesTrends, setSalesTrends] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [monthlyMetrics, setMonthlyMetrics] = useState<any[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<any[]>([]);
  const [customerSegmentation, setCustomerSegmentation] = useState<any[]>([]);
  const [productPerformance, setProductPerformance] = useState<any[]>([]);
  const [summaryStats, setSummaryStats] = useState<any>({
    totalTransactions: 0,
    avgBasketSize: 0,
    conversionRate: 0,
    repeatCustomerRate: 0,
    customerLifetimeValue: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardAndAnalytics = async () => {
      try {
        setIsLoading(true);
        const [dashResp, chartsResp] = await Promise.all([
          apiClient.get('/analytics/dashboard'),
          apiClient.get('/analytics/charts')
        ]);

        if (dashResp.data?.success && dashResp.data.data) {
          const { summary: sumData, recentSales: salesList } = dashResp.data.data;
          setSummary(sumData);
          setRecentSales(salesList);
        }

        if (chartsResp.data?.success && chartsResp.data.data) {
          const d = chartsResp.data.data;
          setSalesTrends(d.salesTrends || []);
          setMonthlyMetrics(d.monthlyMetrics || []);
          setWeeklyActivity(d.weeklyActivity || []);
          setCustomerSegmentation(d.customerSegmentation || []);
          setProductPerformance(d.productPerformance || []);
          setSummaryStats(d.summaryStats || {
            totalTransactions: 0,
            avgBasketSize: 0,
            conversionRate: 0,
            repeatCustomerRate: 0,
            customerLifetimeValue: 0
          });

          const categoryList = d.categoryPerformance || [];
          const totalVal = categoryList.reduce((sum: number, item: any) => sum + parseFloat(item.value || '0'), 0);
          const formattedCategories = categoryList.map((item: any) => ({
            name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
            value: totalVal > 0 ? Math.round((parseFloat(item.value || '0') / totalVal) * 100) : 0
          }));
          setCategoryData(formattedCategories.length > 0 ? formattedCategories : []);
        }
      } catch (error) {
        console.error('Error loading dashboard & analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardAndAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-500 text-sm font-medium animate-pulse">Loading dashboard metrics...</div>
      </div>
    );
  }

  // Monthly metrics calculations
  const currentMonthData = monthlyMetrics[monthlyMetrics.length - 1] || { revenue: 0, profit: 0, customers: 0 };
  const prevMonthData = monthlyMetrics[monthlyMetrics.length - 2] || { revenue: 0, profit: 0, customers: 0 };

  const monthlyRevenue = currentMonthData.revenue || 0;
  const monthlyProfit = currentMonthData.profit || 0;

  const revDiff = monthlyRevenue - prevMonthData.revenue;
  const percentageGrowth = prevMonthData.revenue > 0 ? (revDiff / prevMonthData.revenue) * 100 : 0;
  const profitMargin = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0;

  return (
    <div className="space-y-5">
      {/* Header Section - Modern Compact Slate Theme */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">Unified command center and business intelligence metrics</p>
        </div>
      </div>

      {/* KPI Cards (Advanced Business Intelligence) */}
      <div>
        <h2 className="mb-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">Advanced Performance KPIs</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4 border-l-4 border-l-indigo-600 border border-slate-200 bg-white shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Revenue</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  LKR.{monthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="mt-1 text-xs text-emerald-600 font-medium">
                  {percentageGrowth >= 0 ? '+' : ''}{percentageGrowth.toFixed(1)}% vs last month
                </p>
              </div>
              <Activity size={22} className="text-indigo-600" />
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-emerald-600 border border-slate-200 bg-white shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Profit</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  LKR.{monthlyProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="mt-1 text-xs text-emerald-600 font-medium">
                  {profitMargin.toFixed(0)}% profit margin
                </p>
              </div>
              <Target size={22} className="text-emerald-600" />
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-blue-600 border border-slate-200 bg-white shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Customers</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {summary.totalCustomers.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-emerald-600 font-medium">
                  +{currentMonthData.customers || 0} new this month
                </p>
              </div>
              <Users size={22} className="text-blue-600" />
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-purple-600 border border-slate-200 bg-white shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg. Transaction</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  LKR.{summaryStats.avgBasketSize.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  based on {summaryStats.totalTransactions} sales
                </p>
              </div>
              <TrendingUp size={22} className="text-purple-600" />
            </div>
          </Card>
        </div>
      </div>

      {/* Operational Highlights (Summary counts) */}
      <div>
        <h2 className="mb-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">Operational Highlights</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4 border border-slate-200 bg-white shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Revenue</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  LKR.{summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="mt-1 text-xs text-slate-500">{summary.totalSalesCount} receipts</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-2.5">
                <ShoppingCart size={20} className="text-slate-700" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border border-slate-200 bg-white shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Patients</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{summary.totalCustomers}</p>
                <p className="mt-1 text-xs text-slate-500">Registered patients</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-2.5">
                <Users size={20} className="text-slate-700" />
              </div>
            </div>
          </Card>

          <Card className={`p-4 border border-slate-200 bg-white shadow-sm rounded-xl ${summary.lowStockCount > 0 ? 'border-l-4 border-l-amber-500' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Warning</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{summary.lowStockCount}</p>
                <p className="mt-1 text-xs text-amber-600">Below minimum stock</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-2.5">
                <Package size={20} className="text-amber-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border border-slate-200 bg-white shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Lab Orders</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{summary.activeLabOrders}</p>
                <p className="mt-1 text-xs text-indigo-600">In progress</p>
              </div>
              <div className="rounded-lg bg-indigo-50 p-2.5">
                <TrendingUp size={20} className="text-indigo-600" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue & Profit Area Chart */}
        <Card className="p-4 border border-slate-200 shadow-sm rounded-xl bg-white">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-4">Revenue & Profit Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `LKR.${Number(value).toLocaleString()}`} />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stackId="1"
                stroke="#4f46e5"
                fill="#4f46e5"
                name="Revenue"
              />
              <Area
                type="monotone"
                dataKey="profit"
                stackId="1"
                stroke="#7c3aed"
                fill="#7c3aed"
                name="Profit"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Weekly Activity Bar Chart */}
        <Card className="p-4 border border-slate-200 shadow-sm rounded-xl bg-white">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-4">Weekly Activity (Sales vs Visitors)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="sales"
                fill="#06b6d4"
                name="Sales (LKR.)"
              />
              <Bar
                yAxisId="right"
                dataKey="visitors"
                fill="#f59e0b"
                name="Visitors"
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Category Distribution Pie */}
        <Card className="p-4 border border-slate-200 shadow-sm rounded-xl bg-white col-span-1">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-4">Sales by Category</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={75}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Customer Segmentation Scatter */}
        <Card className="p-4 border border-slate-200 shadow-sm rounded-xl bg-white col-span-2">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-4">Customer Segmentation</h2>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                type="number"
                dataKey="x"
                name="Visit Frequency"
                unit=" visits"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Avg. Spend"
                unit=" LKR."
                tick={{ fontSize: 12 }}
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter
                name="Customers"
                data={customerSegmentation}
                fill="#334155"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Product Performance & Patient Growth Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Product Performance Progress Bars */}
        <Card className="p-4 border border-slate-200 shadow-sm rounded-xl bg-white">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-4">Product Performance</h2>
          <div className="space-y-3">
            {productPerformance.map((product) => (
              <div key={product.product} className="border-b border-slate-100 pb-3 last:border-b-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <p className="font-semibold text-slate-900 text-xs">{product.product}</p>
                    <p className="text-[11px] text-slate-500">LKR.{(product.revenue).toLocaleString()} revenue</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-600">+{product.growth}%</p>
                    <p className="text-[11px] text-slate-500">⭐ {product.satisfaction}/5</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-900 rounded-full"
                      style={{
                        width: `${productPerformance.reduce((max, p) => Math.max(max, p.revenue), 0) > 0
                          ? (product.revenue / productPerformance.reduce((max, p) => Math.max(max, p.revenue), 0)) * 100
                          : 0
                          }%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Customer Growth Metrics */}
        <Card className="p-4 border border-slate-200 shadow-sm rounded-xl bg-white">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-4">Patient & Prescription Growth</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="customers"
                stroke="#4f46e5"
                strokeWidth={2}
                name="New Customers"
                dot={{ fill: '#4f46e5' }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="prescriptions"
                stroke="#7c3aed"
                strokeWidth={2}
                name="Prescriptions"
                dot={{ fill: '#7c3aed' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Summary Statistics */}
      <Card className="p-4 border border-slate-200 shadow-sm rounded-xl bg-white">
        <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-4">Advanced Business Statistics</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="text-center p-2">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Transactions</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {summaryStats.totalTransactions.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-2 lg:border-l border-slate-100">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Avg. Basket Size</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              LKR.{summaryStats.avgBasketSize.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-2 lg:border-l border-slate-100">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Conversion Rate</p>
            <p className="mt-1 text-xl font-bold text-emerald-600">
              {summaryStats.conversionRate}%
            </p>
          </div>
          <div className="text-center p-2 lg:border-l border-slate-100">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Repeat Patient Rate</p>
            <p className="mt-1 text-xl font-bold text-indigo-600">
              {summaryStats.repeatCustomerRate}%
            </p>
          </div>
          <div className="text-center p-2 lg:border-l border-slate-100">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Patient Lifetime Value</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              LKR.{summaryStats.customerLifetimeValue.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Recent Transactions */}
      <Card className="p-4 border border-slate-200 shadow-sm rounded-xl bg-white">
        <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-4">Recent Transactions</h2>
        <div className="space-y-3">
          {recentSales.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No recent transactions found.</p>
          ) : (
            recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between border-b border-slate-100 pb-2.5 last:border-b-0">
                <div>
                  <p className="font-semibold text-slate-900 text-xs">Invoice #{sale.invoice_number}</p>
                  <p className="text-[11px] text-slate-500">
                    Customer: {sale.first_name ? `${sale.first_name} ${sale.last_name || ''}`.trim() : 'Walk-in'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 text-xs">LKR.{parseFloat(sale.net_amount).toLocaleString()}</p>
                  <p className="text-[11px] text-emerald-600 font-semibold uppercase">{sale.payment_status}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
