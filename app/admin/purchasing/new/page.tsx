'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { tokenStorage } from '@/services/tokenStorage';

export default function AdminCreatePOPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [taxAmount, setTaxAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [items, setItems] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = tokenStorage.getAccessToken() || localStorage.getItem('accessToken') || localStorage.getItem('token');
    fetch('http://localhost:8088/api/v1/suppliers', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((d) => {
        const list = Array.isArray(d.data) ? d.data : (Array.isArray(d.data?.suppliers) ? d.data.suppliers : []);
        setSuppliers(list);
      });

    fetch('http://localhost:8088/api/v1/products?limit=200', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((d) => {
        const list = Array.isArray(d.data) ? d.data : (Array.isArray(d.data?.products) ? d.data.products : (Array.isArray(d.data?.items) ? d.data.items : []));
        setProducts(list);
      });
  }, []);

  const handleAddProduct = (prod: any) => {
    const prodId = prod.productId || prod.product_id;
    const existingIdx = items.findIndex((i) => i.productId === prodId);
    const prodName = prod.productName || prod.product_name;
    const defaultCost = Number(prod.lastPurchaseCost || prod.cost_price || prod.price || 0);

    if (existingIdx >= 0) {
      const next = [...items];
      next[existingIdx].orderedQuantity += 1;
      setItems(next);
    } else {
      setItems([
        ...items,
        {
          productId: prodId,
          productName: prodName,
          productCode: prod.productCode || prod.product_code || '',
          orderedQuantity: 1,
          unitCost: defaultCost,
        },
      ]);
    }
    setProductSearch('');
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemQtyChange = (idx: number, qty: number) => {
    const next = [...items];
    next[idx].orderedQuantity = Math.max(1, qty);
    setItems(next);
  };

  const handleItemCostChange = (idx: number, cost: number) => {
    const next = [...items];
    next[idx].unitCost = Math.max(0, cost);
    setItems(next);
  };

  const subtotal = items.reduce((sum, item) => sum + item.orderedQuantity * item.unitCost, 0);
  const totalAmount = subtotal + taxAmount - discountAmount;

  const handleSubmit = async (status: 'DRAFT' | 'APPROVED') => {
    if (!supplierId) {
      alert('Please select a supplier');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one product line item to the order');
      return;
    }

    setLoading(true);
    try {
      const token = tokenStorage.getAccessToken() || localStorage.getItem('accessToken') || localStorage.getItem('token');
      const res = await fetch('http://localhost:8088/api/v1/purchasing/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          supplierId: Number(supplierId),
          expectedDeliveryDate: expectedDeliveryDate || undefined,
          taxAmount,
          discountAmount,
          notes,
          status,
          items: items.map((i) => ({
            productId: i.productId,
            orderedQuantity: i.orderedQuantity,
            unitCost: i.unitCost,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/admin/purchasing/${data.data.poId || data.data.po_id}`);
      } else {
        alert(data.message || 'Failed to create purchase order');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const productList = Array.isArray(products) ? products : [];
  const filteredProducts = productList.filter((p) => {
    if (!productSearch) return false;
    const q = productSearch.toLowerCase();
    const name = (p.productName || p.product_name || '').toLowerCase();
    const code = (p.productCode || p.product_code || '').toLowerCase();
    return name.includes(q) || code.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/admin/purchasing" className="hover:underline">
              Purchase Orders
            </Link>
            <span>/</span>
            <span className="text-foreground">New Order</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Create Purchase Order</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supplier & Dates Card */}
          <div className="bg-card border border-border/40 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">1. Vendor & Schedule</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Supplier / Vendor *
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(Number(e.target.value))}
                  className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.supplierId || s.supplier_id} value={s.supplierId || s.supplier_id}>
                      {s.companyName || s.company_name} ({s.phone || 'No phone'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Product Items Picker & Table Card */}
          <div className="bg-card border border-border/40 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">2. Order Products</h3>

            {/* Product Search Input */}
            <div className="relative">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products by name or code to add..."
                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
              />
              {filteredProducts.length > 0 ? (
                <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border/60 rounded-xl max-h-48 overflow-y-auto z-20 shadow-xl divide-y divide-border/30">
                  {filteredProducts.slice(0, 8).map((prod) => (
                    <button
                      key={prod.productId || prod.product_id}
                      type="button"
                      onClick={() => handleAddProduct(prod)}
                      className="w-full text-left px-4 py-2.5 hover:bg-secondary/60 flex justify-between items-center text-sm cursor-pointer"
                    >
                      <span className="font-medium text-foreground">{prod.productName || prod.product_name}</span>
                      <span className="text-xs text-muted-foreground font-mono">${Number(prod.lastPurchaseCost || prod.price || 0).toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Items Table */}
            <div className="border border-border/40 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm text-foreground">
                <thead className="bg-secondary/40 text-xs uppercase font-semibold text-muted-foreground border-b border-border/40">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3 text-center">Ordered Qty</th>
                    <th className="px-4 py-3 text-right">Unit Cost ($)</th>
                    <th className="px-4 py-3 text-right">Subtotal ($)</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground text-xs">
                        No products added yet. Use the search bar above to select products for this purchase order.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-secondary/30">
                        <td className="px-4 py-3 font-medium text-foreground">{item.productName}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.orderedQuantity}
                            onChange={(e) => handleItemQtyChange(idx, parseInt(e.target.value, 10) || 1)}
                            className="w-20 bg-secondary/80 border border-border/60 rounded-lg px-2.5 py-1 text-center text-foreground focus:outline-none focus:border-primary font-bold"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitCost}
                            onChange={(e) => handleItemCostChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-24 bg-secondary/80 border border-border/60 rounded-lg px-2.5 py-1 text-right text-foreground focus:outline-none focus:border-primary font-mono"
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-foreground font-mono">
                          ${(item.orderedQuantity * item.unitCost).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-rose-500 hover:text-rose-600 text-xs font-medium cursor-pointer"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Summary Sidebar Column */}
        <div className="space-y-6">
          <div className="bg-card border border-border/40 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">3. Summary & Notes</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span className="font-mono text-foreground">${subtotal.toFixed(2)}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Tax Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-secondary/50 border border-border/50 rounded-xl px-3 py-2 text-foreground font-mono text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Discount Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-secondary/50 border border-border/50 rounded-xl px-3 py-2 text-foreground font-mono text-sm focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-border/40 flex justify-between items-center">
                <span className="font-bold text-foreground">Total Order Cost:</span>
                <span className="text-xl font-extrabold text-primary font-mono">${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Order Notes / Supplier Terms
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special delivery instructions or terms..."
                className="w-full bg-secondary/50 border border-border/50 rounded-xl p-3 text-foreground text-xs placeholder-muted-foreground focus:outline-none resize-none"
              />
            </div>

            <div className="pt-4 flex flex-col gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmit('APPROVED')}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-xl transition-all shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Approve & Create PO'}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmit('DRAFT')}
                className="w-full py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium text-sm rounded-xl border border-border/40 transition-colors cursor-pointer disabled:opacity-50"
              >
                Save as Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
