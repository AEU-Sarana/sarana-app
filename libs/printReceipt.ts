export interface PrintReceiptItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  discount_amount?: number;
}

export interface PrintReceiptData {
  receipt_number: string;
  order_date: string;
  seller_name: string;
  customer_name: string;
  customer_phone?: string;
  payment_method: string;
  items: PrintReceiptItem[];
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  service_fee: number;
  total_amount: number;
  received_amount?: number;
  change_amount?: number;
  exchange_rate?: number;
}

/**
 * Utility function to trigger the thermal-style billing receipt printing
 * in a standalone window, ensuring CSS classes and logo sizes are fully constrained.
 */
export function printReceipt(order: PrintReceiptData) {
  if (typeof window === 'undefined') return;

  const logoSrc = `${window.location.origin}/logo.jpg`;
  const khrRate = order.exchange_rate || 4100;
  const khr = Math.round(order.total_amount * khrRate).toLocaleString();
  const isCash = order.payment_method === 'CASH' || order.payment_method === 'Cash';

  const itemRows = order.items.map((item, idx) => `
    <tr style="border-bottom:1px dashed #eee;vertical-align:top;">
      <td style="padding:6px 0;font-size:9px;">${idx + 1}</td>
      <td style="padding:6px 4px;font-size:9px;">
        <div style="font-weight:700;">${item.product_name}</div>
        ${item.discount_amount && item.discount_amount > 0
          ? `<div style="color:#16a34a;font-size:7.5px;font-weight:700;">Disc: -$${item.discount_amount.toFixed(2)}</div>`
          : ''}
      </td>
      <td style="padding:6px 0;text-align:center;font-size:9px;">${item.quantity}</td>
      <td style="padding:6px 0;text-align:right;font-size:9px;">$${item.unit_price.toFixed(2)}</td>
      <td style="padding:6px 0;text-align:right;font-size:9px;font-weight:700;">$${item.subtotal.toFixed(2)}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Receipt ${order.receipt_number}</title>
  <style>
    @page { size:A4; margin:14mm 16mm; }
    *{ margin:0; padding:0; box-sizing:border-box; }
    body{ font-family:'Courier New',Courier,monospace; font-size:11px; color:#000; background:#fff;
          -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .sep{ border:none; border-top:1px dashed #ccc; margin:10px 0; }
    table{ border-collapse:collapse; width:100%; }
  </style>
</head>
<body>
<div style="max-width:560px;margin:0 auto;padding:20px 0;">

  <!-- HEADER -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;
              border-bottom:1px dashed #ccc;padding-bottom:14px;margin-bottom:14px;">
    <div style="display:flex;flex-direction:column;align-items:flex-start;gap:6px;
                width:38%;flex-shrink:0;">
      <div style="width:72px;height:72px;min-width:72px;max-width:72px;
                  overflow:hidden;border-radius:8px;border:1px solid #e5e7eb;flex-shrink:0;">
        <img src="${logoSrc}" alt="Logo"
             style="width:100%;height:100%;object-fit:cover;display:block;"/>
      </div>
      <span style="font-size:9px;font-weight:700;color:#374151;">ទូរស័ព្ទ: 017 62 26 26</span>
    </div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;flex:1;
                padding-left:16px;gap:2px;">
      <span style="font-size:14px;font-weight:900;color:#000;line-height:1.2;">ឱសថស្ថាន</span>
      <span style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;">PHARMACIE</span>
      <span style="font-size:15px;font-weight:900;color:#000;line-height:1.2;margin-top:6px;">វិក្កយបត្រ</span>
      <span style="font-size:11px;font-weight:900;color:#000;text-transform:uppercase;letter-spacing:1.5px;">INVOICE</span>
    </div>
  </div>

  <!-- METADATA -->
  <div style="margin-bottom:12px;border-bottom:1px dashed #ccc;padding-bottom:12px;font-size:9.5px;">
    <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
      <span style="color:#555;">Receipt ID:</span>
      <span style="font-weight:900;">${order.receipt_number}</span>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
      <span style="color:#555;">Date/Time:</span><span>${order.order_date}</span>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
      <span style="color:#555;">Cashier:</span><span>${order.seller_name}</span>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
      <span style="color:#555;">Customer:</span>
      <span style="font-weight:900;">${order.customer_name}</span>
    </div>
    ${order.customer_phone && order.customer_phone !== 'N/A' && order.customer_phone !== '' ? `
    <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
      <span style="color:#555;">Phone:</span><span>${order.customer_phone}</span>
    </div>` : ''}
    <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
      <span style="color:#555;">Payment Method:</span>
      <span style="font-weight:900;">${order.payment_method}</span>
    </div>
  </div>

  <!-- ITEMS TABLE -->
  <table>
    <thead>
      <tr style="border-bottom:1px dashed #aaa;color:#777;font-size:7.5px;text-transform:uppercase;font-weight:700;">
        <th style="text-align:left;padding-bottom:8px;width:7%;">ល.រ<br/>N°</th>
        <th style="text-align:left;padding-bottom:8px;padding-left:4px;width:45%;">រាយនាមទំនិញ<br/>NAME OF GOODS</th>
        <th style="text-align:center;padding-bottom:8px;width:10%;">ចំនួន<br/>QTY</th>
        <th style="text-align:right;padding-bottom:8px;width:18%;">តម្លៃមួយ<br/>U.PRICE</th>
        <th style="text-align:right;padding-bottom:8px;width:20%;">តម្លៃសរុប<br/>AMOUNT</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <hr class="sep"/>

  <!-- TOTALS -->
  <div style="margin-bottom:12px;font-size:9.5px;">
    <div style="display:flex;justify-content:space-between;margin-bottom:4px;color:#555;">
      <span>Subtotal:</span><span>$${order.subtotal.toFixed(2)}</span>
    </div>
    ${order.discount_amount > 0 ? `
    <div style="display:flex;justify-content:space-between;margin-bottom:4px;color:#dc2626;font-weight:600;">
      <span>Discount:</span><span>-$${order.discount_amount.toFixed(2)}</span>
    </div>` : ''}
    ${order.tax_amount > 0 ? `
    <div style="display:flex;justify-content:space-between;margin-bottom:4px;color:#555;">
      <span>Tax:</span><span>$${order.tax_amount.toFixed(2)}</span>
    </div>` : ''}
    ${order.service_fee > 0 ? `
    <div style="display:flex;justify-content:space-between;margin-bottom:4px;color:#555;">
      <span>Service Fee:</span><span>$${order.service_fee.toFixed(2)}</span>
    </div>` : ''}
    <!-- TOTAL box -->
    <div style="border:2px solid #000;padding:8px 12px;margin-top:8px;
                display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:13px;font-weight:900;text-transform:uppercase;">សរុប TOTAL</span>
      <div style="text-align:right;">
        <div style="font-size:18px;font-weight:900;letter-spacing:-0.5px;">$${order.total_amount.toFixed(2)}</div>
        <div style="font-size:9px;color:#555;font-weight:600;">${khr} KHR</div>
      </div>
    </div>
  </div>

  <hr class="sep"/>

  <!-- PAYMENT -->
  <div style="margin-bottom:20px;font-size:9.5px;">
    ${isCash && order.received_amount !== undefined ? `
    <div style="display:flex;justify-content:space-between;margin-bottom:4px;color:#555;">
      <span>Cash Paid:</span><span>$${order.received_amount.toFixed(2)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-weight:900;font-size:10px;
                border-top:1px solid #eee;padding-top:4px;">
      <span>Change returned:</span><span>$${(order.change_amount ?? 0).toFixed(2)}</span>
    </div>` : `
    <div style="display:flex;justify-content:space-between;color:#059669;font-weight:700;">
      <span>${order.payment_method} PAID:</span><span>Reference synced ✓</span>
    </div>`}
  </div>

  <!-- SIGNATURES -->
  <div style="display:flex;justify-content:space-between;font-size:8.5px;
              font-weight:700;padding:0 4px;margin-bottom:28px;">
    <span>អ្នកទិញ / L'acheteur</span>
    <span>អ្នកលក់ / Le vender</span>
  </div>

  <!-- FOOTER -->
  <div style="border-top:1px dashed #ccc;padding-top:12px;text-align:center;">
    <p style="font-weight:900;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:5px;">
      THANK YOU FOR YOUR PURCHASE!
    </p>
    <p style="font-size:8px;color:#9ca3af;">
      Medicines are non-refundable once opened. Please check expiry dates.
    </p>
  </div>

</div>
</body>
</html>`;

  const pw = window.open('', '_blank', 'width=900,height=1100,scrollbars=yes');
  if (!pw) { window.print(); return; }
  pw.document.open();
  pw.document.write(html);
  pw.document.close();
  pw.onload = () => setTimeout(() => pw.print(), 400);
}
