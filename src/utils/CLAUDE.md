# Utils CLAUDE.md

## terminal.ts - AppleScript Pitfalls

### Escaping Strings

Never use `JSON.stringify()` to escape strings for AppleScript. It produces `\"` which AppleScript doesn't understand. Instead use direct escaping:

```typescript
const safe = str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
```

### Scope in `tell` Blocks

Inside a `tell current window` block, don't use `current session of current window` - just use `current session`. Nested references like `current window of current window` cause `-1728` errors.

### iTerm Session Names

The `name` property of an iTerm session may not be exactly what you set with escape sequences. It can include the running command or shell prompt. Use `contains` for matching rather than exact equality.

### Accessing Session Variables

You cannot access arbitrary session variables like `path` - you'll get "Access not allowed" errors. Stick to documented properties like `name`.

### Tab Title Persistence

To make iTerm tab names persist, use terminal escape sequences before running commands:

```typescript
const titleCmd = `printf '\\033]0;${tabName}\\007'`;
const fullCmd = `${titleCmd} && ${actualCommand}`;
```

AppleScript's `set name of session` doesn't stick.

## xlaude.ts - CLI Integration

### PATH Issues

The xlaude binary is typically in `~/.cargo/bin`. Raycast's sandboxed environment has a minimal PATH, so we extend it with common locations. If a command fails with "command not found", check `getExtendedPath()`.

### Error Extraction

xlaude outputs errors to stderr. The `extractErrorMessage()` function checks stderr first, then stdout, then falls back to the Error message.
