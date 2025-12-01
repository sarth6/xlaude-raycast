# xlaude for Raycast

<p align="center">
  <img src="https://github.com/user-attachments/assets/60f3e98b-329d-471c-9674-c5f418e741b2" width="128" height="128" alt="xlaude icon">
</p>

A [Raycast](https://raycast.com) extension for managing [xlaude](https://github.com/anthropics/xlaude) worktrees—isolated git worktree environments for AI-assisted coding sessions.

## Why xlaude + Raycast? 🤖

**xlaude** lets you run multiple AI coding sessions in parallel (Claude, Codex, etc.), each in its own git worktree. This means you can:
- Work on multiple features simultaneously without branch switching
- Keep each agent's context isolated per task
- Easily clean up when done

**This Raycast extension** brings that workflow to your fingertips:
- Launch new coding sessions in seconds from Raycast
- See all active sessions and their last messages at a glance
- Open any session directly in iTerm with your agent ready to go
- Clean up finished sessions without touching the terminal

## Installation 📦

### Prerequisites

1. **xlaude** - Install the xlaude CLI:
   ```bash
   cargo install xlaude
   ```

2. **Raycast** - Download from [raycast.com](https://raycast.com)

### Install the Extension

```bash
# Clone this repository
git clone https://github.com/anthropics/xlaude-raycast.git
cd xlaude-raycast

# Install dependencies
npm install
```

Then start the extension:

```bash
npm run dev
```

## Commands 🛠️

### List Worktrees
View all your active xlaude worktrees with session information. See the last message from each session and how long ago it was active.

### Open Worktree
Select a worktree to open in your terminal. Automatically runs `xlaude open` to resume your session.

### Create Worktree
Create a new worktree for a fresh coding session. Optionally provide a name, or let xlaude generate one.

### Checkout Branch/PR
Check out an existing branch or GitHub PR number into a new worktree. Great for code review or picking up someone else's work.

### Create Worktree from Ticket
Instantly create a worktree named after a ticket ID (e.g., `ENG-123`). Perfect for Linear, Jira, or any ticket-based workflow.

### Delete Worktree
Remove a worktree when you're done. Automatically closes any associated iTerm tabs/panes.

### Delete All Worktrees
Nuclear option—remove all worktrees at once. Useful for weekly cleanup.

## Configuration

Open Raycast preferences (`⌘ + ,`) and find the xlaude extension to configure:

| Setting | Description |
|---------|-------------|
| **xlaude Binary Path** | Path to xlaude (default: searches common locations like `~/.cargo/bin`) |
| **Default Repository Path** | Your main repository where worktrees are created |
| **Terminal Application** | iTerm, Terminal.app, or Warp |
| **Use Split Panes** | Open worktrees in split panes instead of new tabs (iTerm only) |
| **Max Panes per Tab** | Maximum split panes per tab: 2, 3, or 4 (iTerm only) |

## Pro Tips 🪄

### Instant Ticket-to-Session Workflow ✨

Set up a Raycast Quicklink to instantly create a worktree from your clipboard:

1. Open Raycast Settings → Extensions → xlaude
2. Create a Quicklink with this URL (replace `YOUR_RAYCAST_USERNAME` with your Raycast username—find it at [raycast.com/account](https://raycast.com/account)):
   ```
   raycast://extensions/YOUR_RAYCAST_USERNAME/xlaude/create-from-ticket?arguments=%7B%22ticketId%22%3A%22{clipboard}%22%7D
   ```
3. Assign a hotkey (e.g., `⌘ + Shift + C`)

Now your workflow becomes:
1. Copy a ticket ID from Linear/Jira/GitHub (e.g., `ENG-456`)
2. Press your hotkey
3. A new worktree is created and your agent opens, ready to work on that ticket

### Split Pane Workflow

Enable split panes in preferences to keep related worktrees side-by-side. When you open a second worktree, it automatically splits into the existing tab. The tab title updates to show both worktree names (e.g., `feature-a / feature-b`).

### Session Visibility

The List Worktrees command shows the last message from each session. Use this to quickly remember what you were working on or check progress across multiple sessions.

## Terminal Support 💻

| Terminal | Features |
|----------|----------|
| **iTerm** | Full support: tab naming, split panes, auto-close on delete |
| **Terminal.app** | Basic support: new tabs with custom titles |
| **Warp** | Basic support: new tabs |

## Development 🧑‍💻

```bash
# Run in development mode (hot reload)
npm run dev

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build for production
npm run build
```

## Publishing to Raycast Store

To publish this extension to the Raycast Store:

1. Create a Raycast account at [raycast.com](https://raycast.com)
2. Find your Raycast username at [raycast.com/account](https://raycast.com/account) (it's the handle shown under your profile, not your display name)
3. Update the `author` field in `package.json` to your Raycast username
4. Run `npm run publish`

Note: The `author` field must exactly match your registered Raycast username for store publishing to work.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT - see [LICENSE](LICENSE) for details.
