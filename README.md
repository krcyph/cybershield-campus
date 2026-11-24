<div align="center">

# CyberShield Campus

**Campus Cybersecurity Awareness & Incident Response Platform**

Empowering students to report cyber threats, analyse suspicious URLs, and test their knowledge — giving campus administrators a unified management and analytics interface.

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-≥18-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)

<br/>

[Overview](#overview) · [Screenshots](#screenshots) · [Features](#features) · [Architecture](#architecture) · [Getting Started](#getting-started) · [API Reference](#api-reference) · [Deployment](#deployment) · [Limitations](#limitations)

</div>

---

## Overview

University campuses are frequent targets for phishing emails, fake internship scams, QR-code fraud, and account compromise attempts. Students lack a structured, campus-aware channel to report incidents or receive timely guidance.

**CyberShield Campus** bridges that gap with a full-stack educational prototype:

- **Students** submit structured incident reports, browse security advisories, analyse suspicious URLs using heuristic rules and campus threat indicators, and test their awareness through an interactive quiz — all with real-time Socket.io notifications.
- **Admins** manage incidents end-to-end, run the advisory lifecycle, curate threat indicators, and monitor platform-wide analytics.

> This is an educational prototype demonstrating full-stack security concepts. It is **not** a production-grade SIEM or commercial threat intelligence platform, and it claims no official university integration or endorsement.

---

## Screenshots

<table>
<tr>
<td align="center" width="50%">
<img src="public/screenshots/student-dashboard.png" alt="Student Dashboard" width="100%"/>
<br/><sub><b>Student Dashboard</b> — Incident history, stats, and quick actions</sub>
</td>
<td align="center" width="50%">
<img src="public/screenshots/incident-report.png" alt="Incident Report Form" width="100%"/>
<br/><sub><b>Incident Reporting</b> — Structured submission form with category selection</sub>
</td>
</tr>
<tr>
<td align="center" width="50%">
<img src="public/screenshots/url-checker.png" alt="URL Risk Checker" width="100%"/>
<br/><sub><b>URL Risk Checker</b> — Heuristic analysis against campus threat indicators</sub>
</td>
<td align="center" width="50%">
<img src="public/screenshots/quiz.png" alt="Cyber Awareness Quiz" width="100%"/>
<br/><sub><b>Cyber Awareness Quiz</b> — 25-question server-scored MCQ with results</sub>
</td>
</tr>
<tr>
<td align="center" width="50%">
<img src="public/screenshots/admin-incidents.png" alt="Admin Incident Management" width="100%"/>
<br/><sub><b>Admin — Incident Management</b> — Triage, update status, add remarks</sub>
</td>
<td align="center" width="50%">
<img src="public/screenshots/admin-analytics.png" alt="Admin Analytics Dashboard" width="100%"/>
<br/><sub><b>Admin — Analytics</b> — Platform-wide incident trends and quiz statistics</sub>
</td>
</tr>
</table>

---

## Features

<table>
<tr>
<td valign="top" width="50%">

### Student Portal

| Feature | Description |
|---|---|
| **Authentication** | JWT-based login and registration with role-aware routing |
| **Incident Reporting** | Submit phishing, scam, account compromise, impersonation, and other incident types |
| **Security Advisories** | Browse campus IT advisories with full content and severity indicators |
| **URL Risk Checker** | Heuristic analysis against pattern rules and campus threat indicators (no outbound requests) |
| **Cyber Awareness Quiz** | 25-question server-scored MCQ — phishing, MFA, passwords, social engineering |
| **Quiz History** | Review past attempts, scores, and correct-answer explanations |
| **Leaderboard** | View top performers ranked by best quiz score |
| **Personal Analytics** | Incident submission history and quiz performance charts |
| **Real-time Notifications** | Socket.io alerts for incident updates and new advisories — unread badge, dropdown, mark-read |

</td>
<td valign="top" width="50%">

### Admin Panel

| Feature | Description |
|---|---|
| **Incident Management** | Search, filter, update status/severity, add remarks, and delete across all reports |
| **Advisory Lifecycle** | Create, edit, publish, archive, and delete advisories (Draft → Published) |
| **Threat Indicators** | Add and remove campus-specific suspicious domains used by the URL checker engine |
| **Platform Analytics** | Campus-wide incident trends, severity/category breakdowns, student count, and quiz stats |
| **Role Authorization** | All admin routes are JWT-role-gated on the backend — the frontend cannot bypass enforcement |

</td>
</tr>
</table>

---

## Architecture

```mermaid
graph TD
    subgraph Browser["Browser — Next.js 16 (App Router)"]
        UI["React UI / Tailwind CSS"]
        MW["Edge Middleware (proxy.ts)\nRoute protection via cs_token cookie"]
        SIO_C["Socket.io Client"]
        AUTH_C["AuthProvider + useAuth"]
        NOTIF["NotificationProvider"]
    end

    subgraph Backend["Backend — Express + TypeScript"]
        API["REST API  /api/*"]
        SIO_S["Socket.io Server"]
        CTRL["Controllers\nauth · incidents · advisories\nindicators · quiz · analytics · url-checker"]
        MDLW["Middleware\nJWT authenticate · authorize(role)\nhelmet · CORS · rate-limit · validator"]
    end

    DB[("MongoDB Atlas\nUsers · Incidents · Advisories\nThreatIndicators · QuizAttempts")]

    UI -- "REST — Authorization: Bearer JWT" --> API
    SIO_C -- "WebSocket — handshake.auth.token" --> SIO_S
    API --> CTRL --> MDLW --> DB
    SIO_S -- "incident:statusUpdated\nadvisory:published\nnotification:new" --> SIO_C
    SIO_C --> NOTIF --> UI
    AUTH_C --> UI
    MW -. "redirect /login\nif no cookie" .-> UI
```

---

## Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 18.0.0 |
| npm | ≥ 9.0.0 |
| MongoDB | Atlas (cloud) or local ≥ 6 |

### 1 — Clone and install

```bash
git clone https://github.com/<your-username>/cybershield-campus.git
cd cybershield-campus

npm install                           # Frontend dependencies
cd backend && npm install && cd ..    # Backend dependencies
```

### 2 — Configure environment variables

```bash
cp .env.example .env.local            # Frontend
cp backend/.env.example backend/.env  # Backend
```

Fill in values as described in the [Environment Variables](#environment-variables) section.

### 3 — Start development servers

```bash
# Terminal 1 — Backend (Express on port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (Next.js on port 3000)
npm run dev
```

### 4 — Seed the admin account *(first run only)*

```bash
cd backend
npm run seed:admin
```

> Ensure `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FULL_NAME`, and `MONGODB_URI` are set in `backend/.env` before running.

---

## Environment Variables

### Frontend — `.env.local`

| Variable | Required | Description | Example |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend REST API base URL | `http://localhost:5000/api` |
| `NEXT_PUBLIC_WS_URL` | ✅ | Backend WebSocket URL for Socket.io | `ws://localhost:5000` |

### Backend — `backend/.env`

| Variable | Required | Description | Example |
|---|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/cybershield` |
| `JWT_SECRET` | ✅ | Random string ≥ 32 characters | `replace_with_64_char_random_string` |
| `JWT_EXPIRES_IN` | ❌ | Token expiry (default: `7d`) | `7d` |
| `PORT` | ❌ | HTTP server port (default: `5000`) | `5000` |
| `FRONTEND_URL` | ❌ | Allowed CORS origin (default: `http://localhost:3000`) | `https://cybershield.vercel.app` |
| `NODE_ENV` | ❌ | Runtime environment | `production` |
| `ADMIN_EMAIL` | Seed only | Admin email for seed script | `admin@college.edu.in` |
| `ADMIN_PASSWORD` | Seed only | Admin password for seed script | `Strong_Password_123!` |
| `ADMIN_FULL_NAME` | Seed only | Admin display name | `Campus IT Admin` |

> **Never commit real `.env` or `.env.local` files.** Only `.env.example` files are tracked in version control.

---

## API Reference

<details>
<summary>Expand full API documentation</summary>

All endpoints are prefixed with `/api`. Protected endpoints require `Authorization: Bearer <token>`.

### Authentication — `/api/auth`

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new student account |
| `POST` | `/api/auth/login` | Public | Authenticate and receive a signed JWT |
| `GET` | `/api/auth/me` | Authenticated | Get the current user's profile |

### Incidents — `/api/incidents`

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/incidents` | Student / Admin | Submit a new incident report |
| `GET` | `/api/incidents/my` | Student | Get own incident history (paginated) |
| `GET` | `/api/incidents/:id` | Student / Admin | Get a single incident |
| `GET` | `/api/incidents` | Admin | Get all incidents (paginated, filterable) |
| `PATCH` | `/api/incidents/:id` | Admin | Update status, severity, and/or admin remarks |
| `DELETE` | `/api/incidents/:id` | Admin | Permanently delete an incident |

### Advisories — `/api/advisories`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/advisories` | Student / Admin | List advisories (students: Published only) |
| `GET` | `/api/advisories/:id` | Student / Admin | Get a single advisory by ID |
| `POST` | `/api/advisories` | Admin | Create an advisory (starts as Draft) |
| `PATCH` | `/api/advisories/:id` | Admin | Update advisory fields or status |
| `DELETE` | `/api/advisories/:id` | Admin | Delete an advisory |

### Threat Indicators — `/api/indicators`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/indicators/check?url=<url>` | Student / Admin | Check a URL against campus indicators |
| `GET` | `/api/indicators` | Admin | List all stored threat indicators |
| `POST` | `/api/indicators` | Admin | Add a suspicious domain or URL indicator |
| `DELETE` | `/api/indicators/:id` | Admin | Remove a threat indicator |

### URL Checker — `/api/url-checker`

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/url-checker/analyze` | Student / Admin | Heuristic risk analysis of a submitted URL |

### Quiz — `/api/quiz`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/quiz/questions` | Student / Admin | Fetch questions without answers (`?category=` / `?difficulty=`) |
| `POST` | `/api/quiz/submit` | Student / Admin | Submit answers — server scores and records the attempt |
| `GET` | `/api/quiz/my-attempts` | Student / Admin | Get own attempt history |
| `GET` | `/api/quiz/leaderboard` | Student / Admin | Get top performers ranked by best score |

### Analytics — `/api/analytics`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/analytics/dashboard` | Student / Admin | Role-aware statistics (admin: platform-wide; student: personal) |

### Health

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Server health check — returns status, environment, and timestamp |

</details>

---

## Security Highlights

| Measure | Implementation |
|---|---|
| **JWT Authentication** | Signed tokens for session-less, stateless auth across REST and WebSocket |
| **Password Hashing** | `bcryptjs` with per-user salt rounds |
| **Role-based Authorization** | `authorize('admin')` middleware gates all admin routes server-side |
| **Input Validation** | `express-validator` chains on all mutation endpoints |
| **HTTP Security Headers** | `helmet` with cross-origin resource policy |
| **CORS Lockdown** | Locked to `FRONTEND_URL` — wildcard origin never permitted |
| **Rate Limiting** | Global: 200 req / 15 min / IP · Auth: 10 req / 15 min / IP |
| **Request Body Cap** | `express.json({ limit: '10kb' })` |
| **Server-side Quiz Scoring** | Correct answers never sent to the client before or during a quiz attempt |
| **Socket.io JWT Auth** | Room membership derived exclusively from verified JWT — clients cannot join arbitrary rooms |

---

## Deployment

### MongoDB Atlas

1. Create a free M0 cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
2. Create a database user with read/write access to the `cybershield` database.
3. Add `0.0.0.0/0` under **Network Access** (or Render's static outbound IPs).
4. Copy the connection string: `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/cybershield?retryWrites=true&w=majority`

### Backend — Render (Web Service)

| Setting | Value |
|---|---|
| **Root Directory** | `backend` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node dist/server.js` |
| **Node Version** | 18 or 20 |
| `MONGODB_URI` | Atlas connection string |
| `JWT_SECRET` | Long random secret (≥ 32 chars) |
| `FRONTEND_URL` | Your Vercel URL, e.g. `https://cybershield.vercel.app` |
| `NODE_ENV` | `production` |

After first deploy, run the admin seed from Render's **Shell** tab: `npm run seed:admin`

> `PORT` is injected automatically by Render — do not set it manually.

### Frontend — Vercel

| Setting | Value |
|---|---|
| **Root Directory** | `.` (repo root) |
| **Framework Preset** | Next.js |
| **Build Command** | `npm run build` |
| `NEXT_PUBLIC_API_URL` | `https://<your-render-service>.onrender.com/api` |
| `NEXT_PUBLIC_WS_URL` | `https://<your-render-service>.onrender.com` |

---

## Limitations

| Limitation | Detail |
|---|---|
| **Heuristic URL checker only** | Pattern matching and campus indicator lookups — no external threat feeds, DNS, or WHOIS queries. A "Low" result does **not** confirm a URL is safe. |
| **In-memory notifications** | Socket.io notifications are session-only. Refreshing the page clears all received notifications. |
| **No email verification** | Any email address can register — no institutional domain restriction. |
| **No automated test suite** | No unit, integration, or end-to-end tests are included. |
| **Manual admin provisioning** | Admin accounts require the `seed:admin` script — there is no self-service admin registration. |
| **JWT in localStorage** | Pragmatic for a campus demo. Consider HttpOnly cookies for higher-security deployments. |
| **Indicator toggle is UI-only** | The active/inactive toggle on the admin indicators page is a client-side overlay and resets on page refresh. |

> This platform does not replace professional cybersecurity tooling. Treat all analysis results as informational guidance only.

---

## Future Enhancements

- Institutional email domain validation at registration (e.g. restrict to `@college.edu.in`)
- Persistent notifications stored in MongoDB with read/unread state
- HttpOnly cookie–based JWT storage for higher-security deployments
- Integration with external threat intelligence feeds (VirusTotal, Google Safe Browsing)
- Automated test suite (Jest + Supertest)
- Email notifications for critical incident status updates
- Expanded quiz question bank with per-attempt randomisation
- Two-factor authentication (TOTP) for admin accounts
- CSV / PDF export of incident reports and analytics

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push and open a Pull Request.

Please follow the existing TypeScript conventions and ensure `npm run lint` passes with no new errors.

---

## Acknowledgements

[Next.js](https://nextjs.org/) · [Express](https://expressjs.com/) · [MongoDB Atlas](https://www.mongodb.com/atlas) · [Socket.io](https://socket.io/) · [Tailwind CSS](https://tailwindcss.com/) · [Recharts](https://recharts.org/) · [Lucide React](https://lucide.dev/) · [helmet](https://helmetjs.github.io/) · [shields.io](https://shields.io/)

---

## License

No license has been specified for this project. All rights are reserved by the author(s) unless a license file is added.

---

<div align="center">

Built with TypeScript · Next.js · Express · MongoDB

</div>
