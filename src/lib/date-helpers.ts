/**
 * Date utilities for consistent date handling across tool APIs
 * 
 * IMPORTANT SCHEMA INFO:
 * - Attendance model: Uses STRING dates (YYYY-MM-DD format)
 * - Fee/Student/User models: Use Date objects
 * 
 * This file standardizes date handling to prevent bugs
 */

/**
 * Get today's date as string (YYYY-MM-DD)
 * Use this for Attendance queries
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Convert any Date to string (YYYY-MM-DD)
 */
export function getDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Get date range as strings
 * @param days - Number of days to go back
 * @returns Object with start and end date strings
 */
export function getDateRange(days: number): { start: string; end: string } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  
  return {
    start: getDateString(start),
    end: getDateString(end)
  }
}

/**
 * Format date string to Indian locale
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Formatted date like "1 February 2025"
 */
export function formatIndianDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return new Date(+year, +month - 1, +day).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Format date string to Indian short format
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Formatted date like "01/02/2025"
 */
export function formatIndianDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

/**
 * Get start of current month as Date object
 * Use this for Fee queries (paidAt field)
 */
export function getCurrentMonthStart(): Date {
  const date = new Date()
  date.setDate(1)
  date.setHours(0, 0, 0, 0)
  return date
}

/**
 * Get today's date with full display format
 * @returns "Saturday, 1 February 2025"
 */
export function getTodayDisplay(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Check if a date string is valid
 */
export function isValidDateString(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateStr)) return false
  
  const date = new Date(dateStr)
  return date instanceof Date && !isNaN(date.getTime())
}