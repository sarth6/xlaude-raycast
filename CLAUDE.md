# CLAUDE.md

This is a Raycast extension for managing xlaude worktrees (git worktree-based Claude coding sessions).

## Build & Development

```bash
npm install
npm run dev      # Development mode with hot reload
npm run build    # Production build
npm run lint     # Run ESLint
npx tsc --noEmit # Type check without emitting
```

## Architecture

- `src/*.tsx` - Raycast command entry points (list, open, create, delete, etc.)
- `src/utils/xlaude.ts` - xlaude CLI wrapper functions
- `src/utils/terminal.ts` - Terminal integration (iTerm, Terminal.app, Warp)
- `package.json` - Extension manifest with commands and preferences

## Key Gotchas

### Shell Execution Environment
Raycast runs in a sandboxed environment with a minimal PATH. The `getExtendedPath()` function in `xlaude.ts` adds common binary locations (`~/.cargo/bin`, `/opt/homebrew/bin`, etc.). Always use `getExecOptions()` which sets `shell: "/bin/bash"` - without this, you'll get `env: sh: No such file or directory` errors.

### Preference Values are Strings
Dropdown preferences return string values, not numbers. Always parse them:
```typescript
const maxPanes = parseInt(maxPanesPerTab || "2", 10);
```

### Reserved Keyboard Shortcuts
Don't use `⌘,` as a shortcut - it's reserved by Raycast for opening preferences.
