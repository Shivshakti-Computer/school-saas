import 'server-only'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export const C = {
    indigo: [0.31, 0.27, 0.90] as [number, number, number],
    green: [0.02, 0.59, 0.41] as [number, number, number],
    red: [0.86, 0.15, 0.15] as [number, number, number],
    slate800: [0.12, 0.16, 0.24] as [number, number, number],
    slate500: [0.39, 0.46, 0.55] as [number, number, number],
    slate200: [0.89, 0.91, 0.94] as [number, number, number],
    slate50: [0.97, 0.98, 0.99] as [number, number, number],
    white: [1, 1, 1] as [number, number, number],
}

export interface ColDef {
    header: string
    width: number
    align?: 'left' | 'center' | 'right'
    color?: (val: string) => [number, number, number] | undefined
}

export interface StatItem {
    label: string
    value: string
    color?: [number, number, number]
}

export async function buildPdf(opts: {
    title: string
    schoolName: string
    month?: string
    stats?: StatItem[]     // ✅ dynamic stats
    cols: ColDef[]
    rows: string[][]
}): Promise<Buffer> {

    const { title, schoolName, month, stats = [], cols, rows } = opts

    const pdfDoc = await PDFDocument.create()
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const reg = await pdfDoc.embedFont(StandardFonts.Helvetica)

    const W = 841.89
    const H = 595.28
    const margin = 40
    const tableW = cols.reduce((s, c) => s + c.width, 0)

    const addPage = () => {
        const page = pdfDoc.addPage([W, H])

        // Header
        page.drawRectangle({
            x: 0, y: H - 54,
            width: W, height: 54,
            color: rgb(...C.indigo),
        })

        page.drawText(title, {
            x: margin,
            y: H - 28,
            font: bold,
            size: 16,
            color: rgb(...C.white),
        })

        page.drawText(
            `${schoolName}${month ? ` · ${month}` : ''} · Generated ${new Date().toLocaleDateString('en-IN')}`,
            { x: margin, y: H - 44, font: reg, size: 9, color: rgb(...C.white) },
        )

        return page
    }

    let page = addPage()
    let cursorY = H - 54 - 14

    // ── Dynamic Stats ─────────────────────────────
    if (stats.length > 0) {
        const boxW = (W - margin * 2) / stats.length

        stats.forEach((s, i) => {
            const x = margin + i * boxW
            page.drawRectangle({
                x,
                y: cursorY - 36,
                width: boxW - 6,
                height: 36,
                color: rgb(...C.slate50),
            })

            page.drawText(s.label, {
                x: x + 6,
                y: cursorY - 14,
                font: reg,
                size: 7,
                color: rgb(...C.slate500),
            })

            page.drawText(s.value, {
                x: x + 6,
                y: cursorY - 30,
                font: bold,
                size: 12,
                color: rgb(...(s.color ?? C.slate800)),
            })
        })

        cursorY -= 50
    }

    // ── Table Header ─────────────────────────────
    const rowH = 18
    const fSize = 8

    const drawHeader = (y: number) => {
        page.drawRectangle({
            x: margin,
            y: y - rowH,
            width: tableW,
            height: rowH,
            color: rgb(...C.indigo),
        })

        let x = margin
        for (const col of cols) {
            page.drawText(col.header, {
                x:
                    col.align === 'center'
                        ? x + col.width / 2 - bold.widthOfTextAtSize(col.header, fSize) / 2
                        : col.align === 'right'
                            ? x + col.width - bold.widthOfTextAtSize(col.header, fSize) - 4
                            : x + 4,
                y: y - rowH + 5,
                font: bold,
                size: fSize,
                color: rgb(...C.white),
            })
            x += col.width
        }

        return y - rowH - 2
    }

    cursorY = drawHeader(cursorY)

    // ── Rows ─────────────────────────────────────
    rows.forEach((row, ri) => {

        if (cursorY - rowH < margin + 20) {
            page = addPage()
            cursorY = H - 54 - 14
            cursorY = drawHeader(cursorY)
        }

        if (ri % 2 === 0) {
            page.drawRectangle({
                x: margin,
                y: cursorY - rowH,
                width: tableW,
                height: rowH,
                color: rgb(...C.slate50),
            })
        }

        let x = margin

        row.forEach((cell, ci) => {
            const col = cols[ci]
            const cellColor = col?.color ? (col.color(cell) ?? C.slate800) : C.slate800
            const font = cellColor !== C.slate800 ? bold : reg

            const textW = font.widthOfTextAtSize(cell, fSize)

            const cx =
                col?.align === 'center'
                    ? x + col.width / 2 - textW / 2
                    : col?.align === 'right'
                        ? x + col.width - textW - 4
                        : x + 4

            page.drawText(cell, {
                x: cx,
                y: cursorY - rowH + 5,
                font,
                size: fSize,
                color: rgb(...cellColor),
            })

            x += col?.width ?? 60
        })

        cursorY -= rowH
    })

    const bytes = await pdfDoc.save()
    return Buffer.from(bytes)
}