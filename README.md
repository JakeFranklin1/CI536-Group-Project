**ADMIN LOGIN: USER = a@a.com PASS: a**

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

Make sure the `.env` file is in the project root with the appropriate API keys.

## 5. Run the Development Server

Start the backend:

```bash
npm run dev
```

https://github.com/user-attachments/assets/36eb23cf-f7c9-481b-a5fd-0e327fbc4967

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
