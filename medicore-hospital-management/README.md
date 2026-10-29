# MediCore — Healthcare Operations Platform

MediCore is a MERN-based healthcare operations platform for coordinating patient flow, clinical work, appointments, queue operations, prescriptions, billing, payments, reports, and administrative users in one protected workspace.

- **Live frontend:** [hospital-management-a5u8.onrender.com](https://hospital-management-a5u8.onrender.com)
- **Live API:** [medicore-api-y2qn.onrender.com](https://medicore-api-y2qn.onrender.com)
- **Health check:** [`/api/health`](https://medicore-api-y2qn.onrender.com/api/health)

> The application is a portfolio project. SMS delivery is provider-adapter based and is not represented as production-confirmed unless an external provider is configured and returns success.

## Table of contents

- [Overview](#overview)
- [Objectives](#objectives)
- [Implemented features](#implemented-features)
- [Roles and permissions](#roles-and-permissions)
- [Technology stack](#technology-stack)
- [System architecture](#system-architecture)
- [Project structure](#project-structure)
- [Authentication and authorization](#authentication-and-authorization)
- [Data model and relationships](#data-model-and-relationships)
- [API reference](#api-reference)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Development commands](#development-commands)
- [Deployment](#deployment)
- [Security measures](#security-measures)
- [Screenshots](#screenshots)
- [Future improvements](#future-improvements)
- [Troubleshooting](#troubleshooting)
- [Author](#author)

## Overview

Hospital teams need a shared operational view of patients, schedules, clinical records, the daily queue, and financial workflows. MediCore provides that foundation through a React dashboard backed by a RESTful Express API and MongoDB Atlas.

The frontend uses protected routes and a reusable authenticated Axios client. The backend owns validation, authorization, relationship checks, financial calculations, queue assignment, privacy filtering, and report aggregation.

## Objectives

- Centralize day-to-day hospital operations in a focused workspace.
- Keep clinical, operational, and financial data behind server-side authorization.
- Maintain consistent relationships between patients, doctors, appointments, prescriptions, invoices, payments, and queue entries.
- Provide a scalable foundation for deployment and future integrations without claiming unsupported functionality.

## Implemented features

- JWT login and public registration for doctor and receptionist accounts.
- Admin user management, including Doctor-profile linking and account deactivation.
- Role-aware dashboard and clinical workspace.
- Patient CRUD with search, pagination, and Doctor-scoped visibility.
- Doctor CRUD with search, pagination, and safe field projections.
- Appointment CRUD, search, date/status filters, pagination, conflict prevention, status transitions, and rescheduling of cancelled/no-show appointments.
- Daily queue management with per-doctor queue counters and workflow statuses: `waiting`, `called`, `in_consultation`, `completed`, `cancelled`, and `no_show`.
- Queue polling in the frontend; no WebSocket or SSE transport is used.
- In-app staff notifications and a patient queue-call notification flow.
- SMS provider adapter with explicit delivery states including `provider_not_configured`.
- Prescription CRUD with Patient/Doctor/Appointment relationship validation and Receptionist clinical-field privacy filtering.
- Invoice CRUD with server-side line-item and financial calculations.
- Immutable payment records with transactional balance and overpayment protection.
- Date-range Reports & Analytics for operational appointments, billing, and permitted clinical aggregates.
- Light, dark, and system theme support.
- Production hardening middleware: Helmet, strict environment-driven CORS, rate limiting, JSON error handling, and disabled `x-powered-by` headers.

## Roles and permissions

| Role | Access summary |
| --- | --- |
| **Admin** | Full operational access, user management, Doctor/Patient/Appointment maintenance, prescriptions, billing, payments, queue controls, and all reports. |
| **Receptionist** | Patient and appointment operations, appointment queue operations, invoice/payment operations, operational reports, and privacy-filtered prescription viewing. Cannot manage users or Doctors. |
| **Doctor** | Doctor-scoped appointments, patients, queue, prescriptions, clinical reports, and permitted clinical actions. Cannot manage users, Doctors, invoices, or payments. |

The backend is authoritative for authorization. Frontend controls are for user experience only.

## Technology stack

### Frontend

- React 19
- Vite 8
- React Router
- Axios
- CSS design tokens and responsive component styles

### Backend

- Node.js
- Express 5
- Mongoose 9
- JSON Web Tokens (`jsonwebtoken`)
- bcrypt password hashing
- dotenv
- Helmet
- CORS
- express-rate-limit

### Database and hosting

- MongoDB Atlas
- Render deployment for the published frontend and API

## System architecture

```text
React + Vite client
        │  Axios / Bearer JWT
        ▼
Express REST API
        │
        ├── Auth + role middleware
        ├── Domain controllers/routes
        ├── Queue and notification services
        └── Mongoose models
                │
                ▼
          MongoDB Atlas
```

The server loads environment variables, connects to MongoDB, and only then starts listening for HTTP requests. The Vite development server proxies `/api` requests to the local Express API.

## Project structure

```text
medicore-hospital-management/
├── client/
│   ├── src/
│   │   ├── components/       # Dashboard, domain tables, forms, modals
│   │   ├── context/          # AuthContext and ThemeContext
│   │   ├── lib/              # Axios client and auth storage
│   │   ├── pages/            # Protected workspaces and public auth pages
│   │   ├── services/         # Authentication service
│   │   ├── styles/           # Shared design system tokens
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── controllers/
│   │   ├── middleware/       # Auth and security middleware
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/         # Queue and SMS/notification services
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── docs/
├── .gitignore
├── package.json
└── README.md
```

## Authentication and authorization

1. `POST /api/auth/login` validates credentials and returns a seven-day JWT plus a safe user object.
2. The client stores the token locally for this portfolio implementation and Axios attaches it as `Authorization: Bearer <token>`.
3. `protect` verifies the token, reloads the active User, and rejects missing, invalid, expired, or deactivated accounts.
4. `authorizeRoles(...)` enforces route-level role permissions.
5. Doctor accounts carry a linked `Doctor` profile. Doctor-scoped controllers enforce that link server-side.
6. Receptionist prescription responses remove `diagnosis`, `notes`, and `medicines`.

Public registration accepts only `doctor` and `receptionist`; public admin registration is rejected. Admin accounts are managed through the protected User Management API.

## Data model and relationships

| Model | Important fields and relationships |
| --- | --- |
| **User** | `name`, `email`, bcrypt-hashed `password`, `role`, `active`, optional `doctor` reference. Active Doctor profiles have a unique User link. |
| **Patient** | Identity/contact fields, date of birth, demographics, address, emergency contact, and medical history. |
| **Doctor** | Name, contact details, specialization, department, qualification, and experience. |
| **Appointment** | Required Patient and Doctor references, `dateTime`, reason, appointment status, and queue workflow fields. |
| **QueueCounter** | Atomic per-Doctor, per-date sequence used for queue numbers. |
| **Prescription** | Patient, Doctor, optional Appointment, diagnosis, notes, and one or more medicines. Appointment references must match the Patient and Doctor. |
| **Invoice** | Patient, optional Doctor/Appointment, invoice number, line items, discount, tax, calculated totals, payment status, and audit references. |
| **Payment** | Immutable payment transaction linked to an Invoice, amount, method, paid date, receiver, reference, and notes. |
| **Notification** | User or Patient recipient, message, related appointment/queue, channel, read state, and delivery status. |

Relationship integrity is enforced by the API for new and updated appointments, prescriptions, and invoices. Existing records are not automatically rewritten.

## API reference

All routes below are relative to `https://medicore-api-y2qn.onrender.com`. Except for health and authentication, routes require a valid Bearer JWT. Successful responses generally use `{ "success": true, "data": ... }`; failures use `{ "success": false, "message": "..." }`.

### Public authentication and health

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Public deployment health check. |
| `POST` | `/api/auth/register` | Register a Doctor or Receptionist account. Admin is not allowed. |
| `POST` | `/api/auth/login` | Authenticate and receive a JWT and safe user object. |

### Patients

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/patients` | List patients with optional `search`, `page`, and `limit` (`10`, `20`, `50`). Doctor results are scoped. |
| `GET` | `/api/patients/:id` | Retrieve one authorized patient. |
| `POST` | `/api/patients` | Create a patient. Admin and Receptionist. |
| `PUT` | `/api/patients/:id` | Update a patient. Admin and Receptionist. |
| `DELETE` | `/api/patients/:id` | Delete a patient. Admin only. |

### Doctors

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/doctors` | List Doctors with optional name/email/specialization search and pagination. |
| `GET` | `/api/doctors/:id` | Retrieve a Doctor profile. |
| `POST` | `/api/doctors` | Create a Doctor. Admin only. |
| `PUT` | `/api/doctors/:id` | Update a Doctor. Admin only. |
| `DELETE` | `/api/doctors/:id` | Delete a Doctor. Admin only. |

### Appointments

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/appointments` | List with `search`, `status`, `date`, optional Doctor filter, and pagination. |
| `GET` | `/api/appointments/:id` | Retrieve an authorized appointment. |
| `POST` | `/api/appointments` | Create an appointment with reference validation and conflict prevention. |
| `PUT` | `/api/appointments/:id` | Update an appointment while enforcing status transitions and conflicts. |
| `POST` | `/api/appointments/:id/reschedule` | Create a new scheduled appointment from a cancelled/no-show appointment. |
| `DELETE` | `/api/appointments/:id` | Delete an appointment. Admin only. |

Appointment statuses are `scheduled`, `completed`, `cancelled`, and `no_show`.

### Prescriptions

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/prescriptions` | List prescriptions with search/filter/pagination and role-aware privacy. |
| `GET` | `/api/prescriptions/:id` | Retrieve one prescription with role-aware privacy. |
| `POST` | `/api/prescriptions` | Create a prescription. Admin and Doctor. |
| `PUT` | `/api/prescriptions/:id` | Update a prescription. Admin and Doctor. |
| `DELETE` | `/api/prescriptions/:id` | Delete a prescription. Admin and Doctor. |

### Queue and notifications

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/queue` | Get the queue for a date, optional Doctor, and optional queue status. Also safely ensures eligible queue entries. |
| `GET` | `/api/queue/:id` | Retrieve one authorized queue entry. |
| `PUT` | `/api/queue/:id/status` | Advance a queue entry through allowed workflow states. |
| `GET` | `/api/notifications` | Get the authenticated User's in-app notifications. |
| `GET` | `/api/notifications/unread-count` | Get the authenticated User's unread count. |
| `PUT` | `/api/notifications/read-all` | Mark the authenticated User's notifications read. |
| `PUT` | `/api/notifications/:id/read` | Mark one owned notification read. |

Queue updates use frontend polling. A patient queue-call notification is created only after an actual `waiting → called` transition, and delivery can be `pending`, `sent`, `failed`, or `provider_not_configured`.

### Billing and payments

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/invoices` | List invoices. Admin and Receptionist. |
| `GET` | `/api/invoices/:id` | Retrieve one invoice. Admin and Receptionist. |
| `POST` | `/api/invoices` | Create an invoice with server-calculated financials. Admin and Receptionist. |
| `PUT` | `/api/invoices/:id` | Update an invoice subject to payment integrity rules. Admin and Receptionist. |
| `DELETE` | `/api/invoices/:id` | Delete an invoice without recorded payments. Admin only. |
| `POST` | `/api/payments` | Record a payment transaction. Admin and Receptionist. |
| `GET` | `/api/payments/:id` | Retrieve one payment transaction. Admin and Receptionist. |
| `GET` | `/api/invoices/:invoiceId/payments` | List payment history for an invoice. Admin and Receptionist. |

Invoice payment status is `unpaid`, `partial`, or `paid`. Overpayments are rejected server-side.

### Reports

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/reports/overview` | Operational and permitted billing overview. Supports `from` and `to` in `YYYY-MM-DD`. Admin and Receptionist. |
| `GET` | `/api/reports/appointments` | Appointment status, date, and Doctor aggregates. Supports date range, status, and Doctor filters. |
| `GET` | `/api/reports/billing` | Invoice/payment aggregates and payment-status distribution. Supports date range and status. Admin and Receptionist. |
| `GET` | `/api/reports/clinical` | Prescription and medicine aggregates without prescription contents. Supports date range and Doctor scoping. Admin and Doctor. |

### User management

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/users` | List users with safe serialized fields. Admin only. |
| `GET` | `/api/users/:id` | Retrieve one user. Admin only. |
| `POST` | `/api/users` | Create a user and optionally link a Doctor profile. Admin only. |
| `PUT` | `/api/users/:id` | Update role, active state, password, or Doctor link with validation. Admin only. |
| `DELETE` | `/api/users/:id` | Deactivate a user while protecting the last active admin. Admin only. |

## Local setup

### Prerequisites

- Node.js 20 or later
- npm
- A MongoDB Atlas cluster or compatible MongoDB deployment

### Install

```bash
git clone https://github.com/stufffactory14-debug/hospital_management.git
cd hospital_management/medicore-hospital-management
npm install
npm install --prefix client
npm install --prefix server
```

### Configure the API

```bash
copy server\.env.example server\.env
```

Edit `server/.env` with local values. Never commit this file.

### Configure the client

```bash
copy client\.env.example client\.env
```

For local development, the default API URL is `http://localhost:5000/api`. The Vite proxy also forwards `/api` requests to the local backend.

## Environment variables

### `server/.env`

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string. Required. |
| `PORT` | Express port; defaults to `5000`. |
| `JWT_SECRET` | Secret used to sign and verify JWTs. Required; keep private. |
| `CLIENT_ORIGIN` | Comma-separated allowed frontend origin(s) for CORS. |
| `SMS_PROVIDER` | Provider adapter name. The current adapter recognizes `webhook`; blank means not configured. |
| `SMS_API_URL` | SMS webhook endpoint, if configured. |
| `SMS_API_KEY` | SMS provider credential, if configured. |
| `RATE_LIMIT_LOGIN_WINDOW_MS` | Login limiter window; default `900000`. |
| `RATE_LIMIT_LOGIN_MAX` | Login requests per window; default `10`. |
| `RATE_LIMIT_REGISTER_WINDOW_MS` | Registration limiter window; default `3600000`. |
| `RATE_LIMIT_REGISTER_MAX` | Registration requests per window; default `5`. |
| `RATE_LIMIT_MUTATION_WINDOW_MS` | Mutation limiter window; default `900000`. |
| `RATE_LIMIT_MUTATION_MAX` | Mutation requests per window; default `120`. |

### `client/.env`

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | API base URL, normally `http://localhost:5000/api` locally and the deployed API URL in a separately hosted production client. |

Do not put JWT secrets, MongoDB credentials, SMS keys, or other private values in client environment variables. Vite variables are exposed to browser code.

## Development commands

From the repository root:

```bash
npm run dev       # Start Vite and Express together
npm run client    # Start only the frontend
npm run server    # Start only the backend
npm run build     # Build the frontend for production
```

Equivalent package-level commands:

```bash
npm run dev --prefix client
npm start --prefix server
```

The API starts only after a successful MongoDB connection. Health check locally with:

```bash
curl http://localhost:5000/api/health
```

## Deployment

The published deployment uses Render (or an equivalent frontend/API hosting arrangement):

- Frontend: [hospital-management-a5u8.onrender.com](https://hospital-management-a5u8.onrender.com)
- Backend: [medicore-api-y2qn.onrender.com](https://medicore-api-y2qn.onrender.com)

For a production deployment:

1. Deploy the `server` service with `npm start --prefix server` or the equivalent service-root command.
2. Set `MONGODB_URI`, `JWT_SECRET`, `PORT`, and the production `CLIENT_ORIGIN` in the server environment.
3. Set the client `VITE_API_URL` to the deployed API base URL ending in `/api` before building.
4. Deploy the client using `npm run build --prefix client` and serve the generated `client/dist` directory.
5. Confirm `GET /api/health` and an authenticated workflow after deployment.

Never expose `.env` files or provider credentials in the repository. MongoDB Atlas network access must allow the deployed API service according to your infrastructure policy.

## Security measures

- JWT authentication with seven-day token expiry.
- bcrypt password hashing with a cost factor of 12.
- Server-side role authorization and Doctor-profile scoping.
- Public registration role whitelist; admin cannot be created publicly.
- Safe user serialization; passwords are never returned.
- Whitelisted request fields for domain mutations.
- ObjectId, relationship, status, scheduling, and financial validation.
- Appointment double-booking prevention and queue transition validation.
- Transactional queue counters and payment updates.
- Receptionist filtering of prescription diagnosis, notes, and medicines.
- Patient notification recipient and phone derivation on the server.
- Helmet security headers and disabled `x-powered-by`.
- Environment-driven CORS without wildcard authenticated access.
- Rate limiting for login, registration, and mutation requests.
- Centralized JSON errors without stack traces, secrets, or filesystem paths.
- `.env` and generated output excluded by `.gitignore`.

## Screenshots

Screenshots are not included in the repository yet. Suggested captures for a future documentation update:

```text
docs/screenshots/dashboard.png
docs/screenshots/appointments.png
docs/screenshots/queue.png
docs/screenshots/prescriptions.png
docs/screenshots/billing.png
docs/screenshots/reports.png
```

## Future improvements

These are intentionally future-facing and are not claims about the current implementation:

- Shared Redis-backed rate limiting for multi-instance deployments.
- Structured, privacy-safe audit logging and observability.
- Automated authenticated API and browser regression tests.
- Production SMS provider integration and delivery reconciliation.
- Payment gateway integration and external transaction reconciliation.
- More explicit timezone configuration for hospital-local reports and queues.
- Stronger appointment scheduling constraints for concurrent writes.
- Password reset, session revocation, and refresh-token strategy.
- Expanded accessibility and formal end-to-end test coverage.

## Troubleshooting

### MongoDB connection fails

- Confirm `server/.env` exists and contains a valid `MONGODB_URI`.
- Check MongoDB Atlas network access and database credentials.
- Start the API from the repository root with `npm run server`.
- The API intentionally does not start listening until MongoDB connects.

### Frontend cannot reach the API locally

- Confirm the backend is listening on port `5000`.
- Confirm `client/.env` uses `VITE_API_URL=http://localhost:5000/api`, or use the Vite `/api` proxy.
- Restart Vite after changing environment variables.

### `401 Authentication is required`

- Log in again to obtain a fresh JWT.
- Confirm the request includes `Authorization: Bearer <token>`.
- Check that the User account is still active.

### `403` permission response

The authenticated role does not have permission for that operation, or a Doctor account is not linked to a valid Doctor profile. Frontend controls do not replace backend authorization.

### `429 Too many requests`

The applicable rate limiter has been exceeded. Wait for the configured window to expire, then retry. Adjust environment-based limits deliberately rather than disabling protection in production.

### SMS is not delivered

The current system reports `provider_not_configured` unless all required SMS variables are present and the provider adapter confirms a successful response. Queue state changes are not rolled back because of SMS delivery failure.

## Author

**Stuff Factory 14**

- GitHub: [@stufffactory14-debug](https://github.com/stufffactory14-debug)
- Repository: [hospital_management](https://github.com/stufffactory14-debug/hospital_management)
