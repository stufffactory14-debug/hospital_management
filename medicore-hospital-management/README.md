# MediCore - Hospital Management System

MediCore is a production-oriented hospital management system being built as a MERN portfolio project. This foundation separates the React client and Express API for future clinical and administrative modules.

## Tech stack

- MongoDB (connected in a later phase)
- Express.js and Node.js
- React with Vite

## Project structure

```text
medicore-hospital-management/
├── client/                 # React + Vite frontend
├── server/                 # Express API
│   └── src/
│       ├── app.js          # Express configuration and routes
│       └── server.js       # HTTP server entry point
├── docs/                   # Project documentation
├── .gitignore
├── package.json            # Root development scripts
└── README.md
```

## Local setup

Install Node.js 20 or later, then from the project root run:

```bash
npm install
npm install --prefix client
npm install --prefix server
npm run dev
```

The Vite app runs at the URL printed by Vite (normally `http://localhost:5173`), and the API runs at `http://localhost:5000`.

## Development commands

```bash
npm run dev       # Run client and server concurrently
npm run client    # Run only the React client
npm run server    # Run only the Express API
npm run build     # Create a production frontend build
```

Health check: `GET http://localhost:5000/api/health`

Future phases will add authentication, role-based access, appointments, medical records, prescriptions, billing, dashboards, and deployment configuration.
