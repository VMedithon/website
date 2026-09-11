# Working agreements

This repository is the public frontend. Keep server implementation, credentials, database schemas, internal infrastructure details, and confidential operational documentation in the separate private backend repository. Browser code is public; do not treat hidden UI as access control.

Always work on a branch and open a pull request. Never merge unless explicitly asked. Cloudflare bot CI/CD deploys this website. Never deploy the website manually or replace its existing hosting configuration.

Preserve the public event website when adding portal routes. Use only publishable configuration in VITE_ variables. Run the build, typecheck, lint, and relevant portal tests before opening a PR.
