/* ============================================================
   FILE: src/models/Attendance.ts
   Schema — Student + School models ke saath aligned
   ============================================================ */

import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IAttendance extends Document {
  tenantId:  mongoose.Types.ObjectId
  studentId: mongoose.Types.ObjectId
  date:      string          // "YYYY-MM-DD"
  subject?:  string
  period?:   number
  status:    'present' | 'absent' | 'late' | 'holiday' | 'half-day'
  markedBy:  mongoose.Types.ObjectId
  smsSent:   boolean
  remarks?:  string
  createdAt: Date
  updatedAt: Date
}

export interface IAttendanceLean {
  _id:       mongoose.Types.ObjectId
  tenantId:  mongoose.Types.ObjectId
  studentId: mongoose.Types.ObjectId
  date:      string
  subject?:  string
  period?:   number
  status:    IAttendance['status']
  markedBy:  mongoose.Types.ObjectId
  smsSent:   boolean
  remarks?:  string
  createdAt: Date
  updatedAt: Date
}

export type AttendanceStatus    = IAttendance['status']
export type AttendanceStatusUI  = 'present' | 'absent' | 'late' | 'pending'

// ── Schema ───────────────────────────────────────────────────

const AttendanceSchema = new Schema<IAttendance>(
  {
    tenantId: {
      type:     Schema.Types.ObjectId,
      ref:      'School',
      required: true,
      index:    true,
    },
    studentId: {
      type:     Schema.Types.ObjectId,
      ref:      'Student',
      required: true,
    },
    date: {
      type:     String,
      required: true,
      match:    [/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'],
    },
    subject: {
      type:    String,
      trim:    true,
    },
    period: {
      type: Number,
      min:  1,
      max:  10,
    },
    status: {
      type:     String,
      enum:     ['present', 'absent', 'late', 'holiday', 'half-day'],
      required: true,
    },
    markedBy: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    smsSent: {
      type:    Boolean,
      default: false,
    },
    remarks: {
      type:      String,
      trim:      true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
)

// ── Indexes ───────────────────────────────────────────────────

// Primary unique constraint
// subject null/undefined ke liye sparse use karo
AttendanceSchema.index(
  { tenantId: 1, studentId: 1, date: 1 },
  {
    unique: true,
    name:   'unique_student_date',
    // subject wali date ke liye alag index
    partialFilterExpression: { subject: { $exists: false } },
  }
)

AttendanceSchema.index(
  { tenantId: 1, studentId: 1, date: 1, subject: 1 },
  {
    unique: true,
    name:   'unique_student_date_subject',
    partialFilterExpression: { subject: { $exists: true } },
  }
)

// Report queries
AttendanceSchema.index(
  { tenantId: 1, date: 1 },
  { name: 'attendance_by_date' }
)

// Student history — date descending
AttendanceSchema.index(
  { tenantId: 1, studentId: 1, date: -1 },
  { name: 'student_history' }
)

// SMS pending query — absent + smsSent:false
AttendanceSchema.index(
  { tenantId: 1, status: 1, smsSent: 1, date: 1 },
  { name: 'sms_pending_query' }
)

// ── Static Methods ────────────────────────────────────────────

interface AttendanceStatics extends Model<IAttendance> {
  getMonthlyStats(
    tenantId: string,
    studentId: string,
    month: string
  ): Promise<{
    present:    number
    absent:     number
    late:       number
    holiday:    number
    total:      number
    percentage: number
  }>

  getDailyClassSummary(
    tenantId: string,
    date:     string,
    cls:      string,
    section?: string
  ): Promise<{
    present: number
    absent:  number
    late:    number
    total:   number
  }>
}

AttendanceSchema.statics.getMonthlyStats = async function (
  tenantId: string,
  studentId: string,
  month: string
) {
  const [year, mon] = month.split('-')
  const startDate   = `${year}-${mon.padStart(2, '0')}-01`
  const endDate     = `${year}-${mon.padStart(2, '0')}-31`

  const result = await this.aggregate([
    {
      $match: {
        tenantId:  new mongoose.Types.ObjectId(tenantId),
        studentId: new mongoose.Types.ObjectId(studentId),
        date:      { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id:     null,
        present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        absent:  { $sum: { $cond: [{ $eq: ['$status', 'absent'] },  1, 0] } },
        late:    { $sum: { $cond: [{ $eq: ['$status', 'late'] },    1, 0] } },
        holiday: { $sum: { $cond: [{ $eq: ['$status', 'holiday'] }, 1, 0] } },
        total:   { $sum: 1 },
      },
    },
  ])

  if (!result.length) {
    return { present: 0, absent: 0, late: 0, holiday: 0, total: 0, percentage: 0 }
  }

  const { present, absent, late, holiday, total } = result[0]

  // Percentage: present + late dono attendance mein count
  const attendedDays = present + late
  const percentage   = total > 0 ? Math.round((attendedDays / total) * 100) : 0

  return { present, absent, late, holiday, total, percentage }
}

AttendanceSchema.statics.getDailyClassSummary = async function (
  tenantId: string,
  date:     string,
  cls:      string,
  section?: string
) {
  // Students of this class
  const Student = mongoose.model('Student')
  const filter: Record<string, unknown> = {
    tenantId: new mongoose.Types.ObjectId(tenantId),
    class:    cls,
    status:   'active',
  }
  if (section) filter.section = section

  const students = await Student.find(filter).select('_id').lean()
  const studentIds = students.map((s: { _id: mongoose.Types.ObjectId }) => s._id)

  if (!studentIds.length) {
    return { present: 0, absent: 0, late: 0, total: 0 }
  }

  const result = await this.aggregate([
    {
      $match: {
        tenantId:  new mongoose.Types.ObjectId(tenantId),
        studentId: { $in: studentIds },
        date,
      },
    },
    {
      $group: {
        _id:     null,
        present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        absent:  { $sum: { $cond: [{ $eq: ['$status', 'absent'] },  1, 0] } },
        late:    { $sum: { $cond: [{ $eq: ['$status', 'late'] },    1, 0] } },
        total:   { $sum: 1 },
      },
    },
  ])

  if (!result.length) {
    return { present: 0, absent: 0, late: 0, total: studentIds.length }
  }

  return result[0]
}

export const Attendance = (
  mongoose.models.Attendance ||
  mongoose.model<IAttendance, AttendanceStatics>('Attendance', AttendanceSchema)
) as AttendanceStatics