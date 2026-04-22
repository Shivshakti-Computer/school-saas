// FILE: src/lib/message/templates.ts
// All message templates - SMS, Email, WhatsApp
// Single source of truth
// ═══════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════
// SMS TEMPLATES
// ══════════════════════════════════════════════════════════

export const SMS_TEMPLATES = {
  // OTP
  otp: (otp: string) =>
    `Your Skolify OTP is ${otp}. Valid for 10 minutes. Do not share. -Skolify`,

  // Attendance
  absentAlert: (studentName: string, date: string, schoolName: string) =>
    `${studentName} was ABSENT on ${date} at ${schoolName}. Please contact school if needed. -Skolify`,

  // Fee
  feeReminder: (studentName: string, amount: number, dueDate: string) =>
    `Fee of Rs.${amount} for ${studentName} due on ${dueDate}. Pay online to avoid late fine. -Skolify`,

  feeReceipt: (studentName: string, amount: number, receiptNo: string) =>
    `Payment Rs.${amount} received for ${studentName}. Receipt: ${receiptNo}. Thank you! -Skolify`,

  // Exam
  examResult: (studentName: string, examName: string) =>
    `${studentName}'s ${examName} result is now available. Login to portal to view. -Skolify`,

  // Notice
  notice: (schoolName: string, title: string) =>
    `${schoolName}: New notice - "${title}". Login to portal for details. -Skolify`,

  // Admission
  admissionApproved: (studentName: string, schoolName: string) =>
    `${studentName}'s admission at ${schoolName} is APPROVED. Visit school for further process. -Skolify`,
}

// ══════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ══════════════════════════════════════════════════════════

export const EMAIL_TEMPLATES = {
  // Welcome Email
  welcome: (schoolName: string, adminName: string, loginUrl: string) => ({
    subject: `Welcome to Skolify — ${schoolName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;background:#f8fafc">
        <div style="background:white;border-radius:16px;padding:32px;border:1px solid #e2e8f0">
          <div style="text-align:center;margin-bottom:24px">
            <h1 style="margin:0;color:#1e293b;font-size:22px">Welcome to Skolify! 🎉</h1>
          </div>
          <p style="color:#475569;margin:0 0 8px">Hi <strong>${adminName}</strong>,</p>
          <p style="color:#475569;margin:0 0 20px">
            Your school <strong style="color:#1e293b">${schoolName}</strong> has been registered successfully.
            Your <strong>60-day free trial</strong> has started with ALL features unlocked.
          </p>
          <div style="text-align:center;margin:24px 0">
            <a href="${loginUrl}"
              style="display:inline-block;background:linear-gradient(135deg,#2563eb,#4f46e5);color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px">
              Login to Dashboard →
            </a>
          </div>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0">
            — Skolify by Shivshakti Computer Academy
          </p>
        </div>
      </div>
    `,
  }),


  // Superadmin Notification - New School Registration
  newSchoolRegistration: (
    schoolName: string,
    schoolCode: string,
    adminName: string,
    phone: string,
    email: string,
    trialDays: number,
    registrationDate: string,
    dashboardUrl: string
  ) => ({
    subject: `🆕 New School Registration - ${schoolName}`,
    html: `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;background:#f8fafc">
      <div style="background:white;border-radius:16px;padding:32px;border:1px solid #e2e8f0">
        
        <!-- Header -->
        <div style="text-align:center;margin-bottom:24px;padding-bottom:20px;border-bottom:2px solid #eef2ff">
          <h1 style="margin:0;color:#1e293b;font-size:24px">🎉 New School Registration</h1>
          <p style="margin:8px 0 0;color:#64748b;font-size:13px">${registrationDate}</p>
        </div>

        <!-- School Info Card -->
        <div style="background:linear-gradient(135deg,#eef2ff,#faf5ff);border:1.5px solid #c7d2fe;border-radius:12px;padding:20px;margin-bottom:20px">
          <h2 style="margin:0 0 16px;color:#4338ca;font-size:18px">🏫 School Details</h2>
          
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600">School Name:</td>
              <td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:700">${schoolName}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600">School Code:</td>
              <td style="padding:6px 0;color:#1e293b;font-size:14px;font-family:monospace;background:#f1f5f9;padding:4px 8px;border-radius:4px;display:inline-block">${schoolCode}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600">Admin Name:</td>
              <td style="padding:6px 0;color:#1e293b;font-size:14px">${adminName}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600">Phone:</td>
              <td style="padding:6px 0;color:#1e293b;font-size:14px">
                <a href="tel:${phone}" style="color:#4338ca;text-decoration:none">${phone}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600">Email:</td>
              <td style="padding:6px 0;color:#1e293b;font-size:14px">
                <a href="mailto:${email}" style="color:#4338ca;text-decoration:none">${email || 'Not provided'}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600">Trial Period:</td>
              <td style="padding:6px 0;color:#059669;font-size:14px;font-weight:700">${trialDays} Days</td>
            </tr>
          </table>
        </div>

        <!-- Action Buttons -->
        <div style="text-align:center;margin:24px 0">
          <a href="${dashboardUrl}" 
            style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;margin:0 8px">
            View in Dashboard →
          </a>
        </div>

        <!-- Quick Stats -->
        <div style="background:#fef3c7;border:1.5px solid #fde68a;border-radius:10px;padding:16px;margin-top:20px">
          <p style="margin:0;color:#92400e;font-size:13px;line-height:1.6">
            ⚡ <strong>Quick Info:</strong><br>
            • Trial Credits: Granted automatically<br>
            • All Modules: Unlocked during trial<br>
            • Phone Verified: ✅ Yes
          </p>
        </div>

        <!-- Footer -->
        <p style="color:#94a3b8;font-size:11px;text-align:center;margin:20px 0 0;padding-top:16px;border-top:1px solid #e2e8f0">
          Automated notification from Skolify Registration System<br>
          Shivshakti Computer Academy
        </p>
      </div>
    </div>
  `,
  }),

  // OTP Email
  otp: (otp: string) => ({
    subject: `${otp} — Skolify Verification Code`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 20px;background:#f8fafc">
        <div style="background:white;border-radius:16px;padding:32px;border:1px solid #e2e8f0">
          <h2 style="margin:0;color:#1e293b;font-size:20px;text-align:center">Verification Code</h2>
          <div style="background:linear-gradient(135deg,#eff6ff,#eef2ff);border:2px solid #bfdbfe;border-radius:16px;padding:24px;text-align:center;margin:20px 0">
            <p style="margin:0 0 8px;color:#3b82f6;font-size:12px;font-weight:700;text-transform:uppercase">Your OTP</p>
            <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#1e293b;font-family:monospace">${otp}</div>
          </div>
          <div style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:12px 16px">
            <p style="margin:0;color:#92400e;font-size:13px">
              ⏰ Valid for <strong>10 minutes</strong> only. Do not share with anyone.
            </p>
          </div>
        </div>
      </div>
    `,
  }),

  // Fee Receipt
  feeReceipt: (studentName: string, amount: string, receiptNo: string, schoolName: string) => ({
    subject: `Fee Receipt #${receiptNo} — ${schoolName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px">
        <h2>Fee Receipt</h2>
        <p>Fee of <strong>₹${amount}</strong> for <strong>${studentName}</strong> has been received.</p>
        <p>Receipt No: <strong>${receiptNo}</strong></p>
        <p style="color:#94A3B8;font-size:12px">— ${schoolName} via Skolify</p>
      </div>
    `,
  }),

  trialReminder: (
    schoolName: string,
    daysLeft: number,
    upgradeUrl: string
  ) => ({
    subject: `⚠️ Trial ending in ${daysLeft} day${daysLeft > 1 ? 's' : ''} — ${schoolName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;background:#f8fafc">
        <div style="background:white;border-radius:16px;padding:32px;border:1px solid #e2e8f0">
          <h2 style="margin:0 0 16px;color:#1e293b">
            ⚠️ Your trial ends in ${daysLeft} day${daysLeft > 1 ? 's' : ''}
          </h2>
          <p style="color:#475569;margin:0 0 16px">
            Hi <strong>${schoolName}</strong>,
          </p>
          <p style="color:#475569;margin:0 0 20px">
            Your 60-day free trial is ending soon. Upgrade now to
            keep access to all features without interruption.
          </p>
          <div style="text-align:center;margin:24px 0">
            <a href="${upgradeUrl}"
              style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px">
              Upgrade Now →
            </a>
          </div>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0">
            — Skolify by Shivshakti Computer Academy
          </p>
        </div>
      </div>
    `,
  }),
}

// ══════════════════════════════════════════════════════════
// WHATSAPP TEMPLATES
// ══════════════════════════════════════════════════════════

export const WHATSAPP_TEMPLATES = {
  // Fee Reminder
  feeReminder: (studentName: string, amount: number, dueDate: string, schoolName: string) =>
    `Dear Parent,\n\nFee reminder for ${studentName}:\n\nAmount: ₹${amount}\nDue Date: ${dueDate}\n\nPay online to avoid late charges.\n\nRegards,\n${schoolName}`,

  // Attendance Alert
  attendanceAlert: (studentName: string, date: string, status: string, schoolName: string) =>
    `Dear Parent,\n\n${studentName} was marked ${status} on ${date}.\n\nIf incorrect, please contact school.\n\nRegards,\n${schoolName}`,

  // Exam Result
  examResult: (studentName: string, examName: string, schoolName: string) =>
    `Dear Parent,\n\n${examName} results for ${studentName} are now available.\n\nLogin to parent portal to view detailed report.\n\nRegards,\n${schoolName}`,
}