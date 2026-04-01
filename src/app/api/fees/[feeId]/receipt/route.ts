// FILE: src/app/api/fees/[feeId]/receipt/route.ts
// GET → Generate receipt data for a fee payment
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { Fee } from "@/models/Fee"
import  "@/models/Student"
import { School } from "@/models/School"
import   "@/models/FeeStructure"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ feeId: string }> }
) {
    try {
        const { feeId } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        const paymentIndex = req.nextUrl.searchParams.get('paymentIndex')

        const fee = await Fee.findOne({
            _id: feeId,
            tenantId: session.user.tenantId,
        })
            .populate({
                path: 'studentId',
                select: 'admissionNo class section rollNo fatherName',
                populate: { path: 'userId', select: 'name phone' },
            })
            .populate('structureId', 'name term academicYear items')
            .lean() as any

        if (!fee) {
            return NextResponse.json({ error: 'Fee not found' }, { status: 404 })
        }

        const school = await School.findById(session.user.tenantId)
            .select('name address phone email logo')
            .lean() as any

        // If paymentIndex specified, get specific payment receipt
        // Otherwise return latest/overall receipt
        let paymentData = null
        if (paymentIndex !== null && fee.payments?.length > 0) {
            const idx = parseInt(paymentIndex!)
            if (idx >= 0 && idx < fee.payments.length) {
                paymentData = fee.payments[idx]
            }
        }

        const receipt = {
            // School info
            school: {
                name: school?.name || '',
                address: school?.address || '',
                phone: school?.phone || '',
                email: school?.email || '',
                logo: school?.logo || '',
            },
            // Student info
            student: {
                name: fee.studentId?.userId?.name || 'N/A',
                admissionNo: fee.studentId?.admissionNo || '',
                class: fee.studentId?.class || '',
                section: fee.studentId?.section || '',
                rollNo: fee.studentId?.rollNo || '',
                fatherName: fee.studentId?.fatherName || '',
                phone: fee.studentId?.userId?.phone || '',
            },
            // Fee info
            fee: {
                structureName: fee.structureId?.name || '',
                term: fee.structureId?.term || '',
                academicYear: fee.structureId?.academicYear || '',
                items: fee.structureId?.items || [],
                totalAmount: fee.finalAmount,
                discount: fee.discount,
                lateFine: fee.lateFine,
                totalPaid: fee.paidAmount,
                remaining: fee.finalAmount - fee.paidAmount,
                status: fee.status,
                dueDate: fee.dueDate,
            },
            // Payment details (specific or latest)
            payment: paymentData ? {
                amount: paymentData.amount,
                mode: paymentData.paymentMode,
                receiptNumber: paymentData.receiptNumber,
                paidAt: paymentData.paidAt,
                razorpayId: paymentData.razorpayPaymentId || null,
            } : {
                amount: fee.paidAmount,
                mode: fee.paymentMode,
                receiptNumber: fee.receiptNumber,
                paidAt: fee.paidAt,
                razorpayId: fee.razorpayPaymentId || null,
            },
            // All payments history
            allPayments: (fee.payments || []).map((p: any, i: number) => ({
                index: i,
                amount: p.amount,
                mode: p.paymentMode,
                receiptNumber: p.receiptNumber,
                paidAt: p.paidAt,
            })),
        }

        return NextResponse.json({ receipt })
    } catch (err: any) {
        console.error('Receipt error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}