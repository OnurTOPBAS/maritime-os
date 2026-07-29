/**
 * Get the application URL automatically
 * Priority:
 * 1. NEXT_PUBLIC_APP_URL (if manually set)
 * 2. VERCEL_URL (automatically provided by Vercel)
 * 3. localhost:3000 (for local development)
 */
export function getAppUrl(): string {
  // Check for manually set URL first
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // Check for Vercel URL (automatically provided in Vercel deployments)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Fallback to localhost for local development
  return "http://localhost:3000"
}
