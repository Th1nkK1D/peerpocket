# Peerpocket

## Structure

The project is monorepo managed by bun
- /app is main frontend app using react, Tanstack Router, Tanstack Form, MUI, Tailwind, and Tinybase
  - /app/tests contain playwright tests for each route. When you create or make changes to a route, please also create or update the corresponding test file
- /server is the backend based on bun
- /libs is a shared functions

## Rules

- Prefer Tailwind class over custom CSS
- Always use tab for indent
- Do not edit routeTree.gen.ts directly, it is auto generated
- Should run all test with `bun run test` in /app after finish the task related to /app package
