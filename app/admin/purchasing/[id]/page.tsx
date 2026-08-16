'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import GoodsReceivedModal from '@/components/purchasing/goods-received-modal';
import POPrintableInvoice from '@/components/purchasing/po-printable-invoice';
import { tokenStorage } from '@/services/tokenStorage';

export default function AdminPODetailsPage() {
  const params = useParams();
  const poId = params.id;
  const [po, setPo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [grModalOpen, setGrModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchPODetails = useCallback(async () => {
    setLoading(true);
    try {
      const token = tokenStorage.getAccessToken() || localStorage.getItem('accessToken') || localStorage.getItem('token');
      const res = await fetch(`http://localhost:8088/api/v1/purchasing/orders/${poId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPo(data.data);
      }
    } catch (err) {
      console.error('Fetch PO error:', err);
    } finally {
      setLoading(false);
    }
  }, [poId]);

  useEffect(() => {
    if (poId) fetchPODetails();
  }, [poId, fetchPODetails]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      const token = tokenStorage.getAccessToken() || localStorage.getItem('accessToken') || localStorage.getItem('token');
      const res = await fetch(`http://localhost:8088/api/v1/purchasing/orders/${poId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to generate PDF');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${po.poNumber || po.po_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || 'PDF download failed');
    }
  };

  const handleUpdateStatus = async (status: string) => {
    setUpdatingStatus(true);
    try {
      const token = tokenStorage.getAccessToken() || localStorage.getItem('accessToken') || localStorage.getItem('token');
      const res = await fetch(`http://localhost:8088/api/v1/purchasing/orders/${poId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchPODetails();
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground max-w-5xl mx-auto">
        Loading purchase order details...
      </div>
    );
  }

  if (!po) {
    return (
      <div className="p-8 text-center text-muted-foreground max-w-5xl mx-auto space-y-4">
        <div>Purchase order not found or deleted.</div>
        <Link href="/admin/purchasing" className="text-primary underline">
          Back to Purchase Orders
        </Link>
      </div>
    );
  }

  const items = po.purchase_order_items || [];
  const goodsReceivedList = po.goods_received || [];

  return (
    <div className="space-y-6 print:p-0">
      {/* Screen Header (Hidden on Print) */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/admin/purchasing" className="hover:underline">
              Purchase Orders
            </Link>
            <span>/</span>
            <span className="text-foreground">{po.poNumber || po.po_number}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{po.poNumber || po.po_number}</h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              {po.status}
            </span>
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl text-xs font-semibold border border-border/40 transition-all flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print A4 Invoice
          </button>

          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl text-xs font-semibold border border-border/40 transition-all flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </button>

          {['APPROVED', 'SENT', 'PARTIAL_RECEIVED'].includes(po.status) ? (
            <button
              onClick={() => setGrModalOpen(true)}
              className="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-semibold transition-all shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8" />
              </svg>
              Receive Goods (Stock In)
            </button>
          ) : null}

          {po.status === 'DRAFT' ? (
            <button
              disabled={updatingStatus}
              onClick={() => handleUpdateStatus('APPROVED')}
              className="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/20 cursor-pointer"
            >
              Approve PO
            </button>
          ) : null}
        </div>
      </div>

      {/* Screen Overview Cards (Hidden on Print) */}
      <div className="print:hidden grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-2 shadow-sm">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Vendor / Supplier</h3>
          <div className="text-base font-bold text-foreground">{po.supplier?.companyName || po.suppliers?.company_name}</div>
          <div className="text-xs text-muted-foreground">Phone: {po.supplier?.phone || po.suppliers?.phone || '—'}</div>
          <div className="text-xs text-muted-foreground">Email: {po.supplier?.email || po.suppliers?.email || '—'}</div>
        </div>

        <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-2 shadow-sm">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Order Schedule</h3>
          <div className="text-xs text-muted-foreground">
            Order Date: <span className="font-semibold text-foreground">{new Date(po.orderDate || po.order_date).toLocaleDateString()}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Expected Delivery:{' '}
            <span className="font-semibold text-foreground">
              {po.expectedDeliveryDate || po.expected_delivery_date
                ? new Date(po.expectedDeliveryDate || po.expected_delivery_date).toLocaleDateString()
                : 'Not specified'}
            </span>
          </div>
        </div>

        <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-2 shadow-sm">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Order Total</h3>
          <div className="text-2xl font-extrabold text-primary font-mono">${Number(po.totalAmount || po.total_amount).toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">Created by: {po.createdByUser?.fullName || po.created_by_name || 'Admin'}</div>
        </div>
      </div>

      {/* Screen Line Items Table (Hidden on Print) */}
      <div className="print:hidden bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm space-y-4 p-6">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Ordered Products</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="bg-secondary/40 text-xs uppercase font-semibold text-muted-foreground border-b border-border/40">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 text-center">Ordered Qty</th>
                <th className="px-4 py-3 text-center">Received Qty</th>
                <th className="px-4 py-3 text-right">Unit Cost ($)</th>
                <th className="px-4 py-3 text-right">Subtotal ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {items.map((item: any, idx: number) => (
                <tr key={idx} className="hover:bg-secondary/30">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {item.product?.productName || item.product_name}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-foreground">{item.orderedQuantity}</td>
                  <td className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-400 font-bold">{item.receivedQuantity}</td>
                  <td className="px-4 py-3 text-right font-mono">${Number(item.unitCost).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-bold text-foreground font-mono">${Number(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Screen Stock In History (Hidden on Print) */}
      {goodsReceivedList.length > 0 ? (
        <div className="print:hidden bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Stock In Receiving History</h3>
          <div className="space-y-3">
            {goodsReceivedList.map((gr: any, idx: number) => (
              <div key={idx} className="bg-secondary/40 border border-border/40 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{gr.grNumber || gr.gr_number}</div>
                  <div className="text-xs text-muted-foreground">
                    Received on {new Date(gr.receivedDate || gr.received_date).toLocaleDateString()}
                    {gr.invoiceNumber || gr.invoice_number ? ` | Inv #: ${gr.invoiceNumber || gr.invoice_number}` : ''}
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-foreground">
                  ${Number(gr.totalReceivedAmount || gr.total_received_amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Component for A4 Printing */}
      <POPrintableInvoice po={po} />

      {/* Modal for Recording Stock In */}
      <GoodsReceivedModal
        isOpen={grModalOpen}
        onClose={() => setGrModalOpen(false)}
        onSuccess={fetchPODetails}
        po={po}
      />
    </div>
  );
}
