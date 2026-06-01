# AI 和云端账号接入方案

## 当前实现

当前版本已经预留 DeepSeek AI 接口：

- 前端：`prototype/app.js`
- 后端：`api/analyze-day.js`
- 部署目标：Vercel
- 环境变量：`DEEPSEEK_API_KEY`

前端会调用：

```text
POST /api/analyze-day
```

如果接口不可用，会自动回退到本地规则版复盘建议。

## DeepSeek

不要把 DeepSeek API Key 写进前端代码，也不要提交到 GitHub。Key 只能放到 Vercel 环境变量：

```text
DEEPSEEK_API_KEY=...
DEEPSEEK_MODEL=deepseek-v4-flash
```

建议模型：

- `deepseek-v4-flash`：每日总结优先用这个，速度和成本更合适。
- `deepseek-v4-pro`：后续如果需要更深入的长期分析再切换。

## Supabase

Supabase 用于真正账号、云端数据和跨设备同步。建议表结构：

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null,
  target text,
  time_label text,
  created_at timestamptz default now()
);

create table daily_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  record_date date not null,
  done_count int not null default 0,
  total_count int not null default 0,
  percent int not null default 0,
  mood text,
  events text,
  study text,
  improvements text,
  tomorrow text,
  ai_reflection jsonb,
  updated_at timestamptz default now(),
  unique (user_id, record_date)
);
```

RLS 策略方向：

```sql
alter table habits enable row level security;
alter table daily_records enable row level security;

create policy "Users can manage own habits"
on habits for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own daily records"
on daily_records for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

## 下一步

1. 把项目导入 Vercel。
2. 在 Vercel 添加 `DEEPSEEK_API_KEY`。
3. 测试 `/api/analyze-day`。
4. 创建 Supabase 项目。
5. 添加 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`。
6. 把本地用户隔离替换为 Supabase Auth。
7. 把 localStorage 的 habits / records 迁移到 Supabase 表。
