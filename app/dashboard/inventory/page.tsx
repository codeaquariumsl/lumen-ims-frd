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
  Tag,
  Printer,
  Barcode,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import apiClient from '@/lib/api-client';

interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: string;
  type: 'inventory' | 'non-inventory';
  barcode: string;
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
  code?: string;
  description?: string;
  item_count?: number;
}

const DEFAULT_CATEGORIES = [
  { name: 'frames', code: 'FR' },
  { name: 'lenses', code: 'LN' },
  { name: 'services', code: 'SV' },
  { name: 'accessories', code: 'AC' },
  { name: 'contact-lens', code: 'CL' }
];

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
  const [newCategoryCode, setNewCategoryCode] = useState('');

  // Print Barcode Prompt & Sticker Modal State
  const [savedItemForPrint, setSavedItemForPrint] = useState<InventoryItem | null>(null);
  const [showPrintPromptModal, setShowPrintPromptModal] = useState(false);
  const [showStickerPrintView, setShowStickerPrintView] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'frames',
    type: 'inventory' as 'inventory' | 'non-inventory',
    barcode: '',
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
      const response = await apiClient.get('/products');
      if (response.data?.success) {
        const mapped = (response.data.data || []).map((item: any, idx: number) => ({
          id: String(item.id || item.product_id || `prod-${idx}`),
          code: item.code || '',
          name: item.name || '',
          category: item.category || 'General',
          type: item.type || 'inventory',
          barcode: item.barcode || `01${item.code || ''}`,
          quantity: item.quantity !== undefined && item.quantity !== null ? item.quantity : 0,
          minStock: item.min_stock !== undefined ? item.min_stock : 5,
          maxStock: item.max_stock !== undefined ? item.max_stock : 100,
          costPrice: parseFloat(item.cost_price || item.costPrice || '0'),
          sellingPrice: parseFloat(item.selling_price || item.sellingPrice || '0'),
          lastUpdated: item.last_updated ? String(item.last_updated).split(' ')[0] : ''
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

  // Fetch next product code and auto barcode (01 + product code)
  const fetchNextCodeForCategory = async (categoryName: string) => {
    try {
      const res = await apiClient.get('/products/next-code', { params: { category: categoryName } });
      if (res.data?.success && res.data.data) {
        const { code, barcode } = res.data.data;
        setFormData((prev) => ({
          ...prev,
          code: code || '',
          barcode: barcode || (code ? `01${code}` : '')
        }));
      }
    } catch (err) {
      console.error('Failed to fetch next product code:', err);
    }
  };

  const handleCategoryChangeInForm = (catName: string) => {
    setFormData((prev) => ({ ...prev, category: catName }));
    if (!editingItemId) {
      fetchNextCodeForCategory(catName);
    }
  };

  const handleOpenAddItemModal = () => {
    const defaultCat = categoriesList[0]?.name || DEFAULT_CATEGORIES[0].name;
    setFormData({
      code: '',
      name: '',
      category: defaultCat,
      type: 'inventory',
      barcode: '',
      quantity: 0,
      minStock: 5,
      maxStock: 100,
      costPrice: 0,
      sellingPrice: 0,
    });
    setEditingItemId(null);
    setIsAddingItem(true);
    fetchNextCodeForCategory(defaultCat);
  };

  // Map of categories with 2-letter codes
  const allCategoriesMap = new Map<string, { name: string; code: string }>();
  DEFAULT_CATEGORIES.forEach((c) => allCategoriesMap.set(c.name.toLowerCase(), c));
  categoriesList.forEach((c) => {
    const nameLower = c.name.toLowerCase();
    allCategoriesMap.set(nameLower, {
      name: c.name,
      code: c.code || nameLower.substring(0, 2).toUpperCase()
    });
  });

  const handleAddCategory = async () => {
    const trimmedName = newCategoryName.trim().toLowerCase();
    const trimmedCode = newCategoryCode.trim().toUpperCase();

    if (!trimmedName) {
      alert('Category name is required.');
      return;
    }

    if (!trimmedCode || trimmedCode.length !== 2 || !/^[A-Z]{2}$/.test(trimmedCode)) {
      alert('Category code is required and must be exactly 2 letters (e.g. FR, LN).');
      return;
    }

    if (Array.from(allCategoriesMap.keys()).includes(trimmedName)) {
      alert(`Category "${trimmedName}" already exists.`);
      return;
    }

    try {
      const response = await apiClient.post('/categories', { name: trimmedName, code: trimmedCode });
      if (response.data?.success) {
        setNewCategoryName('');
        setNewCategoryCode('');
        await fetchCategories();
      }
    } catch (error: any) {
      console.error('Error adding category:', error);
      alert(error.response?.data?.message || `Failed to create category "${trimmedName}".`);
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
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || item.category.toLowerCase() === filterCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = inventory.filter((item) => item.type === 'inventory' && item.quantity <= item.minStock);
  const overStockItems = inventory.filter((item) => item.type === 'inventory' && item.quantity >= item.maxStock);

  const handleSaveItem = async () => {
    if (!formData.name || !formData.name.trim()) {
      alert('Product Name is required.');
      return;
    }

    if (!formData.sellingPrice || formData.sellingPrice <= 0) {
      alert('Selling Price is required and must be greater than 0.');
      return;
    }

    if (formData.type === 'inventory' && (formData.quantity === undefined || formData.quantity === null || isNaN(formData.quantity))) {
      alert('Current Qty is required for inventory items.');
      return;
    }

    if (!formData.code) {
      alert('Product Code is required.');
      return;
    }

    try {
      let response;
      const payload = {
        ...formData,
        barcode: formData.barcode || `01${formData.code}`
      };

      if (editingItemId) {
        response = await apiClient.put(`/products/${editingItemId}`, payload);
      } else {
        response = await apiClient.post('/products', payload);
      }

      if (response.data?.success) {
        const savedData: InventoryItem = {
          id: response.data.data?.id || response.data.data?.product_id || editingItemId || '',
          code: formData.code,
          name: formData.name,
          category: formData.category,
          type: formData.type,
          barcode: payload.barcode,
          quantity: formData.quantity,
          minStock: formData.minStock,
          maxStock: formData.maxStock,
          costPrice: formData.costPrice,
          sellingPrice: formData.sellingPrice,
          lastUpdated: new Date().toISOString().split('T')[0]
        };

        setIsAddingItem(false);
        setEditingItemId(null);
        await fetchInventory();
        await fetchCategories();

        // Ask to print barcode sticker ONLY for Inventory type products
        if (savedData.type === 'inventory') {
          setSavedItemForPrint(savedData);
          setShowPrintPromptModal(true);
        }
      }
    } catch (error: any) {
      console.error('Error saving inventory item:', error);
      alert(error.response?.data?.message || 'Failed to save product.');
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    setFormData({
      code: item.code,
      name: item.name,
      category: item.category,
      type: item.type || 'inventory',
      barcode: item.barcode || `01${item.code}`,
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
    (sum, item) => sum + (item.type === 'inventory' ? item.quantity * item.costPrice : 0),
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

  // Helper Code128 SVG renderer
  const renderBarcodeSvg = (text: string) => {
    const CODE128_PATTERNS: { [key: number]: string } = {
      0: "212222", 1: "222122", 2: "222221", 3: "121223", 4: "121322", 5: "131222", 6: "122213", 7: "122312", 8: "132212", 9: "221213",
      10: "221312", 11: "231212", 12: "112232", 13: "122132", 14: "122231", 15: "113222", 16: "123122", 17: "123221", 18: "223211", 19: "221132",
      20: "221231", 21: "213212", 22: "223112", 23: "312131", 24: "311222", 25: "321122", 26: "321221", 27: "312212", 28: "322112", 29: "322211",
      30: "212123", 31: "212321", 32: "232121", 33: "111323", 34: "131123", 35: "131321", 36: "112313", 37: "132113", 38: "132311", 39: "211313",
      40: "231113", 41: "231311", 42: "112133", 43: "112331", 44: "132131", 45: "113123", 46: "113321", 47: "133121", 48: "313121", 49: "211331",
      50: "231131", 51: "213113", 52: "213311", 53: "213131", 54: "311123", 55: "311321", 56: "331121", 57: "312113", 58: "312311", 59: "332111",
      60: "314111", 61: "221411", 62: "431111", 63: "111224", 64: "111422", 65: "121124", 66: "121421", 67: "141122", 68: "141221", 69: "112214",
      70: "112412", 71: "122114", 72: "122411", 73: "142112", 74: "142211", 75: "241211", 76: "221114", 77: "413111", 78: "241112", 79: "134111",
      80: "111242", 81: "121142", 82: "121241", 83: "114212", 84: "124112", 85: "124211", 86: "411212", 87: "421112", 88: "421211", 89: "212141",
      90: "214121", 91: "412121", 92: "111143", 93: "111341", 94: "113141", 95: "114113", 96: "114311", 97: "411113", 98: "411311", 99: "113114",
      100: "114131", 101: "311141", 102: "411131", 103: "211412", 104: "211214", 105: "211232"
    };
    const STOP_PATTERN = "2331112";

    let checksum = 104;
    let pattern = CODE128_PATTERNS[104] || "";

    const str = text || "01000";
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i) - 32;
      const patIdx = code >= 0 && code <= 95 ? code : 0;
      checksum += patIdx * (i + 1);
      pattern += CODE128_PATTERNS[patIdx] || "";
    }

    const checksumIdx = checksum % 103;
    pattern += CODE128_PATTERNS[checksumIdx] || "";
    pattern += STOP_PATTERN;

    let x = 0;
    const rects: string[] = [];
    const barHeight = 45;
    for (let i = 0; i < pattern.length; i++) {
      const width = parseInt(pattern[i], 10);
      if (i % 2 === 0) {
        rects.push(`<rect x="${x}" y="0" width="${width}" height="${barHeight}" fill="#000000"/>`);
      }
      x += width;
    }

    return (
      <svg
        viewBox={`0 0 ${x} ${barHeight}`}
        className="w-full h-10 mx-auto"
        preserveAspectRatio="none"
        dangerouslySetInnerHTML={{ __html: rects.join('') }}
      />
    );
  };

  return (
    <div className="space-y-3 p-1">
      {/* Printable Area CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #barcode-sticker-printable, #barcode-sticker-printable * {
            visibility: visible !important;
          }
          #barcode-sticker-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            padding: 20px !important;
          }
        }
      `}</style>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-slate-900 p-2 text-white shadow-sm">
            <Package size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inventory & Product Management</h1>
            <p className="text-xs text-slate-500">Track catalog, category codes, product types, and print barcode stickers</p>
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
              if (isAddingItem) {
                setIsAddingItem(false);
                setEditingItemId(null);
              } else {
                handleOpenAddItemModal();
              }
            }}
            className="gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm text-xs px-3.5 py-1.5 h-8 rounded-lg"
          >
            <Plus size={15} />
            {isAddingItem ? 'Cancel' : 'Add Product'}
          </Button>
        </div>
      </div>

      {/* Key Metrics - Compact UI/UX */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <div className="flex items-center gap-2.5 px-3 py-1.5">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Boxes size={14} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">Total Items</p>
              <p className="text-sm font-bold text-slate-900 mt-1 leading-none">{inventory.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-1.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <DollarSign size={14} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">Total Value</p>
              <p className="text-sm font-bold text-indigo-600 mt-1 leading-none">
                LKR {Number(totalInventoryValue).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-1.5">
            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <TrendingDown size={14} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">Low Stock</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-sm font-bold text-red-600 leading-none">{lowStockItems.length}</span>
                {lowStockItems.length > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-red-100 text-red-700 rounded-full">Alert</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <TrendingUp size={14} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">Over Stock</p>
              <p className="text-sm font-bold text-amber-600 mt-1 leading-none">{overStockItems.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Management Modal Dialog Overlay */}
      {isAddingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <Card className="w-full max-w-3xl p-5 shadow-2xl bg-white rounded-xl space-y-4 max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-slate-900 text-white">
                  <Package size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    {editingItemId ? 'Edit Product Item' : 'Product Management Modal'}
                  </h2>
                  <p className="text-[11px] text-slate-400">Add or edit product item specifications and pricing</p>
                </div>
              </div>
              <button
                onClick={() => { setIsAddingItem(false); setEditingItemId(null); }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Category <span className="text-red-500 font-bold">*</span>
                  </label>
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
                  onChange={(e) => handleCategoryChangeInForm(e.target.value)}
                  className="w-full px-2.5 h-8 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 capitalize font-medium text-slate-800"
                >
                  {Array.from(allCategoriesMap.values()).map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name.toUpperCase()} [{cat.code}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Product Code
                  </label>
                  {!editingItemId && (
                    <button
                      type="button"
                      onClick={() => fetchNextCodeForCategory(formData.category)}
                      className="text-[10px] text-slate-500 hover:text-slate-900 flex items-center gap-0.5"
                      title="Auto generate code"
                    >
                      <RefreshCw size={10} /> Auto
                    </button>
                  )}
                </div>
                <Input
                  placeholder="Auto e.g. FR001"
                  value={formData.code}
                  readOnly
                  className="h-8 text-xs font-mono font-bold border-slate-300 rounded-md bg-slate-100/90 text-slate-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Product Name <span className="text-red-500 font-bold">*</span>
                </label>
                <Input
                  placeholder="Item Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-8 text-xs border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Product Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-2.5 h-8 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 capitalize font-medium text-slate-800"
                >
                  <option value="inventory">Inventory Item</option>
                  <option value="non-inventory">Non-Inventory Service / Item</option>
                </select>
              </div>

              {formData.type === 'inventory' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Barcode
                  </label>
                  <Input
                    placeholder="Auto Barcode e.g. 01FR001"
                    value={formData.barcode}
                    readOnly
                    className="h-8 text-xs font-mono border-slate-300 rounded-md bg-slate-100/90 text-slate-700 cursor-not-allowed"
                  />
                </div>
              )}

              {formData.type === 'inventory' && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Current Qty <span className="text-red-500 font-bold">*</span>
                    </label>
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
                </>
              )}

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
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Selling Price (LKR) <span className="text-red-500 font-bold">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="Selling Price"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                  step="0.01"
                  className="h-8 text-xs border-slate-300 rounded-md font-semibold text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                onClick={() => { setIsAddingItem(false); setEditingItemId(null); }}
                variant="outline"
                size="sm"
                className="h-8 text-xs px-3 border-slate-300 text-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveItem}
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 text-white h-8 text-xs font-medium px-4 rounded-md shadow-sm"
              >
                {editingItemId ? 'Update Product' : 'Save Item'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2 items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, product code, or barcode..."
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
              <option value="all">All Categories ({Array.from(allCategoriesMap.keys()).length})</option>
              {Array.from(allCategoriesMap.values()).map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name.toUpperCase()} [{cat.code}]
                </option>
              ))}
            </select>
          </div>
          <span className="text-[11px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md whitespace-nowrap">
            {filteredInventory.length} item{filteredInventory.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Inventory Compact Table */}
      <Card className="overflow-hidden border border-slate-200 shadow-sm rounded-xl bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white divide-x divide-slate-800">
                <th className="px-3.5 py-2.5 font-bold text-[11px] uppercase tracking-wider w-24">Code</th>
                <th className="px-3.5 py-2.5 font-bold text-[11px] uppercase tracking-wider">Product Name</th>
                <th className="px-3.5 py-2.5 font-bold text-[11px] uppercase tracking-wider w-28">Category</th>
                <th className="px-3.5 py-2.5 font-bold text-[11px] uppercase tracking-wider w-28">Barcode</th>
                <th className="px-3.5 py-2.5 text-center font-bold text-[11px] uppercase tracking-wider w-34">Current Stock</th>
                <th className="px-3.5 py-2.5 text-right font-bold text-[11px] uppercase tracking-wider w-36">Cost / Sell</th>
                <th className="px-3.5 py-2.5 text-center font-bold text-[11px] uppercase tracking-wider w-32">Actions</th>
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
                    <td className="px-3.5 py-2 font-mono text-[11px] text-slate-600">
                      {item.type === 'inventory' ? (item.barcode || `01${item.code}`) : '-'}
                    </td>
                    <td className="px-3.5 py-2 text-center">
                      {item.type === 'non-inventory' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          Non-Inventory
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${item.quantity <= item.minStock
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : item.quantity >= item.maxStock
                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                        >
                          {item.quantity} pcs
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-2 text-right font-medium">
                      <div className="text-slate-800 font-bold">LKR {item.sellingPrice.toLocaleString()}</div>
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
                          className="h-7 w-7 p-0 text-blue-600 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </Button>
                        {item.type === 'inventory' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSavedItemForPrint(item);
                              setShowStickerPrintView(true);
                            }}
                            className="h-7 w-7 p-0 text-green-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-md"
                            title="Print Barcode Sticker"
                          >
                            <Printer size={14} />
                          </Button>
                        )}
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
                  <p className="text-[11px] text-slate-400">Database categories with 2-letter codes</p>
                </div>
              </div>
              <button
                onClick={() => setIsManagingCategories(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Add New Category Inputs */}
            <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Add New Category</p>
              <div className="flex gap-2">
                <div className="flex-2">
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Category Name <span className="text-red-500 font-bold">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Solution"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="h-8 text-xs border-slate-300 rounded-md"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Code (2 Let.) <span className="text-red-500 font-bold">*</span>
                  </label>
                  <Input
                    placeholder="e.g. SL"
                    maxLength={2}
                    value={newCategoryCode}
                    onChange={(e) => setNewCategoryCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                    className="h-8 text-xs font-mono font-bold uppercase border-slate-300 rounded-md"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleAddCategory}
                    size="sm"
                    className="bg-slate-900 hover:bg-slate-800 text-white h-8 text-xs px-3 rounded-md gap-1"
                  >
                    <Plus size={14} />
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Category List */}
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Database Categories ({Array.from(allCategoriesMap.values()).length})
              </p>
              {Array.from(allCategoriesMap.values()).map((catInfo) => {
                const catObj = categoriesList.find((c) => c.name.toLowerCase() === catInfo.name.toLowerCase());
                const count = catObj?.item_count !== undefined
                  ? catObj.item_count
                  : inventory.filter((i) => i.category?.toLowerCase() === catInfo.name.toLowerCase()).length;
                const isDefault = DEFAULT_CATEGORIES.some((d) => d.name.toLowerCase() === catInfo.name.toLowerCase());

                return (
                  <div
                    key={catInfo.name}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80 hover:bg-slate-100/60 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Tag size={13} className="text-slate-400" />
                      <span className="font-semibold text-slate-800 capitalize">{catInfo.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-900 text-white font-mono font-bold">
                        {catInfo.code}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white border border-slate-200 text-slate-500 font-mono">
                        {count} {count === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isDefault && !catObj?.id ? (
                        <span className="text-[10px] font-medium text-slate-400 italic px-1">System</span>
                      ) : (
                        <button
                          onClick={() => handleDeleteCategory(catObj || { name: catInfo.name })}
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

      {/* Post Save Prompt Modal: Ask to Print Barcode Sticker */}
      {showPrintPromptModal && savedItemForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-sm p-4 shadow-2xl bg-white rounded-xl space-y-4 border border-slate-200 text-center">
            <div className="flex flex-col items-center justify-center gap-2 pt-2">
              <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={28} />
              </div>
              <h2 className="text-base font-bold text-slate-900">Product Saved Successfully!</h2>
              <p className="text-xs text-slate-500">
                Product <span className="font-bold text-slate-800">{savedItemForPrint.name}</span> ({savedItemForPrint.code}) has been saved.
              </p>
            </div>

            {/* Mini Barcode Sticker Preview */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono space-y-1">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">LUMEN OPTICALS</p>
              <p className="text-xs font-bold truncate">{savedItemForPrint.name}</p>
              <div className="py-1">
                {renderBarcodeSvg(savedItemForPrint.barcode || `01${savedItemForPrint.code}`)}
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-600 pt-1 border-t border-slate-200">
                <span>Code: {savedItemForPrint.code}</span>
                <span className="font-bold text-slate-900">LKR {savedItemForPrint.sellingPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPrintPromptModal(false);
                  setSavedItemForPrint(null);
                }}
                className="h-8 text-xs border-slate-300 text-slate-700 flex-1"
              >
                Skip / Close
              </Button>
              <Button
                onClick={() => {
                  setShowPrintPromptModal(false);
                  setShowStickerPrintView(true);
                }}
                className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white font-medium flex-1 gap-1.5 shadow-sm"
              >
                <Printer size={14} />
                Print Sticker
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Barcode Sticker Preview & Print Modal */}
      {showStickerPrintView && savedItemForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md p-4 shadow-2xl bg-white rounded-xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-slate-900 text-white">
                  <Barcode size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Print Barcode Sticker</h2>
                  <p className="text-[11px] text-slate-400">Standard optical sticker label view</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowStickerPrintView(false);
                  setSavedItemForPrint(null);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Printable Sticker Box */}
            <div className="flex justify-center my-4">
              <div
                id="barcode-sticker-printable"
                className="w-[52mm] min-h-[28mm] p-2 bg-white border-2 border-dashed border-slate-300 rounded-md text-center flex flex-col justify-between shadow-xs font-mono text-slate-900"
              >
                <div className="text-[9px] font-extrabold tracking-widest text-slate-800 uppercase">
                  LUMEN OPTICALS
                </div>
                <div className="text-[11px] font-bold text-slate-900 truncate my-0.5">
                  {savedItemForPrint.name}
                </div>
                <div className="my-1">
                  {renderBarcodeSvg(savedItemForPrint.barcode || `01${savedItemForPrint.code}`)}
                </div>
                <div className="text-[10px] font-bold tracking-wider text-slate-800">
                  *{savedItemForPrint.barcode || `01${savedItemForPrint.code}`}*
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold pt-1 border-t border-slate-200 mt-0.5">
                  <span className="text-slate-700">CODE: {savedItemForPrint.code}</span>
                  <span className="text-slate-900 font-extrabold">LKR {savedItemForPrint.sellingPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowStickerPrintView(false);
                  setSavedItemForPrint(null);
                }}
                className="h-8 text-xs border-slate-300 text-slate-700"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => window.print()}
                className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white font-medium gap-1.5 shadow-sm px-4"
              >
                <Printer size={14} />
                Print Sticker
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* View Item Specs Modal */}
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

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                <div>
                  <p className="text-[10px] uppercase font-semibold text-slate-400">Product Code</p>
                  <p className="font-bold text-slate-900 font-mono">{viewingItem.code}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-semibold text-slate-400">Barcode</p>
                  <p className="font-bold text-slate-900 font-mono">
                    {viewingItem.type === 'inventory' ? (viewingItem.barcode || `01${viewingItem.code}`) : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-center">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Type</p>
                  <p className="text-xs font-bold text-slate-900 capitalize">{viewingItem.type}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Current Stock</p>
                  <p className={`text-xs font-bold ${viewingItem.quantity <= viewingItem.minStock ? 'text-red-600' : 'text-emerald-600'}`}>
                    {viewingItem.quantity} pcs
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Min / Max</p>
                  <p className="text-xs font-semibold text-slate-800">{viewingItem.minStock} / {viewingItem.maxStock}</p>
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

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                {viewingItem.type === 'inventory' ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setIsViewingItem(false);
                      setSavedItemForPrint(viewingItem);
                      setShowStickerPrintView(true);
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-7 px-3 gap-1"
                  >
                    <Printer size={13} />
                    Print Barcode Sticker
                  </Button>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">Non-Inventory Service</span>
                )}
                <span className="font-bold text-indigo-600 text-xs">
                  Stock Value: LKR {(viewingItem.quantity * viewingItem.costPrice).toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
