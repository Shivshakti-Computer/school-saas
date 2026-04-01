// FILE: src/lib/pdf.ts
// server-only — sirf server pe run hoga
import 'server-only'

import QRCode from 'qrcode'
import { connectDB } from './db'
import { Fee } from '@/models/Fee'
import { Student } from '@/models/Student'
import { Result, Exam } from '@/models/Exam'
import { School } from '@/models/School'
import { uploadBuffer } from './storage'

/* ═══════════════════════════════════════════════════════════════
   BROWSER HELPER — Dev: Chrome, Prod: Chromium-min (Vercel)
   ═══════════════════════════════════════════════════════════════ */
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

/* ── HTML → PDF Buffer ── */
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


/* ═══════════════════════════════════════════════════════════════
   1. STUDENT ID CARD PDF
   — Credit card size 85mm × 54mm
   — Front + Back
   — QR Code with student verification URL
   — School logo, colors
   ═══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════
   ID CARD — Buffer return karta hai (no Cloudinary)
   Route directly use karta hai ise
   ═══════════════════════════════════════════════════════════════ */
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

  // QR Code
  const verifyUrl = `${process.env.NEXTAUTH_URL}/verify/student/${student.admissionNo}`
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 80,
    margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' },
  })

  const photoHTML = student.photo
    ? `<img src="${student.photo}" 
               style="width:100%;height:100%;object-fit:cover;border-radius:4px" 
               crossorigin="anonymous" />`
    : `<div style="
               width:100%;height:100%;
               display:flex;align-items:center;justify-content:center;
               background:${schoolColor}20;
               color:${schoolColor};
               font-size:22px;font-weight:800;
               border-radius:4px;
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
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    background: white;
    width: 196mm;
  }
  .cards-wrapper {
    display: flex;
    gap: 6mm;
    align-items: flex-start;
  }
  .card {
    width: 85mm;
    height: 54mm;
    border-radius: 3mm;
    overflow: hidden;
    position: relative;
    flex-shrink: 0;
  }

  /* FRONT */
  .front {
    background: #FFFFFF;
    border: 0.5px solid #E2E8F0;
    display: flex;
    flex-direction: column;
  }
  .front-header {
    background: ${schoolColor};
    padding: 2.5mm 3mm;
    display: flex;
    align-items: center;
    gap: 2mm;
    flex-shrink: 0;
  }
  .school-text h2 {
    color: white;
    font-size: 6.5pt;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 50mm;
    line-height: 1.2;
  }
  .school-text p {
    color: rgba(255,255,255,0.75);
    font-size: 5pt;
    margin-top: 0.5mm;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 50mm;
  }
  .id-type-badge {
    margin-left: auto;
    background: rgba(255,255,255,0.2);
    color: white;
    font-size: 5pt;
    font-weight: 700;
    padding: 1mm 2mm;
    border-radius: 1mm;
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }
  .front-body {
    flex: 1;
    display: flex;
    padding: 2.5mm 3mm;
    gap: 3mm;
  }
  .photo-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5mm;
    flex-shrink: 0;
  }
  .photo-box {
    width: 17mm;
    height: 20mm;
    border-radius: 1.5mm;
    border: 0.5px solid ${schoolColor}40;
    overflow: hidden;
    background: ${schoolColor}08;
  }
  .adm-no-text {
    font-size: 4.5pt;
    color: #64748B;
    font-weight: 600;
    text-align: center;
    letter-spacing: 0.02em;
  }
  .info-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1mm;
    min-width: 0;
  }
  .student-name-text {
    font-size: 9pt;
    font-weight: 800;
    color: #0F172A;
    line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .class-badge-div {
    display: inline-flex;
    align-items: center;
    background: ${schoolColor}15;
    color: ${schoolColor};
    font-size: 5.5pt;
    font-weight: 700;
    padding: 0.5mm 2mm;
    border-radius: 1mm;
    margin-top: 0.5mm;
    width: fit-content;
  }
  .info-row-div {
    display: flex;
    align-items: flex-start;
    gap: 1.5mm;
    margin-top: 0.5mm;
  }
  .info-label-text {
    font-size: 5pt;
    font-weight: 700;
    color: #94A3B8;
    width: 12mm;
    flex-shrink: 0;
    text-transform: uppercase;
    padding-top: 0.3mm;
    letter-spacing: 0.02em;
  }
  .info-value-text {
    font-size: 5.5pt;
    font-weight: 600;
    color: #334155;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .blood-value {
    color: #DC2626;
    font-weight: 800;
  }
  .front-footer-div {
    background: #F8FAFC;
    border-top: 0.5px solid #F1F5F9;
    padding: 1.5mm 3mm;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }
  .session-text-small { font-size: 5pt; color: #94A3B8; font-weight: 500; }
  .roll-text-small    { font-size: 5pt; font-weight: 700; color: ${schoolColor}; }

  /* BACK */
  .back {
    background: #FFFFFF;
    border: 0.5px solid #E2E8F0;
    display: flex;
    flex-direction: column;
  }
  .back-accent-top { height: 5mm; background: ${schoolColor}; flex-shrink: 0; }
  .back-body-div {
    flex: 1;
    padding: 2.5mm 3mm;
    display: flex;
    flex-direction: column;
    gap: 2mm;
  }
  .back-title-text {
    font-size: 6pt;
    font-weight: 800;
    color: #0F172A;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 0.5px solid #F1F5F9;
    padding-bottom: 1.5mm;
  }
  .back-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5mm;
  }
  .back-item { display: flex; flex-direction: column; gap: 0.3mm; }
  .back-item-label {
    font-size: 4.5pt;
    font-weight: 700;
    color: #94A3B8;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .back-item-value { font-size: 5.5pt; font-weight: 600; color: #334155; }
  .back-bottom {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-top: auto;
  }
  .emergency-box {
    background: #FEF2F2;
    border: 0.5px solid #FECACA;
    border-radius: 1.5mm;
    padding: 1.5mm 2mm;
    flex: 1;
    margin-right: 2mm;
  }
  .emergency-label {
    font-size: 4.5pt;
    font-weight: 700;
    color: #B91C1C;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .emergency-value {
    font-size: 6pt;
    font-weight: 800;
    color: #DC2626;
    margin-top: 0.5mm;
  }
  .qr-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5mm;
    flex-shrink: 0;
  }
  .qr-label { font-size: 4pt; color: #94A3B8; text-align: center; }
  .back-footer-div {
    background: ${schoolColor};
    padding: 1.5mm 3mm;
    flex-shrink: 0;
  }
  .back-footer-text {
    font-size: 5pt;
    color: rgba(255,255,255,0.9);
    font-weight: 500;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
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

  // Buffer return karo — no Cloudinary
  return htmlToPDF(html, {
    width: '196mm',
    height: '60mm',
  })
}

/* ═══════════════════════════════════════════════════════════════
   ID CARD — Cloudinary me upload (production use)
   Receipt aur Report Card ke liye use hota hai
   ═══════════════════════════════════════════════════════════════ */
export async function generateIDCardPDF(studentId: string): Promise<string> {
  const buffer = await generateIDCardBuffer(studentId)

  const student = await Student.findById(studentId)
    .select('admissionNo')
    .lean() as any

  return uploadBuffer(buffer, `idcards/${student?.admissionNo || studentId}`, 'pdf')
}

/* ═══════════════════════════════════════════════════════════════
   2. FEE RECEIPT PDF
   — A5 size, clean professional
   — Line items, discount, late fine
   — PAID stamp, transaction ID
   — School branding
   ═══════════════════════════════════════════════════════════════ */
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

  // Receipt number
  const receiptNo = `RCP-${Date.now().toString().slice(-8)}`
  const paidDate = fee.paidAt
    ? new Date(fee.paidAt).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
    : new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric',
    })

  // Fee items
  const itemsHTML = (structure?.items || [])
    .map((item: any) => `
            <tr>
                <td style="padding:8px 12px;border-bottom:1px solid #F1F5F9;font-size:12px;color:#334155;">
                    ${item.label}
                    ${item.isOptional ? '<span style="font-size:10px;color:#94A3B8;margin-left:4px">(Optional)</span>' : ''}
                </td>
                <td style="padding:8px 12px;border-bottom:1px solid #F1F5F9;text-align:right;font-size:12px;color:#334155;">
                    ₹${Number(item.amount).toLocaleString('en-IN')}
                </td>
            </tr>
        `)
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
    ? `<img src="${schoolLogo}" style="height:50px;object-fit:contain" crossorigin="anonymous" />`
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
  * { margin:0;padding:0;box-sizing:border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    background: white;
    padding: 0;
    width: 148mm;   /* A5 width */
    min-height: 210mm;
  }
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

<!-- Student Info Section -->
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
      <p style="font-size:12px;font-weight:700;color:#334155;margin-top:2px;text-transform:capitalize;">
        ${fee.paymentMode || 'Cash'}
      </p>
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
        <th style="background:${schoolColor}15;padding:8px 12px;text-align:left;font-size:10px;color:${schoolColor};font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">
          Description
        </th>
        <th style="background:${schoolColor}15;padding:8px 12px;text-align:right;font-size:10px;color:${schoolColor};font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">
          Amount
        </th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML || `
        <tr>
          <td style="padding:8px 12px;font-size:12px;color:#334155;">${structure?.name || 'Fee'}</td>
          <td style="padding:8px 12px;text-align:right;font-size:12px;color:#334155;">₹${Number(fee.amount || 0).toLocaleString('en-IN')}</td>
        </tr>
      `}
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
  <!-- Paid Stamp -->
  <div style="
    border: 3px solid #059669;
    border-radius: 6px;
    padding: 6px 16px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transform: rotate(-5deg);
  ">
    <span style="color:#059669;font-size:22px;font-weight:900;letter-spacing:3px;">PAID</span>
  </div>

  <!-- Transaction Info -->
  ${fee.razorpayPaymentId ? `
  <div style="text-align:right;">
    <p style="font-size:9px;color:#94A3B8;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Transaction ID</p>
    <p style="font-size:10px;font-weight:700;color:#334155;margin-top:2px;font-family:monospace;">${fee.razorpayPaymentId}</p>
  </div>` : ''}
</div>

<!-- Footer -->
<div style="
  margin: 0 20px;
  padding: 10px 14px;
  background: #F8FAFC;
  border: 1px solid #F1F5F9;
  border-radius: 6px;
  text-align: center;
">
  <p style="font-size:9px;color:#94A3B8;line-height:1.6;">
    This is a computer-generated receipt. No signature required.<br>
    ${schoolName} · ${schoolPhone || ''} · Powered by Skolify
  </p>
</div>

</body>
</html>`

  const pdfBuffer = await htmlToPDF(html, {
    width: '148mm',
    height: '210mm',
  })

  return uploadBuffer(pdfBuffer, `receipts/${receiptNo}`, 'pdf')
}

/* ═══════════════════════════════════════════════════════════════
   3. REPORT CARD PDF (unchanged — was already working)
   ═══════════════════════════════════════════════════════════════ */
export async function generateReportCard(resultId: string): Promise<string> {
  await connectDB()

  const result = await Result.findById(resultId)
    .populate('studentId')
    .populate('examId')
    .lean() as any

  if (!result) throw new Error('Result not found')

  const school = await School.findById(result.tenantId).lean() as any
  const student = result.studentId as any
  const exam = result.examId as any

  const schoolColor = school?.website?.primaryColor || '#534AB7'

  const marksRows = result.marks
    .map((m: any) => `
            <tr>
                <td style="text-align:left;padding:8px;border-bottom:1px solid #F1F5F9;">${m.subject}</td>
                <td style="padding:8px;border-bottom:1px solid #F1F5F9;text-align:center;">${m.maxMarks}</td>
                <td style="padding:8px;border-bottom:1px solid #F1F5F9;text-align:center;font-weight:700;">
                    ${m.isAbsent ? 'AB' : m.marksObtained}
                </td>
                <td style="padding:8px;border-bottom:1px solid #F1F5F9;text-align:center;font-weight:800;color:${schoolColor};">
                    ${m.grade}
                </td>
                <td style="padding:8px;border-bottom:1px solid #F1F5F9;text-align:center;">
                    <span style="
                        padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;
                        background:${m.isAbsent ? '#F1F5F9' : m.grade !== 'F' ? '#ECFDF5' : '#FEF2F2'};
                        color:${m.isAbsent ? '#64748B' : m.grade !== 'F' ? '#059669' : '#DC2626'};
                    ">
                        ${m.isAbsent ? 'Absent' : m.grade !== 'F' ? 'Pass' : 'Fail'}
                    </span>
                </td>
            </tr>
        `)
    .join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { margin:0;padding:0;box-sizing:border-box; }
  body { font-family: Arial, Helvetica, sans-serif; padding: 30px; color: #333; }
</style>
</head>
<body>

<!-- Header -->
<div style="text-align:center;border-bottom:3px solid ${schoolColor};padding-bottom:16px;margin-bottom:20px;">
  <h1 style="color:${schoolColor};font-size:22px;">${school?.name ?? 'School'}</h1>
  <h2 style="color:#333;font-size:16px;margin-top:4px;">Report Card — ${exam?.name ?? ''}</h2>
  <p style="color:#888;font-size:12px;margin-top:4px;">${school?.address ?? ''}</p>
</div>

<!-- Student Info -->
<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:20px;background:#F8FAFC;padding:12px;border-radius:8px;">
  <div>
    <p style="font-size:10px;color:#94A3B8;font-weight:700;text-transform:uppercase;">Student</p>
    <p style="font-size:12px;font-weight:700;margin-top:2px;">${student?.userId?.name || '—'}</p>
  </div>
  <div>
    <p style="font-size:10px;color:#94A3B8;font-weight:700;text-transform:uppercase;">Adm No</p>
    <p style="font-size:12px;font-weight:700;margin-top:2px;color:${schoolColor};">${student?.admissionNo ?? '—'}</p>
  </div>
  <div>
    <p style="font-size:10px;color:#94A3B8;font-weight:700;text-transform:uppercase;">Class</p>
    <p style="font-size:12px;font-weight:700;margin-top:2px;">${student?.class ?? '—'} - ${student?.section ?? ''}</p>
  </div>
  <div>
    <p style="font-size:10px;color:#94A3B8;font-weight:700;text-transform:uppercase;">Roll No</p>
    <p style="font-size:12px;font-weight:700;margin-top:2px;">${student?.rollNo ?? '—'}</p>
  </div>
</div>

<!-- Marks Table -->
<table style="width:100%;border-collapse:collapse;">
  <thead>
    <tr>
      <th style="background:${schoolColor};color:white;padding:10px 8px;text-align:left;font-size:11px;">Subject</th>
      <th style="background:${schoolColor};color:white;padding:10px 8px;text-align:center;font-size:11px;">Max Marks</th>
      <th style="background:${schoolColor};color:white;padding:10px 8px;text-align:center;font-size:11px;">Obtained</th>
      <th style="background:${schoolColor};color:white;padding:10px 8px;text-align:center;font-size:11px;">Grade</th>
      <th style="background:${schoolColor};color:white;padding:10px 8px;text-align:center;font-size:11px;">Status</th>
    </tr>
  </thead>
  <tbody>${marksRows}</tbody>
</table>

<!-- Summary -->
<div style="margin-top:20px;background:#F8FAFC;padding:16px;border-radius:8px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
  <div style="text-align:center;">
    <p style="font-size:10px;color:#94A3B8;font-weight:700;text-transform:uppercase;">Total Marks</p>
    <p style="font-size:20px;font-weight:800;color:#0F172A;margin-top:4px;">${result.totalMarks}</p>
  </div>
  <div style="text-align:center;">
    <p style="font-size:10px;color:#94A3B8;font-weight:700;text-transform:uppercase;">Obtained</p>
    <p style="font-size:20px;font-weight:800;color:${schoolColor};margin-top:4px;">${result.totalObtained}</p>
  </div>
  <div style="text-align:center;">
    <p style="font-size:10px;color:#94A3B8;font-weight:700;text-transform:uppercase;">Percentage</p>
    <p style="font-size:20px;font-weight:800;color:#0F172A;margin-top:4px;">${result.percentage}%</p>
  </div>
  <div style="text-align:center;">
    <p style="font-size:10px;color:#94A3B8;font-weight:700;text-transform:uppercase;">Result</p>
    <div style="margin-top:4px;">
      <p style="font-size:28px;font-weight:900;color:${schoolColor};">${result.grade}</p>
      <span style="
        font-size:11px;font-weight:700;padding:2px 10px;border-radius:20px;
        background:${result.isPassed ? '#ECFDF5' : '#FEF2F2'};
        color:${result.isPassed ? '#059669' : '#DC2626'};
      ">
        ${result.isPassed ? 'PASS' : 'FAIL'}
      </span>
    </div>
  </div>
</div>

<!-- Signatures -->
<div style="margin-top:40px;display:flex;justify-content:space-between;align-items:flex-end;">
  <div style="text-align:center;">
    <div style="width:120px;border-top:1.5px solid #CBD5E1;padding-top:6px;">
      <p style="font-size:10px;color:#94A3B8;font-weight:600;">Class Teacher</p>
    </div>
  </div>
  <div style="text-align:center;">
    <div style="width:120px;border-top:1.5px solid #CBD5E1;padding-top:6px;">
      <p style="font-size:10px;color:#94A3B8;font-weight:600;">Principal</p>
    </div>
  </div>
</div>

<p style="text-align:center;font-size:10px;color:#94A3B8;margin-top:20px;">
  Computer generated · ${school?.name} · Powered by Skolify
</p>

</body>
</html>`

  const pdfBuffer = await htmlToPDF(html, { format: 'A4' })
  return uploadBuffer(pdfBuffer, `reportcards/${resultId}`, 'pdf')
}