-- Part 11: Subscriptions & Payments

CREATE TABLE IF NOT EXISTS subscription_plans (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100)    NOT NULL,
    name_en         VARCHAR(100),
    slug            VARCHAR(100)    UNIQUE,

    description     TEXT,
    features        JSONB,

    price           DECIMAL(10,2)   NOT NULL,
    currency        VARCHAR(3)      DEFAULT 'VND',
    duration_months INT             DEFAULT 1,

    is_free         BOOLEAN         DEFAULT FALSE,
    is_trial        BOOLEAN         DEFAULT FALSE,
    trial_days      INT,

    is_popular      BOOLEAN         DEFAULT FALSE,
    is_active       BOOLEAN         DEFAULT TRUE,

    display_order   INT             DEFAULT 0,

    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id         UUID            NOT NULL REFERENCES subscription_plans(id),

    status          VARCHAR(20)     DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),

    start_date      DATE            NOT NULL,
    end_date        DATE            NOT NULL,

    auto_renew      BOOLEAN         DEFAULT TRUE,
    cancelled_at    TIMESTAMP,
    cancellation_reason TEXT,

    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_end_date ON user_subscriptions(end_date);

CREATE TABLE IF NOT EXISTS payment_methods (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    type            VARCHAR(20)     NOT NULL CHECK (type IN ('credit_card', 'debit_card')),
    card_brand      VARCHAR(20),
    card_last4      VARCHAR(4)      NOT NULL,
    card_exp_month  INT,
    card_exp_year   INT,

    is_default      BOOLEAN         DEFAULT FALSE,
    is_verified     BOOLEAN         DEFAULT FALSE,

    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);

CREATE TABLE IF NOT EXISTS payments (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID            REFERENCES user_subscriptions(id),

    amount          DECIMAL(10,2)   NOT NULL,
    currency        VARCHAR(3)      DEFAULT 'VND',

    payment_method  VARCHAR(50),
    card_last4      VARCHAR(4),

    transaction_id  VARCHAR(100)    UNIQUE,
    gateway_response JSONB,

    status          VARCHAR(20)     DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),

    description     TEXT,
    metadata        JSONB,

    paid_at         TIMESTAMP,
    failed_at       TIMESTAMP,
    refunded_at     TIMESTAMP,

    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

CREATE TABLE IF NOT EXISTS invoices (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id      UUID            REFERENCES payments(id),
    user_id         UUID            NOT NULL REFERENCES users(id),

    invoice_number  VARCHAR(50)     UNIQUE,

    amount          DECIMAL(10,2)   NOT NULL,
    tax_amount      DECIMAL(10,2)   DEFAULT 0,
    total_amount    DECIMAL(10,2)   NOT NULL,

    billing_info    JSONB,

    status          VARCHAR(20)     DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'paid', 'cancelled')),

    issued_at       TIMESTAMP,
    due_date        DATE,
    paid_at         TIMESTAMP,

    pdf_url         VARCHAR(500),

    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_payment_id ON invoices(payment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
