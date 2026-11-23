# CyberShield Campus

> A full-stack cybersecurity awareness and incident response platform for university campuses.

Students report cyber incidents, read security advisories, check suspicious URLs, and test their knowledge through a cyber awareness quiz — all backed by a real-time notification system. Admins manage the full lifecycle of incidents and advisories, oversee campus threat indicators, and monitor platform analytics.

---

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A518-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?logo=socket.io&logoColor=white)](https://socket.io/)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Features](#2-features)
3. [Technology Stack](#3-technology-stack)
4. [Architecture](#4-architecture)
5. [Folder Structure](#5-folder-structure)
6. [Prerequisites](#6-prerequisites)
7. [Local Installation](#7-local-installation)
8. [Environment Variables](#8-environment-variables)
9. [Admin Account Setup](#9-admin-account-setup)
10. [API Endpoints](#10-api-endpoints)
11. [Authentication and Roles](#11-authentication-and-roles)
12. [Socket.io Notifications](#12-socketio-notifications)
13. [Running Tests](#13-running-tests)
14. [Deployment](#14-deployment)
15. [Security Limitations and Disclaimer](#15-security-limitations-and-disclaimer)

---

## 1. Project Overview

CyberShield Campus helps students recognise and respond to campus cyber threats — phishing emails, fake internship scams, QR code fraud, university impersonation, and account compromise — by giving them structured tools to report incidents, receive real-time advisories, and improve their security awareness through interactive quizzes.

Admins receive a dedicated management panel to review and resolve incident reports, publish threat advisories, manage campus-specific threat indicators, and analyse platform trends — without disrupting the student experience.

---

## 2. Features

### Student Portal

| Feature | Description |
|---|---|
| **Incident Reporting** | Submit structured reports for phishing, URL scams, fake internships, account compromise, payment fraud, and more |
| **Security Advisories** | Browse campus threat intelligence advisories published by administrators |
| **URL Risk Checker** | Analyse suspicious URLs against heuristic rules and campus threat indicators |
| **Cyber Awareness Quiz** | 25-question server-scored MCQ quiz with attempt history and leaderboard |
| **Personal Analytics** | Dashboard showing own incident statistics and quiz performance over time |
| **Real-time Notifications** | Instant Socket.io alerts when an admin updates your incident or publishes a new advisory |

### Admin Panel

| Feature | Description |
|---|---|
| **Incident Management** | View, search, filter, update status/severity, add admin remarks, and delete incident reports |
| **Advisory Management** | Create, edit, publish, archive, and delete security advisories with Draft → Published workflow |
| **Threat Indicators** | Add and remove campus-specific suspicious domains and URLs used by the URL checker |
| **Analytics Dashboard** | Platform-wide incident trends, severity and category breakdowns, registered student count, and quiz statistics |

---

## 3. Technology Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| Next.js (App Router) | 16.4.6 | React framework with Edge middleware for route protection |
| React | 19.3.0 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.3.3 | Utility-first styling |
| Recharts | 3.x | Analytics charts |
| Lucide React | 1.x | Icon set |
| Socket.io Client | 4.8.4 | Real-time notifications |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | ≥ 18.0.0 | Runtime |
| Express | 4.x | HTTP server and routing |
| TypeScript | 5.x | Type safety |
| Mongoose | 8.x | MongoDB ODM |
| Socket.io | 4.8.4 | WebSocket server for real-time events |
| jsonwebtoken | 9.x | JWT authentication |
| bcryptjs | 2.x | Password hashing |
| helmet | 7.x | HTTP security headers |
| express-rate-limit | 7.x | API rate limiting |
| express-validator | 7.x | Request validation |

---

## 4. Architecture

```
Browser (Next.js)
    │
    ├── REST (HTTPS/HTTP)  ──▶  Express API  ──▶  MongoDB Atlas
    │                               │
    │                               └──  Business logic, JWT auth,
    │                                    request validation, rate limiting
    │
    └── WebSocket           ──▶  Socket.io Server (same Express port)
                                      └── Rooms assigned from verified JWT
                                          (clients cannot join rooms directly)
```

**Key design decisions:**

- **JWT storage:** Token is stored in `localStorage` (key: `cs_token`) and mirrored to a `SameSite=Lax` cookie so the Next.js Edge middleware (`proxy.ts`) can read it for server-side route protection.
- **Room security:** Socket.io room membership is derived exclusively from the verified JWT — clients cannot join or request arbitrary rooms.
- **Quiz integrity:** Scoring is fully server-side. Correct answers are never sent to the client before or during question fetch; they are only revealed after submission in the review response.
- **CORS lockdown:** CORS is restricted to the value of `FRONTEND_URL`; a wildcard origin is never permitted.
- **URL analysis:** The URL checker performs entirely local, static analysis — it never makes outbound requests to the submitted URL. Analysis is heuristic-based (see [Section 15](#15-security-limitations-and-disclaimer)).

---

## 5. Folder Structure

```
CyberShield Campus/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (AuthProvider, NotificationProvider)
│   ├── page.tsx                  # Landing page
│   ├── login/                    # Login page
│   ├── register/                 # Student registration page
│   ├── dashboard/                # Student dashboard
│   ├── incidents/                # Incident reporting and history
│   ├── advisories/               # Security advisory browser
│   ├── url-checker/              # URL risk analyser
│   ├── cyber-quiz/               # Quiz (fetch questions → submit → results)
│   ├── analytics/                # Analytics dashboard (role-aware)
│   ├── profile/                  # User profile
│   └── admin/                    # Admin-only pages (token-gated)
│       ├── dashboard/
│       ├── incidents/
│       ├── advisories/
│       └── indicators/
│
├── components/                   # Shared React components
│   ├── DashboardLayout.tsx       # Layout wrapper (Sidebar + Header)
│   ├── Header.tsx                # App header with notification bell
│   ├── Sidebar.tsx               # Navigation sidebar
│   ├── NotificationBell.tsx      # Real-time notification bell and dropdown
│   ├── Badges.tsx                # SeverityBadge, StatusBadge, RiskBadge, etc.
│   └── StatCard.tsx              # Dashboard stat card
│
├── lib/                          # Utility modules
│   ├── api.ts                    # Centralised fetch client (JWT attachment, 401 handling)
│   ├── auth.tsx                  # AuthProvider + useAuth hook
│   ├── notifications.tsx         # NotificationProvider + useNotifications hook
│   ├── socket.ts                 # Socket.io client singleton with reconnection backoff
│   └── utils.ts                  # formatDate, severityColor, getInitials, truncate, etc.
│
├── types/
│   └── index.ts                  # Shared TypeScript types (all backend-aligned)
│
├── data/                         # Legacy stub files (no longer active data sources)
├── public/                       # Static assets
├── proxy.ts                      # Next.js Edge middleware for route protection
├── .env.example                  # Frontend environment variable template
├── next.config.ts
└── tsconfig.json

backend/
├── src/
│   ├── server.ts                 # HTTP server + Socket.io attachment
│   ├── app.ts                    # Express app (CORS, routes, global error handler)
│   ├── config/
│   │   ├── env.ts                # Centralised environment variable validation
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
│   ├── models/                   # Mongoose models
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
│   │   └── quizQuestions.ts      # Authoritative 25-question quiz dataset (never sent raw)
│   └── utils/
│       ├── AppError.ts           # Custom error class + global error handler
│       ├── validation.ts         # express-validator chains
│       ├── urlAnalyzer.ts        # Heuristic URL risk analysis engine
│       └── seedAdmin.ts          # One-time admin account seed script
├── .env.example                  # Backend environment variable template
├── package.json
└── tsconfig.json
```

---

## 6. Prerequisites

| Requirement | Minimum Version |
|---|---|
| Node.js | 18.0.0 |
| npm | 9.0.0 |
| MongoDB | Atlas (cloud) or local ≥ 6 |

---

## 7. Local Installation

### Clone and install

```bash
git clone https://github.com/<your-org>/cybershield-campus.git
cd cybershield-campus

# Frontend dependencies
npm install

# Backend dependencies
cd backend && npm install && cd ..
```

### Configure environment

```bash
# Frontend
cp .env.example .env.local

# Backend
cp backend/.env.example backend/.env
```

Fill in the values as described in [Section 8](#8-environment-variables).

### Run in development

Open two terminals:

**Terminal 1 — Backend:**

```bash
cd backend
npm run dev
# Starts Express on http://localhost:5000
```

**Terminal 2 — Frontend:**

```bash
npm run dev
# Starts Next.js on http://localhost:3000
```

### Seed the admin account (first run only)

```bash
cd backend
npm run seed:admin
```

See [Section 9](#9-admin-account-setup) for details.

---

## 8. Environment Variables

### Frontend — `.env.local`

| Variable | Required | Description | Example |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend REST API base URL | `http://localhost:5000/api` |
| `NEXT_PUBLIC_WS_URL` | ✅ | Backend WebSocket URL for Socket.io | `ws://localhost:5000` |

> **Note:** Both variables must be prefixed with `NEXT_PUBLIC_` to be accessible in browser code. For production deployments use `https://` and `https://` respectively (Socket.io client upgrades the protocol automatically).

### Backend — `backend/.env`

| Variable | Required | Description | Example |
|---|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/cybershield` |
| `JWT_SECRET` | ✅ | Random string ≥ 32 characters for signing JWTs | `replace_with_64_char_random_string` |
| `JWT_EXPIRES_IN` | ❌ | Token expiry (default: `7d`) | `7d` |
| `PORT` | ❌ | HTTP server port (default: `5000`) | `5000` |
| `FRONTEND_URL` | ❌ | Allowed CORS origin (default: `http://localhost:3000`) | `https://cybershield.vercel.app` |
| `NODE_ENV` | ❌ | Runtime environment | `production` |
| `ADMIN_EMAIL` | Seed only | Admin account email used by the seed script | `admin@college.edu.in` |
| `ADMIN_PASSWORD` | Seed only | Admin account password used by the seed script | `Strong_Password_123!` |
| `ADMIN_FULL_NAME` | Seed only | Admin display name (default: `Campus IT Admin`) | `Campus IT Admin` |

---

## 9. Admin Account Setup

The public registration endpoint (`POST /api/auth/register`) only creates student accounts. Admin accounts must be created via the seed script.

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

- The seed script is never accessible via any HTTP endpoint.
- It must be run manually with direct server or shell access.
- Rotate the admin password after first login by updating `ADMIN_PASSWORD` in `.env` and re-running the seed, or updating the hash directly in MongoDB.

---

## 10. API Endpoints

All endpoints are prefixed with `/api`. Protected endpoints require `Authorization: Bearer <token>` in the request header.

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new student account |
| `POST` | `/api/auth/login` | Public | Authenticate and receive a JWT |
| `GET` | `/api/auth/me` | Student / Admin | Get the current user's profile |

### Incidents — `/api/incidents`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/incidents` | Student / Admin | Submit a new incident report |
| `GET` | `/api/incidents/my` | Student | Get own incident history (paginated) |
| `GET` | `/api/incidents/:id` | Student / Admin | Get a single incident (students see own only) |
| `GET` | `/api/incidents` | Admin | Get all incidents (paginated, filterable by status/severity) |
| `PATCH` | `/api/incidents/:id` | Admin | Update incident status, severity, and/or admin remarks |
| `DELETE` | `/api/incidents/:id` | Admin | Permanently delete an incident |

### Advisories — `/api/advisories`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/advisories` | Student / Admin | List advisories (students see Published only; admins see all) |
| `GET` | `/api/advisories/:id` | Student / Admin | Get a single advisory by ID |
| `POST` | `/api/advisories` | Admin | Create an advisory (always starts as Draft) |
| `PATCH` | `/api/advisories/:id` | Admin | Update advisory fields or status |
| `DELETE` | `/api/advisories/:id` | Admin | Delete an advisory |

### Threat Indicators — `/api/indicators`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/indicators/check?url=<url>` | Student / Admin | Check whether a URL matches any campus threat indicator |
| `GET` | `/api/indicators` | Admin | List all stored threat indicators |
| `POST` | `/api/indicators` | Admin | Add a new suspicious domain or URL indicator |
| `DELETE` | `/api/indicators/:id` | Admin | Permanently remove a threat indicator |

### URL Checker — `/api/url-checker`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/url-checker/analyze` | Student / Admin | Heuristic risk analysis of a submitted URL |

### Quiz — `/api/quiz`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/quiz/questions` | Student / Admin | Get questions without correct answers (supports `?category=` and `?difficulty=` filters) |
| `POST` | `/api/quiz/submit` | Student / Admin | Submit answers; server scores and records the attempt |
| `GET` | `/api/quiz/my-attempts` | Student / Admin | Get own attempt history |
| `GET` | `/api/quiz/leaderboard` | Student / Admin | Get top performers by best score |

### Analytics — `/api/analytics`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/analytics/dashboard` | Student / Admin | Role-aware statistics (admin: platform-wide; student: personal) |

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Server health check (returns status, environment, timestamp) |

---

## 11. Authentication and Roles

### JWT Flow

1. `POST /api/auth/login` returns a signed JWT.
2. The frontend stores it in `localStorage` (key: `cs_token`) and mirrors it to a `SameSite=Lax` cookie so the Next.js Edge middleware can read it without decoding.
3. All protected API requests include `Authorization: Bearer <token>`.
4. The backend `authenticate` middleware verifies and decodes the JWT.
5. The `authorize('admin')` middleware checks the decoded role for admin-only routes.

### Role Capabilities

| Role | Capabilities |
|---|---|
| `student` | Report incidents · View own incidents · Read published advisories · Analyse URLs · Take quiz · View personal analytics · Receive real-time notifications |
| `admin` | All student capabilities · Manage all incidents (update/delete) · Full advisory lifecycle · Manage threat indicators · View platform-wide analytics |

### Frontend Route Protection

- `proxy.ts` (Next.js Edge middleware) checks for the `cs_token` cookie on every request.
- Protected paths redirect to `/login?from=<path>` when no token is present.
- `/login` and `/register` redirect to `/dashboard` when a token is already present.
- Admin role enforcement is handled server-side by the backend — the proxy does not gate `/admin/*` routes by decoded role.

---

## 12. Socket.io Notifications

The Socket.io server runs on the **same port** as the HTTP server — no separate WebSocket port is required.

### Authentication

Clients must pass a valid JWT in `socket.handshake.auth.token`. The server verifies the token and assigns rooms — clients cannot join rooms directly.

### Server-Assigned Rooms

| Room | Members | Purpose |
|---|---|---|
| `user:{mongoId}` | One specific user | Targeted personal notifications (e.g. incident updates) |
| `students` | All connected students | Broadcast advisory publications |
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

> **Important:** Notifications are **in-memory only** for the duration of the browser session. There is no notification database table. Refreshing the page clears all received notifications.

---

## 13. Running Tests

No automated test suite is currently included. The following manual checklist covers the core flows:

**Authentication**
- [ ] Register a new student account and verify JWT is stored.
- [ ] Log in as a student and confirm redirection to `/dashboard`.
- [ ] Log out and verify protected routes redirect to `/login`.

**Incident flow**
- [ ] Submit an incident report as a student.
- [ ] Log in as admin, find the report, update its status and add remarks.
- [ ] Verify the student receives a real-time Socket.io notification for the status change.

**Advisory flow**
- [ ] Create a Draft advisory as admin.
- [ ] Publish the advisory and verify students receive a real-time broadcast notification.
- [ ] Confirm students can read the published advisory from their advisory browser.

**URL Checker and indicators**
- [ ] Add a new threat indicator domain as admin.
- [ ] Submit that domain to the URL checker and confirm it is flagged.

**Quiz**
- [ ] Complete the 25-question quiz end-to-end and verify server-scored results match expectations.
- [ ] Check that attempt history and the leaderboard update correctly.

**Analytics**
- [ ] Verify the student analytics dashboard shows only personal data.
- [ ] Verify the admin analytics dashboard shows platform-wide totals.

---

## 14. Deployment

### GitHub

```bash
git init
git remote add origin https://github.com/<your-org>/cybershield-campus.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

> `.gitignore` excludes `node_modules/`, `backend/node_modules/`, `.next/`, `backend/dist/`, and all `.env` files. Only `.env.example` files are committed to version control.

---

### MongoDB Atlas

1. Create a free M0 cluster at [https://cloud.mongodb.com](https://cloud.mongodb.com).
2. Create a database user with **read/write** access to the `cybershield` database.
3. Under **Network Access**, add `0.0.0.0/0` to the IP allowlist (or Render's static outbound IPs for tighter control).
4. Copy the connection string in this format:

   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/cybershield?retryWrites=true&w=majority
   ```

---

### Backend — Render (Web Service)

| Setting | Value |
|---|---|
| **Repository** | Your GitHub repo |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node dist/server.js` |
| **Node Version** | 18 or 20 |

**Required environment variables on Render:**

| Key | Value |
|---|---|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Long random secret (≥ 32 characters) |
| `FRONTEND_URL` | Your Vercel frontend URL, e.g. `https://cybershield.vercel.app` |
| `NODE_ENV` | `production` |
| `JWT_EXPIRES_IN` | `7d` (or as required) |
| `PORT` | Leave unset — Render injects this automatically |

**After first deploy**, run the seed script from Render's **Shell** tab (also set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_FULL_NAME` in the environment variables first):

```bash
npm run seed:admin
```

> **WebSocket note:** Render Web Services support WebSocket connections natively. Socket.io runs on the same port as the HTTP server — no additional configuration is required.

---

### Frontend — Vercel

| Setting | Value |
|---|---|
| **Repository** | Your GitHub repo |
| **Root Directory** | `.` (repo root) |
| **Framework Preset** | Next.js |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` (auto-detected) |
| **Install Command** | `npm install` |

**Required environment variables on Vercel:**

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | Your Render backend URL, e.g. `https://cybershield-api.onrender.com/api` |
| `NEXT_PUBLIC_WS_URL` | Your Render backend URL, e.g. `https://cybershield-api.onrender.com` |

> **Protocol note:** Set `NEXT_PUBLIC_WS_URL` to `https://` (not `wss://`) — the Socket.io client upgrades the protocol automatically and this form is compatible with Render's TLS termination.

---

## 15. Security Limitations and Disclaimer

This platform is built for **educational and demonstration purposes** within a campus environment. It is **not** a production-grade commercial security product.

### Known Limitations

| Limitation | Detail |
|---|---|
| **No email verification** | Registration does not verify that the student's email belongs to the institution. Any email address can be registered. |
| **No persistent notifications** | Socket.io notifications are held in memory for the browser session only. Refreshing the page clears all notifications — there is no notification database table. |
| **Heuristic URL checker** | The URL risk engine uses string pattern matching, structural heuristics, and campus indicator lookups. It does **not** query external threat intelligence feeds, DNS, WHOIS, or certificate transparency logs. A "Low" risk result does **not** confirm that a URL is safe. |
| **No automated tests** | There is no unit, integration, or end-to-end test suite. |
| **Manual admin provisioning** | There is no self-service admin registration flow. All admin accounts must be created via the `seed:admin` script by someone with server access. |
| **JWT in localStorage** | Storing JWTs in `localStorage` is a pragmatic choice for a campus demo. For higher-security deployments, consider HttpOnly cookies instead. |
| **Permissive rate limits** | The global limiter allows 200 requests per 15 minutes per IP; auth endpoints allow 10. Adjust these values in `backend/src/app.ts` and `backend/src/routes/auth.ts` before exposing to a large user base. |
| **In-memory threat indicator toggle** | The active/inactive toggle on the admin indicators page is a UI-only overlay — the backend does not store an `isActive` flag and the toggle resets on page refresh. |

---

**This platform does not replace professional cybersecurity tooling. Treat all analysis results as informational guidance only and always report serious security concerns through your institution's official IT security channel.**
