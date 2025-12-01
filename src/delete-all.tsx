import {
  ActionPanel,
  Action,
  List,
  Icon,
  Color,
  showToast,
  Toast,
  confirmAlert,
  Alert,
  popToRoot,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { listWorktrees, deleteWorktree, Worktree } from "./utils/xlaude";
import { useState } from "react";

export default function Command() {
  const { isLoading, data: worktrees, revalidate } = usePromise(listWorktrees);
  const [deletingAll, setDeletingAll] = useState(false);

  const handleDeleteAll = async () => {
    const allWorktrees = worktrees || [];

    if (allWorktrees.length === 0) {
      await showToast({
        style: Toast.Style.Failure,
        title: "No worktrees to delete",
      });
      return;
    }

    const confirmed = await confirmAlert({
      title: "Delete All Worktrees",
      message: `Are you sure you want to delete all ${allWorktrees.length} worktree${allWorktrees.length > 1 ? "s" : ""}?\n\nThis action cannot be undone.`,
      icon: Icon.Trash,
      primaryAction: {
        title: `Delete All (${allWorktrees.length})`,
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (!confirmed) return;

    setDeletingAll(true);
    let deleted = 0;
    let failed = 0;

    await showToast({
      style: Toast.Style.Animated,
      title: "Deleting worktrees...",
      message: `0 / ${allWorktrees.length}`,
    });

    for (const worktree of allWorktrees) {
      try {
        const result = await deleteWorktree(worktree.name);
        if (result.success) {
          deleted++;
        } else {
          failed++;
          console.error(`Failed to delete ${worktree.name}:`, result.message);
        }
      } catch (error) {
        failed++;
        console.error(`Error deleting ${worktree.name}:`, error);
      }

      await showToast({
        style: Toast.Style.Animated,
        title: "Deleting worktrees...",
        message: `${deleted + failed} / ${allWorktrees.length}`,
      });
    }

    setDeletingAll(false);

    if (failed === 0) {
      await showToast({
        style: Toast.Style.Success,
        title: "All worktrees deleted",
        message: `${deleted} worktree${deleted > 1 ? "s" : ""} removed`,
      });
      await popToRoot();
    } else {
      await showToast({
        style: Toast.Style.Failure,
        title: "Some deletions failed",
        message: `${deleted} deleted, ${failed} failed`,
      });
      revalidate();
    }
  };

  const getSessionCount = (worktree: Worktree): number => {
    return (
      (worktree.sessions?.length || 0) + (worktree.codex_sessions?.length || 0)
    );
  };

  const totalWorktrees = worktrees?.length || 0;

  return (
    <List
      isLoading={isLoading || deletingAll}
      searchBarPlaceholder="Review worktrees to delete..."
    >
      {totalWorktrees > 0 && (
        <List.Section title="Actions">
          <List.Item
            icon={{ source: Icon.Trash, tintColor: Color.Red }}
            title={`Delete All ${totalWorktrees} Worktrees`}
            subtitle="This action cannot be undone"
            actions={
              <ActionPanel>
                <Action
                  title={`Delete All (${totalWorktrees})`}
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  onAction={handleDeleteAll}
                />
              </ActionPanel>
            }
          />
        </List.Section>
      )}

      <List.Section title={`Worktrees (${totalWorktrees})`}>
        {(worktrees || []).map((worktree) => (
          <List.Item
            key={`${worktree.repo_name}/${worktree.name}`}
            icon={{ source: Icon.Tree, tintColor: Color.Orange }}
            title={worktree.name}
            subtitle={worktree.branch}
            accessories={[
              { tag: worktree.repo_name },
              { text: `${getSessionCount(worktree)} sessions` },
            ]}
            actions={
              <ActionPanel>
                <Action
                  title={`Delete All (${totalWorktrees})`}
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  onAction={handleDeleteAll}
                />
                <Action.ShowInFinder path={worktree.path} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>

      {!isLoading && totalWorktrees === 0 && (
        <List.EmptyView
          icon={Icon.Checkmark}
          title="No Worktrees"
          description="There are no worktrees to delete"
        />
      )}
    </List>
  );
}
