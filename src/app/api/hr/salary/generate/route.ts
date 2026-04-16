// ═══════════════════════════════════════════════════════════
// POST /api/hr/salary/generate
// Monthly salary slip generation
// Settings se PF%, ESI%, notification preferences sync
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Staff } from '@/models/Staff'
import { getModuleSettings } from '@/lib/getModuleSettings'
import { logAudit } from '@/lib/audit'
import { sendMessage } from '@/lib/message'
import { SMS_TEMPLATES, EMAIL_TEMPLATES } from '@/lib/message/templates'
import { SchoolSettings } from '@/models/SchoolSettings'
import { School } from '@/models/School'
import '@/models/User'

interface SalarySlip {
    staffId: string
    employeeId: string
    name: string
    designation: string
    department: string
    month: string
    phone: string
    email?: string
    earnings: {
        basic: number
        hra: number
        da: number
        ta: number
        medical: number
        special: number
        otherAllowances: number
        gross: number
    }
    deductions: {
        pf: number
        esi: number
        professionalTax: number
        tds: number
        otherDeductions: number
        total: number
    }
    netPay: number
    bankAccount?: string
    bankName?: string
    ifscCode?: string
    workingDays: number
    presentDays: number
    lopDays: number // Loss of Pay
}

export async function POST(req: NextRequest) {
    const guard = await apiGuardWithBody<{
        month: string                // "2025-01"
        additionalDeductions?: number // extra deduction for all
        workingDays?: number          // this month ke working days
        sendNotifications?: boolean   // salary slip bhejo ya nahi
    }>(req, {
        allowedRoles: ['admin'],
        requiredModules: ['hr'],
        rateLimit: 'mutation',
        auditAction: 'CREATE',
        auditResource: 'Staff',
    })
    if (guard instanceof NextResponse) return guard

    const { session, body, clientInfo } = guard
    const tenantId = session.user.tenantId

    // Validate month format
    if (!body.month || !/^\d{4}-\d{2}$/.test(body.month)) {
        return NextResponse.json(
            { error: 'Invalid month format. Use YYYY-MM' },
            { status: 400 }
        )
    }

    const [year, month] = body.month.split('-').map(Number)
    if (month < 1 || month > 12) {
        return NextResponse.json(
            { error: 'Invalid month' },
            { status: 400 }
        )
    }

    try {
        await connectDB()

        // Get HR module settings — PF%, ESI%, notification prefs
        const moduleSettings = await getModuleSettings(tenantId)
        const hrSettings = moduleSettings.hr

        // Get notification settings
        const schoolSettings = await SchoolSettings
            .findOne({ tenantId })
            .select('notifications')
            .lean() as any

        // Get school info for payslip
        const school = await School
            .findById(tenantId)
            .select('name phone address')
            .lean() as any

        // Get all active staff
        const activeStaff = await Staff.find({
            tenantId,
            status: 'active',
        })
            .populate('userId', 'name email phone')
            .lean()

        if (activeStaff.length === 0) {
            return NextResponse.json(
                { error: 'No active staff found' },
                { status: 404 }
            )
        }

        const workingDays = body.workingDays || 26 // Default working days
        const additionalDeductions = body.additionalDeductions || 0

        // Generate salary slips
        const slips: SalarySlip[] = activeStaff.map(s => {
            const user = s.userId as any
            const basic = s.basicSalary || 0

            // Use stored allowances or calculate from basic
            const hra = s.allowances?.hra || Math.round(basic * 0.2)
            const da = s.allowances?.da || Math.round(basic * 0.15)
            const ta = s.allowances?.ta || 0
            const medical = s.allowances?.medical || 0
            const special = s.allowances?.special || 0
            const otherAllowances = s.allowances?.other || 0

            const gross = basic + hra + da + ta + medical + special + otherAllowances

            // Deductions — from settings or stored values
            let pf = s.deductions?.pf || 0
            let esi = s.deductions?.esi || 0
            let professionalTax = s.deductions?.professionalTax || 0
            let tds = s.deductions?.tds || 0
            const otherDeductions = s.deductions?.other || 0

            // Override with HR settings if enabled
            if (hrSettings?.pfEnabled) {
                pf = Math.round(basic * ((hrSettings.pfPercentage || 12) / 100))
            }
            if (hrSettings?.esiEnabled) {
                esi = Math.round(gross * ((hrSettings.esiPercentage || 0.75) / 100))
            }
            if (hrSettings?.professionalTaxEnabled) {
                // Professional tax slab (Maharashtra example)
                professionalTax = gross > 10000 ? 200 : 0
            }

            const totalDeductions =
                pf + esi + professionalTax + tds + otherDeductions + additionalDeductions

            const netPay = Math.max(0, gross - totalDeductions)

            // LOP calculation (assume full month present unless specified)
            const presentDays = workingDays
            const lopDays = 0

            return {
                staffId: s._id.toString(),
                employeeId: s.employeeId,
                name: s.fullName || user?.name || 'Unknown',
                designation: s.designation,
                department: s.department,
                month: body.month,
                phone: s.phone || user?.phone || '',
                email: s.email || s.personalEmail || user?.email || '',
                earnings: {
                    basic,
                    hra,
                    da,
                    ta,
                    medical,
                    special,
                    otherAllowances,
                    gross,
                },
                deductions: {
                    pf,
                    esi,
                    professionalTax,
                    tds,
                    otherDeductions: otherDeductions + additionalDeductions,
                    total: totalDeductions,
                },
                netPay,
                bankAccount: s.accountNumber,
                bankName: s.bankName,
                ifscCode: s.ifscCode,
                workingDays,
                presentDays,
                lopDays,
            }
        })

        const totalPayout = slips.reduce((sum, s) => sum + s.netPay, 0)

        // ── Send Notifications if requested ──
        let notificationsSent = 0
        const shouldSendEmail =
            body.sendNotifications &&
            (hrSettings?.sendSalarySlipEmail ?? false)
        const shouldSendSMS =
            body.sendNotifications &&
            (hrSettings?.sendSalarySlipSMS ?? false)

        // Check quiet hours
        const quietHours = schoolSettings?.notifications?.quietHours
        const now = new Date()
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        const isQuietHour = quietHours?.enabled && isInQuietHours(
            currentTime,
            quietHours.start || '21:00',
            quietHours.end || '07:00'
        )

        if ((shouldSendEmail || shouldSendSMS) && !isQuietHour) {
            const monthLabel = new Date(year, month - 1).toLocaleString('en-IN', {
                month: 'long', year: 'numeric',
            })

            for (const slip of slips) {
                try {
                    if (shouldSendSMS && slip.phone) {
                        await sendMessage({
                            tenantId,
                            channel: 'sms',
                            purpose: 'custom',
                            recipient: slip.phone,
                            recipientName: slip.name,
                            message: `Dear ${slip.name}, your salary of Rs.${slip.netPay.toLocaleString('en-IN')} for ${monthLabel} has been processed. PF: Rs.${slip.deductions.pf}. Net Pay: Rs.${slip.netPay.toLocaleString('en-IN')}. -${school?.name || 'School'}`,
                            sentBy: session.user.id,
                            sentByName: session.user.name || 'Admin',
                        })
                        notificationsSent++
                    }

                    if (shouldSendEmail && slip.email) {
                        await sendMessage({
                            tenantId,
                            channel: 'email',
                            purpose: 'custom',
                            recipient: slip.email,
                            recipientName: slip.name,
                            subject: `Salary Slip — ${monthLabel} | ${school?.name || 'School'}`,
                            message: `Salary slip for ${monthLabel}`,
                            html: generateSalarySlipHTML(slip, monthLabel, school, hrSettings),
                            sentBy: session.user.id,
                            sentByName: session.user.name || 'Admin',
                        })
                        notificationsSent++
                    }
                } catch (notifError) {
                    console.error(`Notification failed for ${slip.employeeId}:`, notifError)
                }
            }
        }

        await logAudit({
            tenantId,
            userId: session.user.id,
            userName: session.user.name || 'Admin',
            userRole: session.user.role,
            action: 'CREATE',
            resource: 'Staff',
            resourceId: tenantId,
            description: `Salary generated for ${slips.length} staff — Month: ${body.month} — Total: ₹${totalPayout.toLocaleString('en-IN')}`,
            newData: {
                month: body.month,
                totalStaff: slips.length,
                totalPayout,
                notificationsSent,
            },
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
        })

        return NextResponse.json({
            success: true,
            month: body.month,
            totalStaff: slips.length,
            totalPayout,
            notificationsSent,
            slips,
            settings: {
                pfEnabled: hrSettings?.pfEnabled,
                pfPercentage: hrSettings?.pfPercentage,
                esiEnabled: hrSettings?.esiEnabled,
                notificationsEnabled: shouldSendEmail || shouldSendSMS,
            },
        })

    } catch (error: any) {
        console.error('[POST /api/hr/salary/generate]', error)
        return NextResponse.json(
            { error: 'Failed to generate salary' },
            { status: 500 }
        )
    }
}

// ── Quiet hours check ──
function isInQuietHours(
    current: string,
    start: string,
    end: string
): boolean {
    if (start <= end) {
        return current >= start && current <= end
    }
    // Overnight: e.g., 21:00 – 07:00
    return current >= start || current <= end
}

// ── Salary slip HTML template ──
function generateSalarySlipHTML(
    slip: SalarySlip,
    monthLabel: string,
    school: any,
    hrSettings: any
): string {
    const footerText =
        hrSettings?.payslipFooterText ||
        'This is a computer generated payslip.'

    return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8fafc">
      <div style="background:white;border-radius:12px;padding:28px;border:1px solid #e2e8f0">

        <!-- Header -->
        <div style="text-align:center;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #6366f1">
          <h2 style="margin:0;color:#1e1b4b;font-size:20px">${school?.name || 'School'}</h2>
          ${school?.address ? `<p style="margin:4px 0 0;color:#64748b;font-size:12px">${school.address}</p>` : ''}
          <h3 style="margin:12px 0 0;color:#6366f1;font-size:16px">SALARY SLIP — ${monthLabel.toUpperCase()}</h3>
        </div>

        <!-- Employee Details -->
        <table style="width:100%;margin-bottom:20px;font-size:13px">
          <tr>
            <td style="padding:4px 0;color:#64748b;width:40%">Employee Name</td>
            <td style="padding:4px 0;font-weight:600;color:#1e293b">${slip.name}</td>
            <td style="padding:4px 0;color:#64748b;width:25%">Employee ID</td>
            <td style="padding:4px 0;font-weight:600;color:#1e293b">${slip.employeeId}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#64748b">Designation</td>
            <td style="padding:4px 0;color:#1e293b">${slip.designation}</td>
            <td style="padding:4px 0;color:#64748b">Department</td>
            <td style="padding:4px 0;color:#1e293b">${slip.department}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#64748b">Working Days</td>
            <td style="padding:4px 0;color:#1e293b">${slip.workingDays}</td>
            <td style="padding:4px 0;color:#64748b">Present Days</td>
            <td style="padding:4px 0;color:#1e293b">${slip.presentDays}</td>
          </tr>
          ${slip.bankAccount ? `
          <tr>
            <td style="padding:4px 0;color:#64748b">Bank Account</td>
            <td style="padding:4px 0;color:#1e293b">${slip.bankAccount}</td>
            <td style="padding:4px 0;color:#64748b">IFSC</td>
            <td style="padding:4px 0;color:#1e293b">${slip.ifscCode || '-'}</td>
          </tr>` : ''}
        </table>

        <!-- Earnings & Deductions -->
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px">
          <thead>
            <tr style="background:#f1f0f9">
              <th style="padding:8px 12px;text-align:left;color:#4c4980;border:1px solid #e8e6f0">Earnings</th>
              <th style="padding:8px 12px;text-align:right;color:#4c4980;border:1px solid #e8e6f0">Amount (₹)</th>
              <th style="padding:8px 12px;text-align:left;color:#4c4980;border:1px solid #e8e6f0">Deductions</th>
              <th style="padding:8px 12px;text-align:right;color:#4c4980;border:1px solid #e8e6f0">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${generateEarningsDeductionsRows(slip)}
          </tbody>
          <tfoot>
            <tr style="background:#f8f7ff;font-weight:700">
              <td style="padding:10px 12px;border:1px solid #e8e6f0;color:#1e1b4b">Gross Earnings</td>
              <td style="padding:10px 12px;text-align:right;border:1px solid #e8e6f0;color:#059669">₹${slip.earnings.gross.toLocaleString('en-IN')}</td>
              <td style="padding:10px 12px;border:1px solid #e8e6f0;color:#1e1b4b">Total Deductions</td>
              <td style="padding:10px 12px;text-align:right;border:1px solid #e8e6f0;color:#dc2626">₹${slip.deductions.total.toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Net Pay -->
        <div style="background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:10px;padding:16px;text-align:center;margin-bottom:16px">
          <p style="margin:0;color:rgba(255,255,255,0.8);font-size:12px;font-weight:500">NET PAY</p>
          <p style="margin:4px 0 0;color:white;font-size:28px;font-weight:800">₹${slip.netPay.toLocaleString('en-IN')}</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:11px">${numberToWords(slip.netPay)} Only</p>
        </div>

        <!-- Footer -->
        <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center">
          ${footerText}
        </p>
      </div>
    </div>
  `
}

function generateEarningsDeductionsRows(slip: SalarySlip): string {
    const earningRows = [
        { label: 'Basic Salary', amount: slip.earnings.basic },
        { label: 'HRA', amount: slip.earnings.hra },
        { label: 'DA', amount: slip.earnings.da },
        { label: 'Transport', amount: slip.earnings.ta },
        { label: 'Medical', amount: slip.earnings.medical },
        { label: 'Special', amount: slip.earnings.special },
    ].filter(r => r.amount > 0)

    const deductionRows = [
        { label: 'PF (Employee)', amount: slip.deductions.pf },
        { label: 'ESI', amount: slip.deductions.esi },
        { label: 'Prof. Tax', amount: slip.deductions.professionalTax },
        { label: 'TDS', amount: slip.deductions.tds },
        { label: 'Other', amount: slip.deductions.otherDeductions },
    ].filter(r => r.amount > 0)

    const maxRows = Math.max(earningRows.length, deductionRows.length)
    let html = ''

    for (let i = 0; i < maxRows; i++) {
        const e = earningRows[i]
        const d = deductionRows[i]
        html += `
      <tr>
        <td style="padding:6px 12px;border:1px solid #e8e6f0;color:#374151">
          ${e ? e.label : ''}
        </td>
        <td style="padding:6px 12px;text-align:right;border:1px solid #e8e6f0;color:#059669">
          ${e ? `₹${e.amount.toLocaleString('en-IN')}` : ''}
        </td>
        <td style="padding:6px 12px;border:1px solid #e8e6f0;color:#374151">
          ${d ? d.label : ''}
        </td>
        <td style="padding:6px 12px;text-align:right;border:1px solid #e8e6f0;color:#dc2626">
          ${d ? `₹${d.amount.toLocaleString('en-IN')}` : ''}
        </td>
      </tr>
    `
    }

    return html
}

// Simple number to words (Indian system)
function numberToWords(num: number): string {
    if (num === 0) return 'Zero'
    const ones = [
        '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
        'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
    ]
    const tens = [
        '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
        'Sixty', 'Seventy', 'Eighty', 'Ninety',
    ]

    function convert(n: number): string {
        if (n < 20) return ones[n]
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
        if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '')
        if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '')
        if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '')
        return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '')
    }

    return convert(Math.round(num)) + ' Rupees'
}