# Ride Aid Kenya — Final Year Project

A lightweight admin dashboard and frontend for Ride Aid Kenya — a transit occupancy, payment simulation, and feedback system built with React, TypeScript, Vite and Tailwind CSS.

## Table of Contents

- Project overview
- Features
- Tech stack
- Repo layout
- Getting started
- Development
- Build
- Contributing
- License & Contact

## Project overview

This repository contains the frontend for the Ride Aid Kenya project (final year project). The main UI is located in `front/ride-aid-kenya` and includes pages for admin dashboard, occupancy management, payment simulation and feedback.

## Features

- Admin dashboard and login
- Occupancy display and update components
- Payment simulation flow and ticket QR generation
- Feedback form and data table components

## Tech stack

- Frontend: React + TypeScript
- Bundler: Vite
- Styling: Tailwind CSS

## Repo layout (important paths)

- `front/ride-aid-kenya` — frontend application
  - `src/` — React source
    - `pages/` — page components (AdminDashboard, AdminLogin, etc.)
    - `components/` — UI components and shared primitives

## Getting started

Prerequisites:

- Node.js 18+ (or compatible)
- npm or pnpm

Quick start:

1. Open a terminal at the workspace root.
2. Install dependencies and start the dev server:

```
cd front/ride-aid-kenya
npm install
npm run dev
```

The app runs on the port shown by Vite (usually `http://localhost:5173`).

## Development

- Linting and formatting are configured in the frontend package; run commands from `front/ride-aid-kenya` as needed.
- Add components in `src/components` and pages in `src/pages`.

## Build

To create a production build and preview it:

```
cd front/ride-aid-kenya
npm run build
npm run preview
```

## Contributing

- Create a branch per feature/fix.
- Open a pull request describing your changes.
- Keep changes focused and add small, testable commits.

## License & Contact

This project is provided for academic purposes. Add a license file if you plan to publish it publicly.

For questions or help, contact the project owner.
