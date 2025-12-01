import {
  ActionPanel,
  Action,
  Form,
  showToast,
  Toast,
  popToRoot,
  getPreferenceValues,
  showHUD,
  openExtensionPreferences,
} from "@raycast/api";
import { useState } from "react";
import { checkoutBranchOrPR, listWorktrees } from "./utils/xlaude";
import { openInTerminal } from "./utils/terminal";

interface Preferences {
  xlaudePath: string;
  defaultRepoPath?: string;
  terminal: "iterm" | "terminal" | "warp";
}

interface Arguments {
  branchOrPr: string;
}

export default function Command(props: { arguments: Arguments }) {
  const { branchOrPr: initialValue } = props.arguments;
  const [branchOrPr, setBranchOrPr] = useState(initialValue || "");
  const [isLoading, setIsLoading] = useState(false);
  const { defaultRepoPath } = getPreferenceValues<Preferences>();

  const handleSubmit = async (values: {
    branchOrPr: string;
    openAfter: boolean;
  }) => {
    const target = values.branchOrPr.trim();

    if (!target) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Branch or PR required",
        message: "Please enter a branch name or PR number",
      });
      return;
    }

    if (!defaultRepoPath) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Repository path not set",
        message: "Please set Default Repository Path in extension preferences",
        primaryAction: {
          title: "Open Preferences",
          onAction: () => openExtensionPreferences(),
        },
      });
      return;
    }

    setIsLoading(true);
    try {
      await showToast({
        style: Toast.Style.Animated,
        title: "Checking out...",
      });
      const result = await checkoutBranchOrPR(target);

      if (result.success) {
        await showToast({
          style: Toast.Style.Success,
          title: "Checkout complete",
        });

        if (values.openAfter) {
          const { xlaudePath } = getPreferenceValues<Preferences>();
          const xlaude = xlaudePath || "xlaude";

          try {
            // Try to extract the path from the result
            const pathMatch = result.message.match(/at\s+(.+)/);
            if (pathMatch) {
              const worktreePath = pathMatch[1].trim();
              // Get all worktree names for split pane validation
              const worktrees = await listWorktrees();
              const allWorktreeNames = worktrees.map((w) => w.name);
              await openInTerminal(worktreePath, `${xlaude} open`, undefined, allWorktreeNames);
              await showHUD("Opened in terminal");
            }
          } catch (e) {
            console.error("Could not open worktree:", e);
          }
        }

        await popToRoot();
      } else {
        // Extract more useful error info
        let errorMsg = result.message;
        if (errorMsg.includes("not on a base branch")) {
          errorMsg =
            "Must run from a base branch (main/master). Set Default Repository Path to your repo root.";
        } else if (errorMsg.includes("Failed to create worktree")) {
          errorMsg =
            "Failed to create worktree. Ensure the branch exists and you're in a valid git repo.";
        }
        await showToast({
          style: Toast.Style.Failure,
          title: "Checkout failed",
          message: errorMsg,
        });
      }
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: String(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Checkout" onSubmit={handleSubmit} />
          <Action
            title="Open Extension Preferences"
            onAction={openExtensionPreferences}
          />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="branchOrPr"
        title="Branch or PR"
        placeholder="feature/my-branch or 123"
        value={branchOrPr}
        onChange={setBranchOrPr}
        info="Enter a branch name (e.g., feature/auth) or GitHub PR number (e.g., 123 or #123)"
      />
      <Form.Checkbox
        id="openAfter"
        title="Open After Checkout"
        label="Open in terminal after checkout"
        defaultValue={true}
      />
      {defaultRepoPath ? (
        <Form.Description
          title="Repository"
          text={`Working in: ${defaultRepoPath}`}
        />
      ) : (
        <Form.Description
          title="⚠️ Repository Not Set"
          text="Set 'Default Repository Path' in extension preferences (⌘,)"
        />
      )}
      <Form.Description
        title="Info"
        text="For PR numbers, xlaude will fetch the PR head into a pr/<number> branch and create a worktree for it."
      />
    </Form>
  );
}
