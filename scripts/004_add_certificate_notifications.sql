-- Add notification fields to ship_certificates table
ALTER TABLE ship_certificates
ADD COLUMN IF NOT EXISTS responsible_person_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS notify_90_days BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_60_days BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_30_days BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_15_days BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_7_days BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_notification_sent DATE;

-- Create certificate notifications table for tracking sent notifications
CREATE TABLE IF NOT EXISTS certificate_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  certificate_id UUID NOT NULL REFERENCES ship_certificates(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  days_before INTEGER NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_to VARCHAR(255),
  status VARCHAR(50) DEFAULT 'sent'
);

CREATE INDEX IF NOT EXISTS idx_certificate_notifications_certificate ON certificate_notifications(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificate_notifications_sent_at ON certificate_notifications(sent_at);
