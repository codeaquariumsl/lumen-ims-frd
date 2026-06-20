'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Target, Users, TrendingUp } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState('month');
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
  const [dashboardSummary, setDashboardSummary] = useState<any>({
    totalRevenue: 0,
    totalSalesCount: 0,
    totalCustomers: 0,
    lowStockCount: 0,
    activeLabOrders: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const [dashResp, chartsResp] = await Promise.all([
          apiClient.get('/analytics/dashboard'),
          apiClient.get('/analytics/charts')
        ]);

        if (dashResp.data?.success && dashResp.data.data) {
          setDashboardSummary(dashResp.data.data.summary);
        }

        if (chartsResp.data?.success && chartsResp.data.data) {
          const d = chartsResp.data.data;
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
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 font-medium animate-pulse">Loading analytics data...</div>
      </div>
    );
  }

  // Dynamic KPI Calculations from loaded monthly metrics
  const currentMonthData = monthlyMetrics[monthlyMetrics.length - 1] || { revenue: 0, profit: 0, customers: 0 };
  const prevMonthData = monthlyMetrics[monthlyMetrics.length - 2] || { revenue: 0, profit: 0, customers: 0 };
  
  const monthlyRevenue = currentMonthData.revenue || 0;
  const monthlyProfit = currentMonthData.profit || 0;
  
  const revDiff = monthlyRevenue - prevMonthData.revenue;
  const percentageGrowth = prevMonthData.revenue > 0 ? (revDiff / prevMonthData.revenue) * 100 : 0;
  const profitMargin = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="mt-2 text-gray-600">Advanced insights and business metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6 border-l-4 border-indigo-500">
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

        <Card className="p-6 border-l-4 border-green-500">
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

        <Card className="p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Customers</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {dashboardSummary.totalCustomers.toLocaleString()}
              </p>
              <p className="mt-2 text-xs text-green-600 font-medium">
                +{currentMonthData.customers || 0} new this month
              </p>
            </div>
            <Users size={24} className="text-blue-600" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-purple-500">
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

      {/* Main Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue & Profit Trend */}
        <Card className="p-6">
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

        {/* Weekly Activity */}
        <Card className="p-6">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Weekly Activity</h2>
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

      {/* Additional Analytics */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Customer Segmentation */}
        <Card className="p-6">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Customer Segmentation</h2>
          <ResponsiveContainer width="100%" height={350}>
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

        {/* Product Performance */}
        <Card className="p-6">
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
                        width: `${
                          productPerformance.reduce((max, p) => Math.max(max, p.revenue), 0) > 0 
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
      </div>

      {/* Customer Growth Metrics */}
      <Card className="p-6">
        <h2 className="mb-6 text-lg font-semibold text-gray-900">Customer Growth Metrics</h2>
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

      {/* Summary Statistics */}
      <Card className="p-6">
        <h2 className="mb-6 text-lg font-semibold text-gray-900">Summary Statistics</h2>
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
            <p className="text-sm text-gray-600">Repeat Customer Rate</p>
            <p className="mt-2 text-2xl font-bold text-blue-600">
              {summaryStats.repeatCustomerRate}%
            </p>
          </div>
          <div className="text-center border-l">
            <p className="text-sm text-gray-600">Customer Lifetime Value</p>
            <p className="mt-2 text-2xl font-bold text-purple-600">
              LKR.{summaryStats.customerLifetimeValue.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
