'use client';

interface POPrintableInvoiceProps {
  po: any;
}

export default function POPrintableInvoice({ po }: POPrintableInvoiceProps) {
  if (!po) return null;

  const supplierName = po.supplier?.companyName || po.suppliers?.company_name || 'Vendor';
  const supplierPhone = po.supplier?.phone || po.suppliers?.phone;
  const supplierEmail = po.supplier?.email || po.suppliers?.email;
  const supplierAddress = po.supplier?.address || po.suppliers?.address;
  const supplierContact = po.supplier?.contactPerson || po.suppliers?.contact_person;

  const items = po.purchase_order_items || [];

  return (
    <div id="printable-po-invoice" className="hidden print:block print:p-8 bg-white text-black text-sm">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-gray-300 pb-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">MICROSTORE POS</h1>
          <p className="text-xs text-gray-600">Phnom Penh, Cambodia</p>
          <p className="text-xs text-gray-600">Tel: +855 12 345 678 | Email: purchasing@microstore.com</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-gray-800 uppercase">Purchase Order</h2>
          <p className="text-sm font-semibold text-gray-900">PO #: {po.poNumber || po.po_number}</p>
          <p className="text-xs text-gray-600">
            Date: {new Date(po.orderDate || po.order_date).toLocaleDateString()}
          </p>
          {po.expectedDeliveryDate || po.expected_delivery_date ? (
            <p className="text-xs text-gray-600">
              Expected Delivery: {new Date(po.expectedDeliveryDate || po.expected_delivery_date).toLocaleDateString()}
            </p>
          ) : null}
          <p className="text-xs font-semibold text-gray-700 mt-1">Status: {po.status}</p>
        </div>
      </div>

      {/* Supplier & Vendor Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Vendor / Supplier Information:</h3>
        <p className="font-bold text-base text-gray-900">{supplierName}</p>
        {supplierContact ? <p className="text-xs text-gray-700">Attn: {supplierContact}</p> : null}
        {supplierPhone ? <p className="text-xs text-gray-700">Phone: {supplierPhone}</p> : null}
        {supplierEmail ? <p className="text-xs text-gray-700">Email: {supplierEmail}</p> : null}
        {supplierAddress ? <p className="text-xs text-gray-700">Address: {supplierAddress}</p> : null}
      </div>

      {/* Line Items Table */}
      <table className="w-full border-collapse border border-gray-300 mb-6 text-left">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-300 text-xs font-bold text-gray-700 uppercase">
            <th className="p-3 border-r border-gray-300">#</th>
            <th className="p-3 border-r border-gray-300">Item Description</th>
            <th className="p-3 border-r border-gray-300 text-center">Qty</th>
            <th className="p-3 border-r border-gray-300 text-right">Unit Cost ($)</th>
            <th className="p-3 text-right">Subtotal ($)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: any, idx: number) => (
            <tr key={idx} className="border-b border-gray-200">
              <td className="p-3 border-r border-gray-200 text-center text-xs text-gray-500">{idx + 1}</td>
              <td className="p-3 border-r border-gray-200 font-medium">
                {item.product?.productName || item.product_name || `Product #${item.productId}`}
                {item.product?.productCode ? (
                  <span className="text-xs text-gray-500 block">Code: {item.product.productCode}</span>
                ) : null}
              </td>
              <td className="p-3 border-r border-gray-200 text-center font-bold">{item.orderedQuantity}</td>
              <td className="p-3 border-r border-gray-200 text-right">${Number(item.unitCost).toFixed(2)}</td>
              <td className="p-3 text-right font-semibold">${Number(item.subtotal).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-2 text-right">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Subtotal:</span>
            <span>${Number(po.subtotal).toFixed(2)}</span>
          </div>
          {Number(po.discountAmount || po.discount_amount) > 0 ? (
            <div className="flex justify-between text-xs text-gray-600">
              <span>Discount:</span>
              <span>-${Number(po.discountAmount || po.discount_amount).toFixed(2)}</span>
            </div>
          ) : null}
          {Number(po.taxAmount || po.tax_amount) > 0 ? (
            <div className="flex justify-between text-xs text-gray-600">
              <span>Tax:</span>
              <span>+${Number(po.taxAmount || po.tax_amount).toFixed(2)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-400 pt-2">
            <span>Total Amount:</span>
            <span>${Number(po.totalAmount || po.total_amount).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {po.notes ? (
        <div className="border-t border-gray-200 pt-4 mb-8">
          <h4 className="text-xs font-bold text-gray-500 uppercase">Notes & Instructions:</h4>
          <p className="text-xs text-gray-700 mt-1">{po.notes}</p>
        </div>
      ) : null}

      {/* Signatures */}
      <div className="mt-16 flex justify-between items-end text-xs text-gray-600 pt-8 border-t border-gray-200">
        <div>
          <p className="font-bold text-gray-800">Authorized Signature:</p>
          <div className="h-12"></div>
          <p>______________________________________</p>
        </div>
        <div>
          <p className="font-bold text-gray-800">Supplier Confirmation:</p>
          <div className="h-12"></div>
          <p>______________________________________</p>
        </div>
      </div>
    </div>
  );
}
