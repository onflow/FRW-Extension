# FRW-Extension Development Guide

## Commands

- Build dev: `pnpm build:dev`
- Build production: `pnpm build:pro`
- Lint: `pnpm lint` or `pnpm lint:fix`
- Format: `pnpm format` or `pnpm format:fix`
- Test: `pnpm test` (watch mode) or `pnpm test:run` (single run)
- Run specific test: `pnpm test <file-pattern>` or `pnpm test --testNamePattern="<test name>"`
- E2E tests: `pnpm test:e2e` or `pnpm test:e2e:ui` (with UI)

## Code Style

- **File naming**: Use snake-case for source files
- **Components**: Use TitleCase (PascalCase) for component names
- **Imports**: Group imports (builtin → external → internal → parent → sibling → index)
- **Types**: Prefer type imports, strict typing, avoid explicit 'any'
- **React**: Functional components, avoid direct DOM manipulation
- **Error handling**: Use try/catch blocks with specific error types
- **Structure**: UI components in src/ui/FRWComponent, hooks in src/ui/hooks, background services in src/background/service

This project is a Chrome extension Web3 wallet using React.js, TypeScript, MUI, and Firebase for authentication. Always use pnpm for package management.

## Project Structure

- src/ui: React components
- src/background: Background scripts and services
- src/content: Content scripts
- src/popup: Popup UI
- src/shared: Shared types andutilities
