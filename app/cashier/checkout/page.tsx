'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppSelector } from '../../../stores';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { productService } from '../../../services/productService';
import { categoryService } from '../../../services/categoryService';
import { customerService } from '../../../services/customerService';
import { saleService } from '../../../services/saleService';
import { Product } from '../../../features/product/types';
import { Category } from '../../../features/category/types';
import ReceiptModal from '../../../components/sales/receipt-modal';
import ProductCard from '../../../components/checkout/product-card';
import CartItemRow from '../../../components/checkout/cart-item-row';
import CustomerSelector, { Customer } from '../../../components/checkout/customer-selector';
import ProductFilters from '../../../components/checkout/product-filters';
import Pagination from '../../../components/checkout/pagination';
import PaymentSummary from '../../../components/checkout/payment-summary';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function CashierCheckoutPage() {
  const currentUser = useAppSelector(selectCurrentUser);

  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Filtering & Pagination States
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productPage, setProductPage] = useState(1);
  const [totalProductPages, setTotalProductPages] = useState(1);

  // Cart & Invoice States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ABA' | 'WING'>('CASH');
  const [cashReceived, setCashReceived] = useState<string>('');
  
  // Customer association states
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('walk-in');
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isNewCustomerMode, setIsNewCustomerMode] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerErrors, setNewCustomerErrors] = useState<{ name?: string; phone?: string }>({});

  // Receipt Modal State
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };
  const [completedOrder, setCompletedOrder] = useState<{
    receiptId: string;
    items: CartItem[];
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    cashReceived: number;
    change: number;
    customerName: string;
    customerPhone: string;
    cashierName: string;
    dateString: string;
  } | null>(null);

  // Debounce search input
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearchQuery(search);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  // Load Categories & Customers
  const loadMetadata = useCallback(async () => {
    try {
      const [cats, custsRes] = await Promise.all([
        categoryService.listCategories(false),
        customerService.getCustomers({ page: 1, limit: 100 }),
      ]);
      setCategories(cats);
      setCustomers((custsRes.customers as any) || []);
    } catch (error) {
      console.error('Failed to load initial metadata:', error);
    }
  }, []);

  // Load Categories & Customers on Mount
  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  // Fetch Products based on Category & Search
  const fetchProducts = useCallback(async (pageToFetch: number) => {
    try {
      setIsLoadingProducts(true);
      const response = await productService.listProducts({
        page: pageToFetch,
        limit: 12,
        status: 'active',
        search: searchQuery.trim() || undefined,
        category_id: selectedCategory || undefined,
      });
      setProducts(response.products || []);
      setTotalProductPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    setProductPage(1);
    fetchProducts(1);
  }, [searchQuery, selectedCategory, fetchProducts]);

  const handleRefresh = async () => {
    try {
      setIsLoadingProducts(true);
      await Promise.all([
        loadMetadata(),
        fetchProducts(1)
      ]);
      setProductPage(1);
      triggerToast('POS terminal refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh POS terminal:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // --- Cart Actions ---
  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.product_id === product.product_id);
      if (existing) {
        // Enforce inventory limit
        if (existing.quantity >= product.stock_quantity) return prev;
        return prev.map((item) =>
          item.product.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.product_id !== productId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null; // trigger removal below
          if (newQty > item.product.stock_quantity) return item; // exceed stock quantity limit
          return { ...item, quantity: newQty };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountValue('0');
    setCashReceived('');
    setSelectedCustomerId('walk-in');
    setCustomerSearch('');
    setIsNewCustomerMode(false);
    setNewCustomerName('');
    setNewCustomerPhone('');
  };

  // --- Invoice Calculations ---
  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const getDiscountAmount = () => {
    const subtotal = getSubtotal();
    const val = parseFloat(discountValue) || 0;
    return Math.min(val, subtotal);
  };

  const getVAT = () => {
    return 0;
  };

  const getGrandTotal = () => {
    const subtotal = getSubtotal();
    const discount = getDiscountAmount();
    return Math.max(0, subtotal - discount);
  };

  // Cash change logic
  const cashNum = parseFloat(cashReceived) || 0;
  const grandTotal = getGrandTotal();
  const changeAmount = Math.max(0, cashNum - grandTotal);

  // --- Check for item quantity in cart helper ---
  const getProductCartQty = (productId: number) => {
    return cart.find((item) => item.product.product_id === productId)?.quantity || 0;
  };

  // --- Submit POS Order ---
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || isCheckingOut) return;

    // Validate new customer if enabled
    if (isNewCustomerMode) {
      const errs: { name?: string; phone?: string } = {};
      if (!newCustomerName.trim()) errs.name = 'Customer name is required';
      if (!newCustomerPhone.trim()) {
        errs.phone = 'Customer phone is required';
      } else if (!/^\+?[0-9\s-]{8,20}$/.test(newCustomerPhone)) {
        errs.phone = 'Phone must be between 8 and 20 digits';
      }
      setNewCustomerErrors(errs);
      if (Object.keys(errs).length > 0) return;
    }

    // Determine Customer Name & Phone
    let customerName = 'Walk-in Customer';
    let customerPhone = 'N/A';

    if (isNewCustomerMode) {
      customerName = newCustomerName;
      customerPhone = newCustomerPhone;
    } else if (selectedCustomerId !== 'walk-in') {
      const activeCust = customers.find((c) => String(c.customerId) === selectedCustomerId);
      if (activeCust) {
        customerName = activeCust.fullName;
        customerPhone = activeCust.phone || 'N/A';
      }
    }

    const subtotal = getSubtotal();
    const discount = getDiscountAmount();
    const tax = getVAT();
    const total = getGrandTotal();

    const items = cart.map((item) => ({
      product_id: item.product.product_id,
      quantity: item.quantity,
      unit_price: item.product.price,
      discount_amount: 0,
      subtotal: item.product.price * item.quantity,
    }));

    const payload = {
      payment_method: (paymentMethod === 'CASH' ? 'CASH' : 'BANK') as 'CASH' | 'BANK',
      received_amount: paymentMethod === 'CASH' ? cashNum : total,
      discount_amount: discount,
      tax_amount: tax,
      service_fee: 0,
      items,
    };

    try {
      setIsCheckingOut(true);
      const createdOrder = await saleService.createOrder(payload);

      setCompletedOrder({
        receiptId: createdOrder.receipt_number,
        items: [...cart],
        subtotal,
        discount,
        tax,
        total,
        cashReceived: paymentMethod === 'CASH' ? cashNum : total,
        change: paymentMethod === 'CASH' ? changeAmount : 0,
        customerName,
        customerPhone,
        cashierName: createdOrder.seller_name || currentUser?.fullName || 'Cashier One',
        dateString: new Date(createdOrder.order_date).toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' }),
      });

      setIsReceiptOpen(true);
      triggerToast('POS sale created successfully');
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || 'Failed to complete transaction.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleNewOrder = () => {
    setIsReceiptOpen(false);
    setCompletedOrder(null);
    clearCart();
    fetchProducts(productPage);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 select-none relative pb-10">
      
      {/* Dynamic inline styles to hide other page modules during Receipt Printing */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt-modal, #printable-receipt-modal * {
            visibility: visible;
          }
          #printable-receipt-modal {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* POS Top Header Controls */}
      <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Checkout POS Terminal</h1>
          <p className="text-xs text-foreground/50 mt-1">
            Search products, manage cart items, associate customer accounts, and record retail pharmacy sales.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoadingProducts}
          className="group px-4.5 py-2.5 bg-secondary/50 hover:bg-secondary border border-border/40 hover:border-border/80 rounded-xl text-foreground/60 hover:text-foreground font-extrabold text-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] shadow-sm disabled:opacity-50"
        >
          <svg
            className={`w-4 h-4 text-foreground/50 transition-transform duration-500 ease-out ${
              isLoadingProducts ? 'animate-spin' : 'group-hover:rotate-180'
            }`}
            fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Section: Product Browser (Grid + Search + Category Tabs) */}
        <div className="lg:col-span-8 space-y-6">
          
          <ProductFilters
            search={search}
            onSearchChange={setSearch}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Products Grid */}
          {isLoadingProducts ? (
            <div className="flex flex-col items-center justify-center py-36 gap-4">
              <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <span className="text-xs font-bold text-foreground/50 tracking-wider">Retrieving Active Catalog...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-card border border-border/40 rounded-3xl p-12 text-center shadow-sm select-none">
              <div className="w-16 h-16 rounded-full bg-secondary/60 flex items-center justify-center mx-auto text-foreground/45 border border-border/40 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-black text-foreground">No Products Found</h3>
              <p className="text-xs text-foreground/50 mt-1 max-w-sm mx-auto">
                No active medicines match your search query or category filters. Try clearing inputs or selecting a different category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((prod) => (
                <ProductCard
                  key={prod.product_id}
                  product={prod}
                  cartQty={getProductCartQty(prod.product_id)}
                  onAddToCart={addToCart}
                />
              ))}
            </div>
          )}

          <Pagination
            currentPage={productPage}
            totalPages={totalProductPages}
            onPageChange={(page) => {
              setProductPage(page);
              fetchProducts(page);
            }}
          />

        </div>

        {/* Right Section: Invoice Cart Sidebar */}
        <div className="lg:col-span-4 sticky top-6 bg-card border border-border/40 rounded-3xl shadow-sm p-6 space-y-6 flex flex-col max-h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar">
          
          {/* Header Cart Details */}
          <div className="flex justify-between items-center select-none border-b border-border/40 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <h2 className="text-base font-black text-foreground tracking-tight">Invoice Cart</h2>
            </div>
            <span className="text-xs font-bold text-foreground/45">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} Items
            </span>
          </div>

          {/* Customer Selection Block */}
          <CustomerSelector
            isNewCustomerMode={isNewCustomerMode}
            setIsNewCustomerMode={setIsNewCustomerMode}
            newCustomerName={newCustomerName}
            setNewCustomerName={setNewCustomerName}
            newCustomerPhone={newCustomerPhone}
            setNewCustomerPhone={setNewCustomerPhone}
            newCustomerErrors={newCustomerErrors}
            setNewCustomerErrors={setNewCustomerErrors}
            customerSearch={customerSearch}
            setCustomerSearch={setCustomerSearch}
            isCustomerDropdownOpen={isCustomerDropdownOpen}
            setIsCustomerDropdownOpen={setIsCustomerDropdownOpen}
            selectedCustomerId={selectedCustomerId}
            setSelectedCustomerId={setSelectedCustomerId}
            customers={customers}
          />

          {/* Cart Items list */}
          <div className="flex-1 min-h-[260px] overflow-y-auto space-y-3.5 pr-1 select-none">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center select-none text-foreground/35">
                <svg className="w-12 h-12 stroke-current opacity-40 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="text-xs font-bold">POS Cart is Empty</span>
                <span className="text-[10px] text-foreground/45 mt-0.5">Click catalog cards to add items</span>
              </div>
            ) : (
              cart.map((item) => (
                <CartItemRow
                  key={item.product.product_id}
                  item={item}
                  onUpdateQty={updateQuantity}
                  onRemove={removeFromCart}
                />
              ))
            )}
          </div>

          <PaymentSummary
            cart={cart}
            discountValue={discountValue}
            onDiscountValueChange={setDiscountValue}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            cashReceived={cashReceived}
            onCashReceivedChange={setCashReceived}
            subtotal={getSubtotal()}
            discountAmount={getDiscountAmount()}
            grandTotal={grandTotal}
            changeAmount={changeAmount}
            onClearCart={clearCart}
            onCheckout={handleCheckout}
            isLoading={isCheckingOut}
          />

        </div>

      </div>

      {/* ── Receipt Modal (Printable) ── */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        order={completedOrder}
        paymentMethod={paymentMethod}
        onClose={handleNewOrder}
        onNewOrder={handleNewOrder}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-2xl animate-scale-up select-none">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {toastMessage}
        </div>
      )}

    </div>
  );
}
