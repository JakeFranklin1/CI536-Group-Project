# Environment Setup Guide

## 1. Install Required Software

For both Windows & macOS, install:

- [Node.js (v18 or later)](https://nodejs.org/)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Git (Windows)](https://git-scm.com/download/win) | [Git (macOS)](https://git-scm.com/download/mac)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [PostgreSQL](https://www.postgresql.org/download/)

## VS Code Extensions (Recommended Plugins)

Inside VS Code, install the following extensions:

| Extension                      | Purpose                                     |
| ------------------------------ | ------------------------------------------- |
| ESLint                         | Enforces coding style and highlights issues |
| Prettier - Code formatter      | Automatically formats code                  |
| DotENV                         | Syntax highlighting for `.env` files        |
| REST Client                    | Allows testing API routes inside VS Code    |
| GitLens                        | Enhances Git functionality in VS Code       |
| PostgreSQL (if using Supabase) | Helps manage and query local PostgreSQL DB  |

## 2. Clone the GitHub Repository

```bash
git clone https://github.com/JakeFranklin1/CI536-Group-Project.git
```

## 3. Install Project Dependencies

Run the following command inside the project folder:

```bash
npm install
```

## 4. Set Up Environment Variables

Create a `.env` file in the project root and add API keys and secrets:

**_TODO: ADD EXAMPLE FILE_**

## 5. Run the Development Server

Start the backend:

```bash
npm run dev
```

# Additional Notes

## Git Workflow for Collaboration

Since multiple people are coding, **we need a clear Git workflow** to prevent conflicts.

## Branching Strategy

### Main Branches

- **Main branch** (`main`)
  - Contains stable code
  - No direct commits allowed

### Development Branches

- **Feature branches** (`feature-xyz`)
  - Each member works on a separate branch
  - Named according to feature being developed

### Maintenance Branches

- **Bug fix branches** (`bugfix-xyz`)
  - Used specifically for fixing issues
  - Named according to bug being fixed

Example workflow:

```bash
# Create and switch to a new feature branch
git checkout -b feature-login

# Make changes and commit
git add .
git commit -m "Add login functionality"

# Push changes to remote
git push origin feature-login

# When ready to merge
git checkout main
git pull origin main
git merge feature-login
```

# Project Structure

## 1. `backend/` (Node.js & Express)

Contains all your **server-side** logic, including routes, controllers, database models, and any middleware.

- **controllers/**: Handles requests and responses for different routes
- **routes/**: Define the API endpoints
- **models/**: Contains the database models, schemas, and logic to interact with the database (this can include Supabase tables and queries)
- **services/**: Integrates with third-party APIs (e.g., IGDB API for game data)
- **middleware/**: Express middleware functions for authentication, validation, etc.
- **utils/**: Helper functions (e.g., for generating tokens, formatting data, etc.)
- **server.js**: Main entry point for the Express server
- **.env**: Environment variables (e.g., Supabase credentials)

## 2. `frontend/` (HTML, CSS, JS)

Contains all the **client-side** code, from UI components to handling the interaction with the backend.

- **assets/**: Static files like images, icons, and fonts
- **pages/**: The various pages in the app (e.g., `LoginPage.html`, `MarketplacePage.html`)
- **services/**: Functions that handle the communication with the backend API
- **styles/**: Global CSS files that provide styles for the application
- **.env**: Environment variables specific to frontend

## 3. `database/` (Supabase)

Contains files related to **database configuration** and **schema management**.

- **migrations/**: For managing database migrations if you use the Supabase CLI to apply schema changes
- **seeders/**: Initial seed data for populating the database
- **supabase_config.json**: Configuration for the Supabase instance

## 4. `tests/` (Testing)

Contains all your **automated tests**, including unit, integration, and end-to-end tests.

- **unit/**: Unit tests using Jest to test individual functions or small units of functionality
- **integration/**: Integration tests using Supertest to test API endpoints and their behavior
- **e2e/**: End-to-end tests using Cypress for UI and user flow testing
- **jest.config.js**: Jest configuration file for unit tests
- **cypress.json**: Cypress configuration for setting up E2E tests

## 5. `.github/` (GitHub Actions & CI/CD)

This folder holds your **CI/CD workflows** (e.g., for running tests on pull requests, deployments, etc.).

- **workflows/**: YAML files for setting up GitHub actions (e.g., for testing or deployment)
- **.gitignore**: Files and directories that Git should ignore (e.g., `node_modules/`, `.env`, etc.)
