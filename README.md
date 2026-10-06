# Supabase Revivor

> A lightweight Netlify scheduled function that keeps multiple Supabase projects active by writing a daily heartbeat row.

[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Netlify](https://img.shields.io/badge/Netlify-Functions-00C7B7?logo=netlify&logoColor=white)](https://www.netlify.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ESM-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

## Overview

**Supabase Revivor** is a small, serverless keep-alive utility for Supabase projects.

It uses a **Netlify Scheduled Function** to periodically make a real database request against each configured Supabase project. Every scheduled run:

1. Deletes the existing rows from the `keepalive` table.
2. Inserts a new row containing the current timestamp.
3. Repeats the process for every configured Supabase project.

The project supports **up to 20 Supabase projects** without requiring changes to the function code.

## How It Works

```text
                Netlify Scheduler
                       │
                       │  Daily at 09:00 UTC
                       ▼
             keepalive.mjs function
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
     Supabase 1   Supabase 2   ... Supabase 20
          │            │
          ▼            ▼
    DELETE old     DELETE old
       rows           rows
          │            │
          ▼            ▼
    INSERT ping     INSERT ping
```

Each project is configured through environment variables using the numbered pattern:

```text
SUPABASE_URL_1
SUPABASE_KEY_1

SUPABASE_URL_2
SUPABASE_KEY_2

...
```

Missing project numbers are simply skipped.

## Features

- **Serverless** — runs as a Netlify Function with no dedicated server.
- **Scheduled execution** — automatically runs once per day at 09:00 UTC.
- **Multi-project support** — supports up to 20 Supabase projects.
- **Zero code changes for new projects** — add another numbered environment-variable pair.
- **Works with Supabase keys** — supports legacy JWT-style keys and newer `sb_publishable_` keys.
- **Minimal storage** — removes previous heartbeat data before inserting the new ping.
- **Simple setup** — one SQL script and environment variables are enough.
- **Static status page** — includes a small public page confirming that the keep-alive service is running.

## Project Structure

```text
Supabase-Revivor/
├── netlify/
│   └── functions/
│       └── keepalive.mjs       # Scheduled Supabase heartbeat function
├── public/
│   └── index.html              # Simple service status page
├── setup.sql                   # Database setup for each Supabase project
├── netlify.toml                # Netlify build/function configuration
└── README.md
```

## Prerequisites

You need:

- A [Netlify](https://www.netlify.com/) account/project.
- One or more [Supabase](https://supabase.com/) projects.
- Access to each project's SQL Editor.
- A suitable Supabase client key for the REST API.

No Node.js application server or package installation is required by this repository.

## Supabase Setup

Run the contents of **`setup.sql` once in the SQL Editor of every Supabase project you want to keep alive**.

The script creates:

```text
public.keepalive
├── id          bigint (identity, primary key)
├── note        text
└── created_at  timestamptz
```

It also enables Row Level Security and creates policies required by the keep-alive function.

### SQL

The repository already contains the complete setup in [`setup.sql`](./setup.sql).

> **Security note:** The included policies intentionally allow the `anon` role to select, insert, and delete rows in the `keepalive` table. Only use the supplied client/publishable or anon key for this purpose, and avoid putting service-role or other privileged secrets into the environment variables.

## Environment Variables

Configure your Netlify project's environment variables using the following pattern:

| Variable | Description |
|---|---|
| `SUPABASE_URL_1` | URL of Supabase project 1 |
| `SUPABASE_KEY_1` | Key for Supabase project 1 |
| `SUPABASE_URL_2` | URL of Supabase project 2 |
| `SUPABASE_KEY_2` | Key for Supabase project 2 |
| `...` | Continue up to project 20 |
| `SUPABASE_URL_20` | URL of Supabase project 20 |
| `SUPABASE_KEY_20` | Key for Supabase project 20 |

The function also accepts:

```text
SUPABASE_PUBLISHABLE_KEY_n
```

as an alternative to `SUPABASE_KEY_n`.

For example:

```text
SUPABASE_URL_1=https://your-project.supabase.co
SUPABASE_KEY_1=your-anon-or-publishable-key

SUPABASE_URL_2=https://another-project.supabase.co
SUPABASE_KEY_2=another-anon-or-publishable-key
```

You do not need to define all 20 projects.

## Deploy to Netlify

### 1. Connect the repository

Import this GitHub repository into Netlify.

### 2. Configure environment variables

Add the required `SUPABASE_URL_n` and `SUPABASE_KEY_n` values in your Netlify project's environment variables.

### 3. Deploy

The included `netlify.toml` configures:

```toml
[build]
  publish = "public"

[functions]
  directory = "netlify/functions"
```

Netlify will serve the contents of `public/` and discover the scheduled function in `netlify/functions/`.

## Schedule

The function is configured with:

```js
export const config = {
  schedule: "0 9 * * *",
};
```

This means it runs **every day at 09:00 UTC**.

The schedule is defined in [`netlify/functions/keepalive.mjs`](./netlify/functions/keepalive.mjs).

## Function Behavior

For each configured project, the function calls the Supabase REST API:

### 1. Delete existing heartbeat rows

```http
DELETE /rest/v1/keepalive?id=gt.0
```

### 2. Insert a new heartbeat

```http
POST /rest/v1/keepalive
```

with a payload similar to:

```json
{
  "note": "ping 2026-10-06T09:00:00.000Z"
}
```

The function logs the HTTP status of both operations for each project.

If one project fails, the function catches the error and continues processing the remaining configured projects.

## Why Delete the Previous Row?

The keep-alive table is intentionally kept extremely small.

Instead of accumulating one record per day, the function removes the existing records and creates a single fresh heartbeat record. This keeps the table lightweight while still producing a database write during every scheduled run.

## Status Page

The repository includes a minimal status page at `public/index.html`.

It displays:

> 🟢 Keep-Alive Running

along with a short explanation that the scheduled function writes a heartbeat to connected Supabase projects.

## Customization

### Change the schedule

Edit the schedule in `netlify/functions/keepalive.mjs`:

```js
export const config = {
  schedule: "0 9 * * *",
};
```

The current value is daily at 09:00 UTC.

### Support more than 20 projects

The function currently defines:

```js
const MAX_PROJECTS = 20;
```

Increase this value if you want the function to inspect additional numbered environment-variable pairs.

For example:

```js
const MAX_PROJECTS = 50;
```

Then configure `SUPABASE_URL_21`, `SUPABASE_KEY_21`, and so on.

## Troubleshooting

### No heartbeat is being written

Check:

- The `keepalive` table exists in the target Supabase project.
- `setup.sql` was executed in that project.
- The Supabase URL is correct.
- The key is configured under the correct numbered environment variable.
- The Netlify deployment has access to the environment variables.
- The function is being invoked by Netlify's scheduler.

### A project is being skipped

The function skips a project when its URL or key is missing.

For project `3`, make sure both are configured:

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

Legacy JWT-style keys beginning with `eyJ` are sent with a Bearer authorization header. New `sb_publishable_` keys are sent without the Bearer header.

## Tech Stack

- **JavaScript (ES Modules)**
- **Netlify Functions**
- **Netlify Scheduled Functions**
- **Supabase REST API**
- **Supabase PostgreSQL**
- **HTML/CSS**

## License

No license file is currently included in the repository.

If you plan to make the project open source for reuse, consider adding an appropriate license.

## Author

**AbdullahSoftDev**

GitHub: [@AbdullahSoftDev](https://github.com/AbdullahSoftDev)

---

If this project is useful to you, consider giving the repository a ⭐ on GitHub.
