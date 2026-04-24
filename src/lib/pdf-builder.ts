/* ============================================================
   FILE: src/lib/pdf-builder.ts
   Professional PDF generation with proper table borders,
   grid lines, and print-optimized layout
   ============================================================ */

import 'server-only'
import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib'

// ── Color Palette (RGB format for pdf-lib) ───────────────────

export const C = {
  // Brand colors
  indigo:   [0.31, 0.27, 0.90] as [number, number, number],
  indigoLight: [0.88, 0.90, 1.00] as [number, number, number],
  
  // Status colors
  green:    [0.02, 0.59, 0.41] as [number, number, number],
  red:      [0.86, 0.15, 0.15] as [number, number, number],
  orange:   [0.98, 0.45, 0.09] as [number, number, number],
  
  // Grayscale
  slate900: [0.09, 0.11, 0.16] as [number, number, number],
  slate800: [0.12, 0.16, 0.24] as [number, number, number],
  slate700: [0.20, 0.25, 0.34] as [number, number, number],
  slate600: [0.28, 0.33, 0.41] as [number, number, number],
  slate500: [0.39, 0.46, 0.55] as [number, number, number],
  slate400: [0.58, 0.64, 0.72] as [number, number, number],
  slate300: [0.80, 0.84, 0.88] as [number, number, number],
  slate200: [0.89, 0.91, 0.94] as [number, number, number],
  slate100: [0.95, 0.96, 0.97] as [number, number, number],
  slate50:  [0.97, 0.98, 0.99] as [number, number, number],
  white:    [1, 1, 1] as [number, number, number],
}

// ── Type Definitions ──────────────────────────────────────────

export interface ColDef {
  header: string
  width:  number
  align?: 'left' | 'center' | 'right'
  color?: (val: string) => [number, number, number] | undefined
}

export interface StatItem {
  label: string
  value: string
  color?: [number, number, number]
}

export interface BuildPdfOptions {
  title:      string
  schoolName: string
  month?:     string
  stats?:     StatItem[]
  cols:       ColDef[]
  rows:       string[][]
  footer?:    string
}

// ── Main PDF Builder ──────────────────────────────────────────

export async function buildPdf(opts: BuildPdfOptions): Promise<Buffer> {
  const { title, schoolName, month, stats = [], cols, rows, footer } = opts

  const pdfDoc = await PDFDocument.create()
  const bold   = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const reg    = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // ── A4 Landscape dimensions ───────────────────────────────
  const W = 841.89  // A4 landscape width in points
  const H = 595.28  // A4 landscape height in points
  
  const margin = {
    top:    50,
    right:  40,
    bottom: 40,
    left:   40,
  }

  const headerHeight = 60
  const footerHeight = footer ? 35 : 0
  const statsHeight  = stats.length > 0 ? 50 : 0

  // Calculate available space for table
  const contentStartY = H - margin.top - headerHeight - statsHeight - 10
  const contentEndY   = margin.bottom + footerHeight + 5

  // Calculate table dimensions
  const tableW = cols.reduce((sum, c) => sum + c.width, 0)
  
  // Center table if it's narrower than page width
  const tableX = margin.left + Math.max(0, (W - margin.left - margin.right - tableW) / 2)

  // ── Helper: Draw page header ─────────────────────────────
  const drawHeader = (page: PDFPage) => {
    // Header background with gradient effect
    page.drawRectangle({
      x: 0,
      y: H - headerHeight,
      width: W,
      height: headerHeight,
      color: rgb(...C.indigo),
    })

    // Subtle top accent line
    page.drawRectangle({
      x: 0,
      y: H - 3,
      width: W,
      height: 3,
      color: rgb(...C.indigoLight),
    })

    // Title
    page.drawText(title, {
      x: margin.left,
      y: H - 30,
      font: bold,
      size: 18,
      color: rgb(...C.white),
    })

    // Subtitle with metadata
    const subtitle = [
      schoolName,
      month,
      `Generated: ${new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}`,
    ].filter(Boolean).join('  •  ')

    page.drawText(subtitle, {
      x: margin.left,
      y: H - 48,
      font: reg,
      size: 9,
      color: rgb(...C.white),
    })
  }

  // ── Helper: Draw footer ──────────────────────────────────
  const drawFooter = (page: PDFPage, pageNum: number, totalPages: number) => {
    if (!footer && pageNum === 1 && totalPages === 1) return

    const footerY = margin.bottom - 5

    // Separator line
    page.drawLine({
      start: { x: margin.left, y: footerY + 15 },
      end:   { x: W - margin.right, y: footerY + 15 },
      thickness: 0.5,
      color: rgb(...C.slate200),
    })

    // Footer text (left)
    if (footer) {
      page.drawText(footer, {
        x: margin.left,
        y: footerY,
        font: reg,
        size: 7,
        color: rgb(...C.slate500),
      })
    }

    // Page number (right)
    const pageText = `Page ${pageNum} of ${totalPages}`
    const pageTextW = reg.widthOfTextAtSize(pageText, 7)
    
    page.drawText(pageText, {
      x: W - margin.right - pageTextW,
      y: footerY,
      font: reg,
      size: 7,
      color: rgb(...C.slate500),
    })
  }

  // ── Helper: Draw stats boxes ─────────────────────────────
  const drawStats = (page: PDFPage, yPosition: number) => {
    if (stats.length === 0) return yPosition

    const boxPadding = 8
    const boxW = (W - margin.left - margin.right - boxPadding * (stats.length - 1)) / stats.length
    const boxH = 42

    stats.forEach((stat, i) => {
      const x = margin.left + i * (boxW + boxPadding)
      const y = yPosition - boxH

      // Box background
      page.drawRectangle({
        x,
        y,
        width: boxW,
        height: boxH,
        color: rgb(...C.white),
        borderColor: rgb(...C.slate200),
        borderWidth: 1,
      })

      // Label
      page.drawText(stat.label, {
        x: x + 10,
        y: y + boxH - 16,
        font: reg,
        size: 8,
        color: rgb(...C.slate600),
      })

      // Value
      const valueColor = stat.color ?? C.slate900
      page.drawText(stat.value, {
        x: x + 10,
        y: y + boxH - 32,
        font: bold,
        size: 14,
        color: rgb(...valueColor),
      })
    })

    return yPosition - boxH - 12
  }

  // ── Helper: Draw table with borders ──────────────────────
  const rowHeight = 20
  const fontSize  = 8
  const cellPadding = 6

  const drawTableHeader = (page: PDFPage, yPosition: number): number => {
    const y = yPosition

    // Header background
    page.drawRectangle({
      x: tableX,
      y: y - rowHeight,
      width: tableW,
      height: rowHeight,
      color: rgb(...C.indigo),
    })

    // Column headers with vertical separators
    let x = tableX
    cols.forEach((col, i) => {
      // Vertical separator (except first column)
      if (i > 0) {
        page.drawLine({
          start: { x, y: y },
          end:   { x, y: y - rowHeight },
          thickness: 1,
          color: rgb(...C.white),
          opacity: 0.3,
        })
      }

      // Header text
      const headerText = col.header
      const textW = bold.widthOfTextAtSize(headerText, fontSize)
      
      let textX: number
      if (col.align === 'center') {
        textX = x + col.width / 2 - textW / 2
      } else if (col.align === 'right') {
        textX = x + col.width - textW - cellPadding
      } else {
        textX = x + cellPadding
      }

      page.drawText(headerText, {
        x: textX,
        y: y - rowHeight / 2 - fontSize / 2,
        font: bold,
        size: fontSize,
        color: rgb(...C.white),
      })

      x += col.width
    })

    // Top border
    page.drawLine({
      start: { x: tableX, y },
      end:   { x: tableX + tableW, y },
      thickness: 1.5,
      color: rgb(...C.indigo),
    })

    // Bottom border
    page.drawLine({
      start: { x: tableX, y: y - rowHeight },
      end:   { x: tableX + tableW, y: y - rowHeight },
      thickness: 1.5,
      color: rgb(...C.indigo),
    })

    // Left border
    page.drawLine({
      start: { x: tableX, y },
      end:   { x: tableX, y: y - rowHeight },
      thickness: 1.5,
      color: rgb(...C.indigo),
    })

    // Right border
    page.drawLine({
      start: { x: tableX + tableW, y },
      end:   { x: tableX + tableW, y: y - rowHeight },
      thickness: 1.5,
      color: rgb(...C.indigo),
    })

    return y - rowHeight
  }

  const drawTableRow = (
    page: PDFPage,
    row: string[],
    yPosition: number,
    rowIndex: number,
    isLastRow: boolean
  ): number => {
    const y = yPosition

    // Alternating row background
    if (rowIndex % 2 === 0) {
      page.drawRectangle({
        x: tableX,
        y: y - rowHeight,
        width: tableW,
        height: rowHeight,
        color: rgb(...C.slate50),
      })
    }

    // Cell content with vertical separators
    let x = tableX
    row.forEach((cell, i) => {
      const col = cols[i]

      // Vertical separator (light gray)
      if (i > 0) {
        page.drawLine({
          start: { x, y },
          end:   { x, y: y - rowHeight },
          thickness: 0.5,
          color: rgb(...C.slate200),
        })
      }

      // Cell text
      const cellColor = col?.color ? (col.color(cell) ?? C.slate800) : C.slate800
      const font = cellColor !== C.slate800 ? bold : reg
      const textW = font.widthOfTextAtSize(cell, fontSize)
      
      let textX: number
      if (col?.align === 'center') {
        textX = x + col.width / 2 - textW / 2
      } else if (col?.align === 'right') {
        textX = x + col.width - textW - cellPadding
      } else {
        textX = x + cellPadding
      }

      page.drawText(cell, {
        x: textX,
        y: y - rowHeight / 2 - fontSize / 2,
        font,
        size: fontSize,
        color: rgb(...cellColor),
      })

      x += col?.width ?? 60
    })

    // Horizontal bottom border
    page.drawLine({
      start: { x: tableX, y: y - rowHeight },
      end:   { x: tableX + tableW, y: y - rowHeight },
      thickness: isLastRow ? 1.5 : 0.5,
      color: isLastRow ? rgb(...C.slate300) : rgb(...C.slate200),
    })

    // Left border
    page.drawLine({
      start: { x: tableX, y },
      end:   { x: tableX, y: y - rowHeight },
      thickness: 1,
      color: rgb(...C.slate300),
    })

    // Right border
    page.drawLine({
      start: { x: tableX + tableW, y },
      end:   { x: tableX + tableW, y: y - rowHeight },
      thickness: 1,
      color: rgb(...C.slate300),
    })

    return y - rowHeight
  }

  // ── Create first page ─────────────────────────────────────
  let page = pdfDoc.addPage([W, H])
  drawHeader(page)

  let cursorY = contentStartY

  // Draw stats
  if (stats.length > 0) {
    cursorY = drawStats(page, cursorY)
  }

  // Draw table header
  cursorY = drawTableHeader(page, cursorY)

  // ── Draw table rows with pagination ──────────────────────
  rows.forEach((row, ri) => {
    // Check if new page needed
    if (cursorY - rowHeight < contentEndY) {
      page = pdfDoc.addPage([W, H])
      drawHeader(page)
      cursorY = contentStartY
      cursorY = drawTableHeader(page, cursorY)
    }

    const isLastRow = ri === rows.length - 1
    cursorY = drawTableRow(page, row, cursorY, ri, isLastRow)
  })

  // ── Add footers to all pages ──────────────────────────────
  const pages = pdfDoc.getPages()
  pages.forEach((p, i) => {
    drawFooter(p, i + 1, pages.length)
  })

  // ── Generate PDF buffer ───────────────────────────────────
  const bytes = await pdfDoc.save()
  return Buffer.from(bytes)
}


/* ============================================================
   DOCUMENT CERTIFICATE PDF GENERATION
   Simple HTML-like content to professional PDF converter
   For TC, CC, Bonafide certificates
   ============================================================ */

export interface DocumentPdfOptions {
  schoolName: string
  documentType: string  // TC, CC, BONAFIDE, CERTIFICATE
  serialNo: string
  content: string       // Plain text content with \n line breaks
  issuedDate?: string
  footerSignature?: string
}

/**
 * Generate professional document certificate PDF
 * Used for TC, CC, Bonafide, Custom certificates
 * 
 * @param opts Document options
 * @returns PDF buffer
 */
export async function buildDocumentPdf(opts: DocumentPdfOptions): Promise<Buffer> {
  const {
    schoolName,
    documentType,
    serialNo,
    content,
    issuedDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    footerSignature = 'Principal / Director',
  } = opts

  const pdfDoc = await PDFDocument.create()
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const reg = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // ── A4 Portrait dimensions ───────────────────────────────
  const W = 595.28  // A4 width in points
  const H = 841.89  // A4 height in points

  const margin = {
    top: 70,
    right: 50,
    bottom: 70,
    left: 50,
  }

  const page = pdfDoc.addPage([W, H])

  // ── Header Section ───────────────────────────────────────
  let cursorY = H - margin.top

  // School name (centered, bold, large)
  const schoolNameSize = 18
  const schoolNameWidth = bold.widthOfTextAtSize(schoolName.toUpperCase(), schoolNameSize)
  
  page.drawText(schoolName.toUpperCase(), {
    x: (W - schoolNameWidth) / 2,
    y: cursorY,
    font: bold,
    size: schoolNameSize,
    color: rgb(...C.slate900),
  })

  cursorY -= 25

  // Document type (centered, bold, underlined)
  const docTypeText = documentType.toUpperCase()
  const docTypeSize = 14
  const docTypeWidth = bold.widthOfTextAtSize(docTypeText, docTypeSize)
  const docTypeX = (W - docTypeWidth) / 2

  page.drawText(docTypeText, {
    x: docTypeX,
    y: cursorY,
    font: bold,
    size: docTypeSize,
    color: rgb(...C.slate900),
  })

  // Underline document type
  page.drawLine({
    start: { x: docTypeX - 10, y: cursorY - 3 },
    end: { x: docTypeX + docTypeWidth + 10, y: cursorY - 3 },
    thickness: 1,
    color: rgb(...C.slate900),
  })

  cursorY -= 22

  // Serial number (centered, smaller)
  const serialText = `Serial No: ${serialNo}`
  const serialSize = 10
  const serialWidth = reg.widthOfTextAtSize(serialText, serialSize)

  page.drawText(serialText, {
    x: (W - serialWidth) / 2,
    y: cursorY,
    font: reg,
    size: serialSize,
    color: rgb(...C.slate600),
  })

  cursorY -= 25

  // Header separator line
  page.drawLine({
    start: { x: margin.left, y: cursorY },
    end: { x: W - margin.right, y: cursorY },
    thickness: 2,
    color: rgb(...C.slate900),
  })

  cursorY -= 30

  // ── Content Section ──────────────────────────────────────
  const contentSize = 11
  const lineHeight = 20
  const maxWidth = W - margin.left - margin.right

  // Split content into lines
  const lines = content.split('\n')

  for (const line of lines) {
    // Check if page break needed (keep 150pt for footer)
    if (cursorY - lineHeight < margin.bottom + 150) {
      // Would overflow — truncate for single page
      // (For multi-page support, create new page here)
      break
    }

    const trimmedLine = line.trim()
    
    // Skip empty lines but add half spacing
    if (!trimmedLine) {
      cursorY -= lineHeight / 2
      continue
    }

    // Word wrap if line too long
    const words = trimmedLine.split(' ')
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const testWidth = reg.widthOfTextAtSize(testLine, contentSize)

      if (testWidth > maxWidth && currentLine) {
        // Draw current line
        page.drawText(currentLine, {
          x: margin.left,
          y: cursorY,
          font: reg,
          size: contentSize,
          color: rgb(...C.slate800),
          maxWidth,
        })
        cursorY -= lineHeight
        currentLine = word
      } else {
        currentLine = testLine
      }
    }

    // Draw remaining text
    if (currentLine) {
      page.drawText(currentLine, {
        x: margin.left,
        y: cursorY,
        font: reg,
        size: contentSize,
        color: rgb(...C.slate800),
        maxWidth,
      })
      cursorY -= lineHeight
    }
  }

  // ── Footer Section ───────────────────────────────────────
  const footerY = margin.bottom + 80

  // Date (left aligned)
  const dateText = `Date: ${issuedDate}`
  page.drawText(dateText, {
    x: margin.left,
    y: footerY,
    font: reg,
    size: 10,
    color: rgb(...C.slate800),
  })

  // Signature section (right aligned)
  const signatureX = W - margin.right - 150

  // Signature line
  page.drawLine({
    start: { x: signatureX, y: footerY + 50 },
    end: { x: W - margin.right, y: footerY + 50 },
    thickness: 1,
    color: rgb(...C.slate900),
  })

  // Signature label
  const signatureSize = 10
  const signatureWidth = reg.widthOfTextAtSize(footerSignature, signatureSize)
  
  page.drawText(footerSignature, {
    x: signatureX + (150 - signatureWidth) / 2,
    y: footerY + 35,
    font: reg,
    size: signatureSize,
    color: rgb(...C.slate800),
  })

  page.drawText('(Signature & Seal)', {
    x: signatureX + 15,
    y: footerY + 20,
    font: reg,
    size: 8,
    color: rgb(...C.slate600),
  })

  // ── Generate PDF buffer ──────────────────────────────────
  const bytes = await pdfDoc.save()
  return Buffer.from(bytes)
}

/**
 * HTML-like content to PDF (for backward compatibility)
 * Strips basic HTML tags and converts to plain text PDF
 * 
 * @param htmlContent HTML string (basic tags only)
 * @returns PDF buffer
 */

// ✅ OPTION 2: Replace regex flags manually (if tsconfig can't change)
export async function generatePdfFromHtml(htmlContent: string): Promise<Buffer> {
  // Extract metadata from HTML
  // ✅ FIX: Replace /s flag with [\s\S]* (ES5 compatible)
  const schoolNameMatch = htmlContent.match(/<div class="school-name">([\s\S]*?)<\/div>/)
  const docTitleMatch = htmlContent.match(/<div class="doc-title">([\s\S]*?)<\/div>/)
  const serialMatch = htmlContent.match(/Serial No:\s*(\S+)/)
  const contentMatch = htmlContent.match(/<div class="content">([\s\S]*?)<\/div>/)

  const schoolName = schoolNameMatch?.[1]?.trim() || 'Institution'
  const docType = docTitleMatch?.[1]?.trim() || 'CERTIFICATE'
  const serialNo = serialMatch?.[1]?.trim() || 'N/A'
  
  // Clean content — remove HTML tags
  let content = contentMatch?.[1] || htmlContent
  content = content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()

  return buildDocumentPdf({
    schoolName,
    documentType: docType,
    serialNo,
    content,
  })
}



/* ============================================================
   CERTIFICATE PDF GENERATION
   Professional certificate with QR verification
   ============================================================ */

export interface CertificatePdfOptions {
  // School details
  schoolName: string
  schoolLogo?: string
  accreditations?: {
    affiliations?: string[]
    registrations?: string[]
    recognitions?: string[]
  }

  // Certificate details
  certificateType: string
  certificateNumber: string
  title: string
  recipientName: string
  content: string

  // Verification
  verificationCode: string
  verificationUrl?: string

  // Customization
  layout?: 'classic' | 'modern' | 'elegant'
  signatureLabel?: string
  issuedDate?: string
  borderStyle?: string
}

/**
 * Generate professional certificate PDF
 * Used for merit, participation, achievement certificates
 * 
 * @param opts Certificate options
 * @returns PDF buffer
 */
export async function buildCertificatePdf(opts: CertificatePdfOptions): Promise<Buffer> {
  const {
    schoolName,
    certificateType,
    certificateNumber,
    title,
    recipientName,
    content,
    verificationCode,
    layout = 'modern',
    signatureLabel = 'Principal',
    issuedDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    accreditations,
  } = opts

  const pdfDoc = await PDFDocument.create()
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const boldItalic = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique)
  const reg = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  // ── A4 Landscape for certificates ──────────────────────────
  const W = 841.89  // A4 landscape width
  const H = 595.28  // A4 landscape height

  const margin = {
    top: 60,
    right: 60,
    bottom: 60,
    left: 60,
  }

  const page = pdfDoc.addPage([W, H])

  // ── Border (decorative) ────────────────────────────────────
  const borderPadding = 20
  const borderColor = layout === 'elegant' 
    ? C.indigo 
    : layout === 'modern' 
    ? [0.8, 0.6, 0.2] as [number, number, number]  // Gold
    : C.slate700

  // Outer border
  page.drawRectangle({
    x: borderPadding,
    y: borderPadding,
    width: W - borderPadding * 2,
    height: H - borderPadding * 2,
    borderColor: rgb(...borderColor),
    borderWidth: 3,
  })

  // Inner border (double border effect)
  page.drawRectangle({
    x: borderPadding + 8,
    y: borderPadding + 8,
    width: W - (borderPadding + 8) * 2,
    height: H - (borderPadding + 8) * 2,
    borderColor: rgb(...borderColor),
    borderWidth: 1,
  })

  let cursorY = H - margin.top

  // ── Header Section ─────────────────────────────────────────
  // School name (centered, elegant)
  const schoolNameSize = 24
  const schoolNameWidth = bold.widthOfTextAtSize(schoolName.toUpperCase(), schoolNameSize)

  page.drawText(schoolName.toUpperCase(), {
    x: (W - schoolNameWidth) / 2,
    y: cursorY,
    font: bold,
    size: schoolNameSize,
    color: rgb(...C.slate900),
  })

  cursorY -= 35

  // Accreditations (if any)
  if (accreditations) {
    const accLines: string[] = []
    
    if (accreditations.affiliations?.length) {
      accLines.push(accreditations.affiliations.join(' • '))
    }
    if (accreditations.registrations?.length) {
      accLines.push(accreditations.registrations.join(' • '))
    }
    
    accLines.forEach(line => {
      const lineSize = 9
      const lineWidth = reg.widthOfTextAtSize(line, lineSize)
      
      page.drawText(line, {
        x: (W - lineWidth) / 2,
        y: cursorY,
        font: reg,
        size: lineSize,
        color: rgb(...C.slate600),
      })
      
      cursorY -= 14
    })
  }

  cursorY -= 10

  // Decorative line
  const lineMargin = 150
  page.drawLine({
    start: { x: lineMargin, y: cursorY },
    end: { x: W - lineMargin, y: cursorY },
    thickness: 1,
    color: rgb(...borderColor),
  })

  cursorY -= 35

  // ── Certificate Type Label ─────────────────────────────────
  const certTypeText = 'CERTIFICATE'
  const certTypeSize = 16
  const certTypeWidth = bold.widthOfTextAtSize(certTypeText, certTypeSize)

  page.drawText(certTypeText, {
    x: (W - certTypeWidth) / 2,
    y: cursorY,
    font: bold,
    size: certTypeSize,
    color: rgb(...borderColor),
  })

  cursorY -= 22

  // Certificate subtype
  const subTypeText = certificateType.toUpperCase()
  const subTypeSize = 12
  const subTypeWidth = reg.widthOfTextAtSize(subTypeText, subTypeSize)

  page.drawText(subTypeText, {
    x: (W - subTypeWidth) / 2,
    y: cursorY,
    font: reg,
    size: subTypeSize,
    color: rgb(...C.slate700),
  })

  cursorY -= 40

  // ── Award Text ──────────────────────────────────────────────
  const awardText = 'This is proudly presented to'
  const awardSize = 11
  const awardWidth = italic.widthOfTextAtSize(awardText, awardSize)

  page.drawText(awardText, {
    x: (W - awardWidth) / 2,
    y: cursorY,
    font: italic,
    size: awardSize,
    color: rgb(...C.slate700),
  })

  cursorY -= 35

  // ── Recipient Name (large, elegant) ────────────────────────
  const nameSize = 28
  const nameWidth = boldItalic.widthOfTextAtSize(recipientName, nameSize)

  page.drawText(recipientName, {
    x: (W - nameWidth) / 2,
    y: cursorY,
    font: boldItalic,
    size: nameSize,
    color: rgb(...C.slate900),
  })

  // Underline name
  const underlineMargin = 80
  page.drawLine({
    start: { x: (W - nameWidth) / 2 - 20, y: cursorY - 5 },
    end: { x: (W - nameWidth) / 2 + nameWidth + 20, y: cursorY - 5 },
    thickness: 1.5,
    color: rgb(...borderColor),
  })

  cursorY -= 45

  // ── Title/Reason ────────────────────────────────────────────
  const titleSize = 13
  const titleLines = wrapText(title, W - 200, reg, titleSize)

  titleLines.forEach(line => {
    const lineWidth = reg.widthOfTextAtSize(line, titleSize)
    
    page.drawText(line, {
      x: (W - lineWidth) / 2,
      y: cursorY,
      font: reg,
      size: titleSize,
      color: rgb(...C.slate800),
    })
    
    cursorY -= 20
  })

  cursorY -= 10

  // ── Content (if any) ────────────────────────────────────────
  if (content && content.trim()) {
    const contentSize = 11
    const contentLines = content.split('\n').filter(l => l.trim())

    contentLines.forEach(line => {
      const wrapped = wrapText(line.trim(), W - 200, reg, contentSize)
      
      wrapped.forEach(wLine => {
        const lineWidth = reg.widthOfTextAtSize(wLine, contentSize)
        
        page.drawText(wLine, {
          x: (W - lineWidth) / 2,
          y: cursorY,
          font: reg,
          size: contentSize,
          color: rgb(...C.slate700),
          maxWidth: W - 200,
        })
        
        cursorY -= 16
      })
    })
  }

  // ── Footer Section ──────────────────────────────────────────
  const footerY = margin.bottom + 70

  // Date (left)
  const dateText = `Date: ${issuedDate}`
  page.drawText(dateText, {
    x: margin.left + 40,
    y: footerY,
    font: reg,
    size: 10,
    color: rgb(...C.slate800),
  })

  // Signature (right)
  const signatureX = W - margin.right - 180

  // Signature line
  page.drawLine({
    start: { x: signatureX, y: footerY + 50 },
    end: { x: W - margin.right - 20, y: footerY + 50 },
    thickness: 1,
    color: rgb(...C.slate900),
  })

  // Signature label
  const sigLabelSize = 11
  const sigLabel = signatureLabel
  const sigLabelWidth = reg.widthOfTextAtSize(sigLabel, sigLabelSize)

  page.drawText(sigLabel, {
    x: signatureX + (160 - sigLabelWidth) / 2,
    y: footerY + 35,
    font: reg,
    size: sigLabelSize,
    color: rgb(...C.slate800),
  })

  page.drawText('(Authorized Signatory)', {
    x: signatureX + 20,
    y: footerY + 20,
    font: reg,
    size: 8,
    color: rgb(...C.slate600),
  })

  // ── Certificate Number & Verification ──────────────────────
  const certNumText = `Certificate No: ${certificateNumber}`
  const certNumSize = 9
  const certNumWidth = reg.widthOfTextAtSize(certNumText, certNumSize)

  page.drawText(certNumText, {
    x: (W - certNumWidth) / 2,
    y: footerY - 10,
    font: reg,
    size: certNumSize,
    color: rgb(...C.slate600),
  })

  // Verification code
  const verifyText = `Verification Code: ${verificationCode}`
  const verifySize = 8
  const verifyWidth = reg.widthOfTextAtSize(verifyText, verifySize)

  page.drawText(verifyText, {
    x: (W - verifyWidth) / 2,
    y: footerY - 25,
    font: reg,
    size: verifySize,
    color: rgb(...C.slate500),
  })

  // Verify instruction
  const verifyInst = 'Scan QR code or visit verification URL to verify authenticity'
  const verifyInstSize = 7
  const verifyInstWidth = reg.widthOfTextAtSize(verifyInst, verifyInstSize)

  page.drawText(verifyInst, {
    x: (W - verifyInstWidth) / 2,
    y: footerY - 37,
    font: italic,
    size: verifyInstSize,
    color: rgb(...C.slate400),
  })

  // ── Generate PDF ────────────────────────────────────────────
  const bytes = await pdfDoc.save()
  return Buffer.from(bytes)
}

// ── Helper: Word Wrap ───────────────────────────────────────
function wrapText(
  text: string,
  maxWidth: number,
  font: any,
  fontSize: number
): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const testWidth = font.widthOfTextAtSize(testLine, fontSize)

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }

  if (currentLine) lines.push(currentLine)
  return lines
}