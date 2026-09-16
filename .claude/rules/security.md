# Security Rules

All agents follow these. `reviewer` checks every item on this list before approving anything.

## 1. Input validation & sanitization

Validate and sanitize at every entry point where data comes from outside the system — form submissions, query params, API request bodies, file uploads. Never trust client-side validation alone; re-validate on the server.

## 2. Database access

- **Parameterized queries / prepared statements only.** Never build a query by concatenating raw strings with user input — this is the #1 rule, no exceptions.
- Least-privilege DB user for the application (not a root/admin DB account).

## 3. Authentication & sessions

- Passwords hashed with a strong, salted algorithm — never stored plaintext or reversibly encrypted.
- Session tokens random, expiring, and invalidated on logout.
- Sensitive actions (password change, payment, delete account) re-check the current session/permissions server-side, not just client-side.

## 4. Secrets

- No credentials, API keys, or tokens committed to the repository — ever, including in comments or old commits.
- All secrets come from environment variables or a secrets manager. Keep a `.env.example` with placeholder values so setup is documented without exposing real secrets.

## 5. Output handling

- Escape output rendered into HTML to prevent XSS; never inject raw user input into a page without escaping.
- Production error responses must not leak stack traces, file paths, or internal query details to the end user — log the detail internally, show a generic message externally.

## 6. Authorization

Every endpoint/action checks that the current user is allowed to do that specific thing to that specific resource — not just "is logged in," but "is logged in AND owns/can access this record."

## 7. Dependencies

Keep third-party packages up to date; check for known vulnerabilities before adding a new dependency, especially for anything handling auth, payments, or file uploads.
