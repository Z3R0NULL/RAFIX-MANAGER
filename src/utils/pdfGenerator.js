/**
 * utils/pdfGenerator.js — Generación de comprobantes PDF.
 *
 * Exporta dos funciones asíncronas:
 *  - generateInvoicePDF(order, settings): crea y descarga la orden de servicio.
 *  - generateSalePDF(sale, settings): crea y descarga el comprobante de venta.
 *
 * Incluye helpers internos para:
 *  - Formateo monetario según configuración de moneda/localidad.
 *  - Construcción de secciones visuales reutilizables (encabezados, filas, columnas).
 *  - Inserción opcional de QR de seguimiento en la orden de servicio.
 */
import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import { STATUS_CONFIG, formatDate, formatDateShort } from './constants'

function fmt(val, currency, locale) {
  if (!val && val !== 0) return '—'
  const num = parseFloat(val)
  if (isNaN(num)) return '—'
  return new Intl.NumberFormat(locale || 'es-AR', {
    style: 'currency',
    currency: currency || 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

async function qrDataUrl(text) {
  return QRCode.toDataURL(text, { width: 180, margin: 1, color: { dark: '#1e2937', light: '#ffffff' } })
}

export async function generateInvoicePDF(order, settings = {}) {
  const businessName    = settings.businessName    || 'RAFIX'
  const businessLogo    = settings.businessLogo    || null
  const currency        = settings.currency        || 'ARS'
  const currencyLocale  = settings.currencyLocale  || 'es-AR'
  const warrantyPolicy  = Array.isArray(settings.warrantyPolicy) && settings.warrantyPolicy.length > 0
    ? settings.warrantyPolicy
    : [
        'El taller no se hace responsable por la pérdida de datos. El cliente debe realizar una copia de seguridad antes del servicio.',
        'Los equipos no retirados después de 30 días generarán cargos de almacenamiento.',
        'El presupuesto es válido por 7 días. Los precios pueden cambiar después de este período.',
        'Los daños físicos o por líquido descubiertos durante la reparación pueden generar cargos adicionales.',
        'Garantizamos nuestras reparaciones por 30 días bajo condiciones de uso normal.',
        'El pago se realiza al momento de retirar el equipo.',
      ]

  const f = (v) => fmt(v, currency, currencyLocale)

  const doc   = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = 210
  const pageH = 297
  const ML    = 14   // margin left/right
  const CW    = pageW - ML * 2  // content width = 182
  const font  = 'helvetica'

  // ── Palette ──────────────────────────────────────────────────────────────
  const C = {
    primary:   [63, 81, 181],   // indigo
    primaryDk: [40, 53, 147],
    white:     [255, 255, 255],
    dark:      [30,  41,  59],
    mid:       [100, 116, 139],
    light:     [248, 250, 252],
    border:    [226, 232, 240],
    accent:    [224, 231, 255],  // indigo-100
    success:   [16, 185, 129],
    warning:   [245, 158, 11],
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  let y = 0

  const setFont = (style, size, color) => {
    doc.setFont(font, style)
    doc.setFontSize(size)
    doc.setTextColor(...(color || C.dark))
  }

  // Ensure we never overflow the page (leaves 22mm for footer)
  const checkPage = (needed = 10) => {
    if (y + needed > pageH - 22) {
      doc.addPage()
      y = ML
    }
  }

  // Horizontal rule
  const hr = (posY, color = C.border, lw = 0.3) => {
    doc.setDrawColor(...color)
    doc.setLineWidth(lw)
    doc.line(ML, posY, pageW - ML, posY)
  }

  // Section header — colored bar with white label
  const sectionHeader = (title, posY) => {
    doc.setFillColor(...C.primary)
    doc.rect(ML, posY, CW, 7, 'F')
    setFont('bold', 7.5, C.white)
    doc.text(title.toUpperCase(), ML + 3, posY + 5)
    return posY + 7
  }

  // Single info row: label on top, value below
  const infoField = (label, value, x, posY, w) => {
    const safeVal = String(value || '—')
    setFont('normal', 7, C.mid)
    doc.text(label, x, posY)
    setFont('normal', 8.5, C.dark)
    const lines = doc.splitTextToSize(safeVal, w - 2)
    doc.text(lines.slice(0, 2), x, posY + 4.2)
    return posY + 4.2 + Math.min(lines.length, 2) * 4
  }

  // Two-column row helper — returns new y after BOTH fields are drawn
  const twoCol = (leftLabel, leftVal, rightLabel, rightVal, posY) => {
    const half = CW / 2 - 3
    const yL = infoField(leftLabel, leftVal,  ML,           posY, half)
    const yR = infoField(rightLabel, rightVal, ML + CW / 2, posY, half)
    return Math.max(yL, yR) + 2
  }

  // ── PAGE 1 ───────────────────────────────────────────────────────────────

  // ── Header band ──────────────────────────────────────────────────────────
  doc.setFillColor(...C.primaryDk)
  doc.rect(0, 0, pageW, 42, 'F')

  // Subtle diagonal accent
  doc.setFillColor(255, 255, 255, 0.04)
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0)

  // Logo
  let logoEndX = ML
  if (businessLogo) {
    try {
      doc.addImage(businessLogo, ML, 7, 28, 28)
      logoEndX = ML + 32
    } catch (_) { logoEndX = ML }
  }

  // Business name + subtitle
  setFont('bold', 20, C.white)
  doc.text(businessName, logoEndX, 19)
  setFont('normal', 8, [180, 190, 255])
  doc.text('Orden de Servicio Técnico', logoEndX, 26)

  // Order number block (right side)
  setFont('bold', 16, C.white)
  doc.text(order.orderNumber || '—', pageW - ML, 18, { align: 'right' })
  setFont('normal', 7.5, [180, 190, 255])
  doc.text('Nº de Orden', pageW - ML, 24, { align: 'right' })

  // Dates row
  setFont('normal', 7, [200, 210, 255])
  const entryStr    = `Ingreso: ${formatDateShort(order.entryDate) || '—'}`
  const deliverStr  = `Entrega: ${formatDateShort(order.deliveryDate) || 'Pendiente'}`
  doc.text(entryStr,   pageW - ML - 55, 33)
  doc.text(deliverStr, pageW - ML,      33, { align: 'right' })

  y = 50

  // ── Status + generated date row ───────────────────────────────────────────
  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  const statusColors = {
    pending:          [245, 158, 11],
    diagnosing:       [99,  102, 241],
    waiting_approval: [249, 115, 22],
    in_repair:        [59,  130, 246],
    completed:        [16,  185, 129],
    delivered:        [16,  185, 129],
    irreparable:      [239, 68,  68],
    abandoned:        [148, 163, 184],
  }
  const sc = statusColors[order.status] || statusColors.pending

  // Status pill
  doc.setFillColor(sc[0], sc[1], sc[2], 0.12)
  doc.setFillColor(sc[0] + 180 > 255 ? 235 : sc[0] + 180,
                   sc[1] + 180 > 255 ? 235 : sc[1] + 180,
                   sc[2] + 180 > 255 ? 235 : sc[2] + 180)
  doc.roundedRect(ML, y - 4, 58, 9, 2, 2, 'F')
  doc.setFillColor(...sc)
  doc.circle(ML + 5, y + 0.5, 1.5, 'F')
  setFont('bold', 8, [sc[0] > 200 ? sc[0] - 60 : sc[0], sc[1] > 200 ? sc[1] - 60 : sc[1], sc[2] > 200 ? sc[2] - 60 : sc[2]])
  doc.text(`Estado: ${statusCfg.label}`, ML + 9, y + 1.2)

  // Generated date (right)
  setFont('normal', 7, C.mid)
  doc.text(`Generado: ${formatDate(new Date().toISOString())}`, pageW - ML, y + 1, { align: 'right' })

  y += 12

  // ── Customer Information ──────────────────────────────────────────────────
  checkPage(50)
  y = sectionHeader('Información del Cliente', y) + 4

  y = twoCol('Nombre completo', order.customerName, 'DNI / Documento', order.customerDni, y)
  y = twoCol('Teléfono', order.customerPhone, 'Email', order.customerEmail, y)

  if (order.customerAddress) {
    setFont('normal', 7, C.mid)
    doc.text('Dirección', ML, y)
    setFont('normal', 8.5, C.dark)
    const addrLines = doc.splitTextToSize(order.customerAddress, CW - 2)
    doc.text(addrLines.slice(0, 2), ML, y + 4.2)
    y += 4.2 + Math.min(addrLines.length, 2) * 4 + 4
  }

  y += 3
  hr(y)
  y += 5

  // ── Device Information ────────────────────────────────────────────────────
  checkPage(45)
  y = sectionHeader('Información del Dispositivo', y) + 4

  y = twoCol('Tipo de dispositivo', order.deviceType, 'Marca', order.deviceBrand, y)
  y = twoCol('Modelo', order.deviceModel, 'Serie / IMEI', order.deviceSerial, y)

  if (order.accessories?.length) {
    const accStr = order.accessories.join(', ')
    setFont('normal', 7, C.mid)
    doc.text('Accesorios incluidos', ML, y)
    setFont('normal', 8.5, C.dark)
    const accLines = doc.splitTextToSize(accStr, CW - 2)
    doc.text(accLines.slice(0, 2), ML, y + 4.2)
    y += 4.2 + Math.min(accLines.length, 2) * 4 + 2
  }

  // Condition checklist (compact inline)
  const checks = [
    ['Enciende',     order.powersOn],
    ['Carga',        order.charges],
    ['Pantalla',     order.screenWorks],
    ['Táctil',       order.touchWorks],
    ['Audio',        order.audioWorks],
    ['Botones',      order.buttonsWork],
    ['Daño agua',    order.waterDamage ? true : false],
    ['Daño físico',  order.physicalDamage ? true : false],
  ].filter(([, v]) => v !== null && v !== undefined)

  if (checks.length) {
    y += 3
    setFont('normal', 7, C.mid)
    doc.text('Condición reportada:', ML, y)
    y += 4
    let cx = ML
    checks.forEach(([label, val]) => {
      const isOk    = val === true
      const isNo    = val === false
      const isDmg   = label.startsWith('Daño') && val === true
      const dotC    = isDmg ? [239, 68, 68] : isOk ? [16, 185, 129] : isNo ? [239, 68, 68] : C.mid
      doc.setFillColor(...dotC)
      doc.circle(cx + 1.2, y - 0.8, 1.2, 'F')
      setFont('normal', 7, C.dark)
      const lbl = `${label}: ${val === true ? 'Sí' : val === false ? 'No' : '—'}`
      doc.text(lbl, cx + 4, y)
      cx += doc.getTextWidth(lbl) + 10
      if (cx > pageW - ML - 20) { cx = ML; y += 5 }
    })
    y += 5
  }

  y += 3
  hr(y)
  y += 5

  // ── Reported Issue ────────────────────────────────────────────────────────
  checkPage(30)
  y = sectionHeader('Problema Reportado', y) + 4

  doc.setFillColor(...C.light)
  const issueLines = doc.splitTextToSize(order.reportedIssue || '—', CW - 6)
  const issueH = issueLines.length * 4.2 + 6
  doc.roundedRect(ML, y - 1, CW, issueH, 2, 2, 'F')
  setFont('normal', 8.5, C.dark)
  doc.text(issueLines, ML + 3, y + 4)
  y += issueH + 6

  // ── Work Performed ────────────────────────────────────────────────────────
  if (order.workDone && order.workDone.trim()) {
    checkPage(30)
    y = sectionHeader('Trabajo Realizado', y) + 4
    const workLines = doc.splitTextToSize(order.workDone, CW - 6)
    const workH = workLines.length * 4.2 + 6
    doc.setFillColor(...C.light)
    doc.roundedRect(ML, y - 1, CW, workH, 2, 2, 'F')
    setFont('normal', 8.5, C.dark)
    doc.text(workLines, ML + 3, y + 4)
    y += workH + 6
  }

  // ── Budget Items (if present) ─────────────────────────────────────────────
  if (order.budgetItems?.length) {
    checkPage(30 + order.budgetItems.length * 7)
    y = sectionHeader('Detalle del Presupuesto', y) + 4

    // Table header
    doc.setFillColor(...C.accent)
    doc.rect(ML, y, CW, 6.5, 'F')
    setFont('bold', 7.5, C.primary)
    doc.text('Descripción',   ML + 2,       y + 4.5)
    doc.text('Cant.',         ML + CW - 45, y + 4.5, { align: 'right' })
    doc.text('P. Unit.',      ML + CW - 25, y + 4.5, { align: 'right' })
    doc.text('Total',         ML + CW,      y + 4.5, { align: 'right' })
    y += 6.5

    let rowTotal = 0
    order.budgetItems.forEach((item, idx) => {
      checkPage(8)
      const qty   = parseFloat(item.qty   || 1)
      const price = parseFloat(item.price || 0)
      const total = qty * price
      rowTotal += total

      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 255)
        doc.rect(ML, y, CW, 6.5, 'F')
      }

      setFont('normal', 8, C.dark)
      const descLines = doc.splitTextToSize(item.description || '—', CW - 55)
      doc.text(descLines[0], ML + 2, y + 4.5)
      doc.text(String(qty),         ML + CW - 45, y + 4.5, { align: 'right' })
      doc.text(f(price),            ML + CW - 25, y + 4.5, { align: 'right' })
      setFont('bold', 8, C.dark)
      doc.text(f(total),            ML + CW,      y + 4.5, { align: 'right' })
      y += 6.5
    })

    // Subtotal row
    hr(y, C.border, 0.4)
    y += 3
    setFont('bold', 8.5, C.dark)
    doc.text('Subtotal presupuesto:', ML + CW - 45, y + 4)
    doc.text(f(rowTotal), ML + CW, y + 4, { align: 'right' })
    y += 10
  }

  // ── Pricing Summary ───────────────────────────────────────────────────────
  checkPage(50)
  y = sectionHeader('Resumen de Precios', y) + 4

  // Pricing box
  const pricingBoxH = 32
  doc.setFillColor(...C.light)
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)
  doc.roundedRect(ML, y, CW, pricingBoxH, 2, 2, 'FD')

  // Left column: estimated + repair cost
  setFont('normal', 7, C.mid)
  doc.text('Precio estimado',   ML + 4,        y + 7)
  doc.text('Costo de reparación', ML + 4,      y + 18)
  setFont('bold', 9, C.dark)
  doc.text(f(order.estimatedPrice), ML + 4,    y + 12.5)
  doc.text(f(order.repairCost),     ML + 4,    y + 23.5)

  // Right column: final total highlighted
  doc.setFillColor(...C.primary)
  doc.roundedRect(ML + CW - 60, y + 3, 56, 26, 2, 2, 'F')
  setFont('normal', 7, [180, 190, 255])
  doc.text('TOTAL A COBRAR', ML + CW - 32, y + 10, { align: 'center' })
  setFont('bold', 14, C.white)
  doc.text(f(order.finalPrice || order.estimatedPrice), ML + CW - 32, y + 22, { align: 'center' })

  y += pricingBoxH + 10

  // ── Signature line ────────────────────────────────────────────────────────
  checkPage(25)
  const sigY = y + 12
  hr(sigY, C.border, 0.4)
  setFont('normal', 7, C.mid)
  doc.text('Firma del cliente', ML + 25, sigY + 4, { align: 'center' })
  hr(sigY, C.border, 0.4)
  const sig2X = pageW - ML - 50
  doc.line(sig2X, sigY, sig2X + 50, sigY)
  doc.setDrawColor(...C.border)
  doc.text('Firma del técnico', sig2X + 25, sigY + 4, { align: 'center' })
  y = sigY + 12

  // ── Terms & Conditions ────────────────────────────────────────────────────
  checkPage(15)
  y += 2
  y = sectionHeader('Términos y Condiciones', y) + 4

  warrantyPolicy.forEach((clause, i) => {
    const text  = `${i + 1}.  ${clause}`
    const lines = doc.splitTextToSize(text, CW - 6)
    checkPage(lines.length * 3.8 + 3)
    setFont('normal', 7, C.mid)
    doc.text(lines, ML + 3, y)
    y += lines.length * 3.8 + 2.5
  })

  y += 4

  // ── QR + Footer ───────────────────────────────────────────────────────────
  const footerY = pageH - 20
  hr(footerY, C.border, 0.3)

  // Footer text
  setFont('bold', 7.5, C.primary)
  doc.text(businessName, ML, footerY + 5)
  setFont('normal', 7, C.mid)
  doc.text('— Sistema de Gestión de Servicio Técnico', ML + doc.getTextWidth(businessName) + 1, footerY + 5)
  doc.text(`Generado: ${formatDate(new Date().toISOString())}`, pageW - ML, footerY + 5, { align: 'right' })
  setFont('normal', 6.5, C.mid)
  doc.text(`Orden: ${order.orderNumber || '—'}  ·  Técnico: ${order.createdBy || '—'}`, ML, footerY + 10)

  // QR — placed ABOVE footer if space allows, otherwise skip
  const trackingUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/track/${order.orderNumber}`
  try {
    const qrImg  = await qrDataUrl(trackingUrl)
    const qrSize = 22
    const qrX    = pageW - ML - qrSize
    const qrYPos = footerY - qrSize - 8

    if (qrYPos > y) {
      doc.addImage(qrImg, 'PNG', qrX, qrYPos, qrSize, qrSize)
      setFont('bold', 6.5, C.primary)
      doc.text('SEGUIMIENTO', qrX + qrSize / 2, qrYPos - 2, { align: 'center' })
      setFont('normal', 5.5, C.mid)
      doc.text('Escaneá para ver el estado', qrX + qrSize / 2, qrYPos + qrSize + 3, { align: 'center' })
    }
  } catch (_) { /* sin QR */ }

  doc.save(`${order.orderNumber || 'orden'}-servicio.pdf`)
}

export async function generateSalePDF(sale, settings = {}) {
  const businessName   = settings.businessName   || 'RAFIX'
  const businessLogo   = settings.businessLogo   || null
  const currency       = settings.currency       || 'ARS'
  const currencyLocale = settings.currencyLocale || 'es-AR'

  const f = (v) => fmt(v, currency, currencyLocale)

  const doc   = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = 210
  const pageH = 297
  const ML    = 14
  const CW    = pageW - ML * 2
  const font  = 'helvetica'

  const C = {
    primary:   [16, 185, 129],   // emerald
    primaryDk: [5,  150, 105],
    white:     [255, 255, 255],
    dark:      [30,  41,  59],
    mid:       [100, 116, 139],
    light:     [248, 250, 252],
    border:    [226, 232, 240],
    accent:    [209, 250, 229],  // emerald-100
  }

  let y = 0

  const setFont = (style, size, color) => {
    doc.setFont(font, style)
    doc.setFontSize(size)
    doc.setTextColor(...(color || C.dark))
  }

  const checkPage = (needed = 10) => {
    if (y + needed > pageH - 22) { doc.addPage(); y = ML }
  }

  const hr = (posY, color = C.border, lw = 0.3) => {
    doc.setDrawColor(...color)
    doc.setLineWidth(lw)
    doc.line(ML, posY, pageW - ML, posY)
  }

  const sectionHeader = (title, posY) => {
    doc.setFillColor(...C.primary)
    doc.rect(ML, posY, CW, 7, 'F')
    setFont('bold', 7.5, C.white)
    doc.text(title.toUpperCase(), ML + 3, posY + 5)
    return posY + 7
  }

  const infoField = (label, value, x, posY, w) => {
    const safeVal = String(value || '—')
    setFont('normal', 7, C.mid)
    doc.text(label, x, posY)
    setFont('normal', 8.5, C.dark)
    const lines = doc.splitTextToSize(safeVal, w - 2)
    doc.text(lines.slice(0, 2), x, posY + 4.2)
    return posY + 4.2 + Math.min(lines.length, 2) * 4
  }

  const twoCol = (leftLabel, leftVal, rightLabel, rightVal, posY) => {
    const half = CW / 2 - 3
    const yL = infoField(leftLabel, leftVal,  ML,           posY, half)
    const yR = infoField(rightLabel, rightVal, ML + CW / 2, posY, half)
    return Math.max(yL, yR) + 2
  }

  // ── Header band ──────────────────────────────────────────────────────────
  doc.setFillColor(...C.primaryDk)
  doc.rect(0, 0, pageW, 42, 'F')

  let logoEndX = ML
  if (businessLogo) {
    try {
      doc.addImage(businessLogo, ML, 7, 28, 28)
      logoEndX = ML + 32
    } catch (_) { logoEndX = ML }
  }

  setFont('bold', 20, C.white)
  doc.text(businessName, logoEndX, 19)
  setFont('normal', 8, [167, 243, 208])
  doc.text('Comprobante de Venta', logoEndX, 26)

  setFont('bold', 16, C.white)
  doc.text(sale.saleNumber || '—', pageW - ML, 18, { align: 'right' })
  setFont('normal', 7.5, [167, 243, 208])
  doc.text('Nº de Venta', pageW - ML, 24, { align: 'right' })

  setFont('normal', 7, [167, 243, 208])
  doc.text(`Fecha: ${formatDate(sale.createdAt)}`, pageW - ML, 33, { align: 'right' })

  y = 50

  // ── Status ────────────────────────────────────────────────────────────────
  const statusColors = { paid: [16, 185, 129], pending: [245, 158, 11], cancelled: [239, 68, 68] }
  const statusLabels = { paid: 'Pagado', pending: 'Pendiente', cancelled: 'Cancelado' }
  const sc = statusColors[sale.status] || statusColors.pending
  doc.setFillColor(sc[0] + 180 > 255 ? 235 : sc[0] + 180, sc[1] + 180 > 255 ? 235 : sc[1] + 180, sc[2] + 180 > 255 ? 235 : sc[2] + 180)
  doc.roundedRect(ML, y - 4, 48, 9, 2, 2, 'F')
  doc.setFillColor(...sc)
  doc.circle(ML + 5, y + 0.5, 1.5, 'F')
  setFont('bold', 8, [sc[0] > 200 ? sc[0] - 60 : sc[0], sc[1] > 200 ? sc[1] - 60 : sc[1], sc[2] > 200 ? sc[2] - 60 : sc[2]])
  doc.text(`Estado: ${statusLabels[sale.status] || 'Pendiente'}`, ML + 9, y + 1.2)
  setFont('normal', 7, C.mid)
  doc.text(`Generado: ${formatDate(new Date().toISOString())}`, pageW - ML, y + 1, { align: 'right' })
  y += 12

  // ── Customer ──────────────────────────────────────────────────────────────
  const hasCustomer = sale.customerName || sale.customerPhone || sale.customerEmail || sale.customerDni
  if (hasCustomer) {
    checkPage(40)
    y = sectionHeader('Datos del Cliente', y) + 4
    y = twoCol('Nombre', sale.customerName, 'DNI / Documento', sale.customerDni, y)
    y = twoCol('Teléfono', sale.customerPhone, 'Email', sale.customerEmail, y)
    if (sale.customerAddress) {
      setFont('normal', 7, C.mid)
      doc.text('Dirección', ML, y)
      setFont('normal', 8.5, C.dark)
      const addrLines = doc.splitTextToSize(sale.customerAddress, CW - 2)
      doc.text(addrLines.slice(0, 2), ML, y + 4.2)
      y += 4.2 + Math.min(addrLines.length, 2) * 4 + 4
    }
    y += 3
    hr(y)
    y += 5
  }

  // ── Items table ───────────────────────────────────────────────────────────
  checkPage(30 + (sale.items?.length || 1) * 7)
  y = sectionHeader('Productos / Servicios', y) + 4

  doc.setFillColor(...C.accent)
  doc.rect(ML, y, CW, 6.5, 'F')
  setFont('bold', 7.5, C.primaryDk)
  doc.text('Descripción',   ML + 2,       y + 4.5)
  doc.text('Cant.',         ML + CW - 45, y + 4.5, { align: 'right' })
  doc.text('P. Unit.',      ML + CW - 25, y + 4.5, { align: 'right' })
  doc.text('Total',         ML + CW,      y + 4.5, { align: 'right' })
  y += 6.5

  const items = sale.items || []
  let subtotal = 0
  let costos = 0

  items.forEach((item, idx) => {
    checkPage(8)
    const qty   = parseFloat(item.qty   || 1)
    const price = parseFloat(item.price || 0)
    const cost  = parseFloat(item.cost  || 0)
    const rowTotal = qty * price
    subtotal += rowTotal
    costos   += qty * cost

    if (idx % 2 === 0) {
      doc.setFillColor(240, 253, 249)
      doc.rect(ML, y, CW, 6.5, 'F')
    }
    setFont('normal', 8, C.dark)
    const descLines = doc.splitTextToSize(item.name || '—', CW - 55)
    doc.text(descLines[0], ML + 2, y + 4.5)
    doc.text(String(qty),  ML + CW - 45, y + 4.5, { align: 'right' })
    doc.text(f(price),     ML + CW - 25, y + 4.5, { align: 'right' })
    setFont('bold', 8, C.dark)
    doc.text(f(rowTotal),  ML + CW,      y + 4.5, { align: 'right' })
    y += 6.5
  })

  // ── Totals box ────────────────────────────────────────────────────────────
  const total    = sale.total ?? subtotal
  const ganancia = total - costos

  hr(y, C.border, 0.4)
  y += 6

  checkPage(40)
  doc.setFillColor(...C.light)
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)
  doc.roundedRect(ML, y, CW, 28, 2, 2, 'FD')

  setFont('normal', 7, C.mid)
  doc.text('Costo',    ML + 4, y + 8)
  doc.text('Ganancia', ML + 4, y + 17)
  setFont('bold', 9, C.dark)
  doc.text(f(costos),   ML + 4, y + 13)
  doc.text(f(ganancia), ML + 4, y + 22)

  doc.setFillColor(...C.primary)
  doc.roundedRect(ML + CW - 60, y + 2, 56, 24, 2, 2, 'F')
  setFont('normal', 7, [167, 243, 208])
  doc.text('TOTAL', ML + CW - 32, y + 9, { align: 'center' })
  setFont('bold', 14, C.white)
  doc.text(f(total), ML + CW - 32, y + 20, { align: 'center' })

  y += 38

  // ── Notes ─────────────────────────────────────────────────────────────────
  if (sale.notes?.trim()) {
    checkPage(25)
    y = sectionHeader('Notas', y) + 4
    const noteLines = doc.splitTextToSize(sale.notes, CW - 6)
    const noteH = noteLines.length * 4.2 + 6
    doc.setFillColor(...C.light)
    doc.roundedRect(ML, y - 1, CW, noteH, 2, 2, 'F')
    setFont('normal', 8.5, C.dark)
    doc.text(noteLines, ML + 3, y + 4)
    y += noteH + 8
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerY = pageH - 20
  hr(footerY, C.border, 0.3)
  setFont('bold', 7.5, C.primary)
  doc.text(businessName, ML, footerY + 5)
  setFont('normal', 7, C.mid)
  doc.text('— Sistema de Gestión', ML + doc.getTextWidth(businessName) + 1, footerY + 5)
  doc.text(`Generado: ${formatDate(new Date().toISOString())}`, pageW - ML, footerY + 5, { align: 'right' })
  setFont('normal', 6.5, C.mid)
  doc.text(`Venta: ${sale.saleNumber || '—'}`, ML, footerY + 10)

  doc.save(`${sale.saleNumber || 'venta'}-comprobante.pdf`)
}
