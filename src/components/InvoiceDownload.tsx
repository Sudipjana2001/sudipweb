import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  size?: string;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  total: number;
  shipping_address?: {
    full_name?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
  order_items?: OrderItem[];
}

interface InvoiceDownloadProps {
  order: Order;
}

export function InvoiceDownload({ order }: InvoiceDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateInvoice = async () => {
    setIsGenerating(true);
    try {
      const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice - ${order.order_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
    .invoice-header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .logo { font-size: 28px; font-weight: bold; color: #7c3aed; }
    .invoice-title { text-align: right; }
    .invoice-title h1 { font-size: 32px; color: #7c3aed; }
    .invoice-title p { color: #666; margin-top: 5px; }
    .details-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .details-box { }
    .details-box h3 { font-size: 12px; text-transform: uppercase; color: #888; margin-bottom: 8px; }
    .details-box p { font-size: 14px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #f8f9fa; text-align: left; padding: 12px; font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 2px solid #e9ecef; }
    td { padding: 12px; border-bottom: 1px solid #e9ecef; }
    .text-right { text-align: right; }
    .totals { margin-left: auto; width: 300px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
    .totals-row.total { border-bottom: 2px solid #7c3aed; font-weight: bold; font-size: 18px; }
    .footer { margin-top: 60px; text-align: center; color: #888; font-size: 12px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .status-pending { background: #fef3c7; color: #d97706; }
    .status-confirmed { background: #d1fae5; color: #059669; }
    .status-shipped { background: #dbeafe; color: #2563eb; }
    .status-delivered { background: #d1fae5; color: #059669; }
  </style>
</head>
<body>
  <div class="invoice-header">
    <div class="logo">🐾 PawStyle</div>
    <div class="invoice-title">
      <h1>INVOICE</h1>
      <p>${order.order_number}</p>
    </div>
  </div>
  
  <div class="details-section">
    <div class="details-box">
      <h3>Bill To</h3>
      <p>
        ${order.shipping_address?.full_name || 'Customer'}<br>
        ${order.shipping_address?.address || ''}<br>
        ${order.shipping_address?.city || ''} ${order.shipping_address?.postal_code || ''}<br>
        ${order.shipping_address?.country || 'India'}
      </p>
    </div>
    <div class="details-box">
      <h3>Invoice Details</h3>
      <p>
        <strong>Invoice Date:</strong> ${new Date(order.created_at).toLocaleDateString()}<br>
        <strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}<br>
        <strong>Status:</strong> <span class="status-badge status-${order.status}">${order.status}</span>
      </p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Size</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Unit Price</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${order.order_items?.map(item => `
        <tr>
          <td>${item.product_name}</td>
          <td>${item.size || '-'}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">₹${Number(item.unit_price).toFixed(2)}</td>
          <td class="text-right">₹${Number(item.total_price).toFixed(2)}</td>
        </tr>
      `).join('') || ''}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal</span>
      <span>₹${Number(order.subtotal).toFixed(2)}</span>
    </div>
    <div class="totals-row">
      <span>Shipping</span>
      <span>₹${Number(order.shipping_cost || 0).toFixed(2)}</span>
    </div>
    <div class="totals-row">
      <span>Tax</span>
      <span>₹${Number(order.tax || 0).toFixed(2)}</span>
    </div>
    <div class="totals-row total">
      <span>Total</span>
      <span>₹${Number(order.total).toFixed(2)}</span>
    </div>
  </div>

  <div class="footer">
    <p>Thank you for shopping with PawStyle!</p>
    <p>For any queries, contact support@pawstyle.com</p>
  </div>
</body>
</html>`;

      // Create blob and download
      const blob = new Blob([invoiceHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Open in new window for printing
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
      toast.success("Invoice generated! Use Ctrl+P to save as PDF");
    } catch (error) {
      toast.error("Failed to generate invoice");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={generateInvoice} disabled={isGenerating}>
      {isGenerating ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4 mr-2" />
      )}
      Download Invoice
    </Button>
  );
}
