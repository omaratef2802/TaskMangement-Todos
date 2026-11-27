# Backend — TaskFlow API

Node.js and Express API for the TaskFlow task-management application. The server uses MongoDB/Mongoose for persistence and Socket.IO for authenticated real-time updates.

## Requirements

- Node.js 24+
- npm
- MongoDB local instance or MongoDB Atlas

Optional integrations:
- Cloudinary for task attachments and profile images.
- SMTP credentials for OTP email and deadline reminders.
- Google OAuth credentials for Google sign-in.

## Installation

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory. Configure only the integrations you use:

```dotenv
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/todos
SECRET=replace_with_a_long_random_jwt_secret
CLIENT_URL=http://localhost:4200

# Cloudinary uploads
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email (Gmail SMTP)
Email_User=
Email_Password=

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/user/google/callback
```

Use your actual Cloudinary and OAuth configuration names from your provider dashboard. Keep the file private and never commit real credentials.

## Run

```bash
npm start
```

The server connects to MongoDB before starting the HTTP server and Socket.IO. The default port is `3000`.

## Checks

```bash
npm run check
```

This runs Node.js syntax checks on `server.js` and JavaScript files under `src`. It is a syntax check, not a substitute for API, database, upload, or multi-user Socket.IO integration tests.

## Architecture

- `server.js` — environment loading, MongoDB connection, HTTP server, Socket.IO, and reminder scheduler.
- `src/app.js` — Express middleware, CORS, routes, and centralized error handling.
- `src/config` — database, Cloudinary, email, Passport, Multer, and Socket.IO configuration.
- `src/routers` — user, task, notification, and admin routes.
- `src/controllers` — HTTP request handlers.
- `src/services` — business logic for users, tasks, collaboration, invitations, attachments, notifications, and reminders.
- `src/modules` — Mongoose models.
- `src/middlewares` — authentication and request middleware.

## API and real-time contract

- REST base path: `/api`.
- Task endpoints: `/api/todo`.
- Notification endpoints: `/api/notifications`.
- Admin endpoints: `/api/admin`.
- JWT is sent directly in the `Authorization` header without the `Bearer` prefix.
- Socket.IO authenticates with `auth: { token }` and joins the authenticated user's private room.
- Relevant socket events include `notification:new` and `todo:changed`.

See [TODO_API.md](TODO_API.md) for endpoint details and payload examples.