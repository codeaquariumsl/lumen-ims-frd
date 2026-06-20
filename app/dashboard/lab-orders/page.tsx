'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Glasses, CheckCircle, Clock, AlertCircle } from 'lucide-react';
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lab Orders</h1>
          <p className="mt-2 text-gray-600">Manage optical lens manufacturing and lab orders</p>
        </div>
        <Button
          onClick={() => setIsAddingOrder(!isAddingOrder)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus size={20} />
          New Order
        </Button>
      </div>

      {/* Status Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4 border-l-4 border-yellow-500">
          <p className="text-xs text-gray-600 mb-2">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
        </Card>
        <Card className="p-4 border-l-4 border-blue-500">
          <p className="text-xs text-gray-600 mb-2">In Process</p>
          <p className="text-2xl font-bold text-blue-600">{statusCounts['in-process']}</p>
        </Card>
        <Card className="p-4 border-l-4 border-green-500">
          <p className="text-xs text-gray-600 mb-2">Completed</p>
          <p className="text-2xl font-bold text-green-600">{statusCounts.completed}</p>
        </Card>
        <Card className="p-4 border-l-4 border-purple-500">
          <p className="text-xs text-gray-600 mb-2">Delivered</p>
          <p className="text-2xl font-bold text-purple-600">{statusCounts.delivered}</p>
        </Card>
      </div>

      {/* Add Order Form */}
      {isAddingOrder && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Create New Lab Order</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              placeholder="Customer Name"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            />
            <Input
              placeholder="Frame Code"
              value={formData.frameCode}
              onChange={(e) => setFormData({ ...formData, frameCode: e.target.value })}
            />
            <select
              value={formData.lensType}
              onChange={(e) => setFormData({ ...formData, lensType: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="standard">Standard Lens</option>
              <option value="power">Power Lens</option>
              <option value="bifocal">Bifocal</option>
              <option value="progressive">Progressive</option>
              <option value="tinted">Tinted</option>
            </select>
            <select
              value={formData.coating}
              onChange={(e) => setFormData({ ...formData, coating: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="none">No Coating</option>
              <option value="anti-glare">Anti-Glare</option>
              <option value="uv">UV Protection</option>
              <option value="anti-glare-uv">Anti-Glare + UV</option>
              <option value="blue-light">Blue Light Filter</option>
            </select>
            <Input
              type="number"
              placeholder="Total Cost"
              value={formData.totalCost}
              onChange={(e) => setFormData({ ...formData, totalCost: parseFloat(e.target.value) })}
              step="100"
            />
            <Input
              type="date"
              placeholder="Expected Delivery Date"
              value={formData.deliveryDate}
              onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleAddOrder} className="bg-green-600 hover:bg-green-700">
              Create Order
            </Button>
            <Button onClick={() => setIsAddingOrder(false)} variant="outline">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Search & Filter */}
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          type="text"
          placeholder="Search by order number or customer name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-process">In Process</option>
          <option value="completed">Completed</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      {/* Orders List */}
      <div className="grid gap-4">
        {filteredOrders.length === 0 ? (
          <Card className="p-8 text-center">
            <Glasses size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No lab orders found</p>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const statusInfo = statusConfig[order.status];
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={order.id} className="p-6">
                <div className="grid gap-6 md:grid-cols-5">
                  {/* Order Info */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Order Number</p>
                    <p className="font-bold text-gray-900">{order.orderNumber}</p>
                    <p className="text-xs text-gray-600 mt-2">{order.customerName}</p>
                  </div>

                  {/* Frame & Lens Info */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Details</p>
                    <p className="text-sm font-medium text-gray-900">{order.frameCode}</p>
                    <p className="text-xs text-gray-600">{order.lensType}</p>
                    <p className="text-xs text-gray-600">{order.coating}</p>
                  </div>

                  {/* Dates */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Dates</p>
                    <p className="text-sm text-gray-900">
                      <strong>Order:</strong> {order.orderDate}
                    </p>
                    <p className="text-sm text-gray-900">
                      <strong>Delivery:</strong> {order.deliveryDate}
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Status</p>
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleStatusChange(order.id, e.target.value as LabOrder['status'])
                      }
                      className={`w-full px-2 py-1 rounded text-sm font-medium text-white border-0 ${order.status === 'pending'
                          ? 'bg-yellow-600'
                          : order.status === 'in-process'
                            ? 'bg-blue-600'
                            : order.status === 'completed'
                              ? 'bg-green-600'
                              : 'bg-purple-600'
                        }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-process">In Process</option>
                      <option value="completed">Completed</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>

                  {/* Cost & Actions */}
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-2">Cost</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      LKR.{order.totalCost.toLocaleString()}
                    </p>
                    <div className="mt-3 flex justify-end gap-2">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
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
