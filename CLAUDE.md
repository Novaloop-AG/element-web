# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Prerequisites

- Node.js >= 22.18
- Yarn 1.x (classic)

## Commands

### Setup
- `yarn install` - Install dependencies
- Copy `config.sample.json` to `config.json` and configure (see docs/config.md)

### Development
- `yarn start` - Run development server on http://localhost:8080
- `yarn start:https` - Run development server with HTTPS
- `yarn build` - Production build (outputs to webapp/)
- `yarn dist` - Create distribution tarball

**Linux note**: If builds fail silently or with `EMFILE: too many open files`, increase inotify limits:
```bash
sudo sysctl fs.inotify.max_user_watches=131072
sudo sysctl fs.inotify.max_user_instances=512
```

### Testing
- `yarn test` - Run Jest unit tests
- `yarn test:playwright` - Run Playwright e2e tests
- `yarn test:playwright:open` - Open Playwright test UI
- `yarn coverage` - Run tests with coverage reporting

To run a single test file:
- `yarn test path/to/test-file.test.ts`
- `yarn test:playwright path/to/e2e-test.ts`

### Code Quality
- `yarn lint` - Run all linters (TypeScript, ESLint, Stylelint)
- `yarn lint:js-fix` - Auto-fix ESLint issues
- `yarn lint:types` - TypeScript type checking only
- `yarn lint:style` - Check CSS/PostCSS styles

### Utilities
- `yarn make-component` - Scaffold new React component
- `yarn i18n` - Manage translations
- `yarn storybook` - Run Storybook on port 6007

## Architecture

This is Element Web, a Matrix client built with React and TypeScript, customized as "HealthChat". Key architectural patterns:

### Component Structure
The application follows a hierarchical component structure:
- `MatrixChat` - Root component managing the entire application state
- `LeftPanel` - Room list, spaces, and navigation
- `MainSplit` - Central room view with messages and input
- `RightPanel` - Member list, room info, and contextual panels

Components are organized in `/src/components/`:
- `/structures/` - Major layout components
- `/views/` - Reusable UI components grouped by function (auth, dialogs, messages, rooms, settings)

### State Management
Uses Flux architecture with:
- Centralized dispatcher in `/src/dispatcher/`
- Stores in `/src/stores/` as singletons (access via `FooStore.instance`)
- Dispatch actions: `dis.dispatch({ action: Action.FOO, ...payload })` or `dis.fire(Action.FOO)` for action-only

### Styling
- PostCSS files with `.pcss` extension
- BEM-like naming: `mx_ComponentName_element`
- Component styles co-located with components (e.g., `_MessageTile.pcss`)
- Theming via CSS custom properties

### Matrix Integration
- Uses `matrix-js-sdk` for all Matrix protocol operations
- Client instance accessed via `MatrixClientPeg`
- Room and event handling through SDK abstractions

### Module System
Plugin architecture in `/src/modules/`:
- Allows runtime extension of functionality
- Module API for registering custom components and handlers

### Testing Patterns
- Unit tests in `/test/unit-tests/` using Jest
- E2E tests in `/playwright/e2e/` using Playwright
- Mock Matrix client and SDK extensively in tests
- Component tests via Storybook

### Important Conventions
- TypeScript strict mode - always use explicit types
- Functional components with hooks preferred over class components (except "structures" which use classes)
- Translations use `_t()` function with hierarchical keys
- 4-space indentation, 120 character line limit
- Component files: UpperCamelCase, utilities: kebab-case
- Use `Optional<T>` type instead of truly optional parameters when callers should explicitly acknowledge missing values
- CSS class names must be prefixed with `mx_` and match component name (e.g., `mx_RoomTile`)
- Import matrix-js-sdk via `matrix-js-sdk/src/matrix` only (not `matrix-js-sdk` or `matrix-js-sdk/src`)
- Use `jest-matrix-react` instead of `@testing-library/react` for component tests
- No `React.forwardRef` - use ref props directly instead
- Use UIStore for window dimensions instead of `window.innerHeight`/`window.innerWidth`
- Use Media helper for MXC URL handling instead of direct `mxcUrlToHttp` calls

### Linked Development with matrix-js-sdk
For developing against local SDK changes:
```bash
# In matrix-js-sdk directory
yarn link && yarn install

# In element-web directory
yarn link matrix-js-sdk && yarn install && yarn start
```