# Knowledge Hub API

This is a REST API for a Knowledge Hub platform built with Nest.js. The application allows users to create, edit, and organize articles by categories and tags, featuring persistent data management with PostgreSQL/Prisma and database-level cascading logic.

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

### Generate Prisma Client and apply migrations

npx prisma generate
npx prisma migrate dev

### Run the seed script to populate the database

npx prisma db seed

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

### Database Performance:

Database indexes added to Article.status, Article.categoryId, and Tag.name for optimized queries.

Connection pooling enabled via connection_limit in the DATABASE_URL.

Efficient data fetching using Prisma include to avoid the N+1 problem.

### Tag Management: Articles use the connectOrCreate pattern to manage tags automatically during creation or updates.

### Cascading Logic (Database Level via Prisma)

- Deleting a User nullifies their Articles' `authorId` and removes their Comments.
- Deleting a Category nullifies related Articles' `categoryId`.
- Deleting an Article removes all associated Comments.

---

## Testing

Note: Ensure the database is running and all migrations have been applied (npx prisma migrate dev) before running tests, as they now interact with a real PostgreSQL instance.

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

## AI Integration (Google Gemini)

This project integrates Google's Gemini AI to provide intelligent features for articles, such as summarization, translation, and technical analysis.

### How to obtain a Gemini API Key (Step-by-step)

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click on **"Get API key"** in the left sidebar.
4. Click the **"Create API key"** button, create it in a new or existing project, and copy the generated key.

### Model Used

The application uses the **`gemini-2.0-flash`** model by default, configured via environment variables.

### Setup & Configuration

After cloning the repository and installing dependencies, you must configure the AI environment variables. Add the following to your `.env` file and replace `your-gemini-api-key` with your actual key:

\`\`\`env
GEMINI_API_KEY=your-gemini-api-key
GEMINI_API_BASE_URL=https://generativelanguage.googleapis.com
GEMINI_MODEL=gemini-2.0-flash
AI_RATE_LIMIT_RPM=20
AI_CACHE_TTL_SEC=300
\`\`\`

### How to test the AI endpoints

1. Ensure the server is running (`npm run start:dev` or `npm start`).
2. Open the Swagger UI at `http://localhost:4000/doc`.
3. Authenticate by executing `POST /auth/login` with valid credentials and copy the `accessToken`.
4. Click the green **"Authorize"** padlock at the top of the Swagger page, paste your token, and click Authorize.
5. Scroll down to the **`ai`** section.
6. Test endpoints like `POST /ai/articles/{articleId}/summarize` (using an existing article ID) or `POST /ai/generate`.
7. Check the usage counters at `GET /ai/usage`.

### Known Limitations

- **Free-tier Quotas & Regional Availability:** Depending on your specific Google account and region, the free tier for `gemini-2.0-flash` might have zero quota or strict limits. If the Google API rejects the request (429 Too Many Requests), the application handles it gracefully and returns a structured `503 Service Unavailable` response to the client.
- **Latency:** Text generation tasks can take a few seconds to process depending on Google's server load and the requested output length.

## Debugging in VSCode

Press `<kbd>F5</kbd>` to start debugging using the provided launch configurations in `.vscode/launch.json`.

---

## Docker Infrastructure

### Security Scanning Results

A security scan was performed on the final image to comply with Assignment 06a requirements.

Tool: Docker Scout

### Summary:

Critical: 0

High: 0

Medium: 0

Low: 0

The image uses node:24-alpine as a base to minimize vulnerabilities and keep the total size under 500MB.

### Prerequisites

- Docker and Docker Compose installed
- .env file configured based on .env.example

### Getting Started

To build and run the application and database:

docker-compose up --build

The API will be available at:
http://localhost:4000

Swagger documentation is accessible at:
http://localhost:4000/doc

### Database Administration

To run Adminer for database management, use the debug profile:

docker-compose --profile debug up

Adminer will be available at:
http://localhost:8080

### Docker Hub Image

Public image available at:
https://hub.docker.com/r/diegoworks/nodejs-2026q1-knowledge-hub-app

## Logging & Error Handling (Assignment 09)

The application implements a production-ready logging system and a centralized error handling layer.

### Features:

- **Custom Logger:** Built-in `MyLogger` with support for different log levels (`log`, `debug`, `warn`, `error`, `verbose`) via the `LOG_LEVEL` environment variable.
- **Request/Response Logging:** All incoming HTTP requests (Method, URL, Query, Body) and outgoing responses (Status Code, Time) are logged.
- **Data Sanitization:** Sensitive information such as `password` and `tokens` are automatically replaced with `[REDACTED]` in the logs using a recursive sanitization algorithm.
- **Log File Rotation:** Logs are written to `logs/app.log`. When the file exceeds `LOG_MAX_FILE_SIZE` (default 1MB), it is automatically rotated with a timestamp suffix.
- **Global Exception Filter:** A centralized filter catches all unhandled exceptions, logs the full stack trace, and returns a standardized JSON response.
- **Custom Error Classes:** Implementation of `NotFoundError`, `ValidationError`, `UnauthorizedError`, and `ForbiddenError` to provide precise HTTP status codes.
- **Graceful Shutdown:** The application listens for `uncaughtException` and `unhandledRejection` to log fatal errors, close database connections (Prisma), and shut down the server safely.

### Configuration (Environment Variables):

- `LOG_LEVEL`: Defines the minimum level of logs to display (default: `log`).
- `LOG_MAX_FILE_SIZE`: Defines the maximum size of the log file in KB before rotation (default: `1024`).
