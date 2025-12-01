# xlaude for Raycast

<p align="center">
  <img src="https://github.com/user-attachments/assets/60f3e98b-329d-471c-9674-c5f418e741b2" width="128" height="128" alt="xlaude icon">
</p>

<p align="center">
  <i>Because typing commands in a terminal is mass too much work.</i>
</p>

A [Raycast](https://raycast.com) extension for managing [xlaude](https://github.com/Xuanwo/xlaude) worktrees—isolated git worktree environments for AI-assisted coding sessions.

## The Origin Story 😴

I discovered [xlaude](https://github.com/Xuanwo/xlaude) and [Raycast](https://raycast.com) around the same time. xlaude was amazing—multiple Claude/Codex sessions in parallel, each in its own git worktree!

But then I realized I'd have to:
1. Open a terminal
2. Navigate to my repo
3. Type `xlaude create ENG-123`
4. Wait for it to finish
5. Type `xlaude open`

Five whole steps? In this economy? Unacceptable.

So I built this Raycast extension. Now I copy a ticket ID from Linear, press one hotkey, and I'm coding. The way it should be.

## The Dream Workflow ✨

```
1. Copy ticket ID from Linear/Jira/GitHub
2. Press hotkey
3. You're coding with AI
```

That's it. That's the whole thing. [Set up the Quicklink](#the-one-hotkey-setup-) and never think about it again.

## Installation 📦

### Prerequisites

1. **xlaude** - Install the xlaude CLI:
   ```bash
   cargo install xlaude
   ```

2. **Raycast** - Download from [raycast.com](https://raycast.com)

### Install the Extension

```bash
git clone https://github.com/Xuanwo/xlaude-raycast.git
cd xlaude-raycast
npm install
npm run dev
```

## The One-Hotkey Setup 🪄

This is the good stuff. Set up a Raycast Quicklink to go from clipboard → coding:

1. Open Raycast Settings → Extensions → xlaude
2. Create a Quicklink with this URL (replace `YOUR_RAYCAST_USERNAME` with your Raycast username):
   ```
   raycast://extensions/YOUR_RAYCAST_USERNAME/xlaude/create-from-ticket?arguments=%7B%22ticketId%22%3A%22{clipboard}%22%7D
   ```
3. Assign a hotkey (e.g., `⌘ + Shift + C`)

Now: copy ticket → press hotkey → AI agent ready. You're welcome.

## All Commands 🛠️

| Command | What it does |
|---------|-------------|
| **Create from Ticket** ⭐ | The star of the show. Ticket ID → worktree → iTerm → AI agent. One command. |
| **List Worktrees** | See all your sessions with last messages. Remember what you were doing. |
| **Open Worktree** | Resume a session. Supports iTerm split panes. |
| **Create Worktree** | Start fresh with a custom name. |
| **Checkout Branch/PR** | Pull a branch or PR into a new worktree. Great for reviews. |
| **Delete Worktree** | Clean up. Auto-closes iTerm tabs too. |
| **Delete All** | Nuclear option. Weekly cleanup in one click. |

## Configuration ⚙️

Open Raycast preferences (`⌘ + ,`) → xlaude:

| Setting | Description |
|---------|-------------|
| **xlaude Binary Path** | Usually auto-detected from `~/.cargo/bin` |
| **Default Repository Path** | Your main repo for worktrees |
| **Terminal Application** | iTerm, Terminal.app, or Warp |
| **Use Split Panes** | Side-by-side worktrees in iTerm |
| **Max Panes per Tab** | 2, 3, or 4 panes per tab |

## Terminal Support 💻

| Terminal | Tab Naming | Split Panes | Auto-close |
|----------|:----------:|:-----------:|:----------:|
| **iTerm** | ✅ | ✅ | ✅ |
| **Terminal.app** | ✅ | ❌ | ❌ |
| **Warp** | ✅ | ❌ | ❌ |

## Development 🧑‍💻

```bash
npm run dev      # Development mode
npm run build    # Production build
npm run lint     # Lint
npx tsc --noEmit # Type check
```

## License

MIT
