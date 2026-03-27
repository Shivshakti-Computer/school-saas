export async function sendSMS(phones: string | string[], message: string): Promise<boolean> {
    const phoneList = Array.isArray(phones) ? phones.join(',') : phones

    try {
        const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
            method: 'POST',
            headers: {
                'authorization': process.env.FAST2SMS_API_KEY!,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                route: 'q',           // quick transactional
                message: message,
                language: 'english',
                flash: 0,
                numbers: phoneList,
            })
        })
        const data = await res.json()
        return data.return === true
    } catch (err) {
        console.error('SMS failed:', err)
        return false
    }
}

// Pre-built SMS templates
export const SMS_TEMPLATES = {
    admissionReceived: (studentName: string, schoolName: string) =>
        `Dear Parent, admission application for ${studentName} received at ${schoolName}. We will review and contact you shortly.`,

    admissionApproved: (studentName: string, schoolName: string) =>
        `Congratulations! ${studentName}'s admission at ${schoolName} is APPROVED. Please visit school for further process.`,

    feeReminder: (studentName: string, amount: number, dueDate: string) =>
        `Dear Parent, fee of Rs.${amount} for ${studentName} is due on ${dueDate}. Pay online to avoid late fine.`,

    feePaid: (studentName: string, amount: number, receiptNo: string) =>
        `Payment of Rs.${amount} received for ${studentName}. Receipt No: ${receiptNo}. Thank you.`,

    absentAlert: (studentName: string, date: string, schoolName: string) =>
        `Dear Parent, ${studentName} was ABSENT on ${date} at ${schoolName}. Please contact school if needed.`,

    examResult: (studentName: string, examName: string) =>
        `${studentName}'s ${examName} result is now available. Login to portal to view marks and grade card.`,

    notice: (schoolName: string, title: string) =>
        `${schoolName}: New notice - "${title}". Login to school portal to read full details.`,
}