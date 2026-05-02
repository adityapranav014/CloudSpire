# 🤝 CloudSpire — Contribution & Git Collaboration Guide

> **Rule #1:** Never push directly to `main`. Every change goes through a branch + Pull Request.

---

## Table of Contents

1. [One-Time Setup](#one-time-setup)
2. [Daily Workflow](#daily-workflow)
3. [Branch Naming](#branch-naming)
4. [Commit Messages](#commit-messages)
5. [Pull Requests](#pull-requests)
6. [Resolving Conflicts](#resolving-conflicts)
7. [Folder & Code Conventions](#folder--code-conventions)
8. [Quick Reference Cheatsheet](#quick-reference-cheatsheet)

---

## One-Time Setup

```bash
# 1. Clone the repo (only needed once per machine)
git clone https://github.com/adityapranav014/CloudSpire.git
cd CloudSpire

# 2. Set your identity (if not already global)
git config user.name  "Your Name"
git config user.email "you@example.com"

# 3. Install dependencies
cd backend  && npm install && cd ..
cd Frontend && npm install && cd ..

# 4. Create your .env files (NEVER commit these)
#    backend/.env  →  copy from backend/.env.example
#    (ask a teammate for the actual values)
```

---

## Daily Workflow

### Before starting ANY work

```bash
# Step 1 — Go back to main and pull the latest changes
git checkout main
git pull origin main

# Step 2 — Create your feature/fix branch
git checkout -b feature/your-feature-name
```

### While working

```bash
# Check what changed
git status
git diff

# Stage and commit in small logical units
git add <specific-files>          # ✅ prefer specific files over `git add .`
git commit -m "feat: short clear description"

# Push your branch early & often (even if WIP)
git push origin feature/your-feature-name
```

### When your feature is done

```bash
# 1. Sync with latest main one more time before opening PR
git fetch origin
git rebase origin/main            # or: git merge origin/main

# 2. Run tests
cd backend  && npm test && cd ..

# 3. Push final state
git push origin feature/your-feature-name

# 4. Open a Pull Request on GitHub →
#    Base: main  |  Compare: feature/your-feature-name
```

---

## Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| New feature | `feature/<name>` | `feature/socket-io-realtime` |
| Bug fix | `fix/<name>` | `fix/azure-auth-token` |
| Docs / chore | `chore/<name>` | `chore/update-readme` |
| Hotfix (urgent) | `hotfix/<name>` | `hotfix/jwt-expiry-crash` |
| Refactor | `refactor/<name>` | `refactor/cloud-controller` |

> **Rules:**
> - Lowercase, hyphens only — no spaces, underscores, or slashes inside the name part.
> - Keep it short but descriptive (≤ 40 chars total).
> - **Never** use: `main`, `master`, `dev`, `test`, `temp`, `wip` as standalone branch names.

---

## Commit Messages

Follow the **Conventional Commits** format:

```
<type>(<optional scope>): <short description>

[optional body — explain the WHY, not the what]
```

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Build tasks, dependency updates |
| `docs` | Documentation only |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `style` | Formatting (no logic change) |
| `perf` | Performance improvement |

**Good examples:**
```
feat(auth): add JWT refresh token rotation
fix(dashboard): resolve NaN in cost KPI calculation
chore: upgrade axios to v1.7
docs: add GCP setup steps to CONTRIBUTING
```

**Bad examples:**
```
fix stuff          ← too vague
final commit       ← meaningless
WIP                ← never push this to shared branches
```

---

## Pull Requests

### Opening a PR

1. Go to `https://github.com/adityapranav014/CloudSpire/pulls`
2. Click **New Pull Request**
3. **Base:** `main` | **Compare:** `your-branch`
4. Fill in the PR template:
   - **What changed?** — 2–3 sentences
   - **Why?** — motivation / linked issue
   - **How to test?** — steps to verify locally
   - **Screenshots** — for any UI change

### PR Rules

- ✅ At least **1 teammate review** before merging
- ✅ All CI checks must pass
- ✅ No merge conflicts (rebase/resolve first)
- ❌ **Do NOT merge your own PR** unless the team agrees in advance
- ❌ Do NOT force-push to `main`

### After merge

```bash
# Clean up your local branch
git checkout main
git pull origin main
git branch -d feature/your-feature-name
```

---

## Resolving Conflicts

```bash
# 1. Fetch and merge latest main into your branch
git checkout main
git pull origin main
git checkout feature/your-feature-name
git merge main

# 2. Git will mark conflicting files — open them and look for:
#    <<<<<<< HEAD       ← your changes
#    =======
#    >>>>>>> main       ← their changes

# 3. Edit the file to keep the correct final version
#    (talk to the other dev if unsure!)

# 4. Mark resolved and commit
git add <resolved-file>
git commit -m "fix: resolve merge conflict in <filename>"

# 5. Re-run tests before pushing
npm test

# 6. Push
git push origin feature/your-feature-name
```

> **Golden rule:** When in doubt about whose code wins — **talk first, merge second.**

---

## Folder & Code Conventions

### Project layout

```
CloudSpire/
├── backend/
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── services/      # Business logic (awsService, azureService…)
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # Express routers
│   │   └── middleware/    # Auth, error handler
│   └── tests/
└── Frontend/
    └── src/
        ├── components/    # Reusable React components
        ├── pages/         # Route-level page components
        ├── hooks/         # Custom React hooks
        ├── context/       # React context providers
        └── utils/         # Pure helper functions
```

### Naming rules

| Thing | Convention | Example |
|-------|-----------|---------|
| React component file | PascalCase | `Dashboard.jsx` |
| React component function | PascalCase | `function CostCard()` |
| Hook | camelCase with `use` prefix | `useMigrationData.js` |
| Service file (backend) | camelCase + `Service` | `awsService.js` |
| Controller file | camelCase | `cloud.js` |
| CSS class | kebab-case | `.cost-card__title` |
| Environment variable | UPPER_SNAKE_CASE | `AWS_ACCESS_KEY_ID` |

### Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|---------|
| Import only what you use | `import * as X` unless necessary |
| Keep components < 200 lines | Dump everything in one file |
| Write a `// TODO:` comment for incomplete logic | Leave broken code silently |
| Use `catchAsync` wrapper in controllers | Forget try/catch in async routes |
| Add `.env` keys to `.env.example` (no values!) | Commit actual secrets |

---

## Quick Reference Cheatsheet

```bash
# ── Start of day ─────────────────────────────────────────
git checkout main && git pull origin main
git checkout -b feature/my-task

# ── During work ──────────────────────────────────────────
git add src/components/MyComponent.jsx
git commit -m "feat(ui): add cost breakdown card"
git push origin feature/my-task

# ── Ready for PR ─────────────────────────────────────────
git fetch origin && git rebase origin/main
git push origin feature/my-task --force-with-lease   # safe force after rebase
# → Open PR on GitHub

# ── After PR merged ──────────────────────────────────────
git checkout main && git pull origin main
git branch -d feature/my-task

# ── Emergency: undo last commit (keep changes) ───────────
git reset --soft HEAD~1

# ── See what's different from main ───────────────────────
git diff main...feature/my-task

# ── Stash unfinished work temporarily ────────────────────
git stash
git stash pop
```

---

> **Questions?** Drop a message in the team chat before making any large structural change.  
> **Docs last updated:** May 2026
