import { Response } from 'express';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { OrderData, OrderItem } from '../models/order.model';

const getLineTotal = (item: OrderItem) => Number(item.line_total ?? item.price_at_purchase ?? 0);

const getUnitPrice = (item: OrderItem) => {
    const normalizedUnit = String(item.unit || '').toUpperCase();
    const quantity = Number(item.quantity || 0);
    const lineTotal = getLineTotal(item);

    if (!Number.isFinite(quantity) || quantity <= 0) return lineTotal;
    if (normalizedUnit === 'GRAM') {
        return lineTotal / (quantity / 1000);
    }
    return lineTotal / quantity;
};

/**
 * Generate A4 PDF Invoice — Clean Monochrome Layout
 */
export function generateA4Invoice(res: Response, orderData: OrderData, items: OrderItem[]) {
    const PAGE_W = 595.28;
    const MARGIN = 50;
    const COL_W = PAGE_W - MARGIN * 2;

    const DARK = '#111111';
    const GRAY = '#555555';
    const LGRAY = '#999999';
    const XLGRAY = '#dddddd';

    const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${orderData.id}.pdf"`);
    doc.pipe(res);

    const invNum = `INV-${String(orderData.id).padStart(5, '0')}`;
    const invDate = new Date(orderData.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const rawAddr = orderData.shipping_address;
    const ship = rawAddr
        ? (typeof rawAddr === 'string' ? JSON.parse(rawAddr) : rawAddr)
        : {};

    // SECTION 1: Header
    let y = MARGIN;

    // Logo — resolve relative to backend project root, pointing at frontend/public
    const logoPath = path.resolve(__dirname, '../../../happy-greens-frontend/public/logo.png');
    let logoW = 0;
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, MARGIN, y, { height: 50 });
        logoW = 60; // Space for logo + padding
    }

    // Left Column: Brand & Tagline
    doc.fontSize(18).font('Helvetica-Bold').fillColor(DARK)
        .text('Happy Greens', MARGIN + logoW, y + 6, { lineBreak: false });

    // Right Column: INVOICE Title
    doc.fontSize(20).font('Helvetica-Bold').fillColor(DARK)
        .text('INVOICE', MARGIN, y, { align: 'right', width: COL_W });

    y += 28;
    // Left side: Sub-info
    doc.fontSize(8.5).font('Helvetica').fillColor(GRAY)
        .text('Fresh & Organic Groceries', MARGIN + logoW, y);
    // Right side: Sub-info
    doc.text(`Invoice No: ${invNum}`, MARGIN, y, { align: 'right', width: COL_W });

    y += 13;
    doc.text('Puducherry, India', MARGIN + logoW, y);
    doc.text(`Date: ${invDate}`, MARGIN, y, { align: 'right', width: COL_W });

    y += 13;
    doc.text('info@happygreens.com', MARGIN + logoW, y);
    doc.text(`Order Status: ${orderData.status.toUpperCase()}`, MARGIN, y, { align: 'right', width: COL_W });

    y += 20; // Advanced PAST the logo height (50) and our 3 lines of text
    doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).lineWidth(1).strokeColor(DARK).stroke();

    // SECTION 2: Billing & Shipping
    y += 14;
    const halfW = (COL_W - 20) / 2;
    const addrStartY = y;

    doc.fontSize(7.5).font('Helvetica-Bold').fillColor(DARK).text('BILL TO', MARGIN, y);
    y += 12;
    doc.fontSize(9).font('Helvetica-Bold').fillColor(DARK).text(orderData.full_name || '—', MARGIN, y);
    y += 13;
    doc.fontSize(8.5).font('Helvetica').fillColor(GRAY);
    if (orderData.email) { doc.text(orderData.email, MARGIN, y); y += 12; }
    if (orderData.phone) { doc.text(orderData.phone, MARGIN, y); y += 12; }

    const shipX = MARGIN + halfW + 20;
    let sy = addrStartY;
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor(DARK).text('SHIP TO', shipX, sy);
    sy += 12;
    doc.fontSize(9).font('Helvetica-Bold').fillColor(DARK).text(ship.name || orderData.full_name || '—', shipX, sy);
    sy += 13;
    doc.fontSize(8.5).font('Helvetica').fillColor(GRAY);
    if (ship.street) { doc.text(ship.street, shipX, sy); sy += 12; }
    const cityLine = [ship.city, ship.state].filter(Boolean).join(', ');
    if (cityLine) { doc.text(cityLine, shipX, sy); sy += 12; }
    if (ship.zipCode) { doc.text(`PIN: ${ship.zipCode}`, shipX, sy); sy += 12; }

    y = Math.max(y, sy) + 12;
    doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).lineWidth(0.4).strokeColor(XLGRAY).stroke();

    // SECTION 3: Products Table
    y += 12;
    const C_ITEM = MARGIN;
    const C_QTY = MARGIN + 300;
    const C_PRICE = MARGIN + 360;
    const C_SUB = MARGIN + 445;
    const SUB_W = PAGE_W - MARGIN - C_SUB;

    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(DARK)
        .text('Product', C_ITEM, y, { width: 290 })
        .text('Qty', C_QTY, y, { width: 52, align: 'center' })
        .text('Unit Price', C_PRICE, y, { width: 78, align: 'right' })
        .text('Subtotal', C_SUB, y, { width: SUB_W, align: 'right' });
    y += 14;
    doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).lineWidth(0.75).strokeColor(DARK).stroke();
    y += 7;

    let subtotal = 0;
    items.forEach((item, idx) => {
        if (y > 670) { doc.addPage(); y = MARGIN; }
        const price = getUnitPrice(item);
        const lineTotal = getLineTotal(item);
        subtotal += lineTotal;
        if (idx > 0) {
            doc.moveTo(MARGIN, y - 4).lineTo(PAGE_W - MARGIN, y - 4).lineWidth(0.3).strokeColor(XLGRAY).stroke();
        }
        doc.fontSize(9).font('Helvetica').fillColor(DARK)
            .text(item.product_name, C_ITEM, y, { width: 290 })
            .text(String(item.quantity), C_QTY, y, { width: 52, align: 'center' })
            .text(`\u20B9${price.toFixed(2)}`, C_PRICE, y, { width: 78, align: 'right' })
            .text(`\u20B9${lineTotal.toFixed(2)}`, C_SUB, y, { width: SUB_W, align: 'right' });
        y += 20;
    });
    doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).lineWidth(0.75).strokeColor(DARK).stroke();

    // SECTION 4: Totals + Payment Info
    y += 12;
    const totalAmount = parseFloat(orderData.total_amount as any);
    const totLabelX = MARGIN + 335;
    const totValW = 65;

    const totRow = (label: string, val: string, bold = false) => {
        doc.fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(bold ? DARK : GRAY)
            .text(label, totLabelX, y, { width: 100 })
            .text(val, PAGE_W - MARGIN - totValW, y, { width: totValW, align: 'right' });
        y += 16;
    };

    totRow('Subtotal', `\u20B9${subtotal.toFixed(2)}`);
    totRow('Delivery charge', '\u20B90.00');
    totRow('Discount', '\u20B90.00');
    doc.moveTo(totLabelX, y - 2).lineTo(PAGE_W - MARGIN, y - 2).lineWidth(0.5).strokeColor(DARK).stroke();
    totRow('TOTAL', `\u20B9${totalAmount.toFixed(2)}`, true);

    const payY = y - 16 * 4;
    doc.fontSize(8.5).font('Helvetica').fillColor(GRAY)
        .text('Payment Method:', MARGIN, payY)
        .text('Order Reference:', MARGIN, payY + 16);
    doc.font('Helvetica-Bold').fillColor(DARK)
        .text((orderData.payment_method || 'COD').toUpperCase(), MARGIN + 110, payY)
        .text(`#${orderData.id}`, MARGIN + 110, payY + 16);

    // SECTION 5: Footer
    const footerY = 805;
    doc.moveTo(MARGIN, footerY).lineTo(PAGE_W - MARGIN, footerY).lineWidth(0.4).strokeColor(XLGRAY).stroke();
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(DARK)
        .text('Thank you for shopping with Happy Greens!', MARGIN, footerY + 8, { align: 'center', width: COL_W });
    doc.fontSize(8).font('Helvetica').fillColor(LGRAY)
        .text('This is a computer-generated invoice and does not require a signature.', MARGIN, footerY + 21, { align: 'center', width: COL_W });

    doc.end();
}

/**
 * Generate 80mm Thermal Receipt
 * POS-style receipt for thermal printers
 */
export function generateThermalReceipt(res: Response, orderData: OrderData, items: OrderItem[]) {
    // 80mm = ~227 pixels at 72 DPI
    const doc = new PDFDocument({ size: [227, 841], margin: 10 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="receipt-${orderData.id}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Header
    doc.fontSize(14)
        .font('Helvetica-Bold')
        .text('🥬 HAPPY GREENS 🥬', { align: 'center' });

    doc.fontSize(8)
        .font('Helvetica')
        .text('Fresh Organic Groceries', { align: 'center' })
        .text('123 Green Street, Mumbai', { align: 'center' })
        .text('Phone: +91 98765 43210', { align: 'center' })
        .moveDown(0.5);

    // Separator
    doc.text('--------------------------------', { align: 'center' })
        .moveDown(0.5);

    // Order Info
    const invoiceNumber = `HG-${orderData.id}`;
    const orderDate = new Date(orderData.created_at).toLocaleString('en-IN', {
        dateStyle: 'short',
        timeStyle: 'short'
    });

    doc.fontSize(8)
        .text(`Invoice: ${invoiceNumber}`, { align: 'center' })
        .text(`Date: ${orderDate}`, { align: 'center' })
        .text(`Customer: ${orderData.full_name}`, { align: 'center' })
        .moveDown(0.5);

    doc.text('--------------------------------', { align: 'center' })
        .moveDown(0.5);

    // Items
    items.forEach((item) => {
        // Parse numeric values from database
        const price = getUnitPrice(item);
        const lineTotal = getLineTotal(item);

        doc.fontSize(8)
            .font('Helvetica')
            .text(item.product_name, 10, doc.y, { width: 207 });

        doc.text(`${item.quantity} x ₹${price.toFixed(2)}`, 10, doc.y, { continued: true })
            .text(`₹${lineTotal.toFixed(2)}`, { align: 'right' });

        doc.moveDown(0.3);
    });

    // Separator
    doc.text('--------------------------------', { align: 'center' })
        .moveDown(0.3);

    // Total
    const totalAmount = parseFloat(orderData.total_amount as any);

    doc.fontSize(10)
        .font('Helvetica-Bold')
        .text('TOTAL:', 10, doc.y, { continued: true })
        .text(`₹${totalAmount.toFixed(2)}`, { align: 'right' });

    doc.moveDown(0.5);
    doc.text('--------------------------------', { align: 'center' })
        .moveDown(0.3);

    // Payment Info
    doc.fontSize(7)
        .font('Helvetica')
        .text(`Payment: ${orderData.payment_gateway || 'Razorpay'}`, { align: 'center' })
        .text(`Method: ${orderData.payment_method_type || 'UPI'}`, { align: 'center' })
        .text(`Status: PAID`, { align: 'center' })
        .text(`Txn: ${orderData.gateway_payment_id || 'N/A'}`, { align: 'center' })
        .moveDown(0.5);

    // Footer
    doc.fontSize(8)
        .text('Thank you!', { align: 'center' })
        .text('Visit: www.happygreens.com', { align: 'center' });

    doc.end();
}
