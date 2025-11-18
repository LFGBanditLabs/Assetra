import { apiFetch } from '@/lib/services/httpClient'

export interface NotificationPayload {
  to: string
  subject: string
  html: string
  stage?: string
}

export async function sendWorkflowEmail(payload: NotificationPayload) {
  return apiFetch<{ success?: boolean; simulated?: boolean }>(`/api/notifications/email`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

