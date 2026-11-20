# Todo API

All endpoints use the `/api/todo` base path. Protected endpoints require the JWT in the `Authorization` header (without the `Bearer` prefix).

## Todo endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/addTodo` | Authenticated | Create a todo |
| GET | `/AllTodos` | Owner | List your todos with pagination and filters |
| GET | `/AllTodosUsers` | Admin | List all todos |
| GET | `/todo/:id` | Owner | Get one owned todo |
| GET | `/AllTodoByTitle?title=...` | Owner | Search your todos by title |
| GET | `/AllTodoByStatus?status=...` | Owner | List your todos by status |
| GET | `/stats` | Owner | Get your todo statistics |
| PATCH | `/updateTodo/:id` | Owner | Update todo fields |
| DELETE | `/deleteTodo/:id` | Owner | Delete one owned todo |
| DELETE | `/clearTodo` | Owner | Delete all your todos |

### Create a todo

`POST /api/todo/addTodo`

```json
{
  "title": "Finish Node.js task",
  "description": "Complete the Express service",
  "type": "task",
  "priority": "high",
  "category": "backend",
  "deadline": "2026-12-01T18:00:00.000Z"
}
```

### List, filter, sort, and paginate

`GET /api/todo/AllTodos?page=1&limit=10&sortBy=createdAt&order=desc&search=Node&status=in-progress&priority=high`

Supported query parameters:
- `page`: positive integer; defaults to `1`.
- `limit`: integer from 1 to 100; defaults to `10`.
- `sortBy`: `createdAt`, `updatedAt`, `deadline`, `title`, `status`, or `priority`.
- `order`: `asc` or `desc`.
- `status`: `not-started`, `in-progress`, or `done`.
- `priority`: `low`, `medium`, or `high`.
- `type`: `task` or `todo`.
- `category`: exact category.
- `search`: case-insensitive partial title search.
- `overdue`: `true` or `false`. Completed todos are not overdue.

List responses include `data` and a `pagination` object with `page`, `limit`, `total`, and `totalPages`.

The `GET /api/todo/stats` response also includes assignment counters under `assignments`: `assignedToMe`, `assignedByMe`, and `unassigned`.

## Team assignment

A todo can be assigned to up to 20 users. The todo owner manages the assignment. All assignees currently share the todo's single status field: when one assignee changes the status, the status changes for the whole todo.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/assignableUsers` | Authenticated | Search users that can be assigned |
| PATCH | `/assign/:id` | Todo owner | Assign one or more users |
| PATCH | `/unassign/:id` | Todo owner | Remove one user from the assignment |
| GET | `/assignedToMe` | Authenticated | List todos assigned to you |
| GET | `/assignedByMe` | Authenticated | List todos you assigned to others |
| PATCH | `/assigned/:id/status` | Assigned user | Update the shared todo status |

### Find users to assign

`GET /api/todo/assignableUsers?search=omar&page=1&limit=10`

The response exposes only public profile fields (name, username, and image), not passwords or email addresses.

### Assign users

`PATCH /api/todo/assign/TODO_ID`

```json
{
  "userIds": [
    "USER_ID_1",
    "USER_ID_2"
  ]
}
```

The service validates IDs and user existence, ignores duplicate assignments, and enforces the 20-assignee limit across the complete assignment list.

### Remove an assignee

`PATCH /api/todo/unassign/TODO_ID`

```json
{
  "userId": "USER_ID_1"
}
```

### Update status as an assignee

`PATCH /api/todo/assigned/TODO_ID/status`

```json
{
  "status": "in-progress"
}
```

Assignees can update status only. They cannot edit the title, description, deadline, priority, owner, or assignment list, and cannot delete the todo. The owner retains full control of the todo.

## Notes

- Every owner operation is scoped by both the todo ID and authenticated owner ID.
- Assignment operations use MongoDB atomic update operators to avoid replacing the full assignee array.
- Todo list queries are paginated and capped at 100 records per page.
- Dates should be sent as ISO 8601 values.
