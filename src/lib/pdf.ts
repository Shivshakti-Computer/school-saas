// src/lib/pdf.ts
// server-only — sirf server pe run hoga
// ═══════════════════════════════════════════════════════════
// EXPORTS:
//   generateIDCardBuffer()      → Buffer (no Cloudinary) ← UNCHANGED
//   generateIDCardPDF()         → string URL             ← UNCHANGED (Cloudinary)
//   generateReceiptPDF()        → string URL             ← UNCHANGED (Cloudinary)
//   generateReportCardBuffer()  → Buffer (no Cloudinary) ← NEW (replaces old)
//   generateReportCard()        → throws error           ← DEPRECATED STUB
//   generateAdmitCardBuffer()   → Buffer (no Cloudinary) ← NEW
// ═══════════════════════════════════════════════════════════

import 'server-only'

import QRCode from 'qrcode'
import { connectDB } from './db'
import { Fee } from '@/models/Fee'
import { Student } from '@/models/Student'
import { Result, Exam, getClassGroup, type ClassGroup } from '@/models/Exam'
import { School } from '@/models/School'
import { uploadBuffer } from './storage'

/* ═══════════════════════════════════════════════════════════
   BROWSER HELPER — Dev: Chrome, Prod: Chromium-min (Vercel)
   ═══════════════════════════════════════════════════════════ */

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
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true as any,
    })
  }

  // Production (Vercel)
  const { default: chromiumModule } = await import('@sparticuz/chromium-min')
  const { default: puppeteer } = await import('puppeteer-core')
  const chr = chromiumModule as any

  return puppeteer.launch({
    args: Array.isArray(chr.args)
      ? chr.args
      : ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: await chr.executablePath(
      'https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar'
    ),
    headless: true,
    defaultViewport: { width: 1280, height: 720 },
  })
}

/* ── HTML → PDF Buffer ──────────────────────────────────── */

async function htmlToPDF(
  html: string,
  options?: {
    width?: string
    height?: string
    format?: 'A4' | 'A5' | 'Letter'
  }
): Promise<Buffer> {
  const browser = await getBrowser()
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdfBuffer = options?.width
      ? await page.pdf({
        width: options.width,
        height: options.height,
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      })
      : await page.pdf({
        format: (options?.format || 'A4') as any,
        printBackground: true,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      })

    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}


/* ═══════════════════════════════════════════════════════════
   1. STUDENT ID CARD
   — UNCHANGED from original
   — generateIDCardBuffer → Buffer (route directly use karta hai)
   — generateIDCardPDF    → Cloudinary URL
   ═══════════════════════════════════════════════════════════ */

export async function generateIDCardBuffer(studentId: string): Promise<Buffer> {
  await connectDB()

  const student = await Student.findById(studentId)
    .populate('userId', 'name phone email')
    .lean() as any

  if (!student) throw new Error('Student not found')

  const school = await School.findById(student.tenantId)
    .select('name address phone email logo website')
    .lean() as any

  if (!school) throw new Error('School not found')

  const user = student.userId as any

  const schoolName = school.name || 'School Name'
  const schoolAddress = school.website?.address || school.address || ''
  const schoolPhone = school.website?.phone || school.phone || ''
  const schoolColor = school.website?.primaryColor || '#2563EB'
  const schoolLogo = school.logo || ''

  const studentName = user?.name || 'Student Name'
  const initials = studentName
    .split(' ')
    .map((n: string) => n[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const dob = student.dateOfBirth
    ? new Date(student.dateOfBirth).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
    : '—'

  const verifyUrl = `${process.env.NEXTAUTH_URL}/verify/student/${student.admissionNo}`
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 80, margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' },
  })

  const photoHTML = student.photo
    ? `<img src="${student.photo}"
           style="width:100%;height:100%;object-fit:cover;border-radius:4px"
           crossorigin="anonymous" />`
    : `<div style="
           width:100%;height:100%;
           display:flex;align-items:center;justify-content:center;
           background:${schoolColor}20;color:${schoolColor};
           font-size:22px;font-weight:800;border-radius:4px;
           font-family:Arial,sans-serif;
         ">${initials}</div>`

  const logoHTML = schoolLogo
    ? `<img src="${schoolLogo}"
           style="width:28px;height:28px;object-fit:contain;border-radius:4px"
           crossorigin="anonymous" />`
    : `<div style="
           width:28px;height:28px;border-radius:4px;
           background:rgba(255,255,255,0.25);
           display:flex;align-items:center;justify-content:center;
           color:white;font-weight:800;font-size:12px;
           font-family:Arial,sans-serif;
         ">${schoolName.charAt(0)}</div>`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,Helvetica,sans-serif; background:white; width:196mm; }
  .cards-wrapper { display:flex; gap:6mm; align-items:flex-start; }
  .card { width:85mm; height:54mm; border-radius:3mm; overflow:hidden; position:relative; flex-shrink:0; }
  .front { background:#FFFFFF; border:0.5px solid #E2E8F0; display:flex; flex-direction:column; }
  .front-header { background:${schoolColor}; padding:2.5mm 3mm; display:flex; align-items:center; gap:2mm; flex-shrink:0; }
  .school-text h2 { color:white; font-size:6.5pt; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:50mm; line-height:1.2; }
  .school-text p  { color:rgba(255,255,255,0.75); font-size:5pt; margin-top:0.5mm; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:50mm; }
  .id-type-badge  { margin-left:auto; background:rgba(255,255,255,0.2); color:white; font-size:5pt; font-weight:700; padding:1mm 2mm; border-radius:1mm; white-space:nowrap; text-transform:uppercase; letter-spacing:0.02em; }
  .front-body     { flex:1; display:flex; padding:2.5mm 3mm; gap:3mm; }
  .photo-col      { display:flex; flex-direction:column; align-items:center; gap:1.5mm; flex-shrink:0; }
  .photo-box      { width:17mm; height:20mm; border-radius:1.5mm; border:0.5px solid ${schoolColor}40; overflow:hidden; background:${schoolColor}08; }
  .adm-no-text    { font-size:4.5pt; color:#64748B; font-weight:600; text-align:center; letter-spacing:0.02em; }
  .info-col       { flex:1; display:flex; flex-direction:column; justify-content:center; gap:1mm; min-width:0; }
  .student-name-text { font-size:9pt; font-weight:800; color:#0F172A; line-height:1.1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .class-badge-div   { display:inline-flex; align-items:center; background:${schoolColor}15; color:${schoolColor}; font-size:5.5pt; font-weight:700; padding:0.5mm 2mm; border-radius:1mm; margin-top:0.5mm; width:fit-content; }
  .info-row-div      { display:flex; align-items:flex-start; gap:1.5mm; margin-top:0.5mm; }
  .info-label-text   { font-size:5pt; font-weight:700; color:#94A3B8; width:12mm; flex-shrink:0; text-transform:uppercase; padding-top:0.3mm; letter-spacing:0.02em; }
  .info-value-text   { font-size:5.5pt; font-weight:600; color:#334155; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .blood-value       { color:#DC2626; font-weight:800; }
  .front-footer-div  { background:#F8FAFC; border-top:0.5px solid #F1F5F9; padding:1.5mm 3mm; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
  .session-text-small{ font-size:5pt; color:#94A3B8; font-weight:500; }
  .roll-text-small   { font-size:5pt; font-weight:700; color:${schoolColor}; }
  .back              { background:#FFFFFF; border:0.5px solid #E2E8F0; display:flex; flex-direction:column; }
  .back-accent-top   { height:5mm; background:${schoolColor}; flex-shrink:0; }
  .back-body-div     { flex:1; padding:2.5mm 3mm; display:flex; flex-direction:column; gap:2mm; }
  .back-title-text   { font-size:6pt; font-weight:800; color:#0F172A; text-transform:uppercase; letter-spacing:0.04em; border-bottom:0.5px solid #F1F5F9; padding-bottom:1.5mm; }
  .back-grid         { display:grid; grid-template-columns:1fr 1fr; gap:1.5mm; }
  .back-item         { display:flex; flex-direction:column; gap:0.3mm; }
  .back-item-label   { font-size:4.5pt; font-weight:700; color:#94A3B8; text-transform:uppercase; letter-spacing:0.03em; }
  .back-item-value   { font-size:5.5pt; font-weight:600; color:#334155; }
  .back-bottom       { display:flex; align-items:flex-end; justify-content:space-between; margin-top:auto; }
  .emergency-box     { background:#FEF2F2; border:0.5px solid #FECACA; border-radius:1.5mm; padding:1.5mm 2mm; flex:1; margin-right:2mm; }
  .emergency-label   { font-size:4.5pt; font-weight:700; color:#B91C1C; text-transform:uppercase; letter-spacing:0.03em; }
  .emergency-value   { font-size:6pt; font-weight:800; color:#DC2626; margin-top:0.5mm; }
  .qr-section        { display:flex; flex-direction:column; align-items:center; gap:0.5mm; flex-shrink:0; }
  .qr-label          { font-size:4pt; color:#94A3B8; text-align:center; }
  .back-footer-div   { background:${schoolColor}; padding:1.5mm 3mm; flex-shrink:0; }
  .back-footer-text  { font-size:5pt; color:rgba(255,255,255,0.9); font-weight:500; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
</style>
</head>
<body>
<div class="cards-wrapper">

  <!-- FRONT -->
  <div class="card front">
    <div class="front-header">
      ${logoHTML}
      <div class="school-text">
        <h2>${schoolName}</h2>
        ${schoolAddress
      ? `<p>${schoolAddress.slice(0, 45)}${schoolAddress.length > 45 ? '...' : ''}</p>`
      : ''}
      </div>
      <div class="id-type-badge">Student ID</div>
    </div>
    <div class="front-body">
      <div class="photo-col">
        <div class="photo-box">${photoHTML}</div>
        <p class="adm-no-text">${student.admissionNo}</p>
      </div>
      <div class="info-col">
        <p class="student-name-text">${studentName}</p>
        <div class="class-badge-div">
          Class ${student.class} — ${student.section} &nbsp;·&nbsp; Roll #${student.rollNo}
        </div>
        <div class="info-row-div">
          <span class="info-label-text">Father</span>
          <span class="info-value-text">${student.fatherName || '—'}</span>
        </div>
        <div class="info-row-div">
          <span class="info-label-text">DOB</span>
          <span class="info-value-text">${dob}</span>
        </div>
        <div class="info-row-div">
          <span class="info-label-text">Phone</span>
          <span class="info-value-text">${student.parentPhone || '—'}</span>
        </div>
        ${student.bloodGroup ? `
        <div class="info-row-div">
          <span class="info-label-text">Blood</span>
          <span class="info-value-text blood-value">${student.bloodGroup}</span>
        </div>` : ''}
      </div>
    </div>
    <div class="front-footer-div">
      <span class="session-text-small">Session: ${student.academicYear || '—'}</span>
      <span class="roll-text-small">Roll No: ${student.rollNo}</span>
    </div>
  </div>

  <!-- BACK -->
  <div class="card back">
    <div class="back-accent-top"></div>
    <div class="back-body-div">
      <p class="back-title-text">${schoolName}</p>
      <div class="back-grid">
        <div class="back-item">
          <span class="back-item-label">Admission No</span>
          <span class="back-item-value">${student.admissionNo}</span>
        </div>
        <div class="back-item">
          <span class="back-item-label">Academic Year</span>
          <span class="back-item-value">${student.academicYear || '—'}</span>
        </div>
        <div class="back-item">
          <span class="back-item-label">Class & Section</span>
          <span class="back-item-value">Class ${student.class} - ${student.section}</span>
        </div>
        <div class="back-item">
          <span class="back-item-label">Category</span>
          <span class="back-item-value" style="text-transform:uppercase;">
            ${student.category || 'General'}
          </span>
        </div>
        ${student.address ? `
        <div class="back-item" style="grid-column:1/-1">
          <span class="back-item-label">Address</span>
          <span class="back-item-value">
            ${(student.address + (student.city ? `, ${student.city}` : '')).slice(0, 55)}...
          </span>
        </div>` : ''}
      </div>
      <div class="back-bottom">
        <div class="emergency-box">
          <p class="emergency-label">⚠ Emergency</p>
          <p class="emergency-value">
            ${student.emergencyContact || student.parentPhone || '—'}
          </p>
          ${student.emergencyName
      ? `<p style="font-size:4.5pt;color:#EF4444;margin-top:0.3mm">
                 ${student.emergencyName}
               </p>`
      : ''}
        </div>
        <div class="qr-section">
          <img src="${qrDataUrl}" style="width:18mm;height:18mm" />
          <span class="qr-label">Scan to verify</span>
        </div>
      </div>
    </div>
    <div class="back-footer-div">
      <p class="back-footer-text">
        If found, return to ${schoolName}${schoolPhone ? ` · ${schoolPhone}` : ''}
      </p>
    </div>
  </div>

</div>
</body>
</html>`

  return htmlToPDF(html, { width: '196mm', height: '60mm' })
}

/* ── ID Card → Cloudinary (backward compat) ─────────────── */

export async function generateIDCardPDF(studentId: string): Promise<string> {
  const buffer = await generateIDCardBuffer(studentId)

  const student = await Student.findById(studentId)
    .select('admissionNo')
    .lean() as any

  return uploadBuffer(
    buffer,
    `idcards/${student?.admissionNo || studentId}`,
    'pdf'
  )
}


/* ═══════════════════════════════════════════════════════════
   2. FEE RECEIPT PDF
   — UNCHANGED from original
   — Cloudinary pe store hota hai
   ═══════════════════════════════════════════════════════════ */

export async function generateReceiptPDF(feeId: string): Promise<string> {
  await connectDB()

  const fee = await Fee.findById(feeId)
    .populate({
      path: 'studentId',
      populate: { path: 'userId', select: 'name phone' },
    })
    .populate('structureId')
    .lean() as any

  if (!fee) throw new Error('Fee not found')

  const school = await School.findById(fee.tenantId)
    .select('name address phone email logo website')
    .lean() as any
  const student = fee.studentId as any
  const structure = fee.structureId as any
  const studentUser = student?.userId as any

  const schoolName = school?.name || 'School Name'
  const schoolAddress = school?.website?.address || school?.address || ''
  const schoolPhone = school?.website?.phone || school?.phone || ''
  const schoolColor = school?.website?.primaryColor || '#2563EB'
  const schoolLogo = school?.logo || ''

  const receiptNo = `RCP-${Date.now().toString().slice(-8)}`
  const paidDate = fee.paidAt
    ? new Date(fee.paidAt).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
    : new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric',
    })

  const itemsHTML = (structure?.items || [])
    .map((item: any) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #F1F5F9;font-size:12px;color:#334155;">
          ${item.label}
          ${item.isOptional
        ? '<span style="font-size:10px;color:#94A3B8;margin-left:4px">(Optional)</span>'
        : ''}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #F1F5F9;text-align:right;font-size:12px;color:#334155;">
          ₹${Number(item.amount).toLocaleString('en-IN')}
        </td>
      </tr>`)
    .join('')

  const discountRow = fee.discount > 0 ? `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #F1F5F9;font-size:12px;color:#059669;">
        Discount Applied
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #F1F5F9;text-align:right;font-size:12px;color:#059669;font-weight:700;">
        — ₹${Number(fee.discount).toLocaleString('en-IN')}
      </td>
    </tr>` : ''

  const lateFineRow = fee.lateFine > 0 ? `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #F1F5F9;font-size:12px;color:#DC2626;">
        Late Fine
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #F1F5F9;text-align:right;font-size:12px;color:#DC2626;font-weight:700;">
        + ₹${Number(fee.lateFine).toLocaleString('en-IN')}
      </td>
    </tr>` : ''

  const logoHTML = schoolLogo
    ? `<img src="${schoolLogo}"
           style="height:50px;object-fit:contain"
           crossorigin="anonymous" />`
    : `<div style="
           width:50px;height:50px;border-radius:10px;
           background:${schoolColor};
           display:flex;align-items:center;justify-content:center;
           color:white;font-size:22px;font-weight:800;
         ">${schoolName.charAt(0)}</div>`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,Helvetica,sans-serif; background:white; padding:0; width:148mm; min-height:210mm; }
</style>
</head>
<body>

<!-- Header Band -->
<div style="background:${schoolColor};padding:16px 20px;display:flex;align-items:center;gap:14px;">
  ${logoHTML}
  <div style="flex:1;min-width:0;">
    <h1 style="color:white;font-size:16px;font-weight:800;line-height:1.2;">${schoolName}</h1>
    ${schoolAddress ? `<p style="color:rgba(255,255,255,0.8);font-size:9px;margin-top:3px;">${schoolAddress}</p>` : ''}
    ${schoolPhone ? `<p style="color:rgba(255,255,255,0.8);font-size:9px;">📞 ${schoolPhone}</p>` : ''}
  </div>
  <div style="text-align:right;flex-shrink:0;">
    <p style="color:rgba(255,255,255,0.7);font-size:9px;text-transform:uppercase;letter-spacing:0.05em;">Fee Receipt</p>
    <p style="color:white;font-size:13px;font-weight:800;margin-top:3px;">${receiptNo}</p>
  </div>
</div>

<!-- Student Info -->
<div style="padding:14px 20px;background:#F8FAFC;border-bottom:1px solid #E2E8F0;">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
    <div>
      <p style="font-size:9px;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">Student Name</p>
      <p style="font-size:13px;font-weight:800;color:#0F172A;margin-top:2px;">${studentUser?.name || 'Unknown'}</p>
    </div>
    <div>
      <p style="font-size:9px;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">Admission No</p>
      <p style="font-size:12px;font-weight:700;color:${schoolColor};margin-top:2px;font-family:monospace;">${student?.admissionNo || '—'}</p>
    </div>
    <div>
      <p style="font-size:9px;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">Class & Section</p>
      <p style="font-size:12px;font-weight:700;color:#334155;margin-top:2px;">Class ${student?.class || '—'} — ${student?.section || ''}</p>
    </div>
    <div>
      <p style="font-size:9px;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">Father's Name</p>
      <p style="font-size:12px;font-weight:700;color:#334155;margin-top:2px;">${student?.fatherName || '—'}</p>
    </div>
    <div>
      <p style="font-size:9px;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">Payment Date</p>
      <p style="font-size:12px;font-weight:700;color:#334155;margin-top:2px;">${paidDate}</p>
    </div>
    <div>
      <p style="font-size:9px;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">Payment Mode</p>
      <p style="font-size:12px;font-weight:700;color:#334155;margin-top:2px;text-transform:capitalize;">${fee.paymentMode || 'Cash'}</p>
    </div>
    ${student?.academicYear ? `
    <div>
      <p style="font-size:9px;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">Academic Year</p>
      <p style="font-size:12px;font-weight:700;color:#334155;margin-top:2px;">${student.academicYear}</p>
    </div>` : ''}
    ${structure?.term ? `
    <div>
      <p style="font-size:9px;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">Fee Term</p>
      <p style="font-size:12px;font-weight:700;color:#334155;margin-top:2px;">${structure.term}</p>
    </div>` : ''}
  </div>
</div>

<!-- Fee Breakdown Table -->
<div style="padding:14px 20px;">
  <p style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#94A3B8;margin-bottom:8px;">
    Fee Breakdown
  </p>
  <table style="width:100%;border-collapse:collapse;border:1px solid #F1F5F9;border-radius:8px;overflow:hidden;">
    <thead>
      <tr>
        <th style="background:${schoolColor}15;padding:8px 12px;text-align:left;font-size:10px;color:${schoolColor};font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">Description</th>
        <th style="background:${schoolColor}15;padding:8px 12px;text-align:right;font-size:10px;color:${schoolColor};font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML || `
        <tr>
          <td style="padding:8px 12px;font-size:12px;color:#334155;">${structure?.name || 'Fee'}</td>
          <td style="padding:8px 12px;text-align:right;font-size:12px;color:#334155;">₹${Number(fee.amount || 0).toLocaleString('en-IN')}</td>
        </tr>`}
      ${discountRow}
      ${lateFineRow}
    </tbody>
    <tfoot>
      <tr>
        <td style="padding:10px 12px;background:#F8FAFC;font-size:13px;font-weight:800;color:#0F172A;border-top:2px solid #E2E8F0;">
          Total Amount Paid
        </td>
        <td style="padding:10px 12px;background:#F8FAFC;text-align:right;font-size:14px;font-weight:800;color:${schoolColor};border-top:2px solid #E2E8F0;">
          ₹${Number(fee.paidAmount || fee.finalAmount || 0).toLocaleString('en-IN')}
        </td>
      </tr>
    </tfoot>
  </table>
</div>

<!-- PAID Stamp + Transaction ID -->
<div style="padding:0 20px 14px;display:flex;align-items:center;justify-content:space-between;">
  <div style="border:3px solid #059669;border-radius:6px;padding:6px 16px;display:inline-flex;align-items:center;gap:8px;transform:rotate(-5deg);">
    <span style="color:#059669;font-size:22px;font-weight:900;letter-spacing:3px;">PAID</span>
  </div>
  ${fee.razorpayPaymentId ? `
  <div style="text-align:right;">
    <p style="font-size:9px;color:#94A3B8;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Transaction ID</p>
    <p style="font-size:10px;font-weight:700;color:#334155;margin-top:2px;font-family:monospace;">${fee.razorpayPaymentId}</p>
  </div>` : ''}
</div>

<!-- Footer -->
<div style="margin:0 20px;padding:10px 14px;background:#F8FAFC;border:1px solid #F1F5F9;border-radius:6px;text-align:center;">
  <p style="font-size:9px;color:#94A3B8;line-height:1.6;">
    This is a computer-generated receipt. No signature required.<br>
    ${schoolName} · ${schoolPhone || ''} · Powered by Skolify
  </p>
</div>

</body>
</html>`

  const pdfBuffer = await htmlToPDF(html, { width: '148mm', height: '210mm' })
  return uploadBuffer(pdfBuffer, `receipts/${receiptNo}`, 'pdf')
}


/* ═══════════════════════════════════════════════════════════
   3. REPORT CARD PDF
   — generateReportCardBuffer() → Buffer (DIRECT, no Cloudinary)
   — generateReportCard()       → DEPRECATED STUB (error throw)
   — Class-group ke hisaab se alag HTML template
   ═══════════════════════════════════════════════════════════ */

/* ── Public export — route.ts yahi use karta hai ─────────── */

export async function generateReportCardBuffer(
  resultId: string
): Promise<Buffer> {
  await connectDB()

  const result = await Result.findById(resultId)
    .populate({
      path: 'studentId',
      populate: { path: 'userId', select: 'name' },
    })
    .populate('examId')
    .lean() as any

  if (!result) throw new Error('Result not found')

  const school = await School.findById(result.tenantId).lean() as any
  const student = result.studentId as any
  const exam = result.examId as any
  const classGroup = getClassGroup(exam?.class || '')

  const schoolColor = school?.website?.primaryColor || '#4f46e5'
  const schoolName = school?.name || 'School'

  const html = buildReportCardHTML({
    result,
    student,
    exam,
    school,
    schoolColor,
    schoolName,
    classGroup,
  })

  return htmlToPDF(html, { format: 'A4' })
}

/* ── DEPRECATED — purana code jo Cloudinary use karta tha ── */

export async function generateReportCard(_resultId: string): Promise<string> {
  throw new Error(
    '[pdf.ts] generateReportCard() is deprecated. ' +
    'Use generateReportCardBuffer() via /api/pdf/reportcard/[resultId] route.'
  )
}


/* ── Report Card HTML builder ───────────────────────────── */

interface ReportCardProps {
  result: any
  student: any
  exam: any
  school: any
  schoolColor: string
  schoolName: string
  classGroup: ClassGroup
}

function buildReportCardHTML(p: ReportCardProps): string {
  const {
    result, student, exam, school,
    schoolColor, schoolName, classGroup,
  } = p

  const studentName = student?.userId?.name || '—'
  const admNo = student?.admissionNo || '—'
  const cls = student?.class || exam?.class || '—'
  const section = student?.section || exam?.section || ''
  const rollNo = student?.rollNo || '—'
  const fatherName = student?.fatherName || '—'
  const motherName = student?.motherName || ''
  const dob = student?.dateOfBirth
    ? new Date(student.dateOfBirth).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
    : '—'
  const category = (student?.category || 'General').toUpperCase()
  const gender = student?.gender
    ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1)
    : '—'
  const bloodGroup = student?.bloodGroup || ''
  const address = [
    student?.address,
    student?.city,
    student?.state,
  ].filter(Boolean).join(', ') || ''

  // ── Colors derived from school color ──
  // Light version for backgrounds
  const colorHex = schoolColor.replace('#', '')
  const r = parseInt(colorHex.slice(0, 2), 16)
  const g = parseInt(colorHex.slice(2, 4), 16)
  const b = parseInt(colorHex.slice(4, 6), 16)
  const colorLight = `rgba(${r},${g},${b},0.08)`
  const colorMid = `rgba(${r},${g},${b},0.15)`
  const colorBorder = `rgba(${r},${g},${b},0.25)`

  // ── Grade color helper ──
  function gradeToColor(grade: string): string {
    const map: Record<string, string> = {
      'A+': '#059669', 'A': '#10b981',
      'B+': '#2563eb', 'B': '#3b82f6',
      'C+': '#d97706', 'C': '#f59e0b',
      'D': '#ea580c', 'F': '#dc2626',
      'AB': '#94a3b8',
    }
    return map[grade] || '#64748b'
  }

  // ── Percentage bar width ──
  function pctBar(pct: number): string {
    const color =
      pct >= 75 ? '#10b981' :
        pct >= 50 ? '#f59e0b' :
          '#ef4444'
    return `
      <div style="
        display:flex;align-items:center;gap:6px;margin-top:2px;
      ">
        <div style="
          flex:1;height:4px;background:#e2e8f0;
          border-radius:999px;overflow:hidden;
        ">
          <div style="
            width:${Math.min(pct, 100)}%;height:100%;
            background:${color};border-radius:999px;
          "></div>
        </div>
        <span style="font-size:9px;color:${color};font-weight:700;min-width:28px;">
          ${pct}%
        </span>
      </div>`
  }

  // ── Logo ──
  const logoHTML = school?.logo
    ? `<img src="${school.logo}"
           style="height:64px;width:64px;object-fit:contain;"
           crossorigin="anonymous" />`
    : `<div style="
           width:64px;height:64px;border-radius:12px;
           background:rgba(255,255,255,0.25);
           color:white;font-size:28px;font-weight:900;
           display:flex;align-items:center;justify-content:center;
           border:2px solid rgba(255,255,255,0.4);
         ">${schoolName.charAt(0)}</div>`

  // ── Photo ──
  const photoHTML = student?.photo
    ? `<img src="${student.photo}"
           style="width:100%;height:100%;object-fit:cover;"
           crossorigin="anonymous" />`
    : `<div style="
           width:100%;height:100%;
           display:flex;align-items:center;justify-content:center;
           background:${colorLight};
           color:${schoolColor};font-size:32px;font-weight:900;
         ">${studentName.charAt(0).toUpperCase()}</div>`

  // ── Marks table ──
  const marksTableHTML = classGroup === 'nursery-kg'
    ? buildNurseryTable(result.marks, schoolColor)
    : buildProfessionalMarksTable(result.marks, schoolColor, classGroup, gradeToColor, pctBar)

  // ── Overall result color ──
  const resultColor = result.isPassed ? '#059669' : '#dc2626'
  const resultBg = result.isPassed ? '#ecfdf5' : '#fef2f2'
  const resultBorder = result.isPassed ? '#86efac' : '#fca5a5'
  const gradeColor_ = gradeToColor(result.grade)

  // ── Rank badge ──
  const rankHTML = result.rank
    ? `<div style="
           display:inline-flex;align-items:center;gap:8px;
           background:#fffbeb;border:1px solid #fbbf24;
           border-radius:999px;padding:6px 16px;
           font-size:12px;font-weight:700;color:#92400e;
         ">
         🏆 Class Rank: ${result.rank} of ${result.totalStudents ?? '?'}
       </div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    background: white;
    color: #1e293b;
  }

  /* Watermark */
  body::before {
    content: 'SKOLIFY';
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 72px;
    font-weight: 900;
    color: rgba(0,0,0,0.025);
    letter-spacing: 12px;
    pointer-events: none;
    z-index: 0;
  }

  .page-content { position: relative; z-index: 1; }
</style>
</head>
<body>
<div class="page-content">

<!-- ══════════════════════════════════
     HEADER — School branding
     ══════════════════════════════════ -->
<div style="
  background: linear-gradient(135deg, ${schoolColor} 0%, ${schoolColor}dd 100%);
  padding: 0;
  position: relative;
  overflow: hidden;
">
  <!-- Decorative circles -->
  <div style="
    position:absolute;top:-30px;right:-30px;
    width:120px;height:120px;border-radius:50%;
    background:rgba(255,255,255,0.08);
  "></div>
  <div style="
    position:absolute;bottom:-20px;left:80px;
    width:80px;height:80px;border-radius:50%;
    background:rgba(255,255,255,0.06);
  "></div>

  <div style="
    padding: 20px 28px;
    display: flex;
    align-items: center;
    gap: 18px;
    position: relative;
    z-index: 1;
  ">
    ${logoHTML}

    <div style="flex:1;">
      <h1 style="
        color:white;font-size:22px;font-weight:900;
        letter-spacing:-0.02em;line-height:1.1;
      ">${schoolName}</h1>
      ${school?.address
      ? `<p style="color:rgba(255,255,255,0.75);font-size:9.5px;margin-top:3px;line-height:1.4;">
             📍 ${school.address}
           </p>`
      : ''}
      ${school?.phone
      ? `<p style="color:rgba(255,255,255,0.7);font-size:9px;margin-top:2px;">
             📞 ${school.phone}
           </p>`
      : ''}
      ${school?.email
      ? `<p style="color:rgba(255,255,255,0.65);font-size:9px;margin-top:1px;">
             ✉ ${school.email}
           </p>`
      : ''}
    </div>

    <!-- Report card title block -->
    <div style="
      background: rgba(255,255,255,0.15);
      border: 1.5px solid rgba(255,255,255,0.3);
      border-radius: 12px;
      padding: 12px 20px;
      text-align: center;
      backdrop-filter: blur(4px);
    ">
      <p style="
        color:rgba(255,255,255,0.75);font-size:8px;
        text-transform:uppercase;letter-spacing:0.1em;
        font-weight:700;
      ">REPORT CARD</p>
      <p style="color:white;font-size:15px;font-weight:900;margin-top:4px;line-height:1.2;">
        ${exam?.name || ''}
      </p>
      <p style="color:rgba(255,255,255,0.8);font-size:10px;margin-top:3px;">
        ${exam?.academicYear || ''}
      </p>
      <!-- Issued date -->
      <p style="
        color:rgba(255,255,255,0.6);font-size:8px;margin-top:4px;
        border-top:1px solid rgba(255,255,255,0.2);padding-top:4px;
      ">
        Issued: ${new Date().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      })}
      </p>
    </div>
  </div>

  <!-- Bottom accent line -->
  <div style="height:4px;background:rgba(255,255,255,0.2);"></div>
</div>


<!-- ══════════════════════════════════
     STUDENT PROFILE SECTION
     ══════════════════════════════════ -->
<div style="
  padding: 16px 28px;
  background: #f8fafc;
  border-bottom: 2px solid ${colorBorder};
">
  <div style="display:flex;gap:18px;align-items:flex-start;">

    <!-- Photo frame -->
    <div style="flex-shrink:0;">
      <div style="
        width: 88px; height: 100px;
        border-radius: 10px;
        border: 3px solid ${schoolColor};
        overflow: hidden;
        background: ${colorLight};
        box-shadow: 0 4px 12px ${colorMid};
      ">${photoHTML}</div>
      <!-- Admission No below photo -->
      <div style="
        margin-top:6px;
        background:${schoolColor};
        color:white;
        font-size:8px;font-weight:700;
        text-align:center;
        padding:3px 6px;
        border-radius:4px;
        letter-spacing:0.03em;
      ">${admNo}</div>
    </div>

    <!-- Student details grid -->
    <div style="flex:1;">

      <!-- Name + class badge row -->
      <div style="
        display:flex;align-items:flex-start;
        justify-content:space-between;
        margin-bottom:10px;
        flex-wrap:wrap;gap:8px;
      ">
        <div>
          <h2 style="
            font-size:18px;font-weight:900;color:#0f172a;
            letter-spacing:-0.02em;line-height:1.1;
          ">${studentName}</h2>
          <div style="
            display:inline-flex;align-items:center;gap:6px;
            margin-top:4px;
          ">
            <span style="
              background:${colorLight};
              border:1px solid ${colorBorder};
              color:${schoolColor};
              font-size:10px;font-weight:700;
              padding:3px 10px;border-radius:999px;
            ">Class ${cls}${section ? ` — ${section}` : ''}</span>
            <span style="
              background:#f1f5f9;border:1px solid #e2e8f0;
              color:#475569;
              font-size:10px;font-weight:600;
              padding:3px 10px;border-radius:999px;
            ">Roll No: ${rollNo}</span>
            ${bloodGroup ? `
            <span style="
              background:#fef2f2;border:1px solid #fecaca;
              color:#dc2626;
              font-size:10px;font-weight:700;
              padding:3px 10px;border-radius:999px;
            ">🩸 ${bloodGroup}</span>` : ''}
          </div>
        </div>
      </div>

      <!-- Info grid — 4 columns -->
      <div style="
        display:grid;
        grid-template-columns:repeat(4,1fr);
        gap:8px;
      ">
        ${profileCell("Father's Name", fatherName)}
        ${profileCell("Mother's Name", motherName || '—')}
        ${profileCell('Date of Birth', dob)}
        ${profileCell('Gender', gender)}
        ${profileCell('Category', category)}
        ${profileCell('Academic Year', exam?.academicYear || '—')}
        ${profileCell('Exam', exam?.name || '—')}
        ${address
      ? `<div style="grid-column:1/3;">
               ${profileCell('Address', address.slice(0, 60) + (address.length > 60 ? '...' : ''))}
             </div>`
      : ''}
      </div>
    </div>
  </div>
</div>


<!-- ══════════════════════════════════
     MARKS TABLE
     ══════════════════════════════════ -->
<div style="padding: 16px 28px 0;">
  <div style="
    display:flex;align-items:center;gap:8px;margin-bottom:10px;
  ">
    <div style="
      width:4px;height:18px;
      background:${schoolColor};
      border-radius:999px;
    "></div>
    <p style="
      font-size:11px;font-weight:800;
      text-transform:uppercase;letter-spacing:0.08em;
      color:#475569;
    ">Academic Performance</p>
  </div>
  ${marksTableHTML}
</div>


<!-- ══════════════════════════════════
     RESULT SUMMARY
     ══════════════════════════════════ -->
<div style="padding: 14px 28px;">
  <div style="
    display:grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap:10px;
    background:white;
    border:1px solid #e2e8f0;
    border-radius:12px;
    overflow:hidden;
  ">

    <!-- Left: Performance bar -->
    <div style="
      padding:14px 16px;
      background:${colorLight};
      border-right:1px solid ${colorBorder};
    ">
      <p style="font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">
        Overall Performance
      </p>
      <div style="display:flex;align-items:flex-end;gap:12px;">
        <div>
          <p style="font-size:24px;font-weight:900;color:${schoolColor};line-height:1;">
            ${result.percentage}%
          </p>
          <p style="font-size:10px;color:#64748b;margin-top:2px;">
            ${result.totalObtained} / ${result.totalMarks} marks
          </p>
        </div>
        <!-- Mini pie-like indicator -->
        <div style="flex:1;">
          <div style="
            height:8px;background:#e2e8f0;
            border-radius:999px;overflow:hidden;
          ">
            <div style="
              width:${result.percentage}%;height:100%;
              background:${result.percentage >= 75 ? '#10b981' : result.percentage >= 50 ? '#f59e0b' : '#ef4444'};
              border-radius:999px;
            "></div>
          </div>
          <div style="
            display:flex;justify-content:space-between;
            font-size:8px;color:#94a3b8;margin-top:3px;
          ">
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Marks Obtained -->
    <div style="padding:14px;text-align:center;border-right:1px solid #e2e8f0;">
      <p style="font-size:9px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">
        Obtained
      </p>
      <p style="font-size:22px;font-weight:900;color:#0f172a;margin-top:6px;line-height:1;">
        ${result.totalObtained}
      </p>
      <p style="font-size:10px;color:#94a3b8;margin-top:2px;">
        of ${result.totalMarks}
      </p>
    </div>

    <!-- Grade -->
    <div style="padding:14px;text-align:center;border-right:1px solid #e2e8f0;">
      <p style="font-size:9px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">
        Grade
      </p>
      <p style="
        font-size:32px;font-weight:900;
        color:${gradeColor_};
        margin-top:4px;line-height:1;
      ">
        ${result.grade}
      </p>
    </div>

    <!-- Result -->
    <div style="padding:14px;text-align:center;">
      <p style="font-size:9px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">
        Result
      </p>
      <div style="
        margin-top:8px;
        display:inline-block;
        padding:6px 14px;
        background:${resultBg};
        border:2px solid ${resultBorder};
        border-radius:8px;
      ">
        <p style="font-size:14px;font-weight:900;color:${resultColor};">
          ${result.isPassed ? 'PASS ✓' : 'FAIL ✗'}
        </p>
      </div>
    </div>
  </div>
</div>


<!-- ══════════════════════════════════
     RANK + REMARKS
     ══════════════════════════════════ -->
<div style="
  padding: 0 28px 14px;
  display:flex;align-items:center;gap:10px;flex-wrap:wrap;
">
  ${rankHTML}
  ${result.remarks ? `
  <div style="
    display:inline-flex;align-items:center;gap:6px;
    background:#f8fafc;border:1px solid #e2e8f0;
    border-radius:999px;padding:5px 14px;
    font-size:11px;color:#475569;
  ">
    💬 ${result.remarks}
  </div>` : ''}
</div>


<!-- ══════════════════════════════════
     GRADE SCALE LEGEND
     ══════════════════════════════════ -->
<div style="padding: 0 28px 14px;">
  <div style="
    background:#f8fafc;border:1px solid #e2e8f0;
    border-radius:8px;padding:10px 14px;
  ">
    <p style="font-size:8.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">
      Grade Scale
    </p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      ${[
      { g: 'A+', r: '91-100', c: '#059669' },
      { g: 'A', r: '81-90', c: '#10b981' },
      { g: 'B+', r: '71-80', c: '#2563eb' },
      { g: 'B', r: '61-70', c: '#3b82f6' },
      { g: 'C+', r: '51-60', c: '#d97706' },
      { g: 'C', r: '41-50', c: '#f59e0b' },
      { g: 'D', r: '33-40', c: '#ea580c' },
      { g: 'F', r: 'Below 33', c: '#dc2626' },
    ].map(item => `
        <div style="display:flex;align-items:center;gap:4px;">
          <span style="
            font-size:10px;font-weight:800;color:${item.c};
            min-width:18px;
          ">${item.g}</span>
          <span style="font-size:8px;color:#94a3b8;">${item.r}</span>
        </div>`).join('')}
    </div>
  </div>
</div>


<!-- ══════════════════════════════════
     SIGNATURES
     ══════════════════════════════════ -->
<div style="
  padding: 16px 28px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
">
  ${['Class Teacher', 'Examiner', "Parent's Signature", 'Principal'].map(sig => `
    <div style="text-align:center;">
      <!-- Signature area -->
      <div style="
        width:110px;height:32px;
        border-bottom:1.5px solid #cbd5e1;
        margin-bottom:6px;
      "></div>
      <p style="font-size:9px;color:#64748b;font-weight:600;">
        ${sig}
      </p>
    </div>`).join('')}
</div>


<!-- ══════════════════════════════════
     FOOTER
     ══════════════════════════════════ -->
<div style="
  background: linear-gradient(135deg, ${schoolColor} 0%, ${schoolColor}dd 100%);
  padding: 10px 28px;
  display:flex;align-items:center;justify-content:space-between;
">
  <p style="font-size:9px;color:rgba(255,255,255,0.7);">
    This is a computer-generated document. No manual signature required.
  </p>
  <p style="font-size:9px;color:rgba(255,255,255,0.6);">
    ${schoolName} · Powered by Skolify
  </p>
</div>

</div><!-- end .page-content -->
</body>
</html>`
}

// ── Professional Marks Table (Class 1+) ──────────────────

// ── Professional Marks Table (Class 1+) ──────────────────

function buildProfessionalMarksTable(
  marks: any[],
  color: string,
  classGroup: ClassGroup,
  gradeToColor: (g: string) => string,
  pctBar: (pct: number) => string
): string {
  // ✅ FIX: Dynamically detect ALL component names across subjects
  const allComponentNames = new Set<string>()
  marks.forEach((m: any) => {
    if (m.components?.length > 0) {
      m.components.forEach((c: any) => {
        if (c.name) allComponentNames.add(c.name)
      })
    }
  })

  const componentColumns = Array.from(allComponentNames).sort()
  const showComponents = componentColumns.length > 0 && classGroup !== 'primary'

  const rows = marks.map((m: any, i: number) => {
    const isAbsent = m.isAbsent
    const isFail = !isAbsent && m.grade === 'F'
    const pct = m.maxMarks > 0
      ? Math.round((m.marksObtained / m.maxMarks) * 100) : 0
    const gradeClr = gradeToColor(m.grade)
    const rowBg = i % 2 === 0 ? '#f8fafc' : '#ffffff'

    // ✅ Component cells - DYNAMIC based on detected components
    let compCells = ''
    if (showComponents && m.components?.length > 0) {
      // Build component map for this subject
      const compMap: Record<string, number> = {}
      m.components.forEach((c: any) => {
        compMap[c.name] = c.marksObtained || 0
      })

      // Generate cells for ALL detected component columns
      compCells = componentColumns.map(compName => {
        const val = compMap[compName]
        return `
          <td style="
            padding:8px 8px;text-align:center;
            border-bottom:1px solid #f1f5f9;
            font-size:11px;color:#475569;
          ">${val !== undefined ? (isAbsent ? 'AB' : val) : '—'}</td>`
      }).join('')
    }

    return `
      <tr style="background:${rowBg}">
        <!-- Subject name + progress bar -->
        <td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;">
          <p style="font-size:12px;font-weight:700;color:#1e293b;">
            ${m.subject}
          </p>
          ${!isAbsent && m.maxMarks > 0
        ? pctBar(pct)
        : ''}
        </td>
        ${compCells}
        <!-- Max -->
        <td style="
          padding:8px 10px;text-align:center;
          border-bottom:1px solid #f1f5f9;
          font-size:11px;color:#64748b;
        ">${m.maxMarks}</td>
        <!-- Pass marks -->
        <td style="
          padding:8px 10px;text-align:center;
          border-bottom:1px solid #f1f5f9;
          font-size:11px;color:#94a3b8;
        ">—</td>
        <!-- Obtained -->
        <td style="
          padding:8px 10px;text-align:center;
          border-bottom:1px solid #f1f5f9;
          font-size:13px;font-weight:800;
          color:${isAbsent ? '#94a3b8' : isFail ? '#dc2626' : '#0f172a'};
        ">${isAbsent ? 'AB' : m.marksObtained}</td>
        <!-- Grade badge -->
        <td style="
          padding:8px 10px;text-align:center;
          border-bottom:1px solid #f1f5f9;
        ">
          ${isAbsent
        ? `<span style="color:#94a3b8;font-size:11px;">—</span>`
        : `<span style="
                 display:inline-block;
                 padding:2px 8px;
                 background:${gradeClr}15;
                 border:1px solid ${gradeClr}40;
                 border-radius:6px;
                 font-size:12px;font-weight:900;
                 color:${gradeClr};
               ">${m.grade}</span>`
      }
        </td>
        <!-- Status pill -->
        <td style="
          padding:8px 10px;text-align:center;
          border-bottom:1px solid #f1f5f9;
        ">
          <span style="
            display:inline-flex;align-items:center;gap:4px;
            padding:3px 10px;border-radius:999px;
            font-size:10px;font-weight:700;
            background:${isAbsent ? '#f1f5f9' : isFail ? '#fef2f2' : '#ecfdf5'};
            color:${isAbsent ? '#64748b' : isFail ? '#dc2626' : '#166534'};
          ">
            <span style="
              width:5px;height:5px;border-radius:50%;
              background:currentColor;flex-shrink:0;
            "></span>
            ${isAbsent ? 'Absent' : isFail ? 'Fail' : 'Pass'}
          </span>
        </td>
      </tr>`
  }).join('')

  // ✅ Headers - DYNAMIC based on detected components
  const headers = ['Subject']
  if (showComponents) {
    headers.push(...componentColumns)
  }
  headers.push('Max', 'Pass', 'Obtained', 'Grade', 'Status')

  const headerRow = headers.map((h, i) => `
    <th style="
      background:${color};color:white;
      padding:9px ${i === 0 ? '10px' : '8px'};
      text-align:${i === 0 ? 'left' : 'center'};
      font-size:9.5px;font-weight:700;
      text-transform:uppercase;letter-spacing:0.04em;
      white-space:nowrap;
    ">${h}</th>`).join('')

  return `
    <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr>${headerRow}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`
}

// ── Profile info cell helper ─────────────────────────────

function profileCell(label: string, value: string): string {
  return `
    <div style="
      background:white;border:1px solid #e2e8f0;
      border-radius:6px;padding:7px 10px;
    ">
      <p style="
        font-size:8px;color:#94a3b8;font-weight:700;
        text-transform:uppercase;letter-spacing:0.04em;
      ">${label}</p>
      <p style="
        font-size:11px;font-weight:700;color:#1e293b;
        margin-top:2px;line-height:1.3;
      ">${value}</p>
    </div>`
}

/* ── Info cell helper ───────────────────────────────────── */
function rcInfoCell(
  label: string,
  value: string,
  color = '#1e293b'
): string {
  return `
    <div>
      <p style="font-size:9px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">
        ${label}
      </p>
      <p style="font-size:11px;font-weight:700;color:${color};margin-top:2px;">
        ${value}
      </p>
    </div>`
}

/* ── Marks table — Class 1 onwards ─────────────────────── */
function buildMarksTable(
  marks: any[],
  color: string,
  classGroup: ClassGroup
): string {
  /* ✅ FIX: Dynamically detect component names */
  const allComponentNames = new Set<string>()
  marks.forEach((m: any) => {
    if (m.components?.length > 0) {
      m.components.forEach((c: any) => {
        if (c.name) allComponentNames.add(c.name)
      })
    }
  })

  const componentColumns = Array.from(allComponentNames).sort()
  const showComponents = componentColumns.length > 0 && classGroup !== 'primary'

  const headerCells = ['Subject']
  if (showComponents) {
    headerCells.push(...componentColumns)
  }
  headerCells.push('Max Marks', 'Obtained', 'Grade', 'Status')

  const headerRow = headerCells.map(h => `
    <th style="
      background:${color};color:white;
      padding:8px 10px;
      text-align:${h === 'Subject' ? 'left' : 'center'};
      font-size:10px;font-weight:700;
      white-space:nowrap;
    ">${h}</th>`).join('')

  const bodyRows = marks.map((m: any, i: number) => {
    const isAbsent = m.isAbsent
    const isFail = !isAbsent && m.grade === 'F'
    const rowBg = i % 2 === 0 ? '#f8fafc' : '#ffffff'

    /* ✅ Component cells - DYNAMIC */
    let compCells = ''
    if (showComponents) {
      const compMap: Record<string, string> = {}
      m.components?.forEach((c: any) => {
        compMap[c.name] = isAbsent ? 'AB' : String(c.marksObtained || 0)
      })

      compCells = componentColumns.map(compName => `
        <td style="
          padding:7px 10px;text-align:center;
          border-bottom:1px solid #f1f5f9;
          font-size:11px;color:#475569;
        ">${compMap[compName] ?? '—'}</td>`).join('')
    }

    return `
      <tr style="background:${rowBg}">
        <td style="
          padding:7px 10px;border-bottom:1px solid #f1f5f9;
          font-size:12px;font-weight:600;color:#1e293b;
        ">${m.subject}</td>
        ${compCells}
        <td style="
          padding:7px 10px;text-align:center;
          border-bottom:1px solid #f1f5f9;
          font-size:11px;color:#64748b;
        ">${m.maxMarks}</td>
        <td style="
          padding:7px 10px;text-align:center;
          border-bottom:1px solid #f1f5f9;
          font-size:12px;font-weight:700;
          color:${isAbsent ? '#94a3b8' : isFail ? '#dc2626' : '#1e293b'};
        ">${isAbsent ? 'AB' : m.marksObtained}</td>
        <td style="
          padding:7px 10px;text-align:center;
          border-bottom:1px solid #f1f5f9;
          font-size:13px;font-weight:900;color:${color};
        ">${isAbsent ? '—' : m.grade}</td>
        <td style="padding:7px 10px;text-align:center;border-bottom:1px solid #f1f5f9;">
          <span style="
            padding:2px 8px;border-radius:20px;
            font-size:10px;font-weight:700;
            background:${isAbsent ? '#f1f5f9' : isFail ? '#fef2f2' : '#ecfdf5'};
            color:${isAbsent ? '#64748b' : isFail ? '#dc2626' : '#166534'};
          ">${isAbsent ? 'Absent' : isFail ? 'Fail' : 'Pass'}</span>
        </td>
      </tr>`
  }).join('')

  return `
    <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;">
      <thead><tr>${headerRow}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>`
}

/* ── Nursery/KG table — activity grades only ────────────── */
function buildNurseryTable(marks: any[], color: string): string {
  const rows = marks.map((m: any, i: number) => `
    <tr style="background:${i % 2 === 0 ? '#f8fafc' : '#fff'}">
      <td style="
        padding:8px 12px;font-size:12px;font-weight:600;
        border-bottom:1px solid #f1f5f9;color:#1e293b;
      ">${m.subject}</td>
      <td style="
        padding:8px 12px;text-align:center;
        border-bottom:1px solid #f1f5f9;
      ">
        ${m.isAbsent
      ? `<span style="color:#94a3b8;font-size:11px;font-weight:600;">Absent</span>`
      : `<span style="
               padding:3px 14px;border-radius:20px;
               background:${color}15;color:${color};
               font-size:11px;font-weight:700;
             ">${m.activityGrade || '—'}</span>`}
      </td>
      <td style="
        padding:8px 12px;text-align:center;
        border-bottom:1px solid #f1f5f9;
        font-size:11px;color:#64748b;
      ">${m.remarks || ''}</td>
    </tr>`).join('')

  return `
    <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;">
      <thead>
        <tr>
          ${['Activity / Subject', 'Grade', "Teacher's Remarks"].map(h => `
            <th style="
              background:${color};color:white;
              padding:8px 12px;
              text-align:${h === 'Activity / Subject' ? 'left' : 'center'};
              font-size:10px;font-weight:700;
            ">${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
}

/* ── Summary boxes — Class 1 onwards ───────────────────── */
function buildResultSummary(result: any, color: string): string {
  return `
    <div style="
      display:grid;grid-template-columns:repeat(4,1fr);gap:10px;
      background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;
    ">
      ${[
      { label: 'Total Marks', value: String(result.totalMarks), c: '#1e293b' },
      { label: 'Marks Obtained', value: String(result.totalObtained), c: color },
      { label: 'Percentage', value: `${result.percentage}%`, c: '#1e293b' },
      { label: 'Overall Grade', value: result.grade, c: color, large: true },
    ].map(b => `
        <div style="text-align:center;">
          <p style="font-size:9px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">
            ${b.label}
          </p>
          <p style="
            font-size:${b.large ? '28px' : '18px'};font-weight:900;
            color:${b.c};margin-top:4px;line-height:1;
          ">${b.value}</p>
        </div>`).join('')}
    </div>`
}

/* ── Summary box — Nursery/KG ───────────────────────────── */
function buildNurserySummary(result: any, color: string): string {
  return `
    <div style="
      background:${color}10;border:1px solid ${color}30;
      border-radius:8px;padding:14px;text-align:center;
    ">
      <p style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;">
        Overall Assessment
      </p>
      <p style="font-size:22px;font-weight:900;color:${color};margin-top:6px;">
        ${result.grade}
      </p>
    </div>`
}


/* ═══════════════════════════════════════════════════════════
   4. ADMIT CARD PDF
   — NEW — Buffer return karta hai (no Cloudinary)
   — generateAdmitCardBuffer(examId, studentId) → Buffer
   ═══════════════════════════════════════════════════════════ */

export async function generateAdmitCardBuffer(
  examId: string,
  studentId: string
): Promise<Buffer> {
  await connectDB()

  const [examDoc, studentDoc] = await Promise.all([
    Exam.findById(examId).lean() as any,
    Student.findById(studentId)
      .populate('userId', 'name')
      .lean() as any,
  ])

  if (!examDoc) throw new Error('Exam not found')
  if (!studentDoc) throw new Error('Student not found')

  const school = await School.findById(examDoc.tenantId)
    .select('name address phone logo website')
    .lean() as any

  const schoolColor = school?.website?.primaryColor || '#4f46e5'
  const schoolName = school?.name || 'School'
  const studentName = (studentDoc.userId as any)?.name || '—'
  const initials = studentName
    .split(' ')
    .map((n: string) => n[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

  /* Logo */
  const logoHTML = school?.logo
    ? `<img src="${school.logo}"
           style="height:48px;width:48px;object-fit:contain;border-radius:6px"
           crossorigin="anonymous" />`
    : `<div style="
           width:48px;height:48px;border-radius:8px;
           background:${schoolColor};color:white;
           font-size:20px;font-weight:900;
           display:flex;align-items:center;justify-content:center;
         ">${schoolName.charAt(0)}</div>`

  /* Photo */
  const photoHTML = studentDoc.photo
    ? `<img src="${studentDoc.photo}"
           style="width:100%;height:100%;object-fit:cover"
           crossorigin="anonymous" />`
    : `<div style="
           width:100%;height:100%;
           display:flex;align-items:center;justify-content:center;
           background:${schoolColor}20;
           color:${schoolColor};font-size:28px;font-weight:800;
         ">${initials}</div>`

  /* QR */
  const qrUrl = `${process.env.NEXTAUTH_URL}/verify/student/${studentDoc.admissionNo}`
  const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 80, margin: 1 })

  /* Schedule rows */
  const scheduleRows = [...(examDoc.subjects ?? [])]
    .sort((a: any, b: any) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    .map((sub: any, i: number) => {
      const date = sub.date
        ? new Date(sub.date).toLocaleDateString('en-IN', {
          weekday: 'short', day: '2-digit',
          month: 'short', year: 'numeric',
        })
        : '—'

      const marksInfo = sub.components?.length > 0
        ? sub.components
          .map((c: any) => `${c.name}: ${c.maxMarks}`)
          .join(', ')
        : `Max: ${sub.totalMaxMarks}`

      return `
        <tr style="background:${i % 2 === 0 ? '#f8fafc' : '#fff'}">
          <td style="padding:7px 10px;font-size:11px;font-weight:700;border-bottom:1px solid #f1f5f9;color:#1e293b;">${sub.name}</td>
          <td style="padding:7px 10px;font-size:11px;border-bottom:1px solid #f1f5f9;color:#475569;">${date}</td>
          <td style="padding:7px 10px;font-size:11px;text-align:center;border-bottom:1px solid #f1f5f9;color:#475569;">${sub.time || '—'}</td>
          <td style="padding:7px 10px;font-size:11px;text-align:center;border-bottom:1px solid #f1f5f9;color:#475569;">${sub.duration ? `${sub.duration} min` : '—'}</td>
          <td style="padding:7px 10px;font-size:11px;border-bottom:1px solid #f1f5f9;color:#64748b;">${marksInfo}</td>
        </tr>`
    }).join('')

  /* Instructions */
  const defaultInstructions = [
    'Candidates must reach the examination center 30 minutes before the scheduled time.',
    'Mobile phones and electronic devices are strictly prohibited in the examination hall.',
    'This admit card must be presented at the examination center.',
    'Students must bring their own stationery (pen, pencil, scale, etc.).',
    'Candidates are not allowed to leave the examination hall during the first 30 minutes.',
  ]
  const instructions: string[] =
    examDoc.instructions?.length > 0
      ? examDoc.instructions
      : defaultInstructions

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,Helvetica,sans-serif; background:white; color:#1e293b; }
</style>
</head>
<body>

<!-- HEADER -->
<div style="background:${schoolColor};padding:16px 24px;display:flex;align-items:center;gap:14px;">
  ${logoHTML}
  <div style="flex:1;">
    <h1 style="color:white;font-size:18px;font-weight:900;">${schoolName}</h1>
    ${school?.address
      ? `<p style="color:rgba(255,255,255,0.8);font-size:9px;margin-top:2px;">${school.address}</p>`
      : ''}
  </div>
  <div style="
    background:rgba(255,255,255,0.15);
    border:1px solid rgba(255,255,255,0.3);
    border-radius:8px;padding:8px 16px;text-align:center;
  ">
    <p style="color:rgba(255,255,255,0.8);font-size:8px;text-transform:uppercase;letter-spacing:0.08em;">
      Admit Card
    </p>
    <p style="color:white;font-size:14px;font-weight:800;margin-top:2px;">
      ${examDoc.name}
    </p>
    <p style="color:rgba(255,255,255,0.8);font-size:9px;">
      ${examDoc.academicYear}
    </p>
  </div>
</div>

<!-- STUDENT SECTION -->
<div style="
  padding:16px 24px;background:#f8fafc;
  border-bottom:2px solid ${schoolColor}30;
  display:flex;gap:16px;align-items:flex-start;
">
  <div style="
    width:80px;height:90px;border-radius:6px;
    border:2px solid ${schoolColor}40;
    overflow:hidden;flex-shrink:0;
    background:${schoolColor}10;
  ">${photoHTML}</div>

  <div style="flex:1;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
    ${acInfoCell('Student Name', studentName)}
    ${acInfoCell('Admission No', studentDoc.admissionNo, schoolColor)}
    ${acInfoCell('Roll No', studentDoc.rollNo)}
    ${acInfoCell('Class & Section',
        `Class ${studentDoc.class}${studentDoc.section ? ` — ${studentDoc.section}` : ''}`)}
    ${acInfoCell("Father's Name", studentDoc.fatherName || '—')}
    ${acInfoCell('Exam Center',
          examDoc.examCenter || school?.address?.split(',')[0] || schoolName)}
  </div>

  <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0;">
    <img src="${qrDataUrl}" style="width:72px;height:72px;" />
    <p style="font-size:8px;color:#94a3b8;text-align:center;">Scan to verify</p>
  </div>
</div>

<!-- EXAM SCHEDULE -->
<div style="padding:16px 24px;">
  <h2 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;margin-bottom:10px;">
    Examination Schedule
  </h2>
  <table style="width:100%;border-collapse:collapse;border-radius:6px;overflow:hidden;">
    <thead>
      <tr>
        ${['Subject', 'Date', 'Time', 'Duration', 'Marks'].map(h => `
          <th style="
            background:${schoolColor};color:white;
            padding:7px 10px;
            text-align:${h === 'Subject' ? 'left' : 'center'};
            font-size:10px;font-weight:700;
          ">${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>${scheduleRows}</tbody>
  </table>
</div>

<!-- INSTRUCTIONS -->
<div style="padding:0 24px 16px;">
  <h2 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;margin-bottom:8px;">
    Important Instructions
  </h2>
  <ol style="padding-left:16px;">
    ${instructions.map((ins: string) => `
      <li style="font-size:10px;color:#475569;margin-bottom:4px;line-height:1.5;">
        ${ins}
      </li>`).join('')}
  </ol>
</div>

<!-- SIGNATURE LINE -->
<div style="
  padding:16px 24px;
  display:flex;justify-content:space-between;align-items:flex-end;
  border-top:1px solid #e2e8f0;margin:0 24px;
">
  <div>
    <p style="font-size:9px;color:#94a3b8;">
      Generated: ${new Date().toLocaleDateString('en-IN', {
            day: '2-digit', month: 'long', year: 'numeric',
          })}
    </p>
  </div>
  <div style="text-align:center;">
    <div style="width:140px;border-top:1.5px solid #cbd5e1;padding-top:6px;">
      <p style="font-size:10px;color:#64748b;font-weight:600;">Principal's Signature</p>
    </div>
  </div>
</div>

<!-- FOOTER -->
<div style="background:${schoolColor};padding:8px 24px;text-align:center;">
  <p style="font-size:9px;color:rgba(255,255,255,0.8);">
    ${schoolName} · This is a computer-generated admit card · Powered by Skolify
  </p>
</div>

</body>
</html>`

  return htmlToPDF(html, { format: 'A4' })
}

/* ── Admit card info cell helper ────────────────────────── */
function acInfoCell(
  label: string,
  value: string,
  color = '#1e293b'
): string {
  return `
    <div>
      <p style="font-size:8px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">
        ${label}
      </p>
      <p style="font-size:11px;font-weight:700;color:${color};margin-top:2px;">
        ${value}
      </p>
    </div>`
}