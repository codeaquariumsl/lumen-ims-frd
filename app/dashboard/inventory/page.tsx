'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Edit, 
  Trash2, 
  AlertCircle, 
  Package, 
  Eye, 
  X, 
  Search,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Filter,
  Boxes,
  Layers,
  Tag
} from 'lucide-react';
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

interface CategoryItem {
  id?: number;
  name: string;
  description?: string;
  item_count?: number;
}

const DEFAULT_CATEGORIES = ['frames', 'lenses', 'services', 'accessories', 'contact-lens'];

export default function InventoryPage() {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isViewingItem, setIsViewingItem] = useState(false);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);

  // Category Management State (Backend Driven)
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

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

  // Fetch categories from backend database
  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/categories');
      if (response.data?.success) {
        setCategoriesList(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading categories from server:', error);
    }
  };

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
    fetchCategories();
  }, []);

  // Derived unique categories combined from defaults, database list, and active inventory items
  const allCategoryNames = Array.from(
    new Set([
      ...DEFAULT_CATEGORIES,
      ...categoriesList.map((c) => c.name.toLowerCase()),
      ...inventory.map((item) => item.category?.toLowerCase()).filter(Boolean),
    ])
  );

  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim().toLowerCase();
    if (!trimmed) return;

    if (allCategoryNames.includes(trimmed)) {
      alert(`Category "${trimmed}" already exists.`);
      return;
    }

    try {
      const response = await apiClient.post('/categories', { name: trimmed });
      if (response.data?.success) {
        setNewCategoryName('');
        await fetchCategories();
      }
    } catch (error: any) {
      console.error('Error adding category:', error);
      alert(error.response?.data?.message || `Failed to create category "${trimmed}".`);
    }
  };

  const handleDeleteCategory = async (catItem: CategoryItem) => {
    const catName = catItem.name;

    const itemCount = inventory.filter((item) => item.category.toLowerCase() === catName.toLowerCase()).length;
    if (itemCount > 0) {
      alert(`Cannot delete category "${catName}" because ${itemCount} product(s) are assigned to it.`);
      return;
    }

    if (window.confirm(`Are you sure you want to remove the category "${catName}"?`)) {
      try {
        if (catItem.id) {
          await apiClient.delete(`/categories/${catItem.id}`);
        }
        if (filterCategory.toLowerCase() === catName.toLowerCase()) {
          setFilterCategory('all');
        }
        await fetchCategories();
      } catch (error: any) {
        console.error('Error deleting category:', error);
        alert(error.response?.data?.message || `Failed to delete category "${catName}".`);
      }
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category.toLowerCase() === filterCategory.toLowerCase();
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
            category: allCategoryNames[0] || 'frames',
            quantity: 0,
            minStock: 5,
            maxStock: 100,
            costPrice: 0,
            sellingPrice: 0,
          });
          setIsAddingItem(false);
          setEditingItemId(null);
          fetchInventory();
          fetchCategories();
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
          fetchCategories();
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

  const getCategoryBadgeClass = (category: string) => {
    const colors: Record<string, string> = {
      frames: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      lenses: 'bg-blue-50 text-blue-700 border-blue-200',
      services: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      accessories: 'bg-purple-50 text-purple-700 border-purple-200',
      'contact-lens': 'bg-teal-50 text-teal-700 border-teal-200',
    };
    return colors[category.toLowerCase()] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-3 p-1">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-slate-900 p-2 text-white shadow-sm">
            <Package size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inventory Management</h1>
            <p className="text-xs text-slate-500">Track stock levels, product catalog, and warehouse pricing</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            onClick={() => {
              setIsManagingCategories(true);
              fetchCategories();
            }}
            variant="outline"
            className="gap-1.5 border-slate-300 text-slate-700 hover:text-slate-900 font-medium text-xs px-3 py-1.5 h-8 rounded-lg"
          >
            <Layers size={14} />
            Categories
          </Button>
          <Button
            onClick={() => {
              setIsAddingItem(!isAddingItem);
              if (isAddingItem) setEditingItemId(null);
            }}
            className="gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm text-xs px-3.5 py-1.5 h-8 rounded-lg"
          >
            <Plus size={15} />
            {isAddingItem ? 'Cancel' : 'Add Product'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
        <Card className="px-3 py-2 border border-slate-200 shadow-2xs rounded-lg bg-white flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Items</p>
            <p className="text-base font-bold text-slate-900 leading-tight">{inventory.length}</p>
          </div>
          <div className="p-1.5 rounded-md bg-slate-100 text-slate-600">
            <Boxes size={15} />
          </div>
        </Card>
        <Card className="px-3 py-2 border border-slate-200 shadow-2xs rounded-lg bg-white flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Stock Value</p>
            <p className="text-base font-bold text-indigo-600 leading-tight">
              LKR {(totalInventoryValue / 100000).toFixed(2)}L
            </p>
          </div>
          <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
            <DollarSign size={15} />
          </div>
        </Card>
        <Card className="px-3 py-2 border-l-3 border-l-red-500 border border-slate-200 shadow-2xs rounded-lg bg-white flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low Stock</p>
            <p className="text-base font-bold text-red-600 leading-tight">{lowStockItems.length}</p>
          </div>
          <div className="p-1.5 rounded-md bg-red-50 text-red-600">
            <TrendingDown size={15} />
          </div>
        </Card>
        <Card className="px-3 py-2 border-l-3 border-l-amber-500 border border-slate-200 shadow-2xs rounded-lg bg-white flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Over Stock</p>
            <p className="text-base font-bold text-amber-600 leading-tight">{overStockItems.length}</p>
          </div>
          <div className="p-1.5 rounded-md bg-amber-50 text-amber-600">
            <TrendingUp size={15} />
          </div>
        </Card>
      </div>

      {/* Add/Edit Form */}
      {isAddingItem && (
        <Card className="p-3.5 bg-white border border-slate-200 shadow-sm rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-900"></span>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                {editingItemId ? 'Edit Inventory Item' : 'Add New Inventory Item'}
              </h2>
            </div>
            <button
              onClick={() => { setIsAddingItem(false); setEditingItemId(null); }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Item Code</label>
              <Input
                placeholder="e.g. FR-001"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="h-8 text-xs border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Item Name</label>
              <Input
                placeholder="Item Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-8 text-xs border-slate-300 rounded-md"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-slate-600">Category</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsManagingCategories(true);
                    fetchCategories();
                  }}
                  className="text-[10px] text-indigo-600 hover:underline font-medium"
                >
                  + Manage
                </button>
              </div>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-2.5 h-8 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 capitalize"
              >
                {allCategoryNames.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Current Qty</label>
              <Input
                type="number"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="h-8 text-xs border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Min Stock Level</label>
              <Input
                type="number"
                placeholder="Min Stock"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                className="h-8 text-xs border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Max Stock Level</label>
              <Input
                type="number"
                placeholder="Max Stock"
                value={formData.maxStock}
                onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) || 0 })}
                className="h-8 text-xs border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cost Price (LKR)</label>
              <Input
                type="number"
                placeholder="Cost Price"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                step="0.01"
                className="h-8 text-xs border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Selling Price (LKR)</label>
              <Input
                type="number"
                placeholder="Selling Price"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                step="0.01"
                className="h-8 text-xs border-slate-300 rounded-md"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              onClick={() => { setIsAddingItem(false); setEditingItemId(null); }}
              variant="outline"
              size="sm"
              className="h-7 text-xs px-3 border-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveItem}
              size="sm"
              className="bg-slate-900 hover:bg-slate-800 text-white h-7 text-xs font-medium px-4 rounded-md"
            >
              {editingItemId ? 'Update Item' : 'Save Item'}
            </Button>
          </div>
        </Card>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2 items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-7 h-8 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-2.5 h-8 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-700 capitalize"
            >
              <option value="all">All Categories ({allCategoryNames.length})</option>
              {allCategoryNames.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <span className="text-[11px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md whitespace-nowrap">
            {filteredInventory.length} item{filteredInventory.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="flex items-center justify-between p-2.5 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
            <p className="text-xs font-medium text-red-900">
              <span className="font-bold">{lowStockItems.length} items</span> are below minimum stock thresholds.
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFilterCategory('all')}
            className="text-[11px] h-6 text-red-700 hover:text-red-900 hover:bg-red-100 px-2"
          >
            Review Items
          </Button>
        </div>
      )}

      {/* Inventory Compact Table */}
      <Card className="overflow-hidden border border-slate-200 shadow-sm rounded-xl bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white divide-x divide-slate-800">
                <th className="px-3.5 py-2.5 font-bold text-[11px] uppercase tracking-wider w-24">Code</th>
                <th className="px-3.5 py-2.5 font-bold text-[11px] uppercase tracking-wider">Product Name</th>
                <th className="px-3.5 py-2.5 font-bold text-[11px] uppercase tracking-wider w-28">Category</th>
                <th className="px-3.5 py-2.5 text-center font-bold text-[11px] uppercase tracking-wider w-24">Qty</th>
                <th className="px-3.5 py-2.5 text-center font-bold text-[11px] uppercase tracking-wider w-24">Min / Max</th>
                <th className="px-3.5 py-2.5 text-right font-bold text-[11px] uppercase tracking-wider w-36">Cost / Sell</th>
                <th className="px-3.5 py-2.5 text-center font-bold text-[11px] uppercase tracking-wider w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading inventory items...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3.5 py-2 font-mono font-bold text-slate-900">{item.code}</td>
                    <td className="px-3.5 py-2 font-medium text-slate-900">{item.name}</td>
                    <td className="px-3.5 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getCategoryBadgeClass(item.category)}`}>
                        {item.category.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3.5 py-2 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${item.quantity <= item.minStock
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : item.quantity >= item.maxStock
                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                      >
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-3.5 py-2 text-center text-slate-500 font-mono text-[11px]">
                      {item.minStock} / {item.maxStock}
                    </td>
                    <td className="px-3.5 py-2 text-right font-medium">
                      <div className="text-slate-800">LKR {item.sellingPrice.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Cost: {item.costPrice.toLocaleString()}</div>
                    </td>
                    <td className="px-3.5 py-2">
                      <div className="flex justify-center items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setViewingItem(item);
                            setIsViewingItem(true);
                          }}
                          className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditItem(item)}
                          className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                          title="Edit Item"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteItem(item.id)}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md"
                          title="Delete Item"
                        >
                          <Trash2 size={14} />
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

      {/* Category Management Modal */}
      {isManagingCategories && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md p-4 shadow-xl bg-white rounded-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-slate-900 text-white">
                  <Layers size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Manage Product Categories</h2>
                  <p className="text-[11px] text-slate-400">Database synchronized product categories</p>
                </div>
              </div>
              <button
                onClick={() => setIsManagingCategories(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Add New Category Input */}
            <div className="flex gap-2">
              <Input
                placeholder="New category name (e.g. solution, cases)..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                className="h-8 text-xs border-slate-300 rounded-md flex-1"
              />
              <Button
                onClick={handleAddCategory}
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 text-white h-8 text-xs px-3 rounded-md gap-1"
              >
                <Plus size={14} />
                Add
              </Button>
            </div>

            {/* Category List */}
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Database Categories ({allCategoryNames.length})
              </p>
              {allCategoryNames.map((catName) => {
                const catObj = categoriesList.find((c) => c.name.toLowerCase() === catName.toLowerCase());
                const count = catObj?.item_count !== undefined 
                  ? catObj.item_count 
                  : inventory.filter((i) => i.category?.toLowerCase() === catName.toLowerCase()).length;
                const isDefault = DEFAULT_CATEGORIES.includes(catName.toLowerCase());

                return (
                  <div
                    key={catName}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80 hover:bg-slate-100/60 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Tag size={13} className="text-slate-400" />
                      <span className="font-semibold text-slate-800 capitalize">{catName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white border border-slate-200 text-slate-500 font-mono">
                        {count} {count === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isDefault && !catObj?.id ? (
                        <span className="text-[10px] font-medium text-slate-400 italic px-1">System</span>
                      ) : (
                        <button
                          onClick={() => handleDeleteCategory(catObj || { name: catName })}
                          className="p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Remove category"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <Button
                onClick={() => setIsManagingCategories(false)}
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 text-white h-7 text-xs px-4 rounded-md"
              >
                Done
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* View Item Modal */}
      {isViewingItem && viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md p-4 shadow-xl bg-white rounded-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-slate-900 text-white">
                  <Package size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Product Specifications</h2>
                  <p className="text-[11px] text-slate-400 font-mono">{viewingItem.code}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsViewingItem(false);
                  setViewingItem(null);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                <div>
                  <p className="text-[10px] uppercase font-semibold text-slate-400">Product Name</p>
                  <p className="font-bold text-slate-900">{viewingItem.name}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-semibold text-slate-400">Category</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${getCategoryBadgeClass(viewingItem.category)}`}>
                    {viewingItem.category.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-center">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Current Qty</p>
                  <p className={`text-sm font-bold ${viewingItem.quantity <= viewingItem.minStock ? 'text-red-600' :
                      viewingItem.quantity >= viewingItem.maxStock ? 'text-amber-600' :
                        'text-emerald-600'
                    }`}>{viewingItem.quantity}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Min Stock</p>
                  <p className="text-sm font-semibold text-slate-800">{viewingItem.minStock}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Max Stock</p>
                  <p className="text-sm font-semibold text-slate-800">{viewingItem.maxStock}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Cost Price</p>
                  <p className="text-xs font-bold text-slate-900">LKR {viewingItem.costPrice.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Selling Price</p>
                  <p className="text-xs font-bold text-slate-900">LKR {viewingItem.sellingPrice.toLocaleString()}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Total Stock Value:</span>
                <span className="font-bold text-indigo-600 text-xs">
                  LKR {(viewingItem.quantity * viewingItem.costPrice).toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
