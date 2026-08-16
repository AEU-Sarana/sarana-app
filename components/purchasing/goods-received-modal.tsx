'use client';

import React, { useState, useEffect } from 'react';
import { tokenStorage } from '@/services/tokenStorage';

interface GoodsReceivedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  po: any;
}

export default function GoodsReceivedModal({ isOpen, onClose, onSuccess, po }: GoodsReceivedModalProps) {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [receivedItems, setReceivedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (po && po.purchase_order_items) {
      setReceivedItems(
        po.purchase_order_items.map((item: any) => {
          const remainingQty = Math.max(0, item.orderedQuantity - item.receivedQuantity);
          return {
            poItemId: item.poItemId,
            productId: item.productId,
            productName: item.product?.productName || item.product_name || `Product #${item.productId}`,
            orderedQuantity: item.orderedQuantity,
            alreadyReceivedQuantity: item.receivedQuantity,
            quantityReceived: remainingQty,
            unitCost: Number(item.unitCost),
            batchNumber: '',
            expiryDate: '',
          };
        })
      );
    }
  }, [po, isOpen]);

  if (!isOpen || !po) return null;

  const handleQtyChange = (index: number, val: number) => {
    const next = [...receivedItems];
    next[index].quantityReceived = Math.max(0, val);
    setReceivedItems(next);
  };

  const handleCostChange = (index: number, val: number) => {
    const next = [...receivedItems];
    next[index].unitCost = Math.max(0, val);
    setReceivedItems(next);
  };

  const handleFieldChange = (index: number, field: string, val: string) => {
    const next = [...receivedItems];
    next[index][field] = val;
    setReceivedItems(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemsToReceive = receivedItems.filter((i) => i.quantityReceived > 0);
    if (itemsToReceive.length === 0) {
      alert('Please enter a received quantity of at least 1 for at least one item');
      return;
    }

    setLoading(true);
    try {
      const token = tokenStorage.getAccessToken() || localStorage.getItem('accessToken') || localStorage.getItem('token');
      const res = await fetch('http://localhost:8088/api/v1/purchasing/goods-received', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          poId: po.poId || po.po_id,
          supplierId: po.supplierId || po.supplier_id,
          receivedDate,
          invoiceNumber,
          notes,
          items: itemsToReceive.map((i) => ({
            poItemId: i.poItemId,
            productId: i.productId,
            quantityReceived: i.quantityReceived,
            unitCost: i.unitCost,
            batchNumber: i.batchNumber || undefined,
            expiryDate: i.expiryDate || undefined,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        alert(data.message || 'Failed to record goods received');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border/60 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-foreground animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-border/40 flex justify-between items-center bg-card">
          <div>
            <h3 className="text-lg font-bold text-foreground">Record Goods Received (Stock In)</h3>
            <p className="text-xs text-muted-foreground">PO #: {po.poNumber || po.po_number} | Supplier: {po.supplier?.companyName || po.suppliers?.company_name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Received Date *
              </label>
              <input
                type="date"
                required
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Supplier Invoice / Delivery Note #
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-90218"
                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Receiving Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Inspected by warehouse..."
                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Line Items to Receive</h4>
            <div className="border border-border/40 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm text-foreground">
                <thead className="bg-secondary/40 text-xs uppercase font-semibold text-muted-foreground border-b border-border/40">
                  <tr>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3 text-center">Ordered</th>
                    <th className="px-4 py-3 text-center">Prev. Received</th>
                    <th className="px-4 py-3 text-center">Receiving Now</th>
                    <th className="px-4 py-3 text-right">Unit Cost ($)</th>
                    <th className="px-4 py-3">Batch #</th>
                    <th className="px-4 py-3">Expiry Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {receivedItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-secondary/30">
                      <td className="px-4 py-3 font-medium text-foreground">{item.productName}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{item.orderedQuantity}</td>
                      <td className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-400 font-medium">{item.alreadyReceivedQuantity}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          value={item.quantityReceived}
                          onChange={(e) => handleQtyChange(idx, parseInt(e.target.value, 10) || 0)}
                          className="w-20 bg-secondary/80 border border-border/60 rounded-lg px-2.5 py-1 text-center text-foreground focus:outline-none focus:border-primary font-bold"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitCost}
                          onChange={(e) => handleCostChange(idx, parseFloat(e.target.value) || 0)}
                          className="w-24 bg-secondary/80 border border-border/60 rounded-lg px-2.5 py-1 text-right text-foreground focus:outline-none focus:border-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.batchNumber}
                          onChange={(e) => handleFieldChange(idx, 'batchNumber', e.target.value)}
                          placeholder="LOT-001"
                          className="w-24 bg-secondary/80 border border-border/60 rounded-lg px-2.5 py-1 text-xs text-foreground placeholder-muted-foreground focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={item.expiryDate}
                          onChange={(e) => handleFieldChange(idx, 'expiryDate', e.target.value)}
                          className="w-32 bg-secondary/80 border border-border/60 rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-border/40">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-border/40 bg-secondary hover:bg-secondary/80 text-foreground transition-colors text-sm font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all shadow-md shadow-primary/20 text-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Processing Stock In...' : 'Confirm Goods Received & Stock In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
