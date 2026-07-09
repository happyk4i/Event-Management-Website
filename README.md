# Event Management Platform

A modern event management platform built with React, Vite, Express, and Prisma. The app allows users to browse events, register/login, manage referrals and points, and complete ticket purchases with coupons and reward points.

## Overview

This project is designed as a full-stack web application for event discovery and booking. It includes:
- A responsive frontend for users and organizers
- A backend API built with Express and TypeScript
- Prisma ORM with PostgreSQL database support
- Referral-based reward system with points and coupons
- Transaction and reporting flows for organizers

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

## Workflow

1. User registers or logs in.
2. User browses event listings and selects an event.
3. User completes checkout using available discounts, coupon, or points.
4. The backend creates a transaction record and updates seat availability.
5. Organizers can review transaction reports and event-related statistics.

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

## Scripts

```bash
npm run dev      # start the development server
npm run build    # build frontend and backend
npm run lint     # type-check the project
```

## Notes

The current implementation focuses on a lightweight preview/demo experience and uses in-memory or simplified logic for some flows such as authentication and reward handling. It is suitable for local development and early-stage product validation.
