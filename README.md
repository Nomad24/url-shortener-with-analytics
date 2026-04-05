# URL Shortener with Analytics Dashboard

A full-stack URL shortening application with guest link creation, user authentication, and comprehensive analytics dashboard.

## Features

- **Guest Link Creation**: Create short links without registration
- **User Authentication**: JWT-based auth with refresh tokens
- **Link Management**: CRUD operations for your links
- **Analytics Dashboard**: 
  - Clicks over time (line chart)
  - Device breakdown (donut chart)
  - Browser statistics (bar chart)
  - Geographic distribution (bar chart)
  - Referrer tracking
- **Click Tracking**: Automatic tracking of device, browser, OS, country, and referrer

## Tech Stack

### Backend
- Node.js + Express (ES6 modules)
- PostgreSQL + Prisma ORM
- JWT Authentication (access + refresh tokens)
- bcryptjs for password hashing
- nanoid for short code generation
- ua-parser-js for user agent parsing

### Frontend
- React 18 + Vite
- Tailwind CSS
- Zustand for state management
- React Query for server state
- React Router v6
- Recharts for data visualization
- Lucide React for icons

## Project Structure

```
url-shortener/
├── backend/
│   ├── src/
│   │   ├── config/         # Environment & Prisma config
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/   # Auth, validation, error handling
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utilities
│   │   ├── app.js          # Express app setup
│   │   └── server.js       # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.js         # Seed data
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # Zustand stores
│   │   ├── main.jsx        # Entry point
│   │   └── App.jsx         # Main app component
│   └── package.json
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database

### Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your credentials and BASE_URL

# Setup database
npx prisma migrate dev
npx prisma db seed

# Start development server
npm run dev
```

Optional DB commands (from `backend/package.json` scripts):

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

### Required Environment Variables

Backend validates all env variables on startup. Minimum required values:

- `NODE_ENV` (`development` | `production` | `test`)
- `PORT`
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES`
- `JWT_REFRESH_EXPIRES`
- `BASE_URL` (public backend URL, used to generate short links like `${BASE_URL}/{shortCode}`)
- `GUEST_LINK_EXPIRES_DAYS` (default lifetime for guest links)
- `USER_LINK_EXPIRES_DAYS` (default lifetime for authenticated user links)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

### Backend (`backend/package.json`)

- `npm run dev` - start backend with nodemon
- `npm run start` - start backend with node
- `npm run lint` - run eslint
- `npm run format` - format backend source with prettier
- `npm run db:generate` - prisma client generate
- `npm run db:migrate` - run prisma migrations (dev)
- `npm run db:seed` - run seed script
- `npm run db:studio` - open Prisma Studio

### Frontend (`frontend/package.json`)

- `npm run dev` - start Vite dev server
- `npm run build` - build production bundle
- `npm run preview` - preview built bundle
- `npm run lint` - run eslint
- `npm run format` - format frontend source with prettier

## Production Run (Frontend + Backend)

In production, backend serves the built frontend from `frontend/dist` and handles SPA fallback to `index.html` for non-API routes.

### 1) Build frontend

```bash
cd frontend
npm install
npm run build
```

### 2) Configure backend env

Set `BASE_URL` to your real public domain (example: `https://short.example.com`).

If you use PM2 config, set it in `backend/ecosystem.config.js` under `env_production`.

### 3) Start backend with PM2

```bash
cd backend
npm install
pm2 start ecosystem.config.js --env production
```

### 4) Apply future updates

```bash
cd frontend && npm run build
cd ../backend && pm2 restart ecosystem.config.js --env production
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Links
- `POST /api/links/guest` - Create guest link
- `POST /api/links` - Create authenticated link
- `GET /api/links` - Get user links
- `GET /api/links/:id` - Get link details
- `PATCH /api/links/:id` - Update link
- `DELETE /api/links/:id` - Delete link

### Analytics
- `GET /api/analytics/overview` - Overview stats
- `GET /api/analytics/clicks` - Clicks over time
- `GET /api/analytics/geography` - Geographic data
- `GET /api/analytics/devices` - Device breakdown
- `GET /api/analytics/browsers` - Browser stats
- `GET /api/analytics/referrers` - Referrer data
- `GET /api/analytics/heatmap` - Activity heatmap

### Other Routes
- `GET /health` - Health check
- `GET /:shortCode` - Redirect short URL to original URL

## Seed Data

The seed script in `backend/prisma/seed.js` creates:

- Test user: `test@example.com`
- Test password: `password123`
- 3 example links and random analytics clicks

## License

MIT
