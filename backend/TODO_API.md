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

## Comments and activity

| Method | Endpoint | Description |
|---|---|---|
| GET | `/comments/:todoId` | Owner/assignee lists comments |
| POST | `/comments/:todoId` | Owner/assignee adds comment |
| PATCH | `/comments/:todoId/:commentId` | Author or owner edits comment |
| DELETE | `/comments/:todoId/:commentId` | Author or owner deletes comment |
| GET | `/activity/:id` | Owner/assignee reads activity history |

Comment body: `{ "text": "I have started working on this task." }`. Comment length: 1-2000 characters. Activity tracks creation, edits, assignment, unassignment, individual status changes, comments, soft deletion and restoration.

## Due date reminders

After MongoDB connects, a background check runs immediately and every 15 minutes. It emails the owner and current assignees once when an active, incomplete todo enters the 24-hour deadline window. Configure `Email_User` and `Email_Password` for Gmail SMTP. A unique index prevents duplicate reminders per todo and recipient.

## Soft delete

Normal lists and stats exclude trashed todos. Delete and clear operations set `deletedAt`; use trash and restore endpoints to recover. Permanent delete also removes comments, activity and reminder records.

## Query options

`page` (default 1), `limit` (1-100, default 10), `sortBy` (createdAt, updatedAt, deadline, title, status, priority), `order` (asc/desc), `status` (not-started/in-progress/done), `priority` (low/medium/high), `type` (task/todo), `category`, `search` (partial title), `overdue` (true/false). Dates use ISO 8601.

Recurring todos are intentionally not included.
