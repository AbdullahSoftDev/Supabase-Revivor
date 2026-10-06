<div align="center">

# Supabase Revivor

### Keep your Supabase projects alive with a lightweight daily heartbeat.

<p>
  <img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/Netlify-Scheduled_Functions-00C7B7?logo=netlify&logoColor=white" alt="Netlify">
  <img src="https://img.shields.io/badge/JavaScript-ESM-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript">
</p>

<p>
  <a href="https://github.com/AbdullahSoftDev/Supabase-Revivor">Repository</a> ·
  <a href="https://supabase.com/">Supabase</a> ·
  <a href="https://www.netlify.com/">Netlify</a>
</p>

</div>

---

## ✨ Overview

**Supabase Revivor** is a lightweight, serverless keep-alive utility for Supabase projects.

It uses a **Netlify Scheduled Function** to make a real database request against each configured Supabase project once every day. Each run removes the previous heartbeat and writes a fresh timestamped row to the `keepalive` table.

> 💡 Configure up to **20 Supabase projects** using environment variables — no code changes required.

## 🚀 How It Works

```text
                         ┌─────────────────────┐
                         │   Netlify Scheduler  │
                         │     09:00 UTC Daily  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    keepalive.mjs    │
                         │  Scheduled Function │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
       ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
       │  Supabase 1 │       │  Supabase 2 │       │ ... Project │
       └──────┬──────┘       └──────┬──────┘       └──────┬──────┘
              │                     │                     │
              ▼                     ▼                     ▼
        Delete old row        Delete old row        Delete old row
              │                     │                     │
              ▼                     ▼                     ▼
        Insert fresh ping     Insert fresh ping     Insert fresh ping
```

## ⚡ Features

| Feature | Details |
|---|---|
| 🟢 **Serverless** | Runs entirely through Netlify Functions |
| ⏰ **Scheduled** | Executes automatically every day at 09:00 UTC |
| 🔗 **Multi-project** | Supports up to 20 Supabase projects |
| 🧩 **No code changes** | Add projects through numbered environment variables |
| 🔐 **Key support** | Supports JWT-style and `sb_publishable_` keys |
| 🪶 **Lightweight** | Keeps only a fresh heartbeat row |
| 🛠️ **Simple setup** | SQL + environment variables + Netlify deployment |
| 📊 **Status page** | Includes a minimal service status page |

## 📁 Project Structure

```text
Supabase-Revivor/
│
├── netlify/
│   └── functions/
│       └── keepalive.mjs       # Scheduled Supabase heartbeat
│
├── public/
│   └── index.html              # Service status page
│
├── setup.sql                   # Supabase database setup
├── netlify.toml                # Netlify configuration
└── README.md                   # Documentation
```

## 🧰 Prerequisites

You need:

- A [Netlify](https://www.netlify.com/) account/project.
- One or more [Supabase](https://supabase.com/) projects.
- Access to each project's SQL Editor.
- A suitable Supabase client/anonymous/publishable key.

No Node.js application server or package installation is required.

## 🗄️ Supabase Setup

Run [`setup.sql`](./setup.sql) **once in the SQL Editor of every Supabase project** you want to keep alive.

It creates the following table:

```text
public.keepalive
├── id          bigint (identity, primary key)
├── note        text
└── created_at  timestamptz
```

It also enables Row Level Security and creates the policies required by the keep-alive function.

> ⚠️ **Security:** The supplied policies intentionally allow the `anon` role to select, insert, and delete rows in `keepalive`. Use only a client/publishable or anonymous key for this purpose. Never put a Supabase service-role key into these environment variables.

## 🔐 Environment Variables

Configure your Netlify project using this numbered pattern:

```env
SUPABASE_URL_1=https://your-project.supabase.co
SUPABASE_KEY_1=your-anon-or-publishable-key

SUPABASE_URL_2=https://another-project.supabase.co
SUPABASE_KEY_2=another-anon-or-publishable-key
```

The function also supports:

```env
SUPABASE_PUBLISHABLE_KEY_1=sb_publishable_...
```

You can configure up to:

```text
SUPABASE_URL_20
SUPABASE_KEY_20
```

Missing project numbers are automatically skipped.

## ☁️ Deploy to Netlify

### 1. Connect the repository

Import this GitHub repository into [Netlify](https://www.netlify.com/).

### 2. Add environment variables

Add the required `SUPABASE_URL_n` and `SUPABASE_KEY_n` values in your Netlify project settings.

### 3. Deploy

The included `netlify.toml` configures the project automatically:

```toml
[build]
  publish = "public"

[functions]
  directory = "netlify/functions"
```

Netlify will serve `public/` and discover the scheduled function inside `netlify/functions/`.

## ⏱️ Schedule

The function is configured to run every day at **09:00 UTC**:

```js
export const config = {
  schedule: "0 9 * * *",
};
```

See [`netlify/functions/keepalive.mjs`](./netlify/functions/keepalive.mjs).

## 🔄 Function Behavior

For every configured project, the function performs two REST API operations.

### 1. Delete existing heartbeat rows

```http
DELETE /rest/v1/keepalive?id=gt.0
```

### 2. Insert a fresh heartbeat

```http
POST /rest/v1/keepalive
```

Example payload:

```json
{
  "note": "ping 2026-10-06T09:00:00.000Z"
}
```

The function logs the HTTP status for both operations. If one project fails, its error is logged and the function continues with the remaining projects.

## 🪶 Why Delete the Previous Row?

The table is intentionally kept tiny.

Instead of storing one heartbeat for every day, the function removes the existing records and creates a fresh heartbeat. This produces a real database write while avoiding unnecessary table growth.

## 🟢 Status Page

The repository includes a minimal status page at [`public/index.html`](./public/index.html).

It displays a simple **Keep-Alive Running** status and explains that the scheduled function writes a daily heartbeat to connected Supabase projects.

## ⚙️ Customization

### Change the schedule

Edit the schedule in `netlify/functions/keepalive.mjs`:

```js
export const config = {
  schedule: "0 9 * * *",
};
```

### Support more than 20 projects

The current function defines:

```js
const MAX_PROJECTS = 20;
```

Increase the value if you want to support additional numbered environment variables.

For example:

```js
const MAX_PROJECTS = 50;
```

Then configure `SUPABASE_URL_21`, `SUPABASE_KEY_21`, and so on.

## 🐛 Troubleshooting

### No heartbeat is being written

Check that:

- `keepalive` exists in the target Supabase project.
- `setup.sql` has been executed.
- The Supabase URL is correct.
- The correct numbered key is configured.
- Netlify has access to the environment variables.
- The scheduled function is being invoked.

### A project is skipped

A project is skipped when either its URL or key is missing.

For project 3, configure:

```text
SUPABASE_URL_3
SUPABASE_KEY_3
```

or:

```text
SUPABASE_URL_3
SUPABASE_PUBLISHABLE_KEY_3
```

### Authentication issues

Legacy JWT-style keys beginning with `eyJ` are sent using a Bearer authorization header. New `sb_publishable_` keys are sent without the Bearer header.

## 🧱 Tech Stack

<div align="center">

**JavaScript · Netlify Functions · Netlify Scheduler · Supabase REST API · Supabase PostgreSQL · HTML/CSS**

</div>

## 📜 License

No license file is currently included in the repository.

If you plan to distribute or accept contributions to the project, consider adding an appropriate open-source license.

## 👨‍💻 Author

<div align="center">

### AbdullahSoftDev

[GitHub](https://github.com/AbdullahSoftDev)

⭐ If Supabase Revivor is useful to you, consider starring the repository.

</div>
