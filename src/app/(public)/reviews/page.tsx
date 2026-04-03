// FILE: src/app/(public)/reviews/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Container } from '@/components/marketing/Container'
import { CTA } from '@/components/marketing/CTA'

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <svg
          key={star}
          width={size} height={size}
          viewBox="0 0 20 20" fill="none"
        >
          <path
            d="M10 1l2.39 5.26L18 7.27l-4 4.14.94 5.59L10 14.27l-4.94 2.73L6 11.41 2 7.27l5.61-.51L10 1z"
            fill={star <= rating ? '#F59E0B' : '#E2E8F0'}
          />
        </svg>
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: any }) {
  return (
    <div
      className="rounded-2xl border p-6 flex flex-col gap-3
        transition-all hover:shadow-soft hover:-translate-y-0.5"
      style={{
        background: 'var(--surface-0)',
        borderColor: 'var(--surface-200)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <StarRating rating={review.rating} />
          <h3
            className="font-bold text-sm mt-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {review.title}
          </h3>
        </div>
        {review.wouldRecommend && (
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0"
            style={{
              background: 'var(--success-light)',
              color: 'var(--success)',
            }}
          >
            Recommends ✓
          </span>
        )}
      </div>

      <p
        className="text-sm leading-relaxed flex-1"
        style={{ color: 'var(--text-secondary)' }}
      >
        {review.message}
      </p>

      <div
        className="flex items-center gap-3 pt-3 border-t"
        style={{ borderColor: 'var(--surface-100)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center
            text-sm font-extrabold text-white flex-shrink-0"
          style={{ background: 'var(--brand)' }}
        >
          {review.schoolName?.charAt(0)?.toUpperCase() || 'S'}
        </div>
        <div>
          <p
            className="text-xs font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {review.contactName}
          </p>
          <p
            className="text-[11px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {review.schoolName}
            {review.schoolLocation && ` · ${review.schoolLocation}`}
          </p>
        </div>
      </div>
    </div>
  )
}

function SubmitReviewForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    schoolName: '', schoolLocation: '', contactName: '',
    contactEmail: '', contactPhone: '',
    rating: 5, title: '', message: '', wouldRecommend: true,
    type: 'review',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hoveredStar, setHoveredStar] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="rounded-2xl border p-8 shadow-soft"
      style={{
        background: 'var(--surface-0)',
        borderColor: 'var(--surface-200)',
      }}
    >
      <h3
        className="text-lg font-bold mb-6"
        style={{ color: 'var(--text-primary)' }}
      >
        ✍️ Apna Review Submit Karein
      </h3>

      {error && (
        <div
          className="p-3 rounded-xl mb-4 text-sm"
          style={{
            background: 'var(--danger-light)',
            color: 'var(--danger)',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating */}
        <div>
          <label
            className="block text-xs font-semibold mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            Rating *
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => setForm(f => ({ ...f, rating: star }))}
              >
                <svg width="28" height="28" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M10 1l2.39 5.26L18 7.27l-4 4.14.94 5.59L10 14.27l-4.94 2.73L6 11.41 2 7.27l5.61-.51L10 1z"
                    fill={star <= (hoveredStar || form.rating) ? '#F59E0B' : '#E2E8F0'}
                    className="transition-colors cursor-pointer"
                  />
                </svg>
              </button>
            ))}
            <span
              className="ml-2 text-sm font-semibold self-center"
              style={{ color: 'var(--text-muted)' }}
            >
              {form.rating}/5
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              School Name *
            </label>
            <input
              className="input-clean"
              placeholder="Aapke school ka naam"
              value={form.schoolName}
              onChange={e => setForm(f => ({ ...f, schoolName: e.target.value }))}
              required
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Your Name *
            </label>
            <input
              className="input-clean"
              placeholder="Principal/Admin naam"
              value={form.contactName}
              onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Location
            </label>
            <input
              className="input-clean"
              placeholder="City, State"
              value={form.schoolLocation}
              onChange={e => setForm(f => ({ ...f, schoolLocation: e.target.value }))}
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Phone (optional)
            </label>
            <input
              className="input-clean"
              placeholder="Contact number"
              value={form.contactPhone}
              onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label
            className="block text-xs font-semibold mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Review Title *
          </label>
          <input
            className="input-clean"
            placeholder="e.g. Best school management software!"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            required
          />
        </div>

        <div>
          <label
            className="block text-xs font-semibold mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Your Review *
          </label>
          <textarea
            className="input-clean resize-none"
            rows={4}
            placeholder="Aapka experience share karein — kya pasand aaya, kya improve ho sakta hai..."
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            required
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="recommend"
            checked={form.wouldRecommend}
            onChange={e => setForm(f => ({ ...f, wouldRecommend: e.target.checked }))}
            className="w-4 h-4 rounded"
          />
          <label
            htmlFor="recommend"
            className="text-sm cursor-pointer"
            style={{ color: 'var(--text-secondary)' }}
          >
            Main dusre schools ko Skolify recommend karunga/karungi
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Submitting...' : 'Submit Review →'}
        </button>

        <p
          className="text-center text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          Review moderation ke baad public hoga · Usually 24 hours
        </p>
      </form>
    </div>
  )
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetch('/api/feedback?limit=20')
      .then(r => r.json())
      .then(data => {
        setReviews(data.reviews || [])
        setStats({
          averageRating: data.averageRating || 0,
          totalReviews: data.totalReviews || 0,
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <>
      {/* Hero */}
      <section className="relative pt-24 pb-16 section-brand-light overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-40 pointer-events-none" />
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <div className="badge-brand inline-flex mb-6">⭐ Reviews</div>
            <h1
              className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Schools jo{' '}
              <span className="gradient-text">Skolify use karte hain</span>
              {' '}ka experience
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Real schools, real experiences. Koi fake review nahi — sirf honest feedback.
            </p>

            {/* Stats */}
            {stats.totalReviews > 0 && (
              <div className="mt-8 flex items-center justify-center gap-6">
                <div className="text-center">
                  <p
                    className="text-5xl font-extrabold"
                    style={{ color: 'var(--brand)' }}
                  >
                    {stats.averageRating}
                  </p>
                  <div className="flex justify-center mt-1">
                    <StarRating rating={Math.round(stats.averageRating)} size={20} />
                  </div>
                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Average rating
                  </p>
                </div>
                <div
                  className="w-px h-16"
                  style={{ background: 'var(--surface-200)' }}
                />
                <div className="text-center">
                  <p
                    className="text-5xl font-extrabold"
                    style={{ color: 'var(--brand)' }}
                  >
                    {stats.totalReviews}
                  </p>
                  <p
                    className="text-xs mt-2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Total reviews
                  </p>
                </div>
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* Reviews Grid + Submit */}
      <section className="py-16 section-light">
        <Container>
          <div className="flex items-center justify-between mb-8">
            <h2
              className="text-xl font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              School Reviews
            </h2>
            {!showForm && !submitted && (
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary text-sm"
              >
                + Write a Review
              </button>
            )}
          </div>

          {/* Submit form */}
          {submitted ? (
            <div
              className="max-w-lg mx-auto text-center p-8 rounded-2xl border mb-10"
              style={{
                background: 'var(--success-light)',
                borderColor: 'rgba(16,185,129,0.2)',
              }}
            >
              <div className="text-4xl mb-3">🎉</div>
              <h3
                className="font-bold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Review Submitted!
              </h3>
              <p
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Shukriya! Aapka review moderation ke baad public hoga.
              </p>
            </div>
          ) : showForm ? (
            <div className="max-w-2xl mx-auto mb-12">
              <SubmitReviewForm onSuccess={() => { setShowForm(false); setSubmitted(true) }} />
            </div>
          ) : null}

          {/* Reviews */}
          {loading ? (
            <div className="text-center py-20">
              <div
                className="w-8 h-8 border-2 border-t-transparent rounded-full
                  animate-spin mx-auto"
                style={{ borderColor: 'var(--brand)' }}
              />
            </div>
          ) : reviews.length === 0 ? (
            <div
              className="text-center py-20 rounded-2xl border"
              style={{
                background: 'var(--surface-0)',
                borderColor: 'var(--surface-200)',
              }}
            >
              <div className="text-5xl mb-4">⭐</div>
              <h3
                className="font-bold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Pehle review bano!
              </h3>
              <p
                className="text-sm mb-6"
                style={{ color: 'var(--text-secondary)' }}
              >
                Abhi tak koi public review nahi hai. Pehle review likhne ka mauka aapka hai!
              </p>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-primary"
                >
                  Write First Review →
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {reviews.map((review: any) => (
                <ReviewCard key={review._id} review={review} />
              ))}
            </div>
          )}
        </Container>
      </section>

      <CTA />
    </>
  )
}