// src/lib/pdf.ts — POORI FILE, copy karke replace karo

import QRCode from 'qrcode'
import { connectDB } from './db'
import { Fee } from '@/models/Fee'
import { Student } from '@/models/Student'
import { Result, Exam } from '@/models/Exam'
import { School } from '@/models/School'
import { uploadBuffer } from './storage'

// ─── Browser helper ───────────────────────────────────────────
async function getBrowser() {
  const isDev = process.env.NODE_ENV === 'development'

  if (isDev) {
    const { default: puppeteer } = await import('puppeteer-core')

    const executablePath =
      process.platform === 'win32'
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : process.platform === 'darwin'
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : '/usr/bin/google-chrome'

    return puppeteer.launch({
      executablePath,
      args:     ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true as any,   // 'true' works for all puppeteer-core versions
    })
  }

  // ── Production (Vercel) ──
  // chromium-min types are incomplete — cast to any to bypass all type errors
  const { default: chromiumModule } = await import('@sparticuz/chromium-min')
  const { default: puppeteer }      = await import('puppeteer-core')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chr = chromiumModule as any

  const launchOptions: any = {
    args:            Array.isArray(chr.args) ? chr.args : ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath:  await chr.executablePath(
      'https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar'
    ),
    headless:        true,
    defaultViewport: { width: 1280, height: 720 },  // hardcoded — no type dependency
  }

  return puppeteer.launch(launchOptions)
}

// ─── HTML to PDF helper ───────────────────────────────────────
async function htmlToPDF(
  html: string,
  options?: { width?: string; height?: string }
): Promise<Buffer> {
  const browser = await getBrowser()
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdfBuffer = options?.width
      ? await page.pdf({
          width:           options.width,
          height:          options.height,
          printBackground: true,
        })
      : await page.pdf({
          format:          'A4',
          printBackground: true,
        })

    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}


// ─────────────────────────────────────────────────────────────
// 1. FEE RECEIPT PDF
// ─────────────────────────────────────────────────────────────
export async function generateReceiptPDF(feeId: string): Promise<string> {
  await connectDB()

  const fee = await Fee.findById(feeId)
    .populate('studentId')
    .populate('structureId')
    .lean() as any

  if (!fee) throw new Error('Fee not found')

  const school    = await School.findById(fee.tenantId).lean() as any
  const student   = fee.studentId  as any
  const structure = fee.structureId as any
  const receiptNo = `RCP-${Date.now()}`
  const date      = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  const itemsHTML = (structure?.items ?? [])
    .map(
      (item: any) =>
        `<tr>
          <td>${item.label}</td>
          <td style="text-align:right">₹${Number(item.amount).toLocaleString('en-IN')}</td>
        </tr>`
    )
    .join('')

  const discountRow = fee.discount > 0
    ? `<tr><td>Discount</td><td style="text-align:right;color:green">- ₹${Number(fee.discount).toLocaleString('en-IN')}</td></tr>`
    : ''

  const lateFineRow = fee.lateFine > 0
    ? `<tr><td>Late Fine</td><td style="text-align:right;color:red">+ ₹${Number(fee.lateFine).toLocaleString('en-IN')}</td></tr>`
    : ''

  const txnRow = fee.razorpayPaymentId
    ? `<p style="text-align:center;font-size:12px;color:#888">Transaction ID: ${fee.razorpayPaymentId}</p>`
    : ''

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    .header { text-align: center; border-bottom: 2px solid #534AB7; padding-bottom: 16px; margin-bottom: 24px; }
    .school-name { font-size: 24px; font-weight: bold; color: #534AB7; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .info-item label { font-size: 12px; color: #888; display: block; }
    .info-item span { font-size: 14px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #534AB7; color: white; padding: 10px; text-align: left; font-size: 13px; }
    td { padding: 10px; border-bottom: 1px solid #eee; font-size: 13px; }
    .total-row { background: #f5f5f5; font-weight: bold; }
    .paid-stamp { text-align: center; margin: 24px 0; }
    .paid-badge { display: inline-block; border: 3px solid #1D9E75; color: #1D9E75;
      font-size: 32px; font-weight: bold; padding: 8px 32px; border-radius: 4px; letter-spacing: 4px; }
    .footer { text-align: center; font-size: 11px; color: #888; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="school-name">${school?.name ?? 'School'}</div>
    <div style="font-size:18px;color:#666;margin-top:4px">Fee Receipt</div>
    <div style="font-size:12px;color:#888;margin-top:4px">${school?.address ?? ''}</div>
  </div>

  <div class="info-grid">
    <div class="info-item"><label>Receipt No</label><span>${receiptNo}</span></div>
    <div class="info-item"><label>Date</label><span>${date}</span></div>
    <div class="info-item"><label>Admission No</label><span>${student?.admissionNo ?? ''}</span></div>
    <div class="info-item"><label>Class</label><span>${student?.class ?? ''} - ${student?.section ?? ''}</span></div>
    <div class="info-item"><label>Father Name</label><span>${student?.fatherName ?? ''}</span></div>
    <div class="info-item"><label>Payment Mode</label><span>${fee.paymentMode ?? 'Online'}</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Fee Description</th>
        <th style="text-align:right">Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
      ${discountRow}
      ${lateFineRow}
      <tr class="total-row">
        <td><strong>Total Paid</strong></td>
        <td style="text-align:right">
          <strong>₹${Number(fee.paidAmount).toLocaleString('en-IN')}</strong>
        </td>
      </tr>
    </tbody>
  </table>

  <div class="paid-stamp">
    <div class="paid-badge">PAID</div>
  </div>

  ${txnRow}

  <div class="footer">
    This is a computer-generated receipt. No signature required.<br>
    Powered by Shivshakti Computer Academy
  </div>
</body>
</html>`

  const pdfBuffer = await htmlToPDF(html)
  return uploadBuffer(pdfBuffer, `receipts/${receiptNo}`, 'pdf')
}


// ─────────────────────────────────────────────────────────────
// 2. STUDENT ID CARD PDF
// ─────────────────────────────────────────────────────────────
export async function generateIDCardPDF(studentId: string): Promise<string> {
  await connectDB()

  const student = await Student.findById(studentId)
    .populate('userId', 'name phone')
    .lean() as any
  if (!student) throw new Error('Student not found')

  const school = await School.findById(student.tenantId).lean() as any
  const user   = student.userId as any

  const qrDataUrl = await QRCode.toDataURL(
    `${process.env.NEXTAUTH_URL}/verify/student/${student.admissionNo}`
  )

  const photoHTML = student.photo
    ? `<img src="${student.photo}" style="width:100%;height:100%;object-fit:cover" />`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;
         color:white;font-size:20px;font-weight:bold">
         ${(user?.name ?? 'S').charAt(0)}
       </div>`

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; }
    .card {
      width: 85mm; height: 54mm;
      background: linear-gradient(135deg, #534AB7 0%, #1D9E75 100%);
      border-radius: 8px; padding: 12px; color: white;
      display: flex; gap: 12px; align-items: center;
    }
    .photo {
      width: 60px; height: 70px; border-radius: 6px;
      background: rgba(255,255,255,0.2);
      border: 2px solid white; overflow: hidden; flex-shrink: 0;
    }
    .info { flex: 1; min-width: 0; }
    .school-name { font-size: 8px; opacity: .8; margin-bottom: 2px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .student-name { font-size: 12px; font-weight: bold; margin-bottom: 4px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .detail { font-size: 8px; opacity: .9; margin: 1px 0; }
    .bottom { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 6px; }
    .admission { font-size: 9px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="card">
    <div class="photo">${photoHTML}</div>
    <div class="info">
      <div class="school-name">${school?.name ?? 'School'}</div>
      <div class="student-name">${user?.name ?? ''}</div>
      <div class="detail">Class: ${student.class} - ${student.section}</div>
      <div class="detail">Roll No: ${student.rollNo}</div>
      <div class="detail">Father: ${student.fatherName}</div>
      <div class="detail">Ph: ${student.parentPhone}</div>
      <div class="bottom">
        <div class="admission">Adm: ${student.admissionNo}</div>
        <img src="${qrDataUrl}" style="width:32px;height:32px" />
      </div>
    </div>
  </div>
</body>
</html>`

  const pdfBuffer = await htmlToPDF(html, { width: '85mm', height: '54mm' })
  return uploadBuffer(pdfBuffer, `idcards/${student.admissionNo}`, 'pdf')
}


// ─────────────────────────────────────────────────────────────
// 3. REPORT CARD PDF
// ─────────────────────────────────────────────────────────────
export async function generateReportCard(resultId: string): Promise<string> {
  await connectDB()

  const result = await Result.findById(resultId)
    .populate('studentId')
    .populate('examId')
    .lean() as any
  if (!result) throw new Error('Result not found')

  const school  = await School.findById(result.tenantId).lean() as any
  const student = result.studentId as any
  const exam    = result.examId    as any

  const marksRows = result.marks
    .map(
      (m: any) =>
        `<tr>
          <td style="text-align:left">${m.subject}</td>
          <td>${m.maxMarks}</td>
          <td>${m.isAbsent ? 'AB' : m.marksObtained}</td>
          <td><strong>${m.grade}</strong></td>
          <td class="${m.grade !== 'F' && !m.isAbsent ? 'pass' : 'fail'}">
            ${m.isAbsent ? 'Absent' : m.grade !== 'F' ? 'Pass' : 'Fail'}
          </td>
        </tr>`
    )
    .join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
    .header { text-align: center; margin-bottom: 20px; }
    h1 { color: #534AB7; margin: 0; font-size: 22px; }
    h2 { color: #333; margin: 4px 0; font-size: 16px; }
    .info-table { width: 100%; margin-bottom: 20px; font-size: 13px; border-collapse: collapse; }
    .info-table td { padding: 4px 8px; }
    .marks-table { width: 100%; border-collapse: collapse; }
    .marks-table th { background: #534AB7; color: white; padding: 8px; font-size: 12px; }
    .marks-table td { padding: 8px; border: 1px solid #ddd; font-size: 13px; text-align: center; }
    .pass { color: #1D9E75; font-weight: bold; }
    .fail { color: #E24B4A; font-weight: bold; }
    .summary { margin-top: 20px; background: #f9f9f9; padding: 16px; border-radius: 8px; }
    .grade-big { font-size: 48px; font-weight: bold; color: #534AB7; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${school?.name ?? 'School'}</h1>
    <h2>Report Card — ${exam?.name ?? ''}</h2>
    <p style="color:#888;font-size:13px">${school?.address ?? ''}</p>
  </div>

  <table class="info-table">
    <tr>
      <td><strong>Father:</strong> ${student?.fatherName ?? ''}</td>
      <td><strong>Adm No:</strong> ${student?.admissionNo ?? ''}</td>
      <td><strong>Class:</strong> ${student?.class ?? ''} - ${student?.section ?? ''}</td>
      <td><strong>Roll No:</strong> ${student?.rollNo ?? ''}</td>
    </tr>
  </table>

  <table class="marks-table">
    <thead>
      <tr>
        <th style="text-align:left">Subject</th>
        <th>Max Marks</th>
        <th>Obtained</th>
        <th>Grade</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>${marksRows}</tbody>
  </table>

  <div class="summary">
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <td>Total: <strong>${result.totalMarks}</strong></td>
        <td>Obtained: <strong>${result.totalObtained}</strong></td>
        <td>Percentage: <strong>${result.percentage}%</strong></td>
        <td><div class="grade-big">${result.grade}</div></td>
        <td>
          <span class="${result.isPassed ? 'pass' : 'fail'}" style="font-size:20px">
            ${result.isPassed ? 'PASS' : 'FAIL'}
          </span>
        </td>
      </tr>
    </table>
  </div>

  <div style="margin-top:40px;display:flex;justify-content:space-between;font-size:12px">
    <div>Class Teacher: _______________</div>
    <div>Principal: _______________</div>
  </div>
</body>
</html>`

  const pdfBuffer = await htmlToPDF(html)
  return uploadBuffer(pdfBuffer, `reportcards/${resultId}`, 'pdf')
}