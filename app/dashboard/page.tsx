'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ShoppingCart, Users, Package, TrendingUp, Activity, Target, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';

const COLORS = ['#4f46e5', '#7c3aed', '#06b6d4', '#ec4899', '#f59e0b'];

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
    conversionRate: 23.4,
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
            conversionRate: 23.4,
            repeatCustomerRate: 0,
            customerLifetimeValue: 0
          });

          const categoryList = d.categoryPerformance || [];
          const totalVal = categoryList.reduce((sum: number, item: any) => sum + parseFloat(item.value || '0'), 0);
          const formattedCategories = categoryList.map((item: any) => ({
            name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
            value: totalVal > 0 ? Math.round((parseFloat(item.value || '0') / totalVal) * 100) : 0
          }));
          setCategoryData(formattedCategories.length > 0 ? formattedCategories : [
            { name: 'Frames', value: 0 },
            { name: 'Lenses', value: 0 },
            { name: 'Accessories', value: 0 }
          ]);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 font-medium animate-pulse">Loading dashboard command center...</div>
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Unified command center and business intelligence metrics</p>
        </div>
        {/* <div className="text-sm text-gray-500 font-medium bg-white px-4 py-2 rounded-lg border shadow-sm">
          📍 Colombo Branch
        </div> */}
      </div>

      {/* Quick Actions */}
      {/* <Card className="p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">Quick Operational Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => router.push('/dashboard/pos')} className="bg-indigo-600 hover:bg-indigo-700">
            <ShoppingCart size={18} className="mr-2" />
            New Sale (POS)
          </Button>
          <Button onClick={() => router.push('/dashboard/customers')} className="bg-green-600 hover:bg-green-700">
            <Users size={18} className="mr-2" />
            Add Customer
          </Button>
          <Button onClick={() => router.push('/dashboard/prescriptions')} className="bg-blue-600 hover:bg-blue-700">
            <Activity size={18} className="mr-2" />
            Create Prescription
          </Button>
          <Button onClick={() => router.push('/dashboard/lab-orders')} className="bg-purple-600 hover:bg-purple-700">
            <Package size={18} className="mr-2" />
            Lab Order
          </Button>
          <Button onClick={() => router.push('/dashboard/reports')} variant="outline" className="border-gray-300">
            <FileText size={18} className="mr-2" />
            View Reports
          </Button>
        </div>
      </Card> */}

      {/* KPI Cards (Advanced Business Intelligence) */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Advanced Performance KPIs</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-6 border-l-4 border-indigo-500 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  LKR.{monthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="mt-2 text-xs text-green-600 font-medium">
                  {percentageGrowth >= 0 ? '+' : ''}{percentageGrowth.toFixed(1)}% vs last month
                </p>
              </div>
              <Activity size={24} className="text-indigo-600" />
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-green-500 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gross Profit</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  LKR.{monthlyProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="mt-2 text-xs text-green-600 font-medium">
                  {profitMargin.toFixed(0)}% profit margin
                </p>
              </div>
              <Target size={24} className="text-green-600" />
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-blue-500 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Customers</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {summary.totalCustomers.toLocaleString()}
                </p>
                <p className="mt-2 text-xs text-green-600 font-medium">
                  +{currentMonthData.customers || 0} new this month
                </p>
              </div>
              <Users size={24} className="text-blue-600" />
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-purple-500 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Transaction</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  LKR.{summaryStats.avgBasketSize.toLocaleString()}
                </p>
                <p className="mt-2 text-xs text-green-600 font-medium">
                  based on {summaryStats.totalTransactions} sales
                </p>
              </div>
              <TrendingUp size={24} className="text-purple-600" />
            </div>
          </Card>
        </div>
      </div>

      {/* Operational Highlights (Summary counts) */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Operational Highlights</h2>
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  LKR.{summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="mt-2 text-xs text-green-600">{summary.totalSalesCount} invoice receipts</p>
              </div>
              <div className="rounded-lg bg-blue-100 p-3">
                <ShoppingCart size={24} className="text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{summary.totalCustomers}</p>
                <p className="mt-2 text-xs text-green-600">Registered patients</p>
              </div>
              <div className="rounded-lg bg-green-100 p-3">
                <Users size={24} className="text-green-600" />
              </div>
            </div>
          </Card>

          <Card className={`p-6 shadow-sm ${summary.lowStockCount > 0 ? 'border-l-4 border-orange-500' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Warning</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{summary.lowStockCount}</p>
                <p className="mt-2 text-xs text-orange-600">Items below minimum stock</p>
              </div>
              <div className="rounded-lg bg-orange-100 p-3">
                <Package size={24} className="text-orange-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Lab Orders</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{summary.activeLabOrders}</p>
                <p className="mt-2 text-xs text-purple-600">Manufacturing in progress</p>
              </div>
              <div className="rounded-lg bg-purple-100 p-3">
                <TrendingUp size={24} className="text-purple-600" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue & Profit Area Chart */}
        <Card className="p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Revenue & Profit Trend</h2>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={monthlyMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
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
        <Card className="p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Weekly Activity (Sales vs Visitors)</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={weeklyActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
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

      {/* Secondary Charts & Lists Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Category Distribution Pie */}
        <Card className="p-6 shadow-sm col-span-1">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Sales by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={80}
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
        <Card className="p-6 shadow-sm col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Customer Segmentation</h2>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name="Visit Frequency"
                unit=" visits"
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Avg. Spend"
                unit=" LKR."
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter
                name="Customers"
                data={customerSegmentation}
                fill="#8b5cf6"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Detailed Customer Growth & Product Performance Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Product Performance Progress Bars */}
        <Card className="p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Product Performance</h2>
          <div className="space-y-4">
            {productPerformance.map((product) => (
              <div key={product.product} className="border-b pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{product.product}</p>
                    <p className="text-xs text-gray-600">LKR.{(product.revenue).toLocaleString()} revenue</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">+{product.growth}%</p>
                    <p className="text-xs text-gray-600">⭐ {product.satisfaction}/5</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
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
        <Card className="p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Patient & Prescription Growth</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
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
      <Card className="p-6 shadow-sm bg-white">
        <h2 className="mb-6 text-lg font-semibold text-gray-900">Advanced Business Statistics</h2>
        <div className="grid gap-4 md:grid-cols-5">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Transactions</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {summaryStats.totalTransactions.toLocaleString()}
            </p>
          </div>
          <div className="text-center border-l">
            <p className="text-sm text-gray-600">Avg. Basket Size</p>
            <p className="mt-2 text-2xl font-bold text-indigo-600">
              LKR.{summaryStats.avgBasketSize.toLocaleString()}
            </p>
          </div>
          <div className="text-center border-l">
            <p className="text-sm text-gray-600">Conversion Rate</p>
            <p className="mt-2 text-2xl font-bold text-green-600">
              {summaryStats.conversionRate}%
            </p>
          </div>
          <div className="text-center border-l">
            <p className="text-sm text-gray-600">Repeat Patient Rate</p>
            <p className="mt-2 text-2xl font-bold text-blue-600">
              {summaryStats.repeatCustomerRate}%
            </p>
          </div>
          <div className="text-center border-l">
            <p className="text-sm text-gray-600">Patient Lifetime Value</p>
            <p className="mt-2 text-2xl font-bold text-purple-600">
              LKR.{summaryStats.customerLifetimeValue.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Recent Transactions */}
      <Card className="p-6 shadow-sm bg-white">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Transactions</h2>
        <div className="space-y-4">
          {recentSales.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No recent transactions found.</p>
          ) : (
            recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between border-b pb-4 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">Invoice #{sale.invoice_number}</p>
                  <p className="text-sm text-gray-600">
                    Customer: {sale.first_name ? `${sale.first_name} ${sale.last_name || ''}`.trim() : 'Walk-in'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">LKR.{parseFloat(sale.net_amount).toLocaleString()}</p>
                  <p className="text-xs text-green-600 uppercase font-medium">{sale.payment_status}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
