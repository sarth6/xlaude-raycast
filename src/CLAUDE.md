# Commands CLAUDE.md

## Command Types

- `mode: "view"` - Shows a UI (List, Form, etc.)
- `mode: "no-view"` - Runs instantly without UI, shows toast notifications

`create-from-ticket.ts` uses `no-view` mode for instant execution from quicklinks.

## Raycast Patterns

### usePromise Hook

For async data fetching, use `usePromise` from `@raycast/utils`:

```typescript
const { isLoading, data, revalidate } = usePromise(listWorktrees);
```

### Toast Notifications

```typescript
await showToast({
  style: Toast.Style.Success, // or .Failure, .Animated
  title: "Title",
  message: "Details",
});
```

### Confirmation Dialogs

```typescript
const confirmed = await confirmAlert({
  title: "Delete?",
  message: "This cannot be undone",
  primaryAction: {
    title: "Delete",
    style: Alert.ActionStyle.Destructive,
  },
});
```

### Arguments

Arguments defined in `package.json` are accessed via the command props:

```typescript
export default function Command(props: { arguments: { name?: string } }) {
  const { name } = props.arguments;
}
```

## Common Issues

### Action Style

Use `Action.Style.Destructive` for delete actions - it renders them in red.

### popToRoot

Call `popToRoot()` after completing destructive actions to return to Raycast home.
