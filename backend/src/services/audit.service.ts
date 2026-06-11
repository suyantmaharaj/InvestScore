import { db } from './firebase.service';

export type AuditAction =
  | 'score_calculated'
  | 'target_set'
  | 'target_deleted'
  | 'user_created'
  | 'user_approved'
  | 'user_rejected'
  | 'user_deleted'
  | 'registration_approved'
  | 'registration_rejected'
  | 'ai_context_updated'
  | 'scoring_config_updated'
  | 'scoring_config_reset'
  | 'notification_sent'
  | 'submission_received'
  | 'submission_scored'
  | 'company_profile_updated'
  | 'watchlist_updated'
  | 'engagement_logged';

export interface AuditEntry {
  action:       AuditAction;
  actor:        string;
  actorRole:    string;
  companyId?:   string;
  companyName?: string;
  detail:       string;
  metadata?:    Record<string, any>;
  timestamp:    string;
}

export async function writeAuditLog(entry: Omit<AuditEntry, 'timestamp'>): Promise<void> {
  try {
    await db.collection('auditLog').add({
      ...entry,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // Audit log failures must never break the main operation
    console.error('Audit log write failed:', err);
  }
}
