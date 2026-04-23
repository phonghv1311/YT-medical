-- Part 10: News

CREATE TABLE IF NOT EXISTS news (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(500)    NOT NULL,
    slug            VARCHAR(500)    UNIQUE,

    thumbnail_url   VARCHAR(500),
    summary         TEXT,
    content         TEXT,

    category        VARCHAR(50),
    tags            VARCHAR(255)[],

    author_id       UUID            NOT NULL REFERENCES users(id),
    hospital_id     UUID            REFERENCES hospitals(id),

    status          VARCHAR(20)     DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at    TIMESTAMP,

    view_count      INT             DEFAULT 0,
    share_count     INT             DEFAULT 0,

    is_featured     BOOLEAN         DEFAULT FALSE,
    is_hot          BOOLEAN         DEFAULT FALSE,

    seo_title       VARCHAR(200),
    seo_description VARCHAR(300),

    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);
CREATE INDEX IF NOT EXISTS idx_news_author_id ON news(author_id);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
CREATE INDEX IF NOT EXISTS idx_news_status ON news(status);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at DESC);

CREATE TABLE IF NOT EXISTS news_comments (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    news_id         UUID            NOT NULL REFERENCES news(id) ON DELETE CASCADE,
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    content         TEXT            NOT NULL,
    parent_id       UUID            REFERENCES news_comments(id),

    is_approved     BOOLEAN         DEFAULT TRUE,

    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_news_comments_news_id ON news_comments(news_id);
CREATE INDEX IF NOT EXISTS idx_news_comments_user_id ON news_comments(user_id);
