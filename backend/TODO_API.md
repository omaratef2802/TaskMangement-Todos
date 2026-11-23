# Todo API

JWT is sent directly in the `Authorization` header without the `Bearer` prefix. Base URL: `/api/todo`.

## Todo and assignment endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/addTodo` | Create todo |
| GET | `/AllTodos` | List active todos with pagination/filter/sort |
| GET | `/AllTodosUsers` | Admin: list active todos for all users |
| GET | `/todo/:id` | Get one active owned todo |
| GET | `/AllTodoByTitle?title=...` | Search by title |
| GET | `/AllTodoByStatus?status=...` | Filter by owner status |
| GET | `/stats` | Active todo statistics |
| PATCH | `/updateTodo/:id` | Update todo |
| PATCH | `/assign/:id` | Owner assigns users |
| PATCH | `/unassign/:id` | Owner removes assignee |
| GET | `/assignableUsers` | Search assignable users |
| GET | `/assignedToMe` | Todos assigned to current user |
| GET | `/assignedByMe` | Todos assigned by current user |
| PATCH | `/assigned/:id/status` | Update only current assignee's status |
| DELETE | `/deleteTodo/:id` | Move todo to trash |
| DELETE | `/clearTodo` | Move all active todos to trash |
| GET | `/trash` | List deleted todos |
| PATCH | `/restore/:id` | Restore a todo |
| DELETE | `/permanent/:id` | Permanently delete a todo already in trash |

Assignment payloads: `{ "userIds": ["USER_ID_1", "USER_ID_2"] }`; unassign: `{ "userId": "USER_ID_1" }`; assignee status: `{ "status": "in-progress" }`.

Each assignee has a separate status in `assignedStatuses`; updating one assignee does not change the owner's status or another assignee's status. Maximum 20 assignees.

## Attachments

| Method | Endpoint | Description |
|---|---|---|
| POST | `/:id/attachments` | Upload one or more task attachments |
| DELETE | `/:id/attachments/:attachmentId` | Delete an attachment |

Upload using `multipart/form-data` with the field name `attachments`. Send up to 5 files per request, 10 MB per file, and 20 files per task. Supported types: JPG, PNG, WEBP, PDF, TXT, CSV, DOC, DOCX, XLS, XLSX, PPT, PPTX, and ZIP.

The task owner and assigned users can upload and view attachments. Only the task owner or the user who uploaded a specific file can delete it. Files are stored in Cloudinary; metadata (original name, secure URL, MIME type, size, uploader and upload date) is stored on the task document. The existing profile-image Multer configuration is kept separate and unchanged.

## Comments and activity

| Method | Endpoint | Description |
|---|---|---|
| GET | `/comments/:todoId` | Owner/assignee lists comments |
| POST | `/comments/:todoId` | Owner/assignee adds comment |
| PATCH | `/comments/:todoId/:commentId` | Author or owner edits comment |
| DELETE | `/comments/:todoId/:commentId` | Author or owner deletes comment |
| GET | `/activity/:id` | Owner/assignee reads activity history |

Comment body: `{ "text": "I have started working on this task." }`. Comment length: 1-2000 characters. Activity tracks creation, edits, assignment, unassignment, individual status changes, comments, attachments, soft deletion and restoration.

## Due date reminders

After MongoDB connects, a background check runs immediately and every 15 minutes. It emails the owner and current assignees once when an active, incomplete todo enters the 24-hour deadline window. Configure `Email_User` and `Email_Password` for Gmail SMTP. A unique index prevents duplicate reminders per todo and recipient.

## Soft delete

Normal lists and stats exclude trashed todos. Delete and clear operations set `deletedAt`; use trash and restore endpoints to recover. Permanent delete also removes comments, activity and reminder records.

## Query options

`page` (default 1), `limit` (1-100, default 10), `sortBy` (createdAt, updatedAt, deadline, title, status, priority), `order` (asc/desc), `status` (not-started/in-progress/done), `priority` (low/medium/high), `type` (task/todo), `category`, `search` (partial title), `overdue` (true/false). Dates use ISO 8601.

Recurring todos are intentionally not included.

## Notifications and Socket.IO

All notification REST endpoints require the same JWT in the `Authorization` header used by the rest of the API (without the `Bearer ` prefix).

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications?page=1&limit=20` | List the current user's notifications |
| GET | `/api/notifications?isRead=false` | List unread notifications |
| GET | `/api/notifications/unread-count` | Get unread count |
| PATCH | `/api/notifications/:id/read` | Mark one notification as read |
| PATCH | `/api/notifications/read-all` | Mark all notifications as read |
| DELETE | `/api/notifications/:id` | Delete one notification |
| DELETE | `/api/notifications/clear` | Clear current user's notifications |

Socket.IO connects to the same HTTP server. The client sends its JWT in the Socket.IO handshake auth object:

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: { token: YOUR_JWT_TOKEN },
});

socket.on("notification:new", (notification) => {
  console.log(notification);
});
```

The server authenticates the socket with the JWT and joins it to a private `user:<userId>` room. Notifications are stored in MongoDB before the `notification:new` event is emitted. Events are currently created for task assignment/removal, assignee status changes, task updates/deletion, comments, and successful 24-hour deadline reminders.

Install dependencies after pulling the changes with `npm install`. For a frontend running on another origin, set `CLIENT_URL` in `.env` to its allowed origin (comma-separated origins are supported). The server defaults to permissive CORS when `CLIENT_URL` is not set; configure it for production.
