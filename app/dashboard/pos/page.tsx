'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Trash2, ShoppingCart, Receipt } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function POSPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkedOutSale, setCheckedOutSale] = useState<any | null>(null);

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
          category: p.category,
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

  const filteredProducts = products;

  const addToCart = (product: (typeof products)[0]) => {
    // Check if enough stock is available before adding
    const existing = cartItems.find((item) => item.id === product.id);
    const currentQtyInCart = existing ? existing.quantity : 0;

    if (product.stock <= currentQtyInCart) {
      alert(`Cannot add more. Available stock for "${product.name}" is ${product.stock}.`);
      return;
    }

    if (existing) {
      setCartItems(
        cartItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCartItems([...cartItems, { id: product.id, name: product.name, price: product.price, quantity: 1 }]);
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

    // Check stock limit on change
    const product = products.find((p) => p.id === id);
    if (product && product.stock < quantity) {
      alert(`Cannot exceed stock limit. Available stock is ${product.stock}.`);
      return;
    }

    setCartItems(
      cartItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert('Cart is empty');
      return;
    }

    const selectedCustomer = customers.find(c => String(c.id) === selectedCustomerId);
    const customerLabel = selectedCustomer
      ? `Customer: ${selectedCustomer.first_name} ${selectedCustomer.last_name || ''}`
      : 'Walk-in customer';

    try {
      const payload = {
        customerId: selectedCustomerId ? parseInt(selectedCustomerId) : undefined,
        items: cartItems.map((item) => ({
          productId: parseInt(item.id),
          quantity: item.quantity
        })),
        paymentMethod: paymentMethod,
        notes: customerLabel
      };

      const response = await apiClient.post('/sales/checkout', payload);
      if (response.data?.success) {
        const saleData = response.data.data;
        setCheckedOutSale(saleData);
        setCartItems([]);
        setSelectedCustomerId('');
        fetchProducts(); // Refresh active stock levels
        
        // Trigger print after state update renders
        setTimeout(() => {
          window.print();
        }, 300);
      }
    } catch (error) {
      console.error('Checkout failed:', error);
    }
  };

  return (
    <>
      <div className="space-y-2 print:hidden">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Point of Sale</h1>
        <p className="mt-2 text-gray-600">Process customer sales and generate invoices</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Products Section */}
        <div className="col-span-2 space-y-2">
          {/* Search */}
          <Card className="p-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </Card>

          {/* Products Grid */}
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="p-2">
                  <p className="text-xs text-gray-500 mb-1">{product.category}</p>
                  <p className="font-medium text-sm text-gray-900 line-clamp-2">
                    {product.name}
                  </p>
                  <p className="text-lg font-bold text-indigo-600 mt-2">
                    LKR.{product.price}
                  </p>
                  <Button
                    onClick={() => addToCart(product)}
                    size="sm"
                    className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart Section */}
        <div className="space-y-4">
          <Card className="p-6 sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart size={24} className="text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">Cart</h2>
            </div>

            {/* Customer Info */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Select Customer (Optional)
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="">Walk-in Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name || ''} ({c.phone || 'No Phone'})
                  </option>
                ))}
              </select>
            </div>

            {/* Cart Items */}
            <div className="max-h-64 overflow-y-auto space-y-2 mb-4 border-b pb-4">
              {cartItems.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Cart is empty</p>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-start bg-gray-50 p-2 rounded text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 line-clamp-1">{item.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-1.5 py-0.5 bg-gray-200 hover:bg-gray-300 rounded text-xs"
                        >
                          −
                        </button>
                        <span className="px-2 text-xs font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-1.5 py-0.5 bg-gray-200 hover:bg-gray-300 rounded text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        LKR.{(item.price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-700 mt-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
                <option value="credit">Credit</option>
              </select>
            </div>

            {/* Bill Summary */}
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">LKR.{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (5%):</span>
                <span className="font-medium">LKR.{tax.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-indigo-600">LKR.{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <Button
              onClick={handleCheckout}
              disabled={cartItems.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
            >
              Checkout
            </Button>

            <Button
              onClick={() => setCartItems([])}
              variant="outline"
              className="w-full mt-2"
            >
              Clear Cart
            </Button>
          </Card>
        </div>
      </div>
      </div>
      
      {/* Print receipt container (visible ONLY in print mode) */}
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
              <span>{checkedOutSale.first_name ? `${checkedOutSale.first_name} ${checkedOutSale.last_name || ''}` : 'Walk-in'}</span>
            </div>
          </div>

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
            <div className="flex justify-between w-48 text-gray-500">
              <span>Subtotal:</span>
              <span>LKR.{parseFloat(checkedOutSale.total_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-48 text-gray-500">
              <span>Tax (5%):</span>
              <span>LKR.{parseFloat(checkedOutSale.tax_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-48 text-gray-500">
              <span>Discount:</span>
              <span>-LKR.{parseFloat(checkedOutSale.discount_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-48 font-bold border-t border-dashed pt-1 mt-1">
              <span>Grand Total:</span>
              <span>LKR.{parseFloat(checkedOutSale.net_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-48 text-[10px] text-gray-400 mt-1">
              <span>Payment Type:</span>
              <span>{(checkedOutSale.payment_method || 'CASH').toUpperCase()}</span>
            </div>
          </div>

          <div className="text-center text-[10px] text-gray-400 mt-6 space-y-1">
            <p>Thank you for shopping with Lumen Opticals!</p>
            <p>Keep this receipt for lens warranty checks.</p>
          </div>
        </div>
      )}
    </>
  );
}
