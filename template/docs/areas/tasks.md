# Tasks

A person's to-do list. Every task belongs to the user who created it; nobody else can see or change it.

## Words

- **Task**: something to do, with a title (1 to 200 characters, trimmed) and whether it's completed.
- **Owner**: the user who created the task (the `sub` of their token).

## Rules

- A task can only be completed, never reopened. Completing it twice is fine (nothing changes).
- Someone else's task answers 404, never 403: it must not reveal that the task exists.
- Lists are newest first, paginated by cursor (default 20, at most 100).

## Permissions

| Permission | Allows |
|---|---|
| `tasks:read` | list and read your tasks |
| `tasks:write` | create and complete your tasks |
