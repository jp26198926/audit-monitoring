import { format, differenceInDays, startOfYear, parseISO } from "date-fns";

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy-MM-dd");
}

/**
 * Calculate days between two dates
 */
export function daysBetween(
  date1: Date | string,
  date2: Date | string,
): number {
  const d1 = typeof date1 === "string" ? parseISO(date1) : date1;
  const d2 = typeof date2 === "string" ? parseISO(date2) : date2;
  return differenceInDays(d2, d1);
}

/**
 * Check if date is overdue
 */
export function isOverdue(targetDate: Date | string): boolean {
  const target =
    typeof targetDate === "string" ? parseISO(targetDate) : targetDate;
  return target < new Date();
}

/**
 * Get year-to-date start date
 */
export function getYearToDateStart(): string {
  return format(startOfYear(new Date()), "yyyy-MM-dd");
}

/**
 * Check if finding should be marked as overdue
 */
export function shouldMarkAsOverdue(
  targetDate: Date | string,
  status: string,
): boolean {
  if (status === "Closed") return false;
  return isOverdue(targetDate);
}

/**
 * Check if date is within days range
 */
export function isWithinDays(date: Date | string, days: number): boolean {
  const target = typeof date === "string" ? parseISO(date) : date;
  const diff = differenceInDays(target, new Date());
  return diff >= 0 && diff <= days;
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
  const sanitized = sanitizeFilename(nameWithoutExt);
  return `${sanitized}_${timestamp}_${random}.${extension}`;
}

/**
 * Pagination helper
 */
export function getPaginationParams(
  page: string | number = 1,
  limit: string | number = 10,
): { offset: number; limit: number } {
  const pageNum = typeof page === "string" ? parseInt(page, 10) : page;
  const limitNum = typeof limit === "string" ? parseInt(limit, 10) : limit;

  const validPage = Math.max(1, pageNum || 1);
  const validLimit = Math.min(Math.max(1, limitNum || 10), 100);

  return {
    offset: (validPage - 1) * validLimit,
    limit: validLimit,
  };
}
