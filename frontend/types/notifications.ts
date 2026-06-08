export type NotificationType =
  | 'submission'
  | 'classification_change'
  | 'registration_approved'
  | 'risk_alert';

export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface Notification {
  id:           string;
  type:         NotificationType;
  title:        string;
  body:         string;
  companyId?:   string;
  companyName?: string;
  severity:     NotificationSeverity;
  forRole:      'pm' | 'admin' | 'all';
  read:         boolean;
  createdAt:    string;
  readAt?:      string;
  metadata?:    Record<string, unknown>;
}
