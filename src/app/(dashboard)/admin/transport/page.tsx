import { getServerSession } from 'next-auth'
import { redirect }         from 'next/navigation'
import { authOptions }      from '@/lib/auth'
import { connectDB }        from '@/lib/db'
import { Route }            from '@/models/Transport'
import { TransportClient }  from './TransportClient'
import '@/models/Student'
import '@/models/User'
import { requireModule } from '@/lib/planGuard'

export const metadata = {
  title: 'Transport | Skolify',
}

export default async function TransportPage() {
  await requireModule('transport')

  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  await connectDB()

  const routes = await Route.find({
    tenantId: session.user.tenantId,
    isActive: true,
  })
    .populate({
      path:     'assignedStudents',
      select:   'admissionNo class section',
      populate: { path: 'userId', select: 'name' },
    })
    .sort({ routeNo: 1 })
    .lean()

  const stats = {
    totalRoutes:   routes.length,
    totalStudents: routes.reduce((s, r) => s + (r.assignedStudents?.length ?? 0), 0),
    totalCapacity: routes.reduce((s, r) => s + r.capacity, 0),
    totalBuses:    routes.filter(r => r.vehicleType === 'bus').length,
    totalVans:     routes.filter(r => r.vehicleType === 'van').length,
  }

  return (
    <TransportClient
      initialRoutes={JSON.parse(JSON.stringify(routes))}
      initialStats={stats}
      userRole={session.user.role}
    />
  )
}