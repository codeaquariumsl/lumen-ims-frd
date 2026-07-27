'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Glasses, CheckCircle, Clock, AlertCircle, Search, X } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface LabOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  frameCode: string;
  lensType: string;
  coating: string;
  status: 'pending' | 'in-process' | 'completed' | 'delivered';
  totalCost: number;
  orderDate: string;
  deliveryDate: string;
}

const statusConfig = {
  pending: { color: 'yellow', icon: Clock, label: 'Pending' },
  'in-process': { color: 'blue', icon: AlertCircle, label: 'In Process' },
  completed: { color: 'green', icon: CheckCircle, label: 'Completed' },
  delivered: { color: 'purple', icon: CheckCircle, label: 'Delivered' },
};

export default function LabOrdersPage() {
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    customerName: '',
    frameCode: '',
    lensType: 'standard',
    coating: 'none',
    totalCost: 0,
    deliveryDate: '',
  });

  const fetchLabOrders = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/lab-orders', {
        params: {
          search: searchTerm,
          status: filterStatus
        }
      });
      if (response.data?.success) {
        const mapped = (response.data.data || []).map((o: any) => ({
          id: o.id,
          orderNumber: o.order_number,
          customerName: `${o.first_name} ${o.last_name || ''}`.trim(),
          frameCode: o.frame_code || '',
          lensType: o.lens_type || '',
          coating: o.coating || '',
          status: o.status,
          totalCost: parseFloat(o.total_cost || '0'),
          orderDate: o.created_at ? o.created_at.split(' ')[0] : '',
          deliveryDate: o.delivery_date ? o.delivery_date.split('T')[0] : ''
        }));
        setOrders(mapped);
      }
    } catch (err) {
      console.error('Error fetching lab orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLabOrders();
  }, [searchTerm, filterStatus]);

  const filteredOrders = orders;

  const handleAddOrder = async () => {
    if (formData.customerName && formData.frameCode) {
      try {
        let customerId = '';
        const searchResp = await apiClient.get('/customers', { params: { search: formData.customerName, limit: 1 } });
        if (searchResp.data?.success && searchResp.data.data.length > 0) {
          customerId = searchResp.data.data[0].id;
        } else {
          const parts = formData.customerName.split(' ');
          const createResp = await apiClient.post('/customers', {
            firstName: parts[0],
            lastName: parts.slice(1).join(' ') || '',
            phone: '0000000000',
          });
          if (createResp.data?.success) {
            customerId = createResp.data.data.id;
          }
        }

        if (customerId) {
          const payload = {
            customerId,
            frameCode: formData.frameCode,
            lensType: formData.lensType,
            coating: formData.coating,
            totalCost: formData.totalCost,
            deliveryDate: formData.deliveryDate || undefined
          };
          const response = await apiClient.post('/lab-orders', payload);
          if (response.data?.success) {
            setFormData({
              customerName: '',
              frameCode: '',
              lensType: 'standard',
              coating: 'none',
              totalCost: 0,
              deliveryDate: '',
            });
            setIsAddingOrder(false);
            fetchLabOrders();
          }
        }
      } catch (error) {
        console.error('Error adding lab order:', error);
      }
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this lab order?')) {
      try {
        const response = await apiClient.delete(`/lab-orders/${id}`);
        if (response.data?.success) {
          fetchLabOrders();
        }
      } catch (error) {
        console.error('Error deleting lab order:', error);
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: LabOrder['status']) => {
    try {
      const response = await apiClient.put(`/lab-orders/${id}/status`, { status: newStatus });
      if (response.data?.success) {
        fetchLabOrders();
      }
    } catch (error) {
      console.error('Error updating lab order status:', error);
    }
  };

  const statusCounts = {
    pending: orders.filter((o) => o.status === 'pending').length,
    'in-process': orders.filter((o) => o.status === 'in-process').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
  };

  return (
    <div className="space-y-5">
      {/* Header Section - Modern Compact Slate Theme */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lab Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage optical lens manufacturing and lab orders</p>
        </div>
        <Button
          onClick={() => setIsAddingOrder(!isAddingOrder)}
          className="gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm text-sm px-4 py-2"
        >
          <Plus size={18} />
          New Order
        </Button>
      </div>

      {/* Status Metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border-l-4 border-l-amber-500 border border-slate-200 shadow-sm rounded-xl bg-white">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{statusCounts.pending}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-500 border border-slate-200 shadow-sm rounded-xl bg-white">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">In Process</p>
          <p className="text-2xl font-bold text-blue-600">{statusCounts['in-process']}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500 border border-slate-200 shadow-sm rounded-xl bg-white">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Completed</p>
          <p className="text-2xl font-bold text-emerald-600">{statusCounts.completed}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-indigo-500 border border-slate-200 shadow-sm rounded-xl bg-white">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Delivered</p>
          <p className="text-2xl font-bold text-indigo-600">{statusCounts.delivered}</p>
        </Card>
      </div>

      {/* Add Order Form */}
      {isAddingOrder && (
        <Card className="p-4 bg-white border border-slate-200 shadow-sm rounded-xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-900"></span>
              <h2 className="text-sm font-semibold text-slate-900">Create New Lab Order</h2>
            </div>
            <button onClick={() => setIsAddingOrder(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Customer Name</label>
              <Input
                placeholder="Customer Name"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Frame Code</label>
              <Input
                placeholder="Frame Code"
                value={formData.frameCode}
                onChange={(e) => setFormData({ ...formData, frameCode: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Lens Type</label>
              <select
                value={formData.lensType}
                onChange={(e) => setFormData({ ...formData, lensType: e.target.value })}
                className="w-full px-3 h-9 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="standard">Standard Lens</option>
                <option value="power">Power Lens</option>
                <option value="bifocal">Bifocal</option>
                <option value="progressive">Progressive</option>
                <option value="tinted">Tinted</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Coating</label>
              <select
                value={formData.coating}
                onChange={(e) => setFormData({ ...formData, coating: e.target.value })}
                className="w-full px-3 h-9 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="none">No Coating</option>
                <option value="anti-glare">Anti-Glare</option>
                <option value="uv">UV Protection</option>
                <option value="anti-glare-uv">Anti-Glare + UV</option>
                <option value="blue-light">Blue Light Filter</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Total Cost (LKR)</label>
              <Input
                type="number"
                placeholder="Total Cost"
                value={formData.totalCost}
                onChange={(e) => setFormData({ ...formData, totalCost: parseFloat(e.target.value) })}
                step="100"
                className="h-9 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Expected Delivery Date</label>
              <Input
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-100">
            <Button onClick={() => setIsAddingOrder(false)} variant="outline" size="sm" className="h-8 text-xs">
              Cancel
            </Button>
            <Button onClick={handleAddOrder} size="sm" className="bg-slate-900 hover:bg-slate-800 text-white h-8 text-xs font-medium px-4">
              Create Order
            </Button>
          </div>
        </Card>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2 items-center bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by order number or customer name..."
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
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 h-9 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-700"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-process">In Process</option>
          <option value="completed">Completed</option>
          <option value="delivered">Delivered</option>
        </select>
        <span className="text-xs text-slate-400 whitespace-nowrap">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Orders List */}
      <div className="grid gap-3">
        {filteredOrders.length === 0 ? (
          <Card className="p-8 text-center bg-white border border-slate-200 shadow-sm rounded-xl">
            <Glasses size={40} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm text-slate-500">No lab orders found</p>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            return (
              <Card key={order.id} className="p-4 bg-white border border-slate-200 shadow-sm rounded-xl hover:border-slate-300 transition-colors">
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5 items-center">
                  {/* Order Info */}
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Order Number</p>
                    <p className="font-bold text-slate-900 text-sm">{order.orderNumber}</p>
                    <p className="text-xs text-slate-600 mt-1 font-medium">{order.customerName}</p>
                  </div>

                  {/* Frame & Lens Info */}
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Details</p>
                    <p className="text-xs font-semibold text-slate-900">{order.frameCode}</p>
                    <p className="text-xs text-slate-500 capitalize">{order.lensType} • {order.coating}</p>
                  </div>

                  {/* Dates */}
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Dates</p>
                    <p className="text-xs text-slate-700">Order: <span className="font-medium text-slate-900">{order.orderDate}</span></p>
                    <p className="text-xs text-slate-700">Delivery: <span className="font-medium text-slate-900">{order.deliveryDate}</span></p>
                  </div>

                  {/* Status Select */}
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Status</p>
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleStatusChange(order.id, e.target.value as LabOrder['status'])
                      }
                      className={`w-full px-2.5 h-8 rounded-lg text-xs font-semibold text-white border-0 focus:ring-2 focus:ring-slate-900 cursor-pointer ${
                        order.status === 'pending'
                          ? 'bg-amber-600'
                          : order.status === 'in-process'
                            ? 'bg-blue-600'
                            : order.status === 'completed'
                              ? 'bg-emerald-600'
                              : 'bg-indigo-600'
                        }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-process">In Process</option>
                      <option value="completed">Completed</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>

                  {/* Cost & Actions */}
                  <div className="md:text-right flex sm:flex-col justify-between items-center sm:items-end">
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Cost</p>
                      <p className="text-base font-bold text-slate-900">
                        LKR.{order.totalCost.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex justify-end gap-1.5 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-red-500 hover:text-red-700 border-slate-300 h-8 px-2.5"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
