/**
 * utils/pdfGenerator.js — Generador de PDF para órdenes de servicio.
 *
 * Exporta:
 *  - generateInvoicePDF(order): genera y descarga automáticamente un PDF A4
 *    con toda la información de la orden pasada como parámetro.
 *
 * Estructura del PDF generado:
 *  1. Encabezado con nombre del sistema (RepairPro), número de orden y fechas.
 *  2. Pill de estado de la orden.
 *  3. Sección "Customer Information" — datos del cliente en 2 columnas.
 *  4. Sección "Device Information" — tipo, marca, modelo, serial y accesorios.
 *  5. Sección "Reported Issue" — problema descrito por el cliente.
 *  6. Sección "Work Performed" — solo si workDone tiene contenido.
 *  7. Sección "Pricing Summary" — precios estimado, de reparación y final.
 *  8. Cuadro destacado con el TOTAL.
 *  9. Sección "Terms & Conditions" — 6 cláusulas estándar del taller.
 * 10. Pie de página con nombre del sistema y fecha de generación.
 *
 * Dependencias: jsPDF, y las utilidades formatDate / formatDateShort /
 *   formatCurrency / STATUS_CONFIG de ./constants.
 */
import jsPDF from 'jspdf'
import { STATUS_CONFIG, formatDate, formatDateShort, formatCurrency } from './constants'

export function generateInvoicePDF(order) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = 210
  const pageH = 297
  const margin = 15
  const col2 = pageW / 2 + 5
  let y = margin

  const font = 'helvetica'

  // Colors
  const indigo = [79, 70, 229]
  const dark = [30, 41, 59]
  const mid = [100, 116, 139]
  const light = [241, 245, 249]
  const border = [226, 232, 240]

  // Header background
  doc.setFillColor(...indigo)
  doc.rect(0, 0, pageW, 38, 'F')

  // Shop name
  doc.setFont(font, 'bold')
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text('RepairPro', margin, 16)

  doc.setFont(font, 'normal')
  doc.setFontSize(9)
  doc.setTextColor(196, 199, 255)
  doc.text('Service Order Manager', margin, 22)

  // Order number (right)
  doc.setFont(font, 'bold')
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text(order.orderNumber || '', pageW - margin, 14, { align: 'right' })
  doc.setFont(font, 'normal')
  doc.setFontSize(8)
  doc.setTextColor(196, 199, 255)
  doc.text('Service Order', pageW - margin, 20, { align: 'right' })

  // Entry / Delivery
  const entryText = `Entry: ${formatDateShort(order.entryDate)}`
  const deliveryText = `Delivery: ${formatDateShort(order.deliveryDate) || 'Pending'}`
  doc.text(`${entryText}   ${deliveryText}`, pageW - margin, 28, { align: 'right' })

  y = 46

  // Status pill
  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  doc.setFillColor(...light)
  doc.roundedRect(margin, y - 5, 50, 10, 2, 2, 'F')
  doc.setFont(font, 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...dark)
  doc.text(`Status: ${statusCfg.label}`, margin + 4, y + 1.5)

  y += 12

  // Two-column grid helper
  const sectionTitle = (title, posY) => {
    doc.setFillColor(...light)
    doc.rect(margin, posY, pageW - margin * 2, 7, 'F')
    doc.setFont(font, 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...indigo)
    doc.text(title.toUpperCase(), margin + 2, posY + 5)
    return posY + 9
  }

  const row = (label, value, x, posY, colWidth = 85) => {
    doc.setFont(font, 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...mid)
    doc.text(label, x, posY)
    doc.setTextColor(...dark)
    doc.setFont(font, 'normal')
    const truncated = doc.splitTextToSize(String(value || '—'), colWidth - 2)
    doc.text(truncated[0], x, posY + 4.5)
    return posY + 9
  }

  // Customer info
  y = sectionTitle('Customer Information', y)
  const customerRows = [
    ['Full Name', order.customerName],
    ['ID / DNI', order.customerDni],
    ['Phone', order.customerPhone],
    ['Email', order.customerEmail],
    ['Address', order.customerAddress],
  ]
  customerRows.forEach(([label, value], i) => {
    // Distribuye en 2 columnas: par = columna izquierda, impar = columna derecha
    if (i === 4) {
      row(label, value, margin, y)
      y += 9
    } else if (i % 2 === 0) {
      row(label, value, margin, y)
    } else {
      row(label, value, col2, y)
      y += 9
    }
  })
  y += 4

  // Device info
  y = sectionTitle('Device Information', y)
  const deviceRows = [
    ['Device Type', order.deviceType],
    ['Brand', order.deviceBrand],
    ['Model', order.deviceModel],
    ['Serial / IMEI', order.deviceSerial],
    ['Accessories', order.accessories?.join(', ')],
  ]
  deviceRows.forEach(([label, value], i) => {
    if (i === 4) {
      row(label, value, margin, y, 170)
      y += 9
    } else if (i % 2 === 0) {
      row(label, value, margin, y)
    } else {
      row(label, value, col2, y)
      y += 9
    }
  })
  y += 4

  // Reported issue
  y = sectionTitle('Reported Issue', y)
  doc.setFont(font, 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...dark)
  const issueLines = doc.splitTextToSize(order.reportedIssue || '—', pageW - margin * 2 - 4)
  doc.text(issueLines, margin + 2, y + 1)
  y += issueLines.length * 4 + 5

  // Work done
  if (order.workDone) {
    y = sectionTitle('Work Performed', y)
    const workLines = doc.splitTextToSize(order.workDone, pageW - margin * 2 - 4)
    doc.setFont(font, 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...dark)
    doc.text(workLines, margin + 2, y + 1)
    y += workLines.length * 4 + 5
  }

  // Pricing
  y = sectionTitle('Pricing Summary', y)
  const pricingRows = [
    ['Estimated Price', formatCurrency(order.estimatedPrice)],
    ['Repair Cost', formatCurrency(order.repairCost)],
    ['Final Price', formatCurrency(order.finalPrice)],
    ['Budget Status', order.budgetStatus?.toUpperCase() || 'PENDING'],
  ]
  pricingRows.forEach(([label, value], i) => {
    if (i % 2 === 0) {
      row(label, value, margin, y)
    } else {
      row(label, value, col2, y)
      y += 9
    }
  })
  y += 6

  // Final price highlight
  doc.setFillColor(...indigo)
  doc.roundedRect(pageW - margin - 60, y - 3, 60, 14, 2, 2, 'F')
  doc.setFont(font, 'bold')
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.text('TOTAL:', pageW - margin - 56, y + 5)
  doc.setFontSize(12)
  doc.text(formatCurrency(order.finalPrice || order.estimatedPrice), pageW - margin - 4, y + 5.5, { align: 'right' })
  y += 20

  // Terms & Conditions
  if (y + 40 > pageH - 20) {
    doc.addPage()
    y = margin
  }
  y = sectionTitle('Terms & Conditions', y)
  const terms = [
    '1. The repair shop is not responsible for data loss. Customers should back up their data before service.',
    '2. Uncollected devices after 30 days will incur a storage fee.',
    '3. The quote is valid for 7 days. Prices may change after this period.',
    '4. Physical damage or liquid damage discovered during repair may incur additional charges.',
    '5. We guarantee our repairs for 30 days under normal use conditions.',
    '6. Payment is due upon device collection.',
  ]
  doc.setFont(font, 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...mid)
  terms.forEach((t) => {
    const lines = doc.splitTextToSize(t, pageW - margin * 2 - 4)
    doc.text(lines, margin + 2, y)
    y += lines.length * 3.5 + 1.5
  })

  // Footer
  y = pageH - 15
  doc.setDrawColor(...border)
  doc.line(margin, y, pageW - margin, y)
  doc.setFont(font, 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...mid)
  doc.text('RepairPro — Service Order Management', margin, y + 5)
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, pageW - margin, y + 5, { align: 'right' })

  doc.save(`${order.orderNumber || 'order'}-invoice.pdf`)
}
