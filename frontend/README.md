# TaskFlow — Angular Frontend

A standalone Angular 22 frontend for the integrated TaskFlow application. The `main` branch contains both frontend and backend.

## Requirements
- Node.js 24+
- npm
- MongoDB-backed API running locally (see the backend README / environment setup)

## Run locally
From the repository root:

```bash
cd frontend
npm install
npm start
```

Open http://localhost:4200.

The development API is configured in `src/environments/environment.development.ts`:
- REST API: `http://localhost:3000/api`
- Socket.IO: `http://localhost:3000`

For deployment, replace the sample host in `src/environments/environment.ts`.

If the frontend runs on a different origin, configure the backend `CLIENT_URL` to allow that origin.

## Implemented screens and workflows

### Authentication
- Sign in and registration
- Forgot password → email OTP → verify OTP → reset password
- Authenticated routes and admin-only route protection
- JWT sent in the `Authorization` header without the `Bearer` prefix

### Organizations and workspaces
- Create and manage organizations
- Add registered users as organization members
- Create multiple workspaces inside an organization
- Create and manage projects inside a workspace
- Open a project's task list; new tasks created from that view are attached to the project
- Organization membership is checked by the backend for project and task access

### Workspace
- Dashboard statistics and recent tasks
- My tasks, Assigned to me, Assigned by me
- Search, status, priority, type, category, due-date and sorting filters
- Pagination, create, edit, status updates, move one/all tasks to trash
- Task detail page with owner/assignee-aware access
- Collaborator assignment and removal (up to the backend limit)
- Per-assignee status updates
- Comments: add, edit and delete according to backend permissions
- Activity history
- Attachments: upload up to 5 per request, image previews, open/download and permission-aware delete
- Calendar derived from task deadlines, including assigned tasks
- Notifications: live Socket.IO refresh, read one/all, delete one/all
- Trash: restore and permanently delete
- Profile: edit personal information, upload profile image, change password
- Admin panel: list/delete users and review all active tasks
- Light, Dark and System theme preferences
- Responsive desktop and mobile layout

## Backend contract
The UI uses the backend routes under `/api/user`, `/api/todo`, `/api/organizations` and `/api/notifications`. The API service is the single place for request definitions. Multipart uploads deliberately let the browser set the multipart content type and boundary.

The calendar is a frontend view built from task deadlines; the backend does not expose a separate calendar endpoint.

## Build
```bash
npm run build
```

The repository GitHub Actions workflow also builds this frontend on pushes to `main`.

## Branch separation
This branch contains the frontend implementation independently. It is not merged into `Backend-omaratef` or `main`. Integration should happen only after the frontend and backend are reviewed together.

## Integration note

The current backend Google OAuth callback responds with a JSON token payload rather than redirecting back into the Angular application. The frontend keeps the backend branch untouched; completing Google sign-in end-to-end requires a small callback redirect integration on the separate backend branch. Email/password authentication and OTP password recovery use the existing API directly.
