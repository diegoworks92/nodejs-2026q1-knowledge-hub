# Knowledge Hub API

This is a REST API for a Knowledge Hub platform built with Nest.js. The application allows users to create, edit, and organize articles by categories and tags, featuring in-memory data management and cascading logic for deletions.

---

## Prerequisites

- Git - Download & Install Git.
- Node.js - Download & Install Node.js (Version 24.x.x recommended).
- npm package manager.

---

## Getting Started

### Clone the repository

```bash
git clone <repository-url>
```

### Install dependencies

```bash
npm install
```

### Run the application

The service listens on PORT 4000 by default (configured via `.env`).

```bash
npm start
```

After starting the app, you can access the OpenAPI (Swagger) documentation to explore and test the endpoints:

http://localhost:4000/doc/

---

## Features

- **Users (/user):** Manage accounts with roles (admin, editor, viewer). Passwords are encrypted and excluded from all server responses.

- **Articles (/article):** Create and filter articles by status, category, or tags.

- **Categories (/category):** Organize articles into logical groups.

- **Comments (/comment):** Add feedback to specific articles.

### Cascading Logic

- Deleting a User nullifies their Articles' `authorId` and removes their Comments.
- Deleting a Category nullifies related Articles' `categoryId`.
- Deleting an Article removes all associated Comments.

---

## Testing

### Core Functionality Tests

To run the automated test suite for the current task (CRUD and Business Logic):

```bash
npx jest test/users.e2e.spec.ts test/articles.e2e.spec.ts test/categories.e2e.spec.ts test/comments.e2e.spec.ts
```

> **Note:** These 4 suites contain 58 tests that must pass for this stage.

---

### Future Development Tests

The `test/` directory contains additional suites (`auth`, `rbac`, `refresh`) prepared for future development phases. These are expected to fail until the authentication and authorization modules are fully implemented in the next tasks.

---

## Linting and Formatting

To maintain code quality and follow the assignment rules:

- Run Linter:

```bash
npm run lint
```

- Format Code:

```bash
npm run format
```

> **IMPORTANT:**  
> The `test/` directory is excluded from linting and formatting (via `.eslintignore` and `.prettierignore`) to prevent any accidental modifications to the original test files, avoiding penalties.

---

## Debugging in VSCode

Press `<kbd>F5</kbd>` to start debugging using the provided launch configurations in `.vscode/launch.json`.
