'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, AlertCircle, BarChart3, Eye, X, Search } from 'lucide-react';
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
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isViewingItem, setIsViewingItem] = useState(false);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);

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

  const handleSaveItem = async () => {
    if (formData.code && formData.name) {
      try {
        let response;
        if (editingItemId) {
          response = await apiClient.put(`/products/${editingItemId}`, formData);
        } else {
          response = await apiClient.post('/products', formData);
        }
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
          setEditingItemId(null);
          fetchInventory();
        }
      } catch (error) {
        console.error('Error saving inventory item:', error);
      }
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    setFormData({
      code: item.code,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      minStock: item.minStock,
      maxStock: item.maxStock,
      costPrice: item.costPrice,
      sellingPrice: item.sellingPrice,
    });
    setEditingItemId(item.id);
    setIsAddingItem(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="space-y-5">
      {/* Header Section - Modern Compact Slate Theme */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track products, stock levels, and warehouse management</p>
        </div>
        <Button
          onClick={() => {
            setIsAddingItem(!isAddingItem);
            if (isAddingItem) setEditingItemId(null);
          }}
          className="gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm text-sm px-4 py-2"
        >
          <Plus size={18} />
          Add Item
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border border-slate-200 shadow-sm rounded-xl bg-white">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Items</p>
          <p className="text-2xl font-bold text-slate-900">{inventory.length}</p>
        </Card>
        <Card className="p-4 border border-slate-200 shadow-sm rounded-xl bg-white">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Value</p>
          <p className="text-2xl font-bold text-indigo-600">
            LKR.{(totalInventoryValue / 100000).toFixed(1)}L
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500 border border-slate-200 shadow-sm rounded-xl bg-white">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Low Stock Items</p>
          <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500 border border-slate-200 shadow-sm rounded-xl bg-white">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Over Stock Items</p>
          <p className="text-2xl font-bold text-amber-600">{overStockItems.length}</p>
        </Card>
      </div>

      {/* Add Item Form */}
      {isAddingItem && (
        <Card className="p-4 bg-white border border-slate-200 shadow-sm rounded-xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-900"></span>
              <h2 className="text-sm font-semibold text-slate-900">
                {editingItemId ? 'Edit Inventory Item' : 'Add New Inventory Item'}
              </h2>
            </div>
            <button onClick={() => { setIsAddingItem(false); setEditingItemId(null); }} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Item Code</label>
              <Input
                placeholder="e.g., FR-001"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Item Name</label>
              <Input
                placeholder="Item Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 h-9 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Current Quantity</label>
              <Input
                type="number"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Min Stock Level</label>
              <Input
                type="number"
                placeholder="Min Stock"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) })}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Max Stock Level</label>
              <Input
                type="number"
                placeholder="Max Stock"
                value={formData.maxStock}
                onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) })}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Cost Price (LKR)</label>
              <Input
                type="number"
                placeholder="Cost Price"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) })}
                step="0.01"
                className="h-9 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Selling Price (LKR)</label>
              <Input
                type="number"
                placeholder="Selling Price"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) })}
                step="0.01"
                className="h-9 text-xs"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-100">
            <Button onClick={() => { setIsAddingItem(false); setEditingItemId(null); }} variant="outline" size="sm" className="h-8 text-xs">
              Cancel
            </Button>
            <Button onClick={handleSaveItem} size="sm" className="bg-slate-900 hover:bg-slate-800 text-white h-8 text-xs font-medium px-4">
              {editingItemId ? 'Update Item' : 'Save Item'}
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
            placeholder="Search by name or code..."
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
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 h-9 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-700"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-400 whitespace-nowrap">{filteredInventory.length} item{filteredInventory.length !== 1 ? 's' : ''}</span>
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
      <Card className="overflow-hidden border border-slate-200 shadow-sm rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Code</th>
                <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Product Name</th>
                <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Category</th>
                <th className="px-5 py-3.5 text-right font-semibold text-xs uppercase tracking-wider">Quantity</th>
                <th className="px-5 py-3.5 text-right font-semibold text-xs uppercase tracking-wider">Min/Max</th>
                <th className="px-5 py-3.5 text-right font-semibold text-xs uppercase tracking-wider">Cost/Sell</th>
                <th className="px-5 py-3.5 text-center font-semibold text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-semibold text-slate-900 text-sm">{item.code}</td>
                  <td className="px-5 py-3 text-slate-900">{item.name}</td>
                  <td className="px-5 py-3 text-slate-600 capitalize">{item.category}</td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.quantity <= item.minStock
                          ? 'bg-red-100 text-red-700'
                          : item.quantity >= item.maxStock
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                    >
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600">
                    {item.minStock}/{item.maxStock}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600">
                    LKR.{item.costPrice.toFixed(0)}/LKR.{item.sellingPrice.toFixed(0)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setViewingItem(item);
                          setIsViewingItem(true);
                        }}
                        className="text-slate-700 hover:text-slate-900 border-slate-300 h-8 px-2.5"
                      >
                        <Eye size={15} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditItem(item)}
                        className="text-slate-700 hover:text-slate-900 border-slate-300 h-8 px-2.5"
                      >
                        <Edit size={15} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-500 hover:text-red-700 border-slate-300 h-8 px-2.5"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View Item Modal */}
      {isViewingItem && viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Inventory Item Details</h2>
              <button
                onClick={() => {
                  setIsViewingItem(false);
                  setViewingItem(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500">Item Code</p>
                  <p className="font-semibold text-slate-900 text-sm">{viewingItem.code}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Item Name</p>
                  <p className="font-semibold text-slate-900 text-sm">{viewingItem.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Category</p>
                  <p className="font-semibold text-slate-900 text-sm capitalize">{viewingItem.category}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Last Updated</p>
                  <p className="font-semibold text-slate-900 text-sm">{viewingItem.lastUpdated || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Current Qty</p>
                  <p className={`text-base font-bold ${
                    viewingItem.quantity <= viewingItem.minStock ? 'text-red-600' :
                    viewingItem.quantity >= viewingItem.maxStock ? 'text-amber-600' :
                    'text-emerald-600'
                  }`}>{viewingItem.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Min Stock</p>
                  <p className="text-base font-medium text-slate-900">{viewingItem.minStock}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Max Stock</p>
                  <p className="text-base font-medium text-slate-900">{viewingItem.maxStock}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Cost Price</p>
                  <p className="text-base font-bold text-slate-900">LKR.{viewingItem.costPrice.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Selling Price</p>
                  <p className="text-base font-bold text-slate-900">LKR.{viewingItem.sellingPrice.toLocaleString()}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <p className="text-xs text-slate-500">Total Value in Stock: <span className="font-bold text-indigo-600 text-sm">LKR.{(viewingItem.quantity * viewingItem.costPrice).toLocaleString()}</span></p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
