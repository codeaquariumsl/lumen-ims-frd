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
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Server-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Summary Metrics State (Full Catalog DB Aggr)
  const [summaryStats, setSummaryStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockCount: 0,
    overStockCount: 0
  });

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

  // Debounce search term changes (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

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

  // Fetch full inventory catalog summary stats from backend
  const fetchInventorySummary = async () => {
    try {
      const response = await apiClient.get('/products/summary');
      if (response.data?.success && response.data.data) {
        setSummaryStats({
          totalItems: Number(response.data.data.totalItems || 0),
          totalValue: Number(response.data.data.totalValue || 0),
          lowStockCount: Number(response.data.data.lowStockCount || 0),
          overStockCount: Number(response.data.data.overStockCount || 0)
        });
      }
    } catch (error) {
      console.error('Error fetching inventory summary:', error);
    }
  };

  // Fetch paginated inventory list from backend
  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/products', {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearchTerm.trim() || undefined,
          category: filterCategory !== 'all' ? filterCategory : undefined
        }
      });
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
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages || 1);
          setTotalItems(response.data.pagination.totalItems || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [currentPage, itemsPerPage, debouncedSearchTerm, filterCategory]);

  useEffect(() => {
    fetchInventorySummary();
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

  const handleFilterCategoryChange = (catName: string) => {
    setFilterCategory(catName);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      const left = Math.max(2, currentPage - 1);
      const right = Math.min(totalPages - 1, currentPage + 1);

      if (left > 2) {
        pages.push('ellipsis-left');
      }

      for (let i = left; i <= right; i++) {
        pages.push(i);
      }

      if (right < totalPages - 1) {
        pages.push('ellipsis-right');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const handleDeleteCategory = async (catItem: CategoryItem) => {
    const catName = catItem.name;
    const catObj = categoriesList.find((c) => c.name.toLowerCase() === catName.toLowerCase()) || catItem;
    const itemCount = catObj.item_count !== undefined ? catObj.item_count : 0;
    if (itemCount > 0) {
      alert(`Cannot delete category "${catName}" because ${itemCount} product(s) are assigned to it.`);
      return;
    }

    if (window.confirm(`Are you sure you want to remove the category "${catName}"?`)) {
      try {
        if (catObj.id) {
          await apiClient.delete(`/categories/${catObj.id}`);
        }
        if (filterCategory.toLowerCase() === catName.toLowerCase()) {
          setFilterCategory('all');
          setCurrentPage(1);
        }
        await fetchCategories();
        await fetchInventory();
        await fetchInventorySummary();
      } catch (error: any) {
        console.error('Error deleting category:', error);
        alert(error.response?.data?.message || `Failed to delete category "${catName}".`);
      }
    }
  };

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
        await fetchInventorySummary();
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
          await fetchInventory();
          await fetchInventorySummary();
          await fetchCategories();
        }
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  // Helper to generate vector Code128 SVG string for 2in x 1in stickers
  const generateBarcodeSvgString = (text: string, height = 24) => {
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
    const barHeight = height;
    for (let i = 0; i < pattern.length; i++) {
      const width = parseInt(pattern[i], 10);
      if (i % 2 === 0) {
        rects.push(`<rect x="${x}" y="0" width="${width}" height="${barHeight}" fill="#000000"/>`);
      }
      x += width;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x} ${barHeight}" preserveAspectRatio="none" style="width:100%;height:100%;display:block;">${rects.join('')}</svg>`;
  };

  // Helper Code128 SVG component renderer for React
  const renderBarcodeSvg = (text: string) => {
    return (
      <div
        className="w-full h-[20px] mx-auto flex items-center justify-center"
        dangerouslySetInnerHTML={{ __html: generateBarcodeSvgString(text, 24) }}
      />
    );
  };

  // Print Barcode Sticker (2in x 1in) using an isolated invisible iframe without touching the main window
  const handlePrintSticker = (item: InventoryItem) => {
    setSavedItemForPrint(item);
    setShowStickerPrintView(true);

    const barcodeText = item.barcode || `01${item.code}`;
    const barcodeSvgMarkup = generateBarcodeSvgString(barcodeText, 24);
    const itemName = item.name ? item.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
    const itemCode = item.code ? item.code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
    const formattedPrice = Number(item.sellingPrice || 0).toLocaleString();

    // Create an isolated hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title></title>
          <style>
            @page {
              size: 2in 1in portrait;
              margin: 0mm !important;
            }
            @page :first {
              margin: 0mm !important;
            }
            @page :left {
              margin: 0mm !important;
            }
            @page :right {
              margin: 0mm !important;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            html, body {
              width: 2in;
              height: 1in;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @media print {
              @page {
                size: 2in 1in portrait;
                margin: 0 0 0 10mm !important;
              }
              html, body {
                width: 2in !important;
                height: 1in !important;
                margin: 0 0 0 5mm !important;
                padding: 0 !important;
                overflow: hidden !important;
              }
              .sticker {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                page-break-after: always !important;
                break-after: page !important;
              }
            }
            .sticker {
              width: 2in;
              height: 1in;
              max-width: 2in;
              max-height: 1in;
              padding: 1.5mm 2.5mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              align-items: stretch;
              text-align: center;
              box-sizing: border-box;
              overflow: hidden;
              background: #ffffff;
              color: #000000;
              page-break-inside: avoid;
              break-inside: avoid;
              page-break-after: always;
              break-after: page;
            }
            .top-section {
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              width: 100%;
            }
            .brand {
              font-size: 7.5px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              line-height: 1;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .name {
              font-size: 8.5px;
              font-weight: 700;
              line-height: 1.1;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              margin: 0.5px 0;
            }
            .details-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 8px;
              font-weight: 700;
              padding-top: 1px;
              line-height: 1;
            }
            .code {
              font-size: 7.5px;
              color: #000000;
            }
            .price {
              font-size: 8px;
              font-weight: 900;
              color: #000000;
            }
            .bottom-section {
              display: flex;
              flex-direction: column;
              justify-content: flex-end;
              width: 100%;
            }
            .barcode-box {
              width: 100%;
              height: 22px;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              margin: 0.5px 0;
            }
            .barcode-box svg {
              width: 100%;
              height: 100%;
              display: block;
            }
            .barcode-num {
              font-size: 7.5px;
              font-weight: 700;
              font-family: monospace;
              letter-spacing: 1px;
              line-height: 1;
            }
          </style>
        </head>
        <body>
          <div class="sticker">
            <div class="top-section">
              <div class="brand">LUMEN OPTICALS</div>
              <div class="name">${itemName}</div>
              <div class="details-row">
                <span class="code">CODE: ${itemCode}</span>
                <span class="price">LKR ${formattedPrice}</span>
              </div>
            </div>
            <div class="bottom-section">
              <div class="barcode-box">${barcodeSvgMarkup}</div>
              <div class="barcode-num">*${barcodeText}*</div>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            console.error('Error during iframe printing:', e);
          } finally {
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 2000);
          }
        }, 150);
      }
    } catch (err) {
      console.error('Failed to print sticker via iframe:', err);
    }
  };

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
              <p className="text-sm font-bold text-slate-900 mt-1 leading-none">{summaryStats.totalItems}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-1.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <DollarSign size={14} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">Total Value</p>
              <p className="text-sm font-bold text-indigo-600 mt-1 leading-none">
                LKR {Number(summaryStats.totalValue).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
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
                <span className="text-sm font-bold text-red-600 leading-none">{summaryStats.lowStockCount}</span>
                {summaryStats.lowStockCount > 0 && (
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
              <p className="text-sm font-bold text-amber-600 mt-1 leading-none">{summaryStats.overStockCount}</p>
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
              onClick={() => {
                setSearchTerm('');
                setDebouncedSearchTerm('');
                setCurrentPage(1);
              }}
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
              onChange={(e) => handleFilterCategoryChange(e.target.value)}
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
            {totalItems} item{totalItems !== 1 ? 's' : ''}
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
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
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
                            onClick={() => handlePrintSticker(item)}
                            className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50 rounded-md"
                            title="Print Barcode Sticker (2x1 in)"
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

      {/* Server-Side Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 py-2.5 bg-white border border-slate-200 rounded-xl shadow-xs text-xs">
        <div className="flex flex-wrap items-center gap-3 text-slate-500">
          <span>
            {totalItems > 0 ? (
              <>
                Showing <strong className="text-slate-800 font-semibold">{((currentPage - 1) * itemsPerPage) + 1}</strong> to{' '}
                <strong className="text-slate-800 font-semibold">{Math.min(currentPage * itemsPerPage, totalItems)}</strong> of{' '}
                <strong className="text-slate-800 font-semibold">{totalItems}</strong> items
              </>
            ) : (
              'No products found'
            )}
          </span>
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
            <span className="text-[11px] text-slate-400">Rows per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-7 px-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Page navigation controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1 flex-wrap justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1 || isLoading}
              className="h-7 w-7 p-0 border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-40"
              title="First Page"
            >
              <ChevronsLeft size={13} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
              className="h-7 px-2 border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-40 gap-1 text-[11px]"
            >
              <ChevronLeft size={13} />
              <span className="hidden sm:inline">Prev</span>
            </Button>

            {getPageNumbers().map((page, idx) => {
              if (typeof page === 'string') {
                return (
                  <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 font-bold select-none text-[11px]">
                    ...
                  </span>
                );
              }
              return (
                <Button
                  key={`page-${page}`}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  disabled={isLoading}
                  className={`h-7 min-w-[28px] px-1.5 text-xs font-semibold ${
                    currentPage === page
                      ? 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900 shadow-xs'
                      : 'border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || isLoading}
              className="h-7 px-2 border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-40 gap-1 text-[11px]"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={13} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || isLoading}
              className="h-7 w-7 p-0 border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-40"
              title="Last Page"
            >
              <ChevronsRight size={13} />
            </Button>
          </div>
        )}
      </div>

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
                const count = catObj?.item_count !== undefined ? Number(catObj.item_count) : 0;
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

            {/* Mini Barcode Sticker Preview (2in x 1in proportional) */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Sticker Label Preview (2" × 1")</p>
              <div className="w-[2in] h-[1in] p-[1.5mm] bg-white border border-dashed border-slate-300 rounded-xs text-center flex flex-col justify-between shadow-xs font-mono text-slate-900 overflow-hidden box-border">
                {/* Item Details (Above Middle Fold/Gap) */}
                <div className="flex flex-col justify-start">
                  <div className="text-[7.5px] font-black tracking-widest text-black uppercase leading-tight truncate">
                    LUMEN OPTICALS
                  </div>
                  <div className="text-[8.5px] font-bold text-black truncate leading-tight my-px">
                    {savedItemForPrint.name}
                  </div>
                  <div className="flex items-center justify-between text-[8px] font-bold pt-[1px] leading-none">
                    <span className="text-slate-700">CODE: {savedItemForPrint.code}</span>
                    <span className="text-black font-extrabold">LKR {savedItemForPrint.sellingPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* Barcode (Below Middle Fold/Gap) */}
                <div className="flex flex-col justify-end">
                  <div className="w-full flex items-center justify-center my-px overflow-hidden">
                    {renderBarcodeSvg(savedItemForPrint.barcode || `01${savedItemForPrint.code}`)}
                  </div>
                  <div className="text-[7.5px] font-bold tracking-wider text-black leading-none font-mono">
                    *{savedItemForPrint.barcode || `01${savedItemForPrint.code}`}*
                  </div>
                </div>
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
                  handlePrintSticker(savedItemForPrint);
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
                  <p className="text-[11px] text-slate-400">Size: 2" × 1" (50.8mm × 25.4mm)</p>
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

            {/* Printable Sticker Box (2in x 1in standard optical label) */}
            <div className="flex flex-col items-center justify-center my-3 p-4 bg-slate-100/70 rounded-xl border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500 mb-2.5 flex items-center gap-1.5">
                <span>Sticker Label Size: <strong className="text-slate-800">2" × 1" (50.8mm × 25.4mm)</strong></span>
              </div>
              <div
                id="barcode-sticker-printable"
                className="w-[2in] h-[1in] p-[1.5mm] bg-white border border-dashed border-slate-400 rounded-xs text-center flex flex-col justify-between shadow-sm font-mono text-slate-900 overflow-hidden box-border select-none"
                style={{ width: '2in', height: '1in' }}
              >
                {/* Item Details (Above Middle Fold/Gap) */}
                <div className="flex flex-col justify-start">
                  <div className="text-[7.5px] font-black tracking-widest text-black uppercase leading-tight truncate">
                    LUMEN OPTICALS
                  </div>
                  <div className="text-[8.5px] font-bold text-black truncate leading-tight my-px">
                    {savedItemForPrint.name}
                  </div>
                  <div className="flex items-center justify-between text-[8px] font-bold pt-[1px] leading-none">
                    <span className="text-black">CODE: {savedItemForPrint.code}</span>
                    <span className="text-black font-extrabold">LKR {savedItemForPrint.sellingPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* Barcode (Below Middle Fold/Gap) */}
                <div className="flex flex-col justify-end">
                  <div className="w-full flex items-center justify-center my-px overflow-hidden">
                    {renderBarcodeSvg(savedItemForPrint.barcode || `01${savedItemForPrint.code}`)}
                  </div>
                  <div className="text-[7.5px] font-bold tracking-wider text-black leading-none font-mono">
                    *{savedItemForPrint.barcode || `01${savedItemForPrint.code}`}*
                  </div>
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
                onClick={() => savedItemForPrint && handlePrintSticker(savedItemForPrint)}
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
                      handlePrintSticker(viewingItem);
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
