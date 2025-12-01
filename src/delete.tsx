import {
  ActionPanel,
  Action,
  List,
  Icon,
  Color,
  showToast,
  Toast,
  confirmAlert,
  popToRoot,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { listWorktrees, deleteWorktree, Worktree } from "./utils/xlaude";

export default function Command() {
  const { isLoading, data: worktrees, revalidate } = usePromise(listWorktrees);

  const handleDelete = async (worktree: Worktree) => {
    const confirmed = await confirmAlert({
      title: "Delete Worktree",
      message: `Are you sure you want to delete "${worktree.name}"?\n\nThis will:\n• Remove the worktree directory\n• Delete the local branch "${worktree.branch}"`,
      primaryAction: {
        title: "Delete",
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
          message: worktree.name,
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
        title: "Error",
        message: String(error),
      });
    }
  };

  const getSessionCount = (worktree: Worktree): number => {
    return (
      (worktree.sessions?.length || 0) + (worktree.codex_sessions?.length || 0)
    );
  };

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search worktrees to delete..."
    >
      {(worktrees || []).map((worktree) => (
        <List.Item
          key={`${worktree.repo_name}/${worktree.name}`}
          icon={{ source: Icon.Trash, tintColor: Color.Red }}
          title={worktree.name}
          subtitle={worktree.branch}
          accessories={[
            { tag: worktree.repo_name },
            {
              text: `${getSessionCount(worktree)} sessions`,
              icon: Icon.Clock,
            },
          ]}
          actions={
            <ActionPanel>
              <Action
                title="Delete Worktree"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                onAction={() => handleDelete(worktree)}
              />
              <Action.ShowInFinder
                path={worktree.path}
                shortcut={{ modifiers: ["cmd", "shift"], key: "f" }}
              />
              <Action
                title="Refresh List"
                icon={Icon.ArrowClockwise}
                shortcut={{ modifiers: ["cmd"], key: "r" }}
                onAction={revalidate}
              />
            </ActionPanel>
          }
        />
      ))}
      {!isLoading && (worktrees || []).length === 0 && (
        <List.EmptyView
          icon={Icon.Trash}
          title="No Worktrees Found"
          description="There are no worktrees to delete"
        />
      )}
    </List>
  );
}
