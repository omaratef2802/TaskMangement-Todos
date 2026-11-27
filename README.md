# TaskFlow — Task Management System

TaskFlow is a collaborative task-management application with an Angular frontend and an Express/MongoDB backend. Users can organize personal work, assign teammates, track individual progress, discuss tasks, attach files, review completed work, and receive notifications.

The backend and frontend are integrated in the `main` branch. The previous working branches are retained as development history.

## Project components

| Component | Technology | Location |
|---|---|---|
| Backend API | Node.js, Express 5, MongoDB/Mongoose, Socket.IO | [`backend/`](backend/) |
| Frontend | Angular 22, TypeScript, Bootstrap 5.3, RxJS, Socket.IO Client | [`frontend/`](frontend/) |

## Main capabilities

- Authentication, registration, password recovery, and role-based admin access.
- Task creation, editing, filtering, categories, priorities, deadlines, and soft deletion.
- Task assignment, invitations, and independent progress tracking for each assignee.
- Comments, activity history, and Cloudinary file attachments.
- Review and approval workflow for submitted work.
- Persistent notifications and real-time updates with Socket.IO.
- Calendar and dashboard views that include assigned tasks.
- Admin tools for managing users and reviewing tasks.
- Light, dark, and system theme options.

## Requirements

- Node.js 24 or newer and npm.
- MongoDB (local instance or MongoDB Atlas).
- Cloudinary credentials for attachment and profile-image uploads.
- SMTP credentials for email-based flows and deadline reminders.
- Google OAuth credentials only if Google sign-in is enabled.

## Run locally

Clone the repository:

```bash
git clone https://github.com/omaratef2802/TaskMangement-Todos.git
cd TaskMangement-Todos
```

### 1. Start the backend

```bash
cd backend
npm install
```

Create `backend/.env` using the variables documented in [Backend setup](backend/README.md), then run:

```bash
npm start
```

The API defaults to `http://localhost:3000/api`.

### 2. Start the frontend

In a second terminal, from the repository root:

```bash
cd frontend
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200). The development environment points to the local backend at `http://localhost:3000`.

## Documentation

- [Backend setup and configuration](backend/README.md)
- [Backend API reference](backend/TODO_API.md)
- [Frontend setup and implemented screens](frontend/README.md)

## Repository status

`main` contains both application components. Keep credentials in local environment files; never commit `.env` files, API keys, database connection strings, or OAuth secrets.
