import { Response } from 'express';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { OrderData, OrderItem } from '../models/order.model';
import { buildUnitConfig, calculateLineTotal } from './unit-pricing.service';

const getLineTotal = (item: OrderItem) => Number(item.line_total ?? item.price_at_purchase ?? 0);

const getOriginalLineTotal = (item: OrderItem) => {
    const storedOriginal = Number(item.original_price_at_purchase ?? 0);
    const paidLineTotal = getLineTotal(item);
    if (Number.isFinite(storedOriginal) && storedOriginal > paidLineTotal) return storedOriginal;

    const quantity = Number(item.quantity || 0);
    const currentUnitPrice = Number((item as any).discount_price);
    const basePrice = Number((item as any).price_per_unit ?? (item as any).price ?? currentUnitPrice);

    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(basePrice) || basePrice <= currentUnitPrice) {
        return paidLineTotal;
    }

    return calculateLineTotal(quantity, buildUnitConfig({
        unit: item.unit,
        price_per_unit: basePrice,
        min_qty: quantity,
        step_qty: quantity,
    }));
};

const getUnitPrice = (item: OrderItem) => {
    const normalizedUnit = String(item.unit || '').toUpperCase();
    const quantity = Number(item.quantity || 0);
    const lineTotal = getLineTotal(item);

    if (!Number.isFinite(quantity) || quantity <= 0) return lineTotal;
    if (normalizedUnit === 'GRAM') return lineTotal / (quantity / 1000);
    return lineTotal / quantity;
};

const formatQuantity = (item: OrderItem) => {
    const normalizedUnit = String(item.unit || '').toUpperCase();
    const quantity = Number(item.quantity || 0);

    if (!Number.isFinite(quantity)) return String(item.quantity ?? '');

    if (normalizedUnit === 'GRAM') {
        if (quantity >= 1000) {
            const kilograms = quantity / 1000;
            return `${Number(kilograms).toFixed(kilograms % 1 === 0 ? 0 : 2)} kg`;
        }
        return `${Math.round(quantity)} g`;
    }

    if (normalizedUnit === 'LITRE') {
        return `${Number(quantity).toFixed(quantity % 1 === 0 ? 0 : 2)} L`;
    }

    if (normalizedUnit === 'DOZEN') {
        return `${Math.round(quantity)} dozen`;
    }

    return `${Math.round(quantity)} pc`;
};

export function generateA4Invoice(res: Response, orderData: OrderData, items: OrderItem[]) {
    const PAGE_W = 595.28;
    const MARGIN = 50;
    const COL_W = PAGE_W - MARGIN * 2;

    const DARK = '#111111';
    const GRAY = '#555555';
    const LGRAY = '#999999';
    const XLGRAY = '#dddddd';
    const GREEN = '#1a7a3a';

    const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${orderData.id}.pdf"`);
    doc.pipe(res);

    const invNum = `INV-${String(orderData.id).padStart(5, '0')}`;
    const invDate = new Date(orderData.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const rawAddr = orderData.shipping_address;
    const ship = rawAddr ? (typeof rawAddr === 'string' ? JSON.parse(rawAddr) : rawAddr) : {};
    const orderLevelSavings = Number(orderData.discount_amount || 0);

    let y = MARGIN;

    const logoPath = path.resolve(__dirname, '../../../happy-greens-frontend/public/logo.png');
    let logoW = 0;
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, MARGIN, y, { height: 50 });
        logoW = 60;
    }

    doc.fontSize(18).font('Helvetica-Bold').fillColor(DARK)
        .text('Happy Greens', MARGIN + logoW, y + 6, { lineBreak: false });

    doc.fontSize(20).font('Helvetica-Bold').fillColor(DARK)
        .text('INVOICE', MARGIN, y, { align: 'right', width: COL_W });

    y += 28;
    doc.fontSize(8.5).font('Helvetica').fillColor(GRAY)
        .text('Fresh & Organic Groceries', MARGIN + logoW, y)
        .text(`Invoice No: ${invNum}`, MARGIN, y, { align: 'right', width: COL_W });

    y += 13;
    doc.text('Puducherry, India', MARGIN + logoW, y)
        .text(`Date: ${invDate}`, MARGIN, y, { align: 'right', width: COL_W });

    y += 13;
    doc.text('happygreenspy@gmail.com', MARGIN + logoW, y)
        .text(`Order Status: ${orderData.status.toUpperCase()}`, MARGIN, y, { align: 'right', width: COL_W });

    y += 20;
    doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).lineWidth(1).strokeColor(DARK).stroke();

    y += 14;
    const halfW = (COL_W - 20) / 2;
    const addrStartY = y;

    doc.fontSize(7.5).font('Helvetica-Bold').fillColor(DARK).text('BILL TO', MARGIN, y);
    y += 12;
    doc.fontSize(9).font('Helvetica-Bold').fillColor(DARK).text(orderData.full_name || '-', MARGIN, y);
    y += 13;
    doc.fontSize(8.5).font('Helvetica').fillColor(GRAY);
    if (orderData.email) { doc.text(orderData.email, MARGIN, y); y += 12; }
    if (orderData.phone) { doc.text(orderData.phone, MARGIN, y); y += 12; }

    const shipX = MARGIN + halfW + 20;
    let sy = addrStartY;
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor(DARK).text('SHIP TO', shipX, sy);
    sy += 12;
    doc.fontSize(9).font('Helvetica-Bold').fillColor(DARK).text(ship.name || orderData.full_name || '-', shipX, sy);
    sy += 13;
    doc.fontSize(8.5).font('Helvetica').fillColor(GRAY);
    const addressLine = [ship.address_line, ship.address, ship.street].filter(Boolean).join(', ');
    if (addressLine) { doc.text(addressLine, shipX, sy); sy += 12; }
    if (ship.locality) { doc.text(ship.locality, shipX, sy); sy += 12; }
    if (ship.landmark) { doc.text(`Landmark: ${ship.landmark}`, shipX, sy); sy += 12; }
    const cityLine = [ship.city, ship.state].filter(Boolean).join(', ');
    if (cityLine) { doc.text(cityLine, shipX, sy); sy += 12; }
    if (ship.zip || ship.zipCode) { doc.text(`PIN: ${ship.zip || ship.zipCode}`, shipX, sy); sy += 12; }
    if (ship.phone) { doc.text(`Phone: ${ship.phone}`, shipX, sy); sy += 12; }

    y = Math.max(y, sy) + 12;
    doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).lineWidth(0.4).strokeColor(XLGRAY).stroke();

    y += 12;
    const C_ITEM = MARGIN;
    const C_QTY = MARGIN + 300;
    const C_PRICE = MARGIN + 360;
    const C_SUB = MARGIN + 445;
    const SUB_W = PAGE_W - MARGIN - C_SUB;

    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(DARK)
        .text('Product', C_ITEM, y, { width: 290 })
        .text('Quantity', C_QTY, y, { width: 52, align: 'center' })
        .text('MRP', C_PRICE, y, { width: 78, align: 'right' })
        .text('Amount', C_SUB, y, { width: SUB_W, align: 'right' });
    y += 14;
    doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).lineWidth(0.75).strokeColor(DARK).stroke();
    y += 7;

    let subtotal = 0;
    let totalOriginal = 0;
    items.forEach((item, idx) => {
        if (y > 670) { doc.addPage(); y = MARGIN; }
        const lineTotal = getLineTotal(item);
        const originalTotal = getOriginalLineTotal(item);
        subtotal += lineTotal;
        totalOriginal += originalTotal;

        if (idx > 0) {
            doc.moveTo(MARGIN, y - 4).lineTo(PAGE_W - MARGIN, y - 4).lineWidth(0.3).strokeColor(XLGRAY).stroke();
        }

        doc.fontSize(9).font('Helvetica').fillColor(DARK)
            .text(item.product_name, C_ITEM, y, { width: 290 })
            .text(formatQuantity(item), C_QTY, y, { width: 52, align: 'center' })
            .text(`Rs. ${lineTotal.toFixed(2)}`, C_SUB, y, { width: SUB_W, align: 'right' });

        const originalText = `Rs. ${originalTotal.toFixed(2)}`;
        const originalWidth = doc.widthOfString(originalText);
        const originalX = C_PRICE + 78 - originalWidth;
        doc.fontSize(9).font('Helvetica').fillColor(originalTotal > lineTotal ? GRAY : DARK)
            .text(originalText, originalX, y, { lineBreak: false });

        if (originalTotal > lineTotal) {
            const strikeY = y + 6;
            doc.moveTo(originalX, strikeY)
                .lineTo(originalX + originalWidth, strikeY)
                .lineWidth(0.8)
                .strokeColor(GRAY)
                .stroke();
        }

        y += 20;
    });

    doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).lineWidth(0.75).strokeColor(DARK).stroke();

    y += 12;
    const totalAmount = parseFloat(orderData.total_amount as any);
    const pointsUsed = Number(orderData.points_used ?? 0);
    const totalSaved = Math.max(0, totalOriginal - subtotal + orderLevelSavings + pointsUsed);
    const deliveryFee = Math.max(0, totalAmount - subtotal + orderLevelSavings + pointsUsed);
    const totLabelX = MARGIN + 335;
    const totValW = 65;

    const totRow = (label: string, val: string, bold = false, color = bold ? DARK : GRAY) => {
        doc.fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(color)
            .text(label, totLabelX, y, { width: 100 })
            .text(val, PAGE_W - MARGIN - totValW, y, { width: totValW, align: 'right' });
        y += 16;
    };

    totRow('Subtotal', `Rs. ${subtotal.toFixed(2)}`);
    totRow('Delivery charge', `Rs. ${deliveryFee.toFixed(2)}`);
    if (pointsUsed > 0) {
        totRow('Loyalty points', `- Rs. ${pointsUsed.toFixed(2)}`);
    }
    if (orderLevelSavings > 0) {
        totRow('Coupon discount', `- Rs. ${orderLevelSavings.toFixed(2)}`);
    }
    if (totalSaved > 0) {
        totRow('You saved', `Rs. ${totalSaved.toFixed(2)}`, false, GREEN);
    }
    doc.moveTo(totLabelX, y - 2).lineTo(PAGE_W - MARGIN, y - 2).lineWidth(0.5).strokeColor(DARK).stroke();
    totRow('TOTAL', `Rs. ${totalAmount.toFixed(2)}`, true);

    let rowCount = 3; // subtotal + delivery + total
    if (pointsUsed > 0) rowCount++;
    if (orderLevelSavings > 0) rowCount++;
    if (totalSaved > 0) rowCount++;
    const payY = y - 16 * rowCount;
    doc.fontSize(8.5).font('Helvetica').fillColor(GRAY)
        .text('Payment Method:', MARGIN, payY)
        .text('Order Reference:', MARGIN, payY + 16);
    doc.font('Helvetica-Bold').fillColor(DARK)
        .text((orderData.payment_method || 'COD').toUpperCase(), MARGIN + 110, payY)
        .text(`#${orderData.id}`, MARGIN + 110, payY + 16);

    const footerY = 805;
    doc.moveTo(MARGIN, footerY).lineTo(PAGE_W - MARGIN, footerY).lineWidth(0.4).strokeColor(XLGRAY).stroke();
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(DARK)
        .text('Thank you for shopping with Happy Greens!', MARGIN, footerY + 8, { align: 'center', width: COL_W });
    doc.fontSize(8).font('Helvetica').fillColor(LGRAY)
        .text('This is a computer-generated invoice and does not require a signature.', MARGIN, footerY + 21, { align: 'center', width: COL_W });

    doc.end();
}

export function generateThermalReceipt(res: Response, orderData: OrderData, items: OrderItem[]) {
    const doc = new PDFDocument({ size: [227, 841], margin: 10 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="receipt-${orderData.id}.pdf"`);
    doc.pipe(res);

    doc.fontSize(14)
        .font('Helvetica-Bold')
        .text('HAPPY GREENS', { align: 'center' });

    doc.fontSize(8)
        .font('Helvetica')
        .text('Fresh Organic Groceries', { align: 'center' })
        .text('Puducherry, India', { align: 'center' })
        .text('Email: happygreenspy@gmail.com', { align: 'center' })
        .moveDown(0.5);

    doc.text('--------------------------------', { align: 'center' }).moveDown(0.5);

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

    doc.text('--------------------------------', { align: 'center' }).moveDown(0.5);

    items.forEach((item) => {
        const price = getUnitPrice(item);
        const lineTotal = getLineTotal(item);

        doc.fontSize(8)
            .font('Helvetica')
            .text(item.product_name, 10, doc.y, { width: 207 });

        doc.text(`${formatQuantity(item)}  Rs. ${price.toFixed(2)}`, 10, doc.y, { continued: true })
            .text(`Rs. ${lineTotal.toFixed(2)}`, { align: 'right' });

        doc.moveDown(0.3);
    });

    doc.text('--------------------------------', { align: 'center' }).moveDown(0.3);

    const totalAmount = parseFloat(orderData.total_amount as any);

    doc.fontSize(10)
        .font('Helvetica-Bold')
        .text('TOTAL:', 10, doc.y, { continued: true })
        .text(`Rs. ${totalAmount.toFixed(2)}`, { align: 'right' });

    doc.moveDown(0.5);
    doc.text('--------------------------------', { align: 'center' }).moveDown(0.3);

    doc.fontSize(7)
        .font('Helvetica')
        .text(`Payment: ${orderData.payment_gateway || 'Razorpay'}`, { align: 'center' })
        .text(`Method: ${orderData.payment_method_type || 'UPI'}`, { align: 'center' })
        .text('Status: PAID', { align: 'center' })
        .text(`Txn: ${orderData.gateway_payment_id || 'N/A'}`, { align: 'center' })
        .moveDown(0.5);

    doc.fontSize(8)
        .text('Thank you!', { align: 'center' })
        .text('Visit: www.happygreens.com', { align: 'center' });

    doc.end();
}
