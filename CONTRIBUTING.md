# Contributing to CloudSpire

Welcome to the CloudSpire team! To ensure smooth collaboration, avoid conflicts, and maintain a clean project history, we follow a structured Git workflow. 

Please read and adhere to the following guidelines before contributing to the project.

## 1. Branch Strategy
- **Never work directly on the `main` branch.**
- Create a new, descriptively named branch for every feature or task.
- **Naming Conventions:**
  - Features: `feature/short-description` (e.g., `feature/login-ui`)
  - Bug Fixes: `fix/bug-name` (e.g., `fix/cart-calculation`)

## 2. Syncing Your Local Environment
- **Pull Before Work:** Always pull the latest code from `main` before starting any new work or creating a new branch.
  ```bash
  git checkout main
  git pull origin main
  ```
- After syncing, branch off to start your work:
  ```bash
  git checkout -b feature/your-feature-name
  ```

## 3. Commit Guidelines
- Make **small, meaningful commits**.
- Write clear, concise commit messages that describe *what* was changed.
- Examples:
  - `"Added login UI"`
  - `"Fixed cart calculation bug"`

## 4. Pushing and Pull Requests (PRs)
- **Push Regularly:** Push your branch to the remote repository frequently to back up your work.
  ```bash
  git push origin feature/your-feature-name
  ```
- **Create a Pull Request:** When your work is ready, create a Pull Request (PR) to merge your branch into `main`.
- **Review Process:** 
  - Do **NOT** merge your own PR. 
  - Wait for at least one team member to review and approve your code.
- **Testing:** Ensure your code is thoroughly tested (both locally and via automated tests if available) before requesting a review.

## 5. Handling Conflicts
If merge conflicts occur between your branch and `main`:
1. Pull the latest `main`: `git pull origin main` (while on your branch).
2. Manually resolve the conflicts in your editor.
3. Test your code again to ensure the resolution didn't break functionality.
4. Commit the resolved changes and push.

## 6. Code Consistency & Communication
- Follow the established folder structure and naming conventions in the repository.
- **Do not randomly change other team members' code** without prior discussion.
- **Communicate Major Changes:** Inform the team before making significant architectural changes or refactoring large portions of the codebase.
- Use code comments and detailed commit messages to explain complex logic or non-obvious decisions.

---
*Following these guidelines ensures that everyone works without conflicts, the latest code is always available, and our project history remains clean and organized.*
