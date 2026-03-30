# Peerpocket

## Structure

The project is monorepo managed by bun
- /app is main frontend app using react, Tanstack Router, Tanstack Form, MUI, Tailwind, and Tinybase
- /server is the backend based on bun
- /libs is a shared functions

## Rules

- Prefer Tailwind class over custom CSS
- Always use tab for indent
- Do not edit routeTree.gen.ts directly, it is auto generated
- Any edit on app source code should be tested by running `bun run test` in /app
