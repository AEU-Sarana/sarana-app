'use client';

import React, { useState, useEffect } from 'react';
import { tokenStorage } from '@/services/tokenStorage';
import { BASE_URL } from '@/services/apiClient';

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
    if (po) {
      const itemsList = po.purchase_order_items || po.items || [];
      setReceivedItems(
        itemsList.map((item: any) => {
          const orderedQty = Number(item.orderedQuantity ?? item.ordered_quantity ?? 0);
          const receivedQty = Number(item.receivedQuantity ?? item.received_quantity ?? 0);
          const remainingQty = Math.max(0, orderedQty - receivedQty);
          
          const rawCost = item.unitCost ?? item.unit_cost ?? item.product?.lastPurchaseCost ?? item.product?.price ?? 0;
          const costVal = Number(rawCost);
          const validCost = isNaN(costVal) ? 0 : costVal;

          return {
            poItemId: item.poItemId ?? item.po_item_id,
            productId: item.productId ?? item.product_id,
            productName: item.product?.productName || item.product_name || `Product #${item.productId || item.product_id}`,
            orderedQuantity: orderedQty,
            alreadyReceivedQuantity: receivedQty,
            quantityReceived: remainingQty,
            unitCost: validCost,
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
    next[index].quantityReceived = Math.max(0, isNaN(val) ? 0 : val);
    setReceivedItems(next);
  };

  const handleCostChange = (index: number, val: number) => {
    const next = [...receivedItems];
    next[index].unitCost = Math.max(0, isNaN(val) ? 0 : val);
    setReceivedItems(next);
  };

  const handleFieldChange = (index: number, field: string, val: string) => {
    const next = [...receivedItems];
    next[index][field] = val;
    setReceivedItems(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemsToReceive = receivedItems.filter((i) => (Number(i.quantityReceived) || 0) > 0);
    if (itemsToReceive.length === 0) {
      alert('Please enter a received quantity of at least 1 for at least one item');
      return;
    }

    setLoading(true);
    try {
      const token = tokenStorage.getAccessToken() || localStorage.getItem('accessToken') || localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/purchasing/goods-received`, {
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
            quantityReceived: Number(i.quantityReceived || 0),
            unitCost: Number(i.unitCost || 0),
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
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
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
            <div className="border border-border/40 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-sm text-foreground min-w-[650px]">
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
                          className="w-24 bg-secondary/80 border border-border/60 rounded-lg px-2.5 py-1 text-right text-foreground focus:outline-none focus:border-primary font-mono"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.batchNumber}
                          onChange={(e) => handleFieldChange(idx, 'batchNumber', e.target.value)}
                          placeholder="e.g. LOT-101"
                          className="w-28 bg-secondary/80 border border-border/60 rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={item.expiryDate}
                          onChange={(e) => handleFieldChange(idx, 'expiryDate', e.target.value)}
                          className="w-32 bg-secondary/80 border border-border/60 rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-border/40 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground font-medium text-sm rounded-xl border border-border/40 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-xl transition-all shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Confirm Goods Received & Stock In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
