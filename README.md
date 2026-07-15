# Event Management Platform

A modern event management platform built with React, Vite, Express, and Prisma. The app allows users to browse events, register/login, manage referrals and points, and complete ticket purchases with coupons and reward points.

## Overview

This project is designed as a full-stack web application for event discovery and booking. It includes:
- A responsive frontend for users and organizers
- A backend API built with Express and TypeScript
- Prisma ORM with PostgreSQL database support
- Referral-based reward system with points and coupons
- Transaction and reporting flows for organizers
- A modular UI refactor that breaks the main app into reusable components
- An AI-powered Event Assistant that is available only after login
- Activepieces automation for chatbot responses with database-backed event search

## Tech Stack

### Frontend
- React 19
- Vite
- TypeScript
- Tailwind CSS
- Recharts for analytics visualization
- Framer Motion for UI animations

### Backend
- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL (via Neon / Prisma compatible datasource)
- Activepieces webhook orchestration for chatbot automation

### Development Tools
- tsx for running TypeScript directly
- dotenv for environment configuration
- Prisma CLI for migrations and schema management

## Project Structure

```bash
client/           # React frontend
server/           # Express backend and Prisma schema
server/routes/    # API route handlers
server/prisma/    # Prisma schema and database models
assets/           # Static assets
```

## Main Features

- User registration and login
- Role-based access for Customers and Organizers
- Event listing and management
- Ticket purchasing flow
- Coupon and referral reward system
- Points balance tracking with expiry handling
- Transaction statistics for organizer dashboard
- Event Assistant chatbot with Activepieces automation
- Database-backed chatbot event search

## Workflow

1. User registers or logs in.
2. User browses event listings and selects an event.
3. User completes checkout using available discounts, coupon, or points.
4. The backend creates a transaction record and updates seat availability.
5. Organizers can review transaction reports and event-related statistics.
6. Logged-in users can open the Event Assistant to search events with AI help.

## Getting Started

### Prerequisites
- Node.js 18 or newer
- npm or pnpm
- PostgreSQL database connection string

### Installation

```bash
git clone <repository-url>
cd event-management-platform
npm install
```

### Environment Variables

Create a `.env` file in the project root with:

```env
DATABASE_URL=your_postgres_connection_string
PORT=3000
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=your_openrouter_model
```

### Run Development Server

```bash
npm run dev
```

The app will start locally on:

```bash
http://localhost:3000
```

## Database

This project uses Prisma with PostgreSQL. Common workflow:

```bash
npx prisma generate
npx prisma db push
```

If you want to create migrations:

```bash
npx prisma migrate dev
```

Seed data is available in [server/seed.ts](file:///c:/file%20adek/Personal%20Website/event-management-platform/server/seed.ts). It clears existing records first, then inserts demo users, events, coupons, point records, and transactions.

## Chatbot Automation

The chatbot route is backed by [server/routes/chat.ts](file:///c:/file%20adek/Personal%20Website/event-management-platform/server/routes/chat.ts).

- It first tries the Activepieces webhook:
  `https://cloud.activepieces.com/api/v1/webhooks/wwJvcE9OLekCzbpBIvbEt`
- If the webhook fails, it falls back to the local OpenRouter-backed AI flow.
- The chatbot queries the Neon database for matching events so responses stay relevant.
- The Event Assistant button is only shown after the user logs in.

## Scripts

```bash
npm run dev      # start the development server
npm run build    # build frontend and backend
npm run lint     # type-check the project
```

## Notes

The current implementation focuses on a lightweight preview/demo experience and uses simplified logic for some flows such as authentication and reward handling. It is suitable for local development and early-stage product validation.

