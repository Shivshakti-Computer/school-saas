// FILE: src/app/(dashboard)/admin/notices/page.tsx
// FINAL PRODUCTION VERSION

'use client'

import { useState, useEffect } from 'react'
import { PageHeader, Button, Modal, Alert, StatCard } from '@/components/ui'
import { NoticeList } from '@/components/notices/NoticeList'
import { NoticeForm } from '@/components/notices/NoticeForm'
import { NoticeFiltersComponent } from '@/components/notices/NoticeFilters'
import { Portal } from '@/components/ui/Portal'
import { Plus, MessageSquare, TrendingUp, Bell, FileText, Pin } from 'lucide-react'
import type { NoticeListItem, NoticeFilters, NoticeStats, NoticeFormData, NoticeDetail } from '@/types/notice'

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<NoticeListItem[]>([])
  const [stats, setStats] = useState<NoticeStats | null>(null)

  // Credit state
  const [creditBalance, setCreditBalance] = useState(0)
  const [totalCreditsUsed, setTotalCreditsUsed] = useState(0)

  const [filters, setFilters] = useState<NoticeFilters>({
    page: 1,
    limit: 20,
    sortBy: 'publishedAt',
    sortOrder: 'desc',
  })
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingNotice, setEditingNotice] = useState<NoticeDetail | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Format credits helper
  const formatCredits = (value: number): string => {
    if (Number.isInteger(value)) {
      return value.toLocaleString('en-IN')
    }
    return value.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Fetch credit balance
  const fetchCreditBalance = async () => {
    try {
      const res = await fetch('/api/credits/balance')
      const data = await res.json()

      // Handle nested data.data.balance structure
      if (data.success && data.data?.balance !== undefined) {
        setCreditBalance(data.data.balance)
      } else if (data.balance !== undefined) {
        setCreditBalance(data.balance)
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err)
    }
  }

  // Calculate total credits used from notices
  const calculateTotalCreditsUsed = (noticesList: NoticeListItem[]) => {
    const total = noticesList.reduce((sum, notice) => {
      return sum + ((notice as any).creditsUsed || 0)
    }, 0)

    setTotalCreditsUsed(Math.round(total * 100) / 100)
  }

  const fetchNotices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.set(key, String(value))
        }
      })

      const res = await fetch(`/api/notices?${params}`)
      const data = await res.json()

      if (res.ok) {
        setNotices(data.notices)
        if (data.stats) setStats(data.stats)
        calculateTotalCreditsUsed(data.notices)
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/notices/stats')
      const data = await res.json()
      if (res.ok) setStats(data.stats)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  useEffect(() => {
    fetchNotices()
  }, [filters])

  useEffect(() => {
    fetchCreditBalance()
    fetchStats()
  }, [])

  const handleCreate = async (formData: NoticeFormData) => {
    try {
      setSubmitting(true)
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 402) {
          setAlert({
            type: 'error',
            message: `Insufficient credits. ${data.error}. Please purchase credits.`,
          })
        } else {
          throw new Error(data.error)
        }
      } else {
        setAlert({
          type: 'success',
          message:
            formData.status === 'draft'
              ? 'Draft saved successfully!'
              : 'Notice published successfully!' +
                (data.warning ? ` Warning: ${data.warning}` : ''),
        })
        setShowCreateModal(false)
        fetchNotices()
        fetchStats()
        fetchCreditBalance()
      }
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (formData: NoticeFormData) => {
    if (!editingNotice) return

    try {
      setSubmitting(true)
      const res = await fetch(`/api/notices/${editingNotice._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setAlert({ type: 'success', message: 'Notice updated successfully!' })
      setEditingNotice(null)
      fetchNotices()
      fetchStats()
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/notices/${id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setAlert({ type: 'success', message: 'Notice deleted successfully!' })
      fetchNotices()
      fetchStats()
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message })
    }
  }

  const handleEdit = async (notice: NoticeListItem) => {
    try {
      const res = await fetch(`/api/notices/${notice._id}`)
      const data = await res.json()
      if (res.ok) {
        setEditingNotice(data.notice)
      }
    } catch (err) {
      console.error('Failed to fetch notice:', err)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notice Board"
        subtitle="Manage and publish notices for students, teachers, and parents"
        action={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Post Notice
          </Button>
        }
      />

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* ✅ FIXED: Responsive Grid - Proper breakpoints */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Notice Stats */}
        {stats && (
          <>
            <StatCard
              label="Total Notices"
              value={stats.total}
              icon={<Bell size={18} />}
              color="primary"
            />

            <StatCard
              label="Published"
              value={stats.published}
              icon={<FileText size={18} />}
              color="success"
            />

            <StatCard
              label="Drafts"
              value={stats.draft}
              icon={<FileText size={18} />}
              color="warning"
            />

            <StatCard
              label="Pinned"
              value={stats.pinned}
              icon={<Pin size={18} />}
              color="info"
            />
          </>
        )}

        {/* ✅ Credits Stats - Fixed overflow */}
        <StatCard
          label="Credits Used"
          value={formatCredits(totalCreditsUsed)}
          icon={<TrendingUp size={18} />}
          color="warning"
        />

        <StatCard
          label="Credit Balance"
          value={formatCredits(creditBalance)}
          icon={<MessageSquare size={18} />}
          color="primary"
          trend={
            creditBalance < 100
              ? '⚠️ Low balance'
              : creditBalance < 500
              ? '💡 Running low'
              : undefined
          }
        />
      </div>

      <NoticeFiltersComponent
        filters={filters}
        onChange={setFilters}
        onReset={() =>
          setFilters({
            page: 1,
            limit: 20,
            sortBy: 'publishedAt',
            sortOrder: 'desc',
          })
        }
        showAdminFilters
      />

      <NoticeList
        notices={notices}
        onEdit={handleEdit}
        onDelete={handleDelete}
        showActions
        isLoading={loading}
      />

      <Portal>
        <Modal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Post New Notice"
          size="lg"
        >
          <NoticeForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateModal(false)}
            isLoading={submitting}
          />
        </Modal>
      </Portal>

      <Portal>
        <Modal
          open={!!editingNotice}
          onClose={() => setEditingNotice(null)}
          title="Edit Notice"
          size="lg"
        >
          {editingNotice && (
            <NoticeForm
              initialData={editingNotice}
              onSubmit={handleUpdate}
              onCancel={() => setEditingNotice(null)}
              isLoading={submitting}
            />
          )}
        </Modal>
      </Portal>
    </div>
  )
}