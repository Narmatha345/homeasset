# HomeAsset

**Smart Home Asset & Maintenance Management** — a Home Asset & Maintenance Management demo/MVP, inspired by common asset-management concepts (such as those found in IBM Maximo Asset Management) and simplified for residential use.

This is **not** IBM Maximo and does **not** integrate with it. It's a standalone demo built to show that core asset-management concepts — houses, locations, assets, purchase & warranty tracking, service history, and maintenance scheduling — translate cleanly to a home context.

## Overview

HomeAsset models a simple hierarchy that shows up throughout the app:

```
House → Location (Room) → Asset (Equipment) → Service History → Next Maintenance
```

A user signs in, picks a house, organizes it into rooms, registers the equipment in each room, and tracks when each piece of equipment was last serviced and when it's due next. The dashboard and calendar surface what needs attention.

## Features

- JWT-based authentication with a seeded demo account
- Dashboard with live stats, upcoming maintenance, recent service activity, and an assets-by-location chart
- House management (create / edit / delete) with address & description
- Room/location management nested under each house
- Asset management with purchase info, warranty tracking, and maintenance scheduling
- Asset details page with a full service history timeline
- Add/edit service records that automatically update an asset's last/next service dates
- Maintenance page with All / This Week / This Month / Overdue filters, mark-completed and reschedule actions
- Month calendar view of every upcoming and completed service event, color-coded by status
- Global service history log with filters by asset, room, service type, and date range
- Global search across assets, rooms, and service records
- Notification dropdown for overdue, due-soon, and warranty-expiring items
- Responsive layout (desktop sidebar, mobile drawer navigation, card-based tables on small screens)
- Empty states, loading states, error states with retry, and delete confirmation dialogs throughout

## Architecture

```
backend/
  src/
    config/       env + database bootstrap (mongodb-memory-server or external MongoDB)
    models/       Mongoose schemas: User, House, Location, Asset, ServiceRecord
    controllers/  request handlers per resource
    routes/       Express routers, mounted under /api
    middleware/   JWT auth guard, centralized error handler
    services/     shared maintenance-status logic (Overdue / Due Soon / Scheduled / Upcoming)
    seed/         idempotent demo-data seeding, runs automatically on server start
    utils/        ApiError, asyncHandler
frontend/
  src/
    api/          axios instance + one typed client module per resource
    components/   ui/ (Button, Card, Table, Modal, Badge, Toast, ...), layout/, and feature folders
    pages/        one file per route (Dashboard, Houses, Assets, Maintenance, Calendar, ...)
    context/      AuthContext, ToastContext
    hooks/        useDebounce, useConfirm
    types/        shared TypeScript interfaces mirroring the backend models
    utils/        status/date/currency formatting, calendar grid helpers
```

## Tech Stack

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide icons, Recharts, React Router
**Backend:** Node.js, Express, TypeScript, Mongoose
**Database:** MongoDB (via `mongodb-memory-server` by default — see below)
**Auth:** JWT (bearer token, stored client-side, verified via Express middleware)

## Database Setup

By default the backend starts an **in-process, in-memory MongoDB instance** via `mongodb-memory-server` — there is nothing to install and nothing to configure. Demo data is (re)seeded automatically every time the backend starts. Data persists for as long as the backend process is running (browser refreshes are completely safe), but restarting the backend resets and reseeds the database. This is intentional: it means anyone can clone this repo and run a fully working demo with zero database setup.

To point the app at a real, persistent MongoDB instance instead (e.g. MongoDB Atlas, a local install, or Docker), set in `backend/.env`:

```
USE_MEMORY_DB=false
MONGODB_URI=mongodb://127.0.0.1:27017/homeasset
```

## Installation

```bash
# Backend
cd backend
cp .env.example .env
npm install

# Frontend
cd ../frontend
cp .env.example .env
npm install
```

## Environment Variables

**backend/.env**

| Variable | Description | Default |
|---|---|---|
| `PORT` | API server port | `4000` |
| `JWT_SECRET` | Secret used to sign JWTs | *(set your own)* |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `USE_MEMORY_DB` | Use in-memory MongoDB | `true` |
| `MONGODB_URI` | External MongoDB connection string (used when `USE_MEMORY_DB=false`) | `mongodb://127.0.0.1:27017/homeasset` |
| `DEMO_EMAIL` / `DEMO_PASSWORD` | Seeded demo account credentials | `demo@homeasset.com` / `Demo@123` |

**frontend/.env**

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | API base URL. Leave empty to use the Vite dev-server proxy to `localhost:4000`. | *(empty)* |

## Running the App

```bash
# Terminal 1 — backend (http://localhost:4000)
cd backend
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd frontend
npm run dev
```

Open `http://localhost:5173` and either sign in with the demo credentials below or click **Demo Login**.

## Demo Credentials

```
Email:    demo@homeasset.com
Password: Demo@123
```

The seed script creates one house ("My Home"), five rooms, six assets (LG Split AC, Samsung Refrigerator, Samsung Washing Machine, Sony Bravia TV, Kent Water Purifier, Havells Water Heater), and eight service history records with realistic purchase, warranty, and maintenance dates — so the dashboard and calendar are populated the moment you log in.

## API Overview

All routes are prefixed with `/api` and (except auth) require an `Authorization: Bearer <token>` header.

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/houses            POST /api/houses
GET    /api/houses/:id        PUT  /api/houses/:id        DELETE /api/houses/:id

GET    /api/locations         POST /api/locations
GET    /api/locations/summary                              (House → Room → Asset tree)
PUT    /api/locations/:id     DELETE /api/locations/:id

GET    /api/assets            POST /api/assets
GET    /api/assets/:id        PUT  /api/assets/:id         DELETE /api/assets/:id
GET    /api/assets/by-location

GET    /api/services          POST /api/services
GET    /api/services/:id      PUT  /api/services/:id       DELETE /api/services/:id

GET    /api/dashboard/summary
GET    /api/dashboard/upcoming-maintenance?range=week|month|overdue
GET    /api/dashboard/recently-serviced
GET    /api/dashboard/assets-by-location
GET    /api/dashboard/notifications

GET    /api/search?q=...
```

## Screenshots

_Add screenshots of the Dashboard, Asset Details, Calendar, and Maintenance pages here before publishing._

## Future Improvements

This MVP is intentionally scoped. The architecture (typed API client layer, resource-based routes/controllers, shared status logic) is meant to make these straightforward to add later without a rewrite:

- QR code / barcode generation and scanning for assets
- Email or push reminders for upcoming maintenance
- AI-assisted maintenance recommendations
- Expense tracking and reporting across assets
- Multiple family members / shared household accounts
- Cloud deployment (Docker, managed MongoDB)
- Native mobile app
- Integration hooks for enterprise asset-management systems

## License

Demo project for portfolio / evaluation purposes.
