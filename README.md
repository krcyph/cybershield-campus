<div align="center">

# 🛡️ CyberShield Campus

**Campus Cybersecurity Awareness & Incident Response Platform**

A full-stack web application that empowers students to report cyber threats, analyse suspicious URLs, test their knowledge, and receive real-time security alerts — giving campus IT administrators a unified management and analytics interface.

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

[Overview](#-overview) · [Features](#-features) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [API Reference](#-api-reference) · [Deployment](#-deployment) · [Limitations](#-limitations)

</div>

---

## 📌 Overview

University campuses are high-value targets for phishing emails, fake internship scams, QR-code fraud, impersonation attacks, and account compromise attempts. Students are frequently targeted, yet most lack a structured, campus-aware channel to report incidents or receive timely guidance.

**CyberShield Campus** bridges that gap:

- **Students** get a guided interface to submit incident reports, browse security advisories published by their IT team, check suspicious URLs against heuristic rules and campus threat indicators, and test their awareness through an interactive quiz — all with real-time Socket.io notifications.

- **Admins** get a full management panel to review and triage incidents, manage the advisory lifecycle, curate campus threat indicators, and monitor platform-wide analytics.

The platform is an educational prototype built to demonstrate full-stack security concepts. It is **not** a production-grade commercial SIEM or threat intelligence platform.

---

## ✨ Features

### Student Portal

| Feature | Description |
|---|---|
| **Incident Reporting** | Submit structured reports for phishing, suspicious URLs, fake internship offers, account compromise, payment/QR scams, impersonation, and more |
| **Security Advisories** | Browse published threat intelligence advisories from campus administrators |
| **URL Risk Checker** | Heuristic analysis of suspicious URLs against pattern rules and campus threat indicators (no outbound network requests) |
| **Cyber Awareness Quiz** | 25-question server-scored MCQ covering phishing, social engineering, password security, MFA, and safe browsing — with difficulty levels and category filters |
| **Leaderboard** | View top performers by best quiz score across the platform |
| **Attempt History** | Review own quiz attempts, scores, and correct-answer explanations |
| **Personal Analytics** | Dashboard showing own incident submission history and quiz performance over time |
| **Real-time Notifications** | Instant Socket.io alerts when an admin updates your incident or publishes a new advisory — with unread count badge, dropdown panel, mark-all-read, and clear-all |

### Admin Panel

| Feature | Description |
|---|---|
| **Incident Management** | View, search, filter, update status/severity, add admin remarks, and delete incident reports across all students |
| **Advisory Management** | Create, edit, publish, archive, and delete advisories with a **Draft → Published** lifecycle |
| **Threat Indicators** | Add and remove campus-specific suspicious domains and URLs used by the URL checker engine |
| **Platform Analytics** | Campus-wide incident trends, severity and category breakdowns, registered student count, and quiz statistics |

---

## 🖼️ Screenshots

> **No application screenshots are currently included in this repository.**
>
> To add screenshots, capture your running application and place image files in the `public/screenshots/` directory, then replace each placeholder below with the correct relative path.
>
> Suggested captures:
> - `student-dashboard.png` — Student dashboard overview
> - `incident-report.png` — Incident submission form
> - `url-checker.png` — URL risk analysis result
> - `quiz.png` — Quiz in progress and results page
> - `admin-incidents.png` — Admin incident management table
> - `admin-analytics.png` — Admin analytics dashboard

<details>
<summary>Screenshot placeholders (expand to see suggested layout)</summary>

```
<!-- Student Dashboard -->
<img src="public/screenshots/student-dashboard.png" alt="Student Dashboard" width="49%"/>

<!-- Incident Report -->
<img src="public/screenshots/incident-report.png" alt="Incident Report Form" width="49%"/>

<!-- URL Checker -->
<img src="public/screenshots/url-checker.png" alt="URL Risk Checker" width="49%"/>

<!-- Quiz -->
<img src="public/screenshots/quiz.png" alt="Cyber Awareness Quiz" width="49%"/>

<!-- Admin Incidents -->
<img src="public/screenshots/admin-incidents.png" alt="Admin Incident Management" width="49%"/>

<!-- Admin Analytics -->
<img src="public/screenshots/admin-analytics.png" alt="Admin Analytics Dashboard" width="49%"/>
```

</details>

---

## 🏗️ Architecture

```mermaid
graph TD
    subgraph Browser["Browser — Next.js 16 (App Router)"]
        UI["React UI / Tailwind CSS"]
        MW["Edge Middleware (proxy.ts)\nRoute protection via cs_token cookie"]
        SIO_C["Socket.io Client\n(lib/socket.ts singleton)"]
        AUTH_C["AuthProvider + useAuth\n(lib/auth.tsx)"]
        NOTIF["NotificationProvider\n(lib/notifications.tsx)"]
    end

    subgraph Backend["Backend — Express + TypeScript"]
        API["REST API\n/api/*"]
        SIO_S["Socket.io Server\n(socketServer.ts)"]
        NOTIF_SVC["notificationService.ts\nTyped emit helpers"]
        CTRL["Controllers\nauth · incidents · advisories\nindicators · quiz · analytics · url-checker"]
        MDLW["Middleware\nJWT authenticate · authorize(role)\nhelmet · CORS · rate-limit · validator"]
    end

    DB[("MongoDB Atlas\nUsers · Incidents · Advisories\nThreatIndicators · QuizAttempts")]

    UI -- "REST (HTTP/HTTPS)\nAuthorization: Bearer JWT" --> API
    SIO_C -- "WebSocket\nhandshake.auth.token (JWT)" --> SIO_S
    API --> CTRL
    CTRL --> MDLW
    CTRL --> DB
    SIO_S -- "JWT auth\nServer-assigned rooms" --> NOTIF_SVC
    NOTIF_SVC -- "incident:statusUpdated\nadvisory:published\nnotification:new" --> SIO_C
    SIO_C --> NOTIF
    AUTH_C --> UI
    NOTIF --> UI
```

**Key design decisions:**

| Decision | Detail |
|---|---|
| **JWT storage** | Stored in `localStorage` (key: `cs_token`) and mirrored to a `SameSite=Lax` cookie so the Next.js Edge middleware can read it without decoding |
| **Room security** | Socket.io room membership is derived exclusively from the verified JWT — clients cannot join or request arbitrary rooms |
| **Quiz integrity** | Scoring is fully server-side; correct answers are never sent to the client before or during question fetch |
| **CORS lockdown** | CORS is locked to the exact value of `FRONTEND_URL`; a wildcard origin is never permitted |
| **URL analysis** | The URL checker performs entirely local, static analysis — it never makes outbound requests to the submitted URL |

---

## 🗂️ Project Structure

```
cybershield-campus/
│
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (AuthProvider, NotificationProvider)
│   ├── page.tsx                  # Landing page
│   ├── login/                    # Login page
│   ├── register/                 # Student registration page
│   ├── dashboard/                # Student dashboard
│   ├── incidents/                # Incident reporting and history
│   ├── advisories/               # Security advisory browser
│   ├── url-checker/              # URL risk analyser
│   ├── cyber-quiz/               # Quiz (fetch → answer → submit → results)
│   ├── analytics/                # Analytics dashboard (role-aware)
│   ├── profile/                  # User profile
│   └── admin/                    # Admin-only pages (backend token-gated)
│       ├── dashboard/
│       ├── incidents/
│       ├── advisories/
│       └── indicators/
│
├── components/                   # Shared React components
│   ├── DashboardLayout.tsx       # Sidebar + Header layout wrapper
│   ├── Header.tsx                # App header with notification bell
│   ├── Sidebar.tsx               # Navigation sidebar
│   ├── NotificationBell.tsx      # Real-time notification bell and dropdown
│   ├── Badges.tsx                # SeverityBadge, StatusBadge, RiskBadge
│   └── StatCard.tsx              # Dashboard stat card
│
├── lib/                          # Utility modules
│   ├── api.ts                    # Centralised fetch client (JWT attachment, 401 handling)
│   ├── auth.tsx                  # AuthProvider + useAuth hook
│   ├── notifications.tsx         # NotificationProvider + useNotifications hook
│   ├── socket.ts                 # Socket.io client singleton with reconnection backoff
│   └── utils.ts                  # formatDate, severityColor, getInitials, truncate …
│
├── types/
│   └── index.ts                  # Shared TypeScript types (backend-aligned)
│
├── data/                         # Legacy stub files (not active data sources)
├── public/                       # Static assets
├── proxy.ts                      # Next.js Edge middleware (route protection)
├── .env.example                  # Frontend environment variable template
├── next.config.ts
└── tsconfig.json

backend/
├── src/
│   ├── server.ts                 # HTTP server + Socket.io attachment
│   ├── app.ts                    # Express app (CORS, routes, global error handler)
│   ├── config/
│   │   ├── env.ts                # Environment variable validation
│   │   └── database.ts           # MongoDB connection
│   ├── controllers/              # Route handler logic
│   │   ├── authController.ts
│   │   ├── incidentController.ts
│   │   ├── advisoryController.ts
│   │   ├── indicatorController.ts
│   │   ├── urlCheckerController.ts
│   │   ├── quizController.ts
│   │   └── analyticsController.ts
│   ├── middleware/
│   │   └── auth.ts               # JWT authenticate + authorize middleware
│   ├── models/                   # Mongoose schemas
│   │   ├── User.ts
│   │   ├── Incident.ts
│   │   ├── Advisory.ts
│   │   ├── ThreatIndicator.ts
│   │   └── QuizAttempt.ts
│   ├── routes/                   # Express routers
│   │   ├── auth.ts
│   │   ├── incidentRoutes.ts
│   │   ├── advisoryRoutes.ts
│   │   ├── indicatorRoutes.ts
│   │   ├── urlCheckerRoutes.ts
│   │   ├── quizRoutes.ts
│   │   └── analyticsRoutes.ts
│   ├── socket/
│   │   ├── socketServer.ts       # Socket.io server init + JWT auth middleware
│   │   └── notificationService.ts # Typed emit helpers
│   ├── data/
│   │   └── quizQuestions.ts      # Authoritative 25-question dataset (never sent raw)
│   └── utils/
│       ├── AppError.ts           # Custom error class + global error handler
│       ├── jwt.ts                # JWT sign/verify helpers
│       ├── validation.ts         # express-validator chains
│       ├── urlAnalyzer.ts        # Heuristic URL risk analysis engine
│       └── seedAdmin.ts          # One-time admin account seed script
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Minimum version |
|---|---|
| Node.js | 18.0.0 |
| npm | 9.0.0 |
| MongoDB | Atlas (cloud) or local ≥ 6 |

### 1 — Clone and install

```bash
git clone https://github.com/<your-org>/cybershield-campus.git
cd cybershield-campus

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..
```

### 2 — Configure environment variables

```bash
# Frontend
cp .env.example .env.local

# Backend
cp backend/.env.example backend/.env
```

Fill in the values as described in the [Environment Variables](#-environment-variables) section below.

### 3 — Start development servers

Open two terminals:

**Terminal 1 — Backend (Express on port 5000):**

```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend (Next.js on port 3000):**

```bash
npm run dev
```

### 4 — Seed the admin account *(first run only)*

```bash
cd backend
npm run seed:admin
```

See [Admin Account Setup](#-admin-account-setup) for what this script does and when to re-run it.

---

## ⚙️ Environment Variables

### Frontend — `.env.local`

| Variable | Required | Description | Example |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend REST API base URL | `http://localhost:5000/api` |
| `NEXT_PUBLIC_WS_URL` | ✅ | Backend WebSocket URL for Socket.io | `http://localhost:5000` |

> Both variables must be prefixed with `NEXT_PUBLIC_` to be accessible in browser code. For production use `https://` for both — the Socket.io client upgrades the protocol automatically.

### Backend — `backend/.env`

| Variable | Required | Description | Example |
|---|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/cybershield` |
| `JWT_SECRET` | ✅ | Random string ≥ 32 characters for signing JWTs | `replace_with_64_char_random_string` |
| `JWT_EXPIRES_IN` | ❌ | Token expiry duration (default: `7d`) | `7d` |
| `PORT` | ❌ | HTTP server port (default: `5000`) | `5000` |
| `FRONTEND_URL` | ❌ | Allowed CORS origin (default: `http://localhost:3000`) | `https://cybershield.vercel.app` |
| `NODE_ENV` | ❌ | Runtime environment | `production` |
| `ADMIN_EMAIL` | Seed only | Admin account email used by the seed script | `admin@college.edu.in` |
| `ADMIN_PASSWORD` | Seed only | Admin account password used by the seed script | `Strong_Password_123!` |
| `ADMIN_FULL_NAME` | Seed only | Admin display name (default: `Campus IT Admin`) | `Campus IT Admin` |

> ⚠️ **Never commit real `.env` or `.env.local` files.** Only `.env.example` files are tracked in version control. `.gitignore` excludes all actual environment files.

---

## 🔐 Admin Account Setup

The public registration endpoint (`POST /api/auth/register`) creates **student** accounts only. Admin accounts must be provisioned via the seed script.

```bash
cd backend
# Ensure ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FULL_NAME and MONGODB_URI are set in .env
npm run seed:admin
```

**What the script does:**

- Connects to MongoDB using `MONGODB_URI`.
- Creates a new admin user if the email does not already exist.
- If an account with that email already exists as a student, it promotes it to admin.
- If an admin account already exists with that email, it makes no changes.

**Security notes:**

- The seed script is accessible only via direct shell access — it has no HTTP endpoint.
- Rotate the admin password after first login by updating `ADMIN_PASSWORD` in `.env` and re-running the seed, or by updating the hash directly in MongoDB.

---

## 📡 API Reference

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
| `GET` | `/api/incidents/:id` | Student / Admin | Get a single incident (students see own only) |
| `GET` | `/api/incidents` | Admin | Get all incidents (paginated, filterable by status/severity) |
| `PATCH` | `/api/incidents/:id` | Admin | Update incident status, severity, and/or admin remarks |
| `DELETE` | `/api/incidents/:id` | Admin | Permanently delete an incident |

### Advisories — `/api/advisories`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/advisories` | Student / Admin | List advisories (students: Published only; admins: all) |
| `GET` | `/api/advisories/:id` | Student / Admin | Get a single advisory by ID |
| `POST` | `/api/advisories` | Admin | Create an advisory (always starts as Draft) |
| `PATCH` | `/api/advisories/:id` | Admin | Update advisory fields or status |
| `DELETE` | `/api/advisories/:id` | Admin | Delete an advisory |

### Threat Indicators — `/api/indicators`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/indicators/check?url=<url>` | Student / Admin | Check whether a URL matches any campus threat indicator |
| `GET` | `/api/indicators` | Admin | List all stored threat indicators |
| `POST` | `/api/indicators` | Admin | Add a new suspicious domain or URL indicator |
| `DELETE` | `/api/indicators/:id` | Admin | Permanently remove a threat indicator |

### URL Checker — `/api/url-checker`

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/url-checker/analyze` | Student / Admin | Heuristic risk analysis of a submitted URL |

### Quiz — `/api/quiz`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/quiz/questions` | Student / Admin | Fetch questions without correct answers (supports `?category=` and `?difficulty=` query params) |
| `POST` | `/api/quiz/submit` | Student / Admin | Submit answers; server scores and records the attempt |
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

---

## 🔒 Security

### JWT Authentication Flow

1. `POST /api/auth/login` returns a signed JWT containing the user's `id` and `role`.
2. The frontend stores it in `localStorage` (key: `cs_token`) and mirrors it to a `SameSite=Lax` cookie so the Next.js Edge middleware (`proxy.ts`) can protect routes server-side.
3. All protected API requests include `Authorization: Bearer <token>`.
4. The backend `authenticate` middleware verifies and decodes the JWT on every request.
5. The `authorize('admin')` middleware checks the decoded role for admin-only routes.

### Role Capabilities

| Role | Capabilities |
|---|---|
| `student` | Report incidents · View own incidents · Read published advisories · Analyse URLs · Take quiz · View personal analytics · Receive real-time notifications |
| `admin` | All student capabilities · Manage all incidents (update/delete) · Full advisory lifecycle · Manage threat indicators · View platform-wide analytics |

### Security Measures

| Measure | Implementation |
|---|---|
| **Password hashing** | `bcryptjs` with per-user salt rounds |
| **HTTP security headers** | `helmet` with cross-origin resource policy |
| **CORS** | Locked to `FRONTEND_URL`; wildcard origin never permitted |
| **Rate limiting** | Global: 200 req / 15 min / IP · Auth endpoints: 10 req / 15 min / IP |
| **Input validation** | `express-validator` chains on all mutation endpoints |
| **Request body size** | Capped at 10 KB (`express.json({ limit: '10kb' })`) |
| **WebSocket rooms** | Server-assigned from verified JWT; clients cannot join arbitrary rooms |
| **Quiz scoring** | Fully server-side; correct answers never sent to client |

### Frontend Route Protection

`proxy.ts` (Next.js Edge middleware) checks for the `cs_token` cookie on every request:

- Protected paths (`/dashboard`, `/incidents`, `/advisories`, `/url-checker`, `/cyber-quiz`, `/analytics`, `/admin/*`) redirect to `/login?from=<path>` when no token is present.
- `/login` and `/register` redirect to `/dashboard` when a token is already present.
- Admin-role enforcement is handled exclusively by the backend — the Edge middleware does not decode the JWT to gate `/admin/*` routes.

---

## 🔔 Real-time Notifications (Socket.io)

The Socket.io server runs on the **same port** as the HTTP server — no separate WebSocket port is required.

### Authentication

Clients must pass a valid JWT in `socket.handshake.auth.token`. The server verifies the token and assigns rooms — clients cannot join rooms directly.

### Server-Assigned Rooms

| Room | Members | Purpose |
|---|---|---|
| `user:{mongoId}` | One specific user | Targeted personal notifications (e.g. incident status updates) |
| `students` | All connected students | Advisory publication broadcasts |
| `admins` | All connected admins | Reserved for future admin-only broadcast events |

### Events Emitted by Backend

| Event | Recipient | Trigger |
|---|---|---|
| `incident:statusUpdated` | Reporter's `user:{id}` room | Admin updates the status of an incident |
| `advisory:published` | `students` room | Admin transitions an advisory from Draft to Published |
| `notification:new` | Same rooms as the specific event | Emitted alongside every specific event above |

### Frontend Behaviour

- `lib/socket.ts` manages a singleton Socket.io connection with automatic reconnection backoff.
- `lib/notifications.tsx` (`NotificationProvider`) connects when a user authenticates and disconnects on logout. It listens to `notification:new` to avoid double-counting alongside specific events.
- `components/NotificationBell.tsx` shows the unread count, a dropdown panel, mark-all-read, and clear-all.

> **Important:** Notifications are **in-memory only** for the duration of the browser session. There is no notification persistence — refreshing the page clears all received notifications.

---

## 🧪 Testing

No automated test suite is currently included. The following manual verification checklist covers the core flows:

<details>
<summary>Manual test checklist</summary>

**Authentication**
- [ ] Register a new student account and verify JWT is stored.
- [ ] Log in as a student and confirm redirection to `/dashboard`.
- [ ] Log out and verify protected routes redirect to `/login`.

**Incident flow**
- [ ] Submit an incident report as a student.
- [ ] Log in as admin, find the report, update its status and add admin remarks.
- [ ] Verify the student receives a real-time Socket.io notification for the status change.

**Advisory flow**
- [ ] Create a Draft advisory as admin.
- [ ] Publish the advisory and verify students receive a real-time broadcast notification.
- [ ] Confirm students can read the published advisory from their advisory browser.

**URL Checker and indicators**
- [ ] Add a new threat indicator domain as admin.
- [ ] Submit that domain to the URL checker and confirm it is flagged.

**Quiz**
- [ ] Complete the full 25-question quiz and verify server-scored results.
- [ ] Check that attempt history and the leaderboard update correctly after submission.

**Analytics**
- [ ] Verify the student analytics dashboard shows only personal data.
- [ ] Verify the admin analytics dashboard shows platform-wide totals.

</details>

---

## 🌐 Deployment

### GitHub

```bash
git init
git remote add origin https://github.com/<your-org>/cybershield-campus.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

> `.gitignore` excludes `node_modules/`, `backend/node_modules/`, `.next/`, `backend/dist/`, and all `.env` files. Only `.env.example` files are committed to version control.

### MongoDB Atlas

1. Create a free M0 cluster at [https://cloud.mongodb.com](https://cloud.mongodb.com).
2. Create a database user with **read/write** access to the `cybershield` database.
3. Under **Network Access**, add `0.0.0.0/0` (or Render's static outbound IPs for tighter control).
4. Copy the connection string:

   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/cybershield?retryWrites=true&w=majority
   ```

### Backend — Render (Web Service)

| Setting | Value |
|---|---|
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node dist/server.js` |
| **Node Version** | 18 or 20 |

**Environment variables to set on Render:**

| Key | Value |
|---|---|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Long random secret (≥ 32 characters) |
| `FRONTEND_URL` | Your Vercel frontend URL, e.g. `https://cybershield.vercel.app` |
| `NODE_ENV` | `production` |
| `JWT_EXPIRES_IN` | `7d` |
| `ADMIN_EMAIL` | Admin email (seed script only) |
| `ADMIN_PASSWORD` | Admin password (seed script only) |
| `ADMIN_FULL_NAME` | Admin display name (seed script only) |

> `PORT` should be left unset on Render — it is injected automatically.

After first deploy, run the admin seed from Render's **Shell** tab:

```bash
npm run seed:admin
```

> **WebSocket note:** Render Web Services support WebSocket connections natively. Socket.io runs on the same port as the HTTP server — no extra configuration is needed.

### Frontend — Vercel

| Setting | Value |
|---|---|
| **Root Directory** | `.` (repo root) |
| **Framework Preset** | Next.js |
| **Build Command** | `npm run build` |
| **Install Command** | `npm install` |

**Environment variables to set on Vercel:**

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<your-render-service>.onrender.com/api` |
| `NEXT_PUBLIC_WS_URL` | `https://<your-render-service>.onrender.com` |

> Set `NEXT_PUBLIC_WS_URL` to `https://` (not `wss://`) — the Socket.io client upgrades the protocol automatically, and this form is compatible with Render's TLS termination.

---

## ⚠️ Limitations

This platform is built for **educational and demonstration purposes**. It is **not** a production-grade commercial security product.

| Limitation | Detail |
|---|---|
| **No email verification** | Registration does not verify that the student's email belongs to the institution. Any email address can be registered. |
| **Heuristic URL checker only** | The URL risk engine uses string pattern matching, structural heuristics, and campus indicator lookups. It does **not** query external threat intelligence feeds, DNS, WHOIS, or certificate transparency logs. A "Low" risk result does **not** confirm that a URL is safe. |
| **In-memory notifications** | Socket.io notifications are held in memory for the browser session only. Refreshing the page clears all notifications — there is no notification persistence layer. |
| **No automated tests** | There is no unit, integration, or end-to-end test suite. |
| **Manual admin provisioning** | There is no self-service admin registration flow. All admin accounts must be created via the `seed:admin` script by someone with server access. |
| **JWT in localStorage** | Storing JWTs in `localStorage` is a pragmatic choice for a campus demo. For higher-security deployments, consider HttpOnly cookies instead. |
| **Permissive rate limits** | Global: 200 req / 15 min / IP · Auth: 10 req / 15 min / IP. Adjust in `backend/src/app.ts` and `backend/src/routes/auth.ts` before exposing to a large user base. |
| **Indicator toggle is UI-only** | The active/inactive toggle on the admin indicators page is a client-side UI overlay — the backend does not store an `isActive` flag and the toggle resets on page refresh. |

> **This platform does not replace professional cybersecurity tooling. Treat all analysis results as informational guidance only and always report serious security concerns through your institution's official IT security channel.**

---

## 🔭 Future Enhancements

- Institutional email domain validation at registration (e.g. restrict to `@college.edu.in`)
- Persistent notifications stored in MongoDB with read/unread state
- HttpOnly cookie–based JWT storage option for higher-security deployments
- Integration with external threat intelligence feeds (VirusTotal, Google Safe Browsing)
- Automated unit and integration test suite (Jest + Supertest)
- Email notifications for critical incident status updates
- Expanded quiz question bank with per-attempt randomisation
- Two-factor authentication (TOTP) for admin accounts
- CSV/PDF export of incident reports and analytics

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome.

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`.
3. Commit your changes: `git commit -m "feat: add my feature"`.
4. Push to the branch: `git push origin feature/my-feature`.
5. Open a Pull Request.

Please ensure your code follows the existing TypeScript conventions and does not introduce new linting errors (`npm run lint`).

---

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/) — React framework
- [Express](https://expressjs.com/) — Node.js web framework
- [MongoDB Atlas](https://www.mongodb.com/atlas) — Cloud database
- [Socket.io](https://socket.io/) — Real-time WebSocket library
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS framework
- [Recharts](https://recharts.org/) — React chart library
- [Lucide React](https://lucide.dev/) — Icon library
- [helmet](https://helmetjs.github.io/) — HTTP security headers
- [shields.io](https://shields.io/) — Readme badges

---

## 📄 License

No license has been specified for this project. All rights are reserved by the author(s) unless a license file is added.

---

<div align="center">

Built with TypeScript · Next.js · Express · MongoDB

</div>
