# TaskFlow — Task Management System

TaskFlow is a collaborative task-management application with an Angular frontend and an Express/MongoDB backend. Users can organize personal work, assign teammates, track individual progress, discuss tasks, attach files, review completed work, and receive notifications.

> **Repository layout:** the backend and frontend are maintained on separate working branches at the moment. The root `main` branch is the project landing page and documentation entry point; it does not yet contain the integrated application source.

## Project components

| Component | Technology | Working branch |
|---|---|---|
| Backend API | Node.js, Express 5, MongoDB/Mongoose, Socket.IO | [Backend-omaratef](https://github.com/omaratef2802/TaskMangement-Todos/tree/Backend-omaratef) |
| Frontend | Angular 22, TypeScript, Bootstrap 5.3, RxJS, Socket.IO Client | [Front-end/omaratef-task-invitations](https://github.com/omaratef2802/TaskMangement-Todos/tree/Front-end/omaratef-task-invitations) |

## Main capabilities

- Authentication, registration, password recovery, and role-based admin access.
- Task creation, editing, filtering, categories, priorities, deadlines, and soft deletion.
- Task assignment, invitations, and independent progress tracking for each assignee.
- Comments, activity history, and file attachments stored through Cloudinary.
- Review and approval workflow for submitted work.
- Notifications with Socket.IO events and a persistent notification center.
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

### 1. Start the backend

```bash
git clone https://github.com/omaratef2802/TaskMangement-Todos.git
cd TaskMangement-Todos
git checkout Backend-omaratef
cd backend
npm install
```

Create `backend/.env` using the variables documented in [Backend setup](https://github.com/omaratef2802/TaskMangement-Todos/blob/Backend-omaratef/backend/README.md), then run:

```bash
npm start
```

The API defaults to `http://localhost:3000/api`.

### 2. Start the frontend

In a second terminal, use a separate working directory or a second clone:

```bash
git clone --branch "Front-end/omaratef-task-invitations" https://github.com/omaratef2802/TaskMangement-Todos.git TaskFlow-frontend
cd TaskFlow-frontend/frontend
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200). The development environment points to the local backend at `http://localhost:3000`.

## Documentation

- [Backend setup and configuration](https://github.com/omaratef2802/TaskMangement-Todos/blob/Backend-omaratef/backend/README.md)
- [Backend API reference](https://github.com/omaratef2802/TaskMangement-Todos/blob/Backend-omaratef/backend/TODO_API.md)
- [Frontend setup and implemented screens](https://github.com/omaratef2802/TaskMangement-Todos/blob/Front-end/omaratef-task-invitations/frontend/README.md)

## Important integration note

The two working branches are intentionally kept separate for now. Review and integrate them together before treating `main` as the deployable, integrated application. Keep credentials in local environment files; never commit `.env` files, API keys, database connection strings, or OAuth secrets.