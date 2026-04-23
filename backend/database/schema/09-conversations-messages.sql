-- Part 9: Conversations, Messages, Video Calls

CREATE TABLE IF NOT EXISTS conversations (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    type            VARCHAR(20)     DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
    title           VARCHAR(255),

    patient_id      UUID            REFERENCES patients(id),
    doctor_id       UUID            REFERENCES doctors(id),

    last_message    TEXT,
    last_message_at TIMESTAMP,
    last_message_by UUID            REFERENCES users(id),

    is_archived     BOOLEAN         DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(patient_id, doctor_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_patient_id ON conversations(patient_id);
CREATE INDEX IF NOT EXISTS idx_conversations_doctor_id ON conversations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);

CREATE TABLE IF NOT EXISTS conversation_participants (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID            NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    role            VARCHAR(20)     DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    last_read_at    TIMESTAMP,

    UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);

CREATE TABLE IF NOT EXISTS messages (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID            NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    content         TEXT,
    message_type    VARCHAR(20)     DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    media_url       VARCHAR(500),
    media_type      VARCHAR(50),
    media_size      BIGINT,

    reply_to_id     UUID            REFERENCES messages(id),

    is_deleted      BOOLEAN         DEFAULT FALSE,
    deleted_at      TIMESTAMP,

    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS message_reads (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id      UUID            NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_reads_message_id ON message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user_id ON message_reads(user_id);

CREATE TABLE IF NOT EXISTS video_calls (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id   UUID            REFERENCES appointments(id),
    conversation_id UUID            REFERENCES conversations(id),

    caller_id       UUID            NOT NULL REFERENCES users(id),
    receiver_id     UUID            NOT NULL REFERENCES users(id),

    status          VARCHAR(20)     DEFAULT 'pending' CHECK (status IN ('pending', 'ringing', 'accepted', 'declined', 'ended', 'missed')),

    started_at      TIMESTAMP,
    ended_at        TIMESTAMP,
    duration_seconds INT,

    room_id         VARCHAR(100),

    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_video_calls_caller_id ON video_calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_receiver_id ON video_calls(receiver_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_status ON video_calls(status);
CREATE INDEX IF NOT EXISTS idx_video_calls_created_at ON video_calls(created_at DESC);
