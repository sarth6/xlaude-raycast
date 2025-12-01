import {
  ActionPanel,
  Action,
  List,
  Icon,
  Color,
  showToast,
  Toast,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { listWorktrees, Worktree } from "./utils/xlaude";
import { openXlaudeInTerminal } from "./utils/terminal";

export default function Command() {
  const { isLoading, data: worktrees } = usePromise(listWorktrees);

  const handleOpen = async (worktree: Worktree) => {
    try {
      await showToast({
        style: Toast.Style.Animated,
        title: "Opening worktree...",
      });
      // Pass all known worktree names so split pane logic can verify tabs
      const allWorktreeNames = (worktrees || []).map((w) => w.name);
      await openXlaudeInTerminal(worktree.name, worktree.path, allWorktreeNames);
      await showToast({
        style: Toast.Style.Success,
        title: `Opened ${worktree.name}`,
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to open",
        message: String(error),
      });
    }
  };

  const getSessionInfo = (worktree: Worktree): string => {
    const sessions = worktree.sessions || [];
    const codexSessions = worktree.codex_sessions || [];
    const totalSessions = sessions.length + codexSessions.length;

    if (totalSessions === 0) return "No sessions";

    const latestSession = sessions[0];
    if (latestSession?.time_ago) {
      return `Last: ${latestSession.time_ago}`;
    }

    return `${totalSessions} session${totalSessions > 1 ? "s" : ""}`;
  };

  const getLastMessage = (worktree: Worktree): string | undefined => {
    const sessions = worktree.sessions || [];
    if (sessions.length > 0 && sessions[0].last_user_message) {
      const msg = sessions[0].last_user_message;
      return msg.length > 50 ? msg.substring(0, 50) + "..." : msg;
    }
    return undefined;
  };

  // Sort worktrees by most recent session activity
  const sortedWorktrees = [...(worktrees || [])].sort((a, b) => {
    const aTime = a.sessions?.[0]?.time_ago || "";
    const bTime = b.sessions?.[0]?.time_ago || "";
    // This is a simple sort - items with time_ago will appear first
    if (aTime && !bTime) return -1;
    if (!aTime && bTime) return 1;
    return 0;
  });

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search worktrees to open..."
    >
      {sortedWorktrees.map((worktree) => (
        <List.Item
          key={`${worktree.repo_name}/${worktree.name}`}
          icon={{ source: Icon.Terminal, tintColor: Color.Blue }}
          title={worktree.name}
          subtitle={getLastMessage(worktree)}
          accessories={[
            { tag: worktree.repo_name },
            { text: getSessionInfo(worktree), icon: Icon.Clock },
          ]}
          actions={
            <ActionPanel>
              <Action
                title="Open in Terminal"
                icon={Icon.Terminal}
                onAction={() => handleOpen(worktree)}
              />
              <Action.OpenWith
                path={worktree.path}
                shortcut={{ modifiers: ["cmd"], key: "o" }}
              />
              <Action.ShowInFinder
                path={worktree.path}
                shortcut={{ modifiers: ["cmd", "shift"], key: "f" }}
              />
              <Action.CopyToClipboard
                title="Copy Path"
                content={worktree.path}
                shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
              />
            </ActionPanel>
          }
        />
      ))}
      {!isLoading && sortedWorktrees.length === 0 && (
        <List.EmptyView
          icon={Icon.Terminal}
          title="No Worktrees Found"
          description="Create a new worktree first using the Create Worktree command"
        />
      )}
    </List>
  );
}
