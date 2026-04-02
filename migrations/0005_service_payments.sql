CREATE TABLE IF NOT EXISTS service_payments (
  id TEXT PRIMARY KEY,
  consultation_id TEXT NOT NULL,
  user_id TEXT,
  request_type TEXT NOT NULL DEFAULT 'service',
  service TEXT NOT NULL,
  complexity TEXT NOT NULL DEFAULT 'starter',
  payment_method TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  status TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  provider TEXT NOT NULL DEFAULT '',
  external_reference TEXT NOT NULL,
  merchant_request_id TEXT NOT NULL DEFAULT '',
  checkout_request_id TEXT NOT NULL DEFAULT '',
  receipt_number TEXT NOT NULL DEFAULT '',
  customer_transaction_code TEXT NOT NULL DEFAULT '',
  provider_response TEXT NOT NULL DEFAULT '',
  last_error TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  paid_at TEXT,
  FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_service_payments_consultation_id ON service_payments(consultation_id);
CREATE INDEX IF NOT EXISTS idx_service_payments_user_id ON service_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_service_payments_checkout_request_id ON service_payments(checkout_request_id);
