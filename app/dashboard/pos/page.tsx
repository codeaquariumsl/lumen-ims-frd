'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Eye,
  X,
  User,
  Check,
  CreditCard,
  Banknote,
  QrCode,
  FileText,
  Filter,
  PackageCheck,
  DollarSign,
  Calendar,
  Building,
  ShieldCheck,
  Link as LinkIcon
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/lib/auth/auth-context';
import { printSalePDF } from '@/lib/pdf/sales-pdf';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}

function POSContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkedOutSale, setCheckedOutSale] = useState<any | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<any | null>(null);
  const [prescriptionCharges, setPrescriptionCharges] = useState<string>('');

  // Customer Prescriptions Dialog State
  const [isCustomerRxDialogOpen, setIsCustomerRxDialogOpen] = useState(false);
  const [customerPrescriptions, setCustomerPrescriptions] = useState<any[]>([]);
  const [isLoadingCustomerRx, setIsLoadingLoadingCustomerRx] = useState(false);

  // Payment Modal State
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'full' | 'advance'>('full');
  const [advanceAmountInput, setAdvanceAmountInput] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);

  const customerDropdownRef = useRef<HTMLDivElement>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/products', {
        params: {
          search: searchTerm,
          limit: 100
        }
      });
      if (response.data?.success) {
        const mapped = (response.data.data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          price: parseFloat(p.selling_price || '0'),
          category: p.category || 'General',
          stock: p.quantity || 0
        }));
        setProducts(mapped);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await apiClient.get('/customers', {
        params: { limit: 100 }
      });
      if (response.data?.success) {
        setCustomers(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchTerm]);

  // Read prescriptionId and customerId query params
  useEffect(() => {
    const pxId = searchParams.get('prescriptionId');
    const cId = searchParams.get('customerId');

    if (cId) {
      setSelectedCustomerId(cId);
    }

    if (pxId) {
      apiClient
        .get(`/prescriptions/${pxId}`)
        .then((response) => {
          if (response.data?.success) {
            const px = response.data.data;
            setSelectedPrescription(px);
            if (px.customer_id) {
              setSelectedCustomerId(String(px.customer_id));
            }
          }
        })
        .catch((error) => {
          console.error('Error loading prescription for POS:', error);
        });
    }
  }, [searchParams]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Categories list
  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesCat;
  });

  const filteredCustomers = customers.filter((c) => {
    if (!searchCustomer) return true;
    const term = searchCustomer.toLowerCase();
    const fullName = `${c.first_name} ${c.last_name || ''}`.toLowerCase();
    const phone = (c.phone || '').toLowerCase();
    return fullName.includes(term) || phone.includes(term);
  });

  const selectedCustomerObj = customers.find((c) => String(c.id) === selectedCustomerId);

  // Fetch prescriptions for selected customer and open dialog
  const openCustomerRxDialog = async (cId: string) => {
    if (!cId) return;
    setIsLoadingLoadingCustomerRx(true);
    setIsCustomerRxDialogOpen(true);
    try {
      const response = await apiClient.get('/prescriptions', {
        params: { customerId: cId, limit: 50 }
      });
      if (response.data?.success) {
        setCustomerPrescriptions(response.data.data || []);
      } else {
        setCustomerPrescriptions([]);
      }
    } catch (error) {
      console.error('Error fetching customer prescriptions:', error);
      setCustomerPrescriptions([]);
    } finally {
      setIsLoadingLoadingCustomerRx(false);
    }
  };

  const addToCart = (product: (typeof products)[0]) => {
    const existing = cartItems.find((item) => item.id === product.id);
    const currentQtyInCart = existing ? existing.quantity : 0;

    if (product.stock <= currentQtyInCart) {
      alert(`Stock limit reached for "${product.name}". Available stock: ${product.stock}`);
      return;
    }

    if (existing) {
      setCartItems(
        cartItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCartItems([
        ...cartItems,
        { id: product.id, name: product.name, price: product.price, quantity: 1, category: product.category }
      ]);
    }
  };

  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    const product = products.find((p) => p.id === id);
    if (product && product.stock < quantity) {
      alert(`Cannot exceed available stock of ${product.stock}.`);
      return;
    }

    setCartItems(
      cartItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  // Calculations
  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const rxCharges = parseFloat(prescriptionCharges || '0') || 0;
  const total = subtotal + rxCharges;

  // Advance Payment calculations
  const parsedAdvanceInput = parseFloat(advanceAmountInput || '0') || 0;
  const advancePaid = paymentType === 'full' ? total : Math.min(total, parsedAdvanceInput);
  const balanceDue = Math.max(0, total - advancePaid);

  // Open Payment Dialog
  const openPaymentDialog = () => {
    if (cartItems.length === 0 && rxCharges === 0) {
      alert('Cart is empty and no prescription charges entered');
      return;
    }

    if (selectedPrescription && !selectedCustomerId) {
      alert('Please select a customer for this prescription order.');
      return;
    }

    setPaymentType('full');
    setAdvanceAmountInput(total.toFixed(2));
    setPaymentNotes('');
    setIsPaymentDialogOpen(true);
  };

  // Execute Final Checkout
  const handleExecuteCheckout = async () => {
    setIsSubmittingCheckout(true);

    const selectedCustomer = selectedCustomerObj;
    const customerLabel = selectedCustomer
      ? `${selectedCustomer.first_name} ${selectedCustomer.last_name || ''}`.trim()
      : 'Walk-in customer';

    const rxLabel = selectedPrescription
      ? `Rx #${selectedPrescription.prescription_number || selectedPrescription.prescriptionNumber || selectedPrescription.id}`
      : null;

    const paymentStatus = balanceDue > 0 ? 'partial' : 'completed';

    const formattedNotes = [
      `Customer: ${customerLabel}`,
      rxLabel ? `Rx: ${rxLabel}` : null,
      paymentType === 'advance' ? `Paid Advance: LKR ${advancePaid.toFixed(2)}` : null,
      balanceDue > 0 ? `Balance Due: LKR ${balanceDue.toFixed(2)}` : null,
      paymentNotes ? `Notes: ${paymentNotes}` : null
    ]
      .filter(Boolean)
      .join(' | ');

    try {
      const payload = {
        customerId: selectedCustomerId ? parseInt(selectedCustomerId) : undefined,
        prescriptionId: selectedPrescription ? parseInt(selectedPrescription.id) : undefined,
        items: cartItems.map((item) => ({
          productId: parseInt(item.id),
          quantity: item.quantity
        })),
        paymentMethod: paymentMethod,
        paymentStatus: paymentStatus,
        prescriptionCharges: rxCharges,
        advanceAmount: advancePaid,
        balanceAmount: balanceDue,
        notes: formattedNotes
      };

      const response = await apiClient.post('/sales/checkout', payload);
      if (response.data?.success) {
        const saleData = response.data.data;
        const fullSaleRecord = {
          ...saleData,
          prescription_charges: rxCharges,
          attached_prescription: selectedPrescription,
          advance_paid: advancePaid,
          advance_amount: advancePaid,
          balance_due: balanceDue,
          balance_amount: balanceDue,
          payment_type: paymentType,
          customer_name: customerLabel,
          notes: formattedNotes
        };
        setCheckedOutSale(fullSaleRecord);
        setCartItems([]);
        setSelectedCustomerId('');
        setSelectedPrescription(null);
        setPrescriptionCharges('');
        setIsPaymentDialogOpen(false);
        fetchProducts();

        printSalePDF(fullSaleRecord, undefined, user?.companyDetails);
      }
    } catch (error) {
      console.error('Checkout failed:', error);
    } finally {
      setIsSubmittingCheckout(false);
    }
  };

  return (
    <>
      <div className="space-y-3 print:hidden">
        {/* Compact Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="text-slate-900" size={22} />
              Point of Sale
            </h1>
            <p className="text-xs text-slate-500">Fast checkout, advance payment management & prescription orders</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
              Cart Items: <span className="text-indigo-600 font-bold">{totalItemCount}</span>
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
              Total: <span className="font-bold">LKR {total.toFixed(2)}</span>
            </span>
          </div>
        </div>

        {/* Selected Prescription Details Compact Panel */}
        {selectedPrescription && (
          <div className="bg-slate-900 text-white p-2 rounded-xl border border-slate-800 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-semibold text-xs text-slate-100 uppercase tracking-wider">Attached Optical Prescription</span>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                  Rx #: {selectedPrescription.prescription_number || selectedPrescription.prescriptionNumber || selectedPrescription.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedPrescription(null)}
                className="text-red-300 hover:text-white hover:bg-slate-800 p-1 rounded transition-colors text-xs flex items-center gap-1"
                title="Remove attached prescription"
              >
                <X size={14} />
                <span>Remove</span>
              </button>
            </div>

            <div className="grid grid-cols-6 gap-2 text-xs">
              <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Customer</span>
                <span className="font-medium text-slate-100 truncate block">
                  {selectedPrescription.first_name
                    ? `${selectedPrescription.first_name} ${selectedPrescription.last_name || ''}`.trim()
                    : selectedPrescription.customerName || 'Selected Customer'}
                </span>
              </div>
              <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Type</span>
                <span className="font-medium text-slate-100 capitalize block">
                  {selectedPrescription.prescription_type || selectedPrescription.prescriptionType || 'Single Vision'}
                </span>
              </div>
              <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Right Eye (OD)</span>
                <span className="font-mono font-semibold text-blue-400 block">
                  {selectedPrescription.od_sph}/{selectedPrescription.od_cyl}@{selectedPrescription.od_axis}°
                </span>
              </div>
              <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Left Eye (OS)</span>
                <span className="font-mono font-semibold text-indigo-400 block">
                  {selectedPrescription.os_sph}/{selectedPrescription.os_cyl}@{selectedPrescription.os_axis}°
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1 col-span-2">
                <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                  <strong className="text-slate-400">PD:</strong> {selectedPrescription.pd} mm
                </span>
                {selectedPrescription.fitting_height && (
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                    <strong className="text-slate-400">Fitting Height:</strong> {selectedPrescription.fitting_height} mm
                  </span>
                )}
                {selectedPrescription.segment_height && (
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                    <strong className="text-slate-400">Segment Height:</strong> {selectedPrescription.segment_height} mm
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Grid: Products Left (2 col), Cart Right (1 col) */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Products Column */}
          <div className="col-span-2 space-y-3">
            {/* Search & Category Filter Bar */}
            <Card className="p-3 bg-white border border-slate-200 shadow-sm rounded-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  type="text"
                  placeholder="Search optical items, frames, lenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Category Pills Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar mt-2">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mr-1 flex items-center gap-1 shrink-0">
                  <Filter size={12} />
                  Cat:
                </span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition-all border ${selectedCategory === cat
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </Card>

            {/* Compact Products Grid */}
            {isLoading ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
                Loading product catalog...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
                No products found matching your search.
              </div>
            ) : (
              <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {filteredProducts.map((product) => {
                  const itemInCart = cartItems.find((item) => item.id === product.id);
                  const isOutOfStock = product.stock <= 0;

                  return (
                    <Card
                      key={product.id}
                      onClick={() => !isOutOfStock && addToCart(product)}
                      className={`p-3 bg-white border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all cursor-pointer rounded-xl flex flex-col justify-between relative group ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''
                        }`}
                    >
                      {itemInCart && (
                        <span className="absolute top-2 right-2 bg-slate-900 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                          {itemInCart.quantity}
                        </span>
                      )}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                            {product.category}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isOutOfStock
                              ? 'bg-red-100 text-red-700'
                              : product.stock <= 5
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                              }`}
                          >
                            {isOutOfStock ? 'Out of Stock' : `${product.stock} in stock`}
                          </span>
                        </div>
                        <h4 className="font-semibold text-xs text-slate-900 line-clamp-2 min-h-[32px] group-hover:text-indigo-600 transition-colors">
                          {product.name}
                        </h4>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Price</span>
                          <span className="text-xs font-bold text-slate-900 font-mono">
                            LKR {product.price.toFixed(2)}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          disabled={isOutOfStock}
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          className="h-7 px-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg gap-1"
                        >
                          <Plus size={13} />
                          Add
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart Sidebar Column */}
          <div className="space-y-2">
            <Card className="p-4 bg-white border border-slate-200 shadow-sm rounded-xl sticky top-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={18} className="text-slate-900" />
                  <h2 className="text-sm font-bold text-slate-900">Current Order</h2>
                </div>
                {cartItems.length > 0 && (
                  <button
                    onClick={() => setCartItems([])}
                    className="text-slate-400 hover:text-red-600 text-xs font-medium transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Searchable Customer Selection */}
              <div className="relative" ref={customerDropdownRef}>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Customer {selectedPrescription ? <span className="text-red-500">*</span> : <span className="text-slate-400 font-normal lowercase">(optional)</span>}
                </label>
                {selectedCustomerObj ? (
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {selectedCustomerObj.first_name?.[0]?.toUpperCase() || 'C'}
                      </div>
                      <div className="truncate flex-1">
                        <p className="font-semibold text-slate-900 truncate">
                          {selectedCustomerObj.first_name} {selectedCustomerObj.last_name || ''}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">{selectedCustomerObj.phone || selectedCustomerObj.email || 'No phone'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openCustomerRxDialog(selectedCustomerId)}
                        className="flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200 rounded-md text-[11px] transition-colors"
                        title="View & Link Prescriptions"
                      >
                        <Eye size={13} />
                        <span>Rx List</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCustomerId('');
                          setSearchCustomer('');
                          setSelectedPrescription(null);
                        }}
                        className="text-slate-400 hover:text-red-600 p-1"
                        title="Clear customer"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search customer by name/phone..."
                      value={searchCustomer}
                      onChange={(e) => {
                        setSearchCustomer(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      className="pl-8 text-xs h-8"
                    />
                    {showCustomerDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                        <button
                          onClick={() => {
                            setSelectedCustomerId('');
                            setShowCustomerDropdown(false);
                            setSearchCustomer('');
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
                        >
                          Walk-in Customer
                        </button>
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => {
                                setSelectedCustomerId(String(c.id));
                                setShowCustomerDropdown(false);
                                setSearchCustomer('');
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-xs transition-colors"
                            >
                              <p className="font-semibold text-slate-900">
                                {c.first_name} {c.last_name || ''}
                              </p>
                              <p className="text-[10px] text-slate-500">{c.phone || c.email || 'No phone'}</p>
                            </button>
                          ))
                        ) : (
                          <div className="p-3 text-center text-xs text-slate-400">No customers found</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cart Items List */}
              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-0.5 divide-y divide-slate-100">
                {cartItems.length === 0 ? (
                  <div className="py-5 text-center border-2 border-dashed border-slate-100 rounded-xl">
                    <ShoppingCart size={24} className="mx-auto mb-1 text-slate-300" />
                    <p className="text-xs font-medium text-slate-500">Cart is empty</p>
                    <p className="text-[10px] text-slate-400">Add products to build order</p>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{item.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          LKR {item.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1 bg-slate-100 rounded-md p-0.5 shrink-0">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-5 h-5 flex items-center justify-center bg-white hover:bg-slate-200 rounded text-slate-700 transition-colors"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="w-5 text-center font-bold text-xs text-slate-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-5 h-5 flex items-center justify-center bg-white hover:bg-slate-200 rounded text-slate-700 transition-colors"
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-bold text-slate-900 font-mono text-xs">
                          {(item.price * item.quantity).toFixed(2)}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Prescription Charges Input */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Prescription Charges <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">LKR</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={prescriptionCharges}
                    onChange={(e) => setPrescriptionCharges(e.target.value)}
                    className="pl-10 text-xs h-8 font-mono"
                  />
                </div>
              </div>

              {/* Bill Summary */}
              <div className="pt-1 border-t border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({totalItemCount} items):</span>
                  <span className="font-mono font-medium">LKR {subtotal.toFixed(2)}</span>
                </div>
                {rxCharges > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Prescription Fee:</span>
                    <span className="font-mono">LKR {rxCharges.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-100">
                  <span>Total Payable:</span>
                  <span className="text-emerald-700 font-mono text-base">LKR {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Open Payment Dialog Button */}
              <Button
                onClick={openPaymentDialog}
                disabled={cartItems.length === 0 && rxCharges === 0}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium h-10 text-xs rounded-xl shadow-sm gap-2 mt-1"
              >
                <PackageCheck size={16} />
                Proceed to Payment Dialog
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* Customer Prescriptions Selector Modal Dialog */}
      {isCustomerRxDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <Card className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 space-y-0 max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Eye size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Prescriptions for {selectedCustomerObj ? `${selectedCustomerObj.first_name} ${selectedCustomerObj.last_name || ''}` : 'Selected Customer'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Select a prescription record to attach to this POS order</p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomerRxDialogOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content / Prescriptions List */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {isLoadingCustomerRx ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Loading customer prescriptions...
                </div>
              ) : customerPrescriptions.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                  <Eye size={36} className="mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">No Prescriptions Found</p>
                  <p className="text-xs text-slate-500">This customer has no eye prescription history on record.</p>
                </div>
              ) : (
                customerPrescriptions.map((rx) => {
                  const isAlreadySelected = selectedPrescription?.id === rx.id;

                  return (
                    <div
                      key={rx.id}
                      className={`p-3.5 border rounded-xl transition-all space-y-2.5 ${isAlreadySelected
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs'
                        }`}
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            Rx #{rx.prescription_number || rx.prescriptionNumber || rx.id}
                          </span>
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 capitalize">
                            {rx.prescription_type || rx.prescriptionType || 'Single Vision'}
                          </span>
                          {isAlreadySelected && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <Check size={12} />
                              Currently Attached
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          Date: {rx.prescription_date ? new Date(rx.prescription_date).toLocaleDateString('en-IN') : 'N/A'}
                        </div>
                      </div>

                      {/* Optical Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Right Eye (OD)</span>
                          <span className="font-mono font-bold text-blue-700">
                            {parseFloat(rx.od_sph || '0').toFixed(2)} / {parseFloat(rx.od_cyl || '0').toFixed(2)} @ {rx.od_axis || 0}°
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Left Eye (OS)</span>
                          <span className="font-mono font-bold text-indigo-700">
                            {parseFloat(rx.os_sph || '0').toFixed(2)} / {parseFloat(rx.os_cyl || '0').toFixed(2)} @ {rx.os_axis || 0}°
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase block">PD</span>
                          <span className="font-mono font-bold text-slate-900">{rx.pd || 62} mm</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-end">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedPrescription(rx);
                              setIsCustomerRxDialogOpen(false);
                            }}
                            className={`h-7 px-3 text-xs font-semibold gap-1.5 ${isAlreadySelected
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                              }`}
                          >
                            <LinkIcon size={12} />
                            {isAlreadySelected ? 'Attached' : 'Link to Order'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-5 py-3 bg-slate-50 border-t border-slate-200 shrink-0">
              <Button
                variant="outline"
                onClick={() => setIsCustomerRxDialogOpen(false)}
                className="h-8 text-xs px-4"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Payment & Advance Payment Modal Dialog */}
      {isPaymentDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <Card className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 space-y-0">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Payment & Checkout Management</h3>
                  <p className="text-[11px] text-slate-400">Manage payment options, advance deposits & final settlement</p>
                </div>
              </div>
              <button
                onClick={() => setIsPaymentDialogOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Customer & Prescription Summary Banner */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Customer</span>
                  <span className="font-semibold text-slate-900 text-xs">
                    {selectedCustomerObj
                      ? `${selectedCustomerObj.first_name} ${selectedCustomerObj.last_name || ''}`.trim()
                      : 'Walk-in Customer'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Order Payable</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">LKR {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Mode Selector Tabs (Full vs Advance) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Payment Type Options
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType('full');
                      setAdvanceAmountInput(total.toFixed(2));
                    }}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${paymentType === 'full'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    <Check size={14} className={paymentType === 'full' ? 'text-emerald-600' : 'opacity-0'} />
                    Full Payment (LKR {total.toFixed(2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType('advance');
                      setAdvanceAmountInput((total * 0.5).toFixed(2));
                    }}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${paymentType === 'advance'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    <Check size={14} className={paymentType === 'advance' ? 'text-emerald-600' : 'opacity-0'} />
                    Advance Deposit Payment
                  </button>
                </div>
              </div>

              {/* Advance Payment Details Inputs */}
              {paymentType === 'advance' && (
                <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                    <span className="font-semibold text-amber-900 text-xs">Advance Payment Calculation</span>
                    <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">
                      Partial Deposit Mode
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Advance Amount Received (LKR) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">LKR</span>
                        <Input
                          type="number"
                          min="0"
                          max={total}
                          step="0.01"
                          value={advanceAmountInput}
                          onChange={(e) => setAdvanceAmountInput(e.target.value)}
                          className="pl-10 text-xs h-9 font-mono font-semibold text-slate-900 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Remaining Balance Due (LKR)
                      </label>
                      <div className="h-9 px-3 bg-white border border-slate-300 rounded-lg flex items-center font-mono font-bold text-red-600 text-xs">
                        LKR {balanceDue.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Preset Deposit Percentage Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] font-semibold text-amber-900 uppercase">Quick Presets:</span>
                    {[0.25, 0.50, 0.75].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setAdvanceAmountInput((total * pct).toFixed(2))}
                        className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-amber-300 rounded text-amber-900 hover:bg-amber-100"
                      >
                        {pct * 100}% (LKR {(total * pct).toFixed(2)})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Method Selector Pills inside Dialog */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Payment Method *
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'cash', label: 'Cash', icon: Banknote },
                    { id: 'card', label: 'Card', icon: CreditCard },
                    { id: 'upi', label: 'UPI / QR', icon: QrCode },
                    { id: 'cheque', label: 'Cheque', icon: FileText },
                  ].map((pm) => {
                    const IconComp = pm.icon;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${paymentMethod === pm.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                          }`}
                      >
                        <IconComp size={14} />
                        {pm.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Notes Input */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Cashier Notes / Receipt Remarks <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Balance due on frame delivery..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="text-xs h-8"
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-slate-50 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => setIsPaymentDialogOpen(false)}
                disabled={isSubmittingCheckout}
                className="h-9 text-xs px-4"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExecuteCheckout}
                disabled={isSubmittingCheckout}
                className="h-9 text-xs px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-sm"
              >
                <PackageCheck size={16} />
                {isSubmittingCheckout ? 'Processing...' : 'Confirm & Process Payment'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Print Receipt View (hidden except in print mode) */}
      {checkedOutSale && (
        <div className="hidden print:block p-8 bg-white text-black text-sm max-w-lg mx-auto border-none">
          <div className="text-center space-y-2 mb-6 border-b pb-4">
            <h2 className="text-xl font-bold uppercase tracking-wide">Lumen Opticals</h2>
            <p className="text-xs text-gray-500 font-mono">Colombo, Sri Lanka</p>
            <p className="text-xs font-mono">Phone: +94 11 234 5678</p>
            <p className="text-xs text-gray-400 font-mono mt-2">SALES RECEIPT</p>
          </div>

          <div className="space-y-1 mb-4 text-xs font-mono">
            <div className="flex justify-between">
              <span>Invoice No:</span>
              <span className="font-bold">{checkedOutSale.invoice_number || checkedOutSale.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{new Date(checkedOutSale.sale_date || checkedOutSale.saleDate).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span>{checkedOutSale.staff_name || 'System Cashier'}</span>
            </div>
            <div className="flex justify-between border-t border-dashed pt-1 mt-1">
              <span>Customer:</span>
              <span>{checkedOutSale.customer_name || (checkedOutSale.first_name ? `${checkedOutSale.first_name} ${checkedOutSale.last_name || ''}` : 'Walk-in')}</span>
            </div>
          </div>

          {/* Printed Prescription Details if present */}
          {checkedOutSale.attached_prescription && (
            <div className="border-t border-dashed py-2 mb-3 text-xs font-mono">
              <p className="font-bold text-center mb-1 uppercase">Eye Prescription</p>
              <div className="flex justify-between">
                <span>OD (Right):</span>
                <span>{checkedOutSale.attached_prescription.od_sph}/{checkedOutSale.attached_prescription.od_cyl}@{checkedOutSale.attached_prescription.od_axis}°</span>
              </div>
              <div className="flex justify-between">
                <span>OS (Left):</span>
                <span>{checkedOutSale.attached_prescription.os_sph}/{checkedOutSale.attached_prescription.os_cyl}@{checkedOutSale.attached_prescription.os_axis}°</span>
              </div>
              <div className="flex justify-between">
                <span>PD:</span>
                <span>{checkedOutSale.attached_prescription.pd} mm</span>
              </div>
            </div>
          )}

          <div className="border-t border-b border-dashed py-2 mb-4">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-dashed text-gray-500">
                  <th className="text-left pb-1">Item Description</th>
                  <th className="text-center pb-1">Qty</th>
                  <th className="text-right pb-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {checkedOutSale.items?.map((item: any) => (
                  <tr key={item.id}>
                    <td className="py-1">
                      <div>{item.name}</div>
                      <div className="text-[10px] text-gray-400">@{parseFloat(item.unit_price).toFixed(2)}</div>
                    </td>
                    <td className="text-center py-1">{item.quantity}</td>
                    <td className="text-right py-1">LKR.{parseFloat(item.line_total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-1.5 text-xs font-mono border-b border-dashed pb-3 mb-4 flex flex-col items-end">
            <div className="flex justify-between w-56 text-gray-500">
              <span>Subtotal:</span>
              <span>LKR.{parseFloat(checkedOutSale.total_amount || subtotal).toFixed(2)}</span>
            </div>
            {checkedOutSale.prescription_charges > 0 && (
              <div className="flex justify-between w-56 text-gray-600 font-semibold">
                <span>Rx Fee:</span>
                <span>LKR.{parseFloat(checkedOutSale.prescription_charges).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between w-56 font-bold border-t border-dashed pt-1 mt-1">
              <span>Grand Total:</span>
              <span>LKR.{(parseFloat(checkedOutSale.net_amount || subtotal) + (checkedOutSale.prescription_charges || 0)).toFixed(2)}</span>
            </div>

            {/* Advance Payment Details on Receipt */}
            {checkedOutSale.payment_type === 'advance' && (
              <>
                <div className="flex justify-between w-56 font-semibold text-emerald-700 border-t border-dashed pt-1 mt-1">
                  <span>Advance Paid:</span>
                  <span>LKR.{checkedOutSale.advance_paid?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-56 font-bold text-red-600">
                  <span>Balance Due:</span>
                  <span>LKR.{checkedOutSale.balance_due?.toFixed(2)}</span>
                </div>
              </>
            )}

            <div className="flex justify-between w-56 text-[10px] text-gray-400 mt-1">
              <span>Payment Method:</span>
              <span>{(checkedOutSale.payment_method || 'CASH').toUpperCase()}</span>
            </div>
            {checkedOutSale.balance_due > 0 && (
              <div className="flex justify-between w-56 text-[10px] text-amber-700 font-bold">
                <span>Status:</span>
                <span>PARTIAL / ADVANCE PAYMENT</span>
              </div>
            )}
          </div>

          <div className="text-center text-[10px] text-gray-400 mt-6 space-y-1">
            <p>Thank you for shopping with Lumen Opticals!</p>
            <p>Keep this receipt for lens warranty and balance collection.</p>
          </div>
        </div>
      )}
    </>
  );
}

export default function POSPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Loading POS...</div>}>
      <POSContent />
    </Suspense>
  );
}
