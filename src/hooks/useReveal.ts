// FILE: src/hooks/useReveal.ts
// Lightweight Intersection Observer hook for scroll animations
// No external library — pure browser API

'use client'

import { useEffect, useRef } from 'react'

interface UseRevealOptions {
  threshold?: number
  rootMargin?: string
  once?: boolean // animate only once (default: true)
}

export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseRevealOptions = {}
) {
  const ref = useRef<T>(null)
  const { threshold = 0.15, rootMargin = '0px 0px -40px 0px', once = true } = options

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Add 'reveal' class if not present
    if (!el.classList.contains('reveal')) {
      el.classList.add('reveal')
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed')
          if (once) observer.unobserve(el)
        } else if (!once) {
          el.classList.remove('revealed')
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin, once])

  return ref
}

// For multiple elements — use on parent container
export function useRevealGroup(options: UseRevealOptions = {}) {
  const ref = useRef<HTMLDivElement>(null)
  const { threshold = 0.1, rootMargin = '0px 0px -40px 0px', once = true } = options

  useEffect(() => {
    const container = ref.current
    if (!container) return

    const children = container.querySelectorAll('.reveal')
    if (children.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            if (once) observer.unobserve(entry.target)
          } else if (!once) {
            entry.target.classList.remove('revealed')
          }
        })
      },
      { threshold, rootMargin }
    )

    children.forEach((child) => observer.observe(child))
    return () => observer.disconnect()
  }, [threshold, rootMargin, once])

  return ref
}