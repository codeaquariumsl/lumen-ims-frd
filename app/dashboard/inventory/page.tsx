'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, AlertCircle, BarChart3 } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  costPrice: number;
  sellingPrice: number;
  lastUpdated: string;
}

export default function InventoryPage() {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'frames',
    quantity: 0,
    minStock: 5,
    maxStock: 100,
    costPrice: 0,
    sellingPrice: 0,
  });

  const categories = ['frames', 'lenses', 'services', 'accessories', 'contact-lens'];

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/products/inventory');
      if (response.data?.success) {
        const mapped = (response.data.data || []).map((item: any) => ({
          id: item.product_id,
          code: item.code,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          minStock: item.min_stock,
          maxStock: item.max_stock,
          costPrice: parseFloat(item.cost_price || '0'),
          sellingPrice: parseFloat(item.selling_price || '0'),
          lastUpdated: item.last_updated ? item.last_updated.split(' ')[0] : ''
        }));
        setInventory(mapped);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = inventory.filter((item) => item.quantity <= item.minStock);
  const overStockItems = inventory.filter((item) => item.quantity >= item.maxStock);

  const handleAddItem = async () => {
    if (formData.code && formData.name) {
      try {
        const response = await apiClient.post('/products', formData);
        if (response.data?.success) {
          setFormData({
            code: '',
            name: '',
            category: 'frames',
            quantity: 0,
            minStock: 5,
            maxStock: 100,
            costPrice: 0,
            sellingPrice: 0,
          });
          setIsAddingItem(false);
          fetchInventory();
        }
      } catch (error) {
        console.error('Error adding inventory item:', error);
      }
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await apiClient.delete(`/products/${id}`);
        if (response.data?.success) {
          fetchInventory();
        }
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const totalInventoryValue = inventory.reduce(
    (sum, item) => sum + item.quantity * item.costPrice,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="mt-2 text-gray-600">Track products, stock levels, and warehouse management</p>
        </div>
        <Button
          onClick={() => setIsAddingItem(!isAddingItem)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus size={20} />
          Add Item
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-gray-600 mb-2">Total Items</p>
          <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-600 mb-2">Total Value</p>
          <p className="text-2xl font-bold text-indigo-600">
            LKR.{(totalInventoryValue / 100000).toFixed(1)}L
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-red-500">
          <p className="text-xs text-gray-600 mb-2">Low Stock Items</p>
          <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
        </Card>
        <Card className="p-4 border-l-4 border-orange-500">
          <p className="text-xs text-gray-600 mb-2">Over Stock Items</p>
          <p className="text-2xl font-bold text-orange-600">{overStockItems.length}</p>
        </Card>
      </div>

      {/* Add Item Form */}
      {isAddingItem && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Add New Inventory Item</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              placeholder="Item Code (e.g., FR-001)"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
            <Input
              placeholder="Item Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <Input
              type="number"
              placeholder="Current Quantity"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
            />
            <Input
              type="number"
              placeholder="Min Stock Level"
              value={formData.minStock}
              onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) })}
            />
            <Input
              type="number"
              placeholder="Max Stock Level"
              value={formData.maxStock}
              onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) })}
            />
            <Input
              type="number"
              placeholder="Cost Price"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) })}
              step="0.01"
            />
            <Input
              type="number"
              placeholder="Selling Price"
              value={formData.sellingPrice}
              onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) })}
              step="0.01"
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleAddItem} className="bg-green-600 hover:bg-green-700">
              Save Item
            </Button>
            <Button onClick={() => setIsAddingItem(false)} variant="outline">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Search & Filter */}
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          type="text"
          placeholder="Search by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="p-4 bg-red-50 border border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Low Stock Alert</p>
              <p className="text-sm text-red-700 mt-1">
                {lowStockItems.length} items are below minimum stock level. Consider placing new orders.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Inventory Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Code</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Product Name</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Category</th>
                <th className="px-6 py-3 text-right font-medium text-gray-900">Quantity</th>
                <th className="px-6 py-3 text-right font-medium text-gray-900">Min/Max</th>
                <th className="px-6 py-3 text-right font-medium text-gray-900">Cost/Sell</th>
                <th className="px-6 py-3 text-center font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.code}</td>
                  <td className="px-6 py-4 text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-gray-600 capitalize">{item.category}</td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${item.quantity <= item.minStock
                          ? 'bg-red-100 text-red-700'
                          : item.quantity >= item.maxStock
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                    >
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">
                    {item.minStock}/{item.maxStock}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">
                    LKR.{item.costPrice.toFixed(0)}/LKR.{item.sellingPrice.toFixed(0)}
                  </td>
                  <td className="px-6 py-4 text-center flex justify-center gap-2">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
