-- 1. 用户与文明主表
CREATE TABLE civilizations (
    id TEXT PRIMARY KEY,           -- 对应 Durable Object ID
    owner_id TEXT NOT NULL,         -- 玩家 ID
    name TEXT DEFAULT 'Unnamed Seed',
    status TEXT DEFAULT 'Order_Plateau', -- 秩序稳态/熵增激变
    sanity_index REAL DEFAULT 100.0,    -- 理智值
    peak_complexity INTEGER DEFAULT 0,  -- 曾达到的最高基因复杂度
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 全球演化日志（用于 AI 突变去重与缓存）
CREATE TABLE mutation_cache (
    cache_key TEXT PRIMARY KEY,     -- 语义+环境的 Hash
    genome_patch TEXT NOT NULL,     -- AI 生成的 JSON 片段
    success_rate REAL DEFAULT 0.0,   -- 存活率反馈
    usage_count INTEGER DEFAULT 1
);

-- 3. 数字化石馆（R2 引用）
CREATE TABLE fossil_archive (
    fossil_id TEXT PRIMARY KEY,
    civilization_id TEXT,
    snapshot_url TEXT,              -- 存储在 R2 中的物种截图/JSON
    extinction_reason TEXT
);
