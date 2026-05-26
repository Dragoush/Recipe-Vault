# Recipe Vault

Recipe Vault is a full-stack web application for organising and managing personal recipes.
It allows users to browse a recipe collection, view detailed cooking information, create and edit entries, and explore collection-level statistics through a React frontend and a FastAPI backend.

The project was developed as a progressive full-stack application, preserving both the earlier in-memory implementation and the later PostgreSQL-backed version.

## Features

- Browse a paginated recipe collection
- View full recipe details, including ingredients and preparation steps
- Create, update and delete recipes
- View collection-level recipe statistics
- Validate recipe data on both the frontend and backend
- Support pagination and basic backend-side filtering
- Preserve both:
  - an API-backed frontend data source
  - a RAM-based frontend data source (which makes the front-end standalone)
- Preserve both:
  - an in-memory backend repository
  - a PostgreSQL-backed backend repository

## Tech Stack

### Frontend

- React
- Vite
- JavaScript / JSX
- React Router
- React Hook Form
- Zod
- Vitest

### Backend

- Python
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- Pytest

### Tooling

- Docker, optional
- Git

## Architecture

The backend follows a layered architecture:

`routes -> services -> repositories`

This keeps responsibilities clearly separated:

- route modules handle HTTP concerns
- services contain application logic
- repositories manage storage implementations

The project preserves two backend repository modes:

- `memory` for in-memory storage
- `database` for PostgreSQL persistence

On the frontend, recipe data can also be sourced from:

- the backend API
- a preserved RAM-based frontend source

## Setup

### Prerequisites

Make sure you have the following installed:

- Node.js 18+
- npm
- Python 3.11+
- PostgreSQL
- Docker optional, for running PostgreSQL locally

### 1. Clone the repository

```bash
git clone https://github.com/Dragoush/Recipe-Vault.git
cd Recipe-Vault
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Set up the backend virtual environment

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:

**Windows**
```bash
.venv\Scripts\activate
```

**Linux / macOS**
```bash
source .venv/bin/activate
```

Install backend dependencies:

```bash
pip install -e .[dev]
```

## Environment Configuration

### Backend

Create `backend/.env` based on `backend/.env.example`.

Example:

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/recipes_db
TEST_DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/recipes_db_test
REPOSITORY_BACKEND=database
```

`REPOSITORY_BACKEND` supports:

- `memory`
- `database`

### Frontend

Create a root `.env` file for the Vite frontend:

```env
VITE_BACKEND_URL=http://127.0.0.1:8000
```

If the frontend runs on another machine or in a virtual machine, set `VITE_BACKEND_URL` to the actual backend machine address.

## Database Setup

If you are using PostgreSQL directly, make sure the database exists and the connection string matches `DATABASE_URL`.

If you prefer Docker, you can run PostgreSQL in a container and point the backend to it through `backend/.env`.

Run migrations from the `backend` directory:

```bash
alembic upgrade head
```

## Running the Application

### Start the backend

From the `backend` directory:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Start the frontend

From the project root:

```bash
npm run dev
```

The frontend will typically be available at:

```text
http://localhost:5173
```

## Running Frontend and Backend on Different Machines

This project supports running the frontend and backend on different machines on the same LAN.

1. Start the backend with:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

2. Set the frontend `.env` file to point to the backend machine:

```env
VITE_BACKEND_URL=http://<BACKEND_IP>:8000
```

3. Update the backend CORS allow-list in:

```text
backend/app/core/allowed_ip_list.txt
```

Add the exact frontend origin, including the port.

4. Make sure your firewall and local network allow traffic on the required ports.

## Frontend Data Source Notes

The frontend preserves both an API-based recipe source and a RAM-based recipe source.

By default, the API source is active.

The active frontend source is selected manually in:

```text
src/features/recipes/activeRecipeSource.js
```

This allows the UI to remain usable both with the live backend and with the preserved in-memory frontend flow.

## API Overview

### Recipes

- `GET /api/recipes`
- `POST /api/recipes`
- `GET /api/recipes/{recipeId}`
- `PUT /api/recipes/{recipeId}`
- `DELETE /api/recipes/{recipeId}`

### Statistics

- `GET /api/recipes/statistics`

## Future Improvements

- Authentication and authorization (in progress, on a4 branch)
- HTTPS support for secure cross-machine communication (planned next)
- Deployment to a public cloud environment (planned next)
- Recipe image uploads
- More advanced filtering and search
