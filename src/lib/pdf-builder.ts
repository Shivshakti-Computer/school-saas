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