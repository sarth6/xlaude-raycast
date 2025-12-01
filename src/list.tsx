import {
  ActionPanel,
  Action,
  List,
  Icon,
  Color,
  showToast,
  Toast,
  confirmAlert,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { listWorktrees, deleteWorktree, Worktree } from "./utils/xlaude";
import { openXlaudeInTerminal } from "./utils/terminal";

export default function Command() {
  const { isLoading, data: worktrees, revalidate } = usePromise(listWorktrees);

  // Group worktrees by repo
  const worktreesByRepo = (worktrees || []).reduce(
    (acc, wt) => {
      const repo = wt.repo_name || "Unknown";
      if (!acc[repo]) {
        acc[repo] = [];
      }
      acc[repo].push(wt);
      return acc;
    },
    {} as Record<string, Worktree[]>,
  );

  const handleOpen = async (worktree: Worktree) => {
    try {
      await showToast({
        style: Toast.Style.Animated,
        title: "Opening worktree...",
      });
      await openXlaudeInTerminal(worktree.name, worktree.path);
      await showToast({
        style: Toast.Style.Success,
        title: "Opened in terminal",
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to open",
        message: String(error),
      });
    }
  };

  const handleDelete = async (worktree: Worktree) => {
    const confirmed = await confirmAlert({
      title: "Delete Worktree",
      message: `Are you sure you want to delete "${worktree.name}"? This will remove the worktree directory and local branch.`,
      primaryAction: {
        title: "Delete",
        style: undefined, // Will use destructive style
      },
    });

    if (!confirmed) return;

    try {
      await showToast({
        style: Toast.Style.Animated,
        title: "Deleting worktree...",
      });
      const result = await deleteWorktree(worktree.name);
      if (result.success) {
        await showToast({
          style: Toast.Style.Success,
          title: "Worktree deleted",
        });
        revalidate();
      } else {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to delete",
          message: result.message,
        });
      }
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to delete",
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
      return `${totalSessions} session${totalSessions > 1 ? "s" : ""} • Last: ${latestSession.time_ago}`;
    }

    return `${totalSessions} session${totalSessions > 1 ? "s" : ""}`;
  };

  const getLastMessage = (worktree: Worktree): string | undefined => {
    const sessions = worktree.sessions || [];
    if (sessions.length > 0 && sessions[0].last_user_message) {
      const msg = sessions[0].last_user_message;
      return msg.length > 60 ? msg.substring(0, 60) + "..." : msg;
    }
    return undefined;
  };

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search worktrees...">
      {Object.entries(worktreesByRepo).map(([repoName, repoWorktrees]) => (
        <List.Section
          key={repoName}
          title={repoName}
          subtitle={`${repoWorktrees.length} worktrees`}
        >
          {repoWorktrees.map((worktree) => (
            <List.Item
              key={`${worktree.repo_name}/${worktree.name}`}
              icon={{ source: Icon.Tree, tintColor: Color.Green }}
              title={worktree.name}
              subtitle={getLastMessage(worktree)}
              accessories={[
                { text: worktree.branch, icon: Icon.ArrowNe },
                { text: getSessionInfo(worktree), icon: Icon.Clock },
              ]}
              actions={
                <ActionPanel>
                  <ActionPanel.Section>
                    <Action
                      title="Open in Terminal"
                      icon={Icon.Terminal}
                      onAction={() => handleOpen(worktree)}
                    />
                    <Action.OpenWith path={worktree.path} />
                    <Action.ShowInFinder path={worktree.path} />
                    <Action.CopyToClipboard
                      title="Copy Path"
                      content={worktree.path}
                      shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                    />
                  </ActionPanel.Section>
                  <ActionPanel.Section>
                    <Action
                      title="Delete Worktree"
                      icon={Icon.Trash}
                      style={Action.Style.Destructive}
                      shortcut={{
                        modifiers: ["cmd", "shift"],
                        key: "backspace",
                      }}
                      onAction={() => handleDelete(worktree)}
                    />
                  </ActionPanel.Section>
                  <ActionPanel.Section>
                    <Action
                      title="Refresh"
                      icon={Icon.ArrowClockwise}
                      shortcut={{ modifiers: ["cmd"], key: "r" }}
                      onAction={revalidate}
                    />
                  </ActionPanel.Section>
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}
      {!isLoading && Object.keys(worktreesByRepo).length === 0 && (
        <List.EmptyView
          icon={Icon.Tree}
          title="No Worktrees Found"
          description="Create a new worktree using the Create Worktree command"
        />
      )}
    </List>
  );
}
