# Peerpocket

## Structure

The project is monorepo managed by bun
- /app is main frontend app using react, Tanstack Router, Tanstack Form, MUI, Tailwind, and Tinybase
- /server is the backend based on bun
- /libs is a shared functions
- /tests contain playwright e2e tests for each route

## Rules

- Use MUI component and related styling https://mui.com/material-ui/llms.txt
- Prefer Tailwind class over custom CSS
- Always use tab for indent
- Always name new file using kebab-case
- Do not edit routeTree.gen.ts directly, it is auto generated
- After finishing any task, run the following commands in the project root
  - Check type with `bun run check`, all errors and warnings must be fixed
  - Lint with `bun run lint`, all errors and warnings must be fixed
  - Any changes to the user-side functionality should add/update corresponded e2e tests in /tests
  - Always run all e2e test with `bun run test`, all tests must be passed
- Human will get in the loop and edit some file along the way. If you spot it, please respect those changes
