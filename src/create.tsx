import {
  ActionPanel,
  Action,
  Form,
  showToast,
  Toast,
  popToRoot,
  getPreferenceValues,
  showHUD,
  Clipboard,
  openExtensionPreferences,
} from "@raycast/api";
import { useState } from "react";
import { createWorktree } from "./utils/xlaude";
import { openInTerminal } from "./utils/terminal";

interface Preferences {
  xlaudePath: string;
  defaultRepoPath?: string;
  terminal: "iterm" | "terminal" | "warp";
}

interface Arguments {
  name?: string;
}

export default function Command(props: { arguments: Arguments }) {
  const { name: initialName } = props.arguments;
  const [name, setName] = useState(initialName || "");
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const { defaultRepoPath } = getPreferenceValues<Preferences>();

  const handleSubmit = async (values: { name: string; openAfter: boolean }) => {
    const worktreeName = values.name.trim() || undefined;
    setLastError(null);

    if (!defaultRepoPath) {
      setLastError(
        "Default Repository Path not set. Press ⌘, to open preferences.",
      );
      await showToast({
        style: Toast.Style.Failure,
        title: "Repository path not set",
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
        title: "Creating worktree...",
      });
      const result = await createWorktree(worktreeName);

      if (result.success) {
        await showToast({
          style: Toast.Style.Success,
          title: "Worktree created",
        });
        console.log("xlaude create output:", result.message);

        if (values.openAfter) {
          const { xlaudePath } = getPreferenceValues<Preferences>();
          const xlaude = xlaudePath || "xlaude";

          try {
            // Try multiple patterns to extract the worktree path
            // Pattern 1: "at /path/to/worktree"
            // Pattern 2: "Created worktree /path/to/worktree"
            // Pattern 3: Just look for a path that starts with /
            let worktreePath: string | null = null;

            const atMatch = result.message.match(/at\s+(\/[^\s]+)/);
            const createdMatch = result.message.match(
              /[Cc]reated.*?(\/[^\s]+)/,
            );
            const pathMatch =
              result.message.match(/(\/[^\s]*worktree[^\s]*)/i) ||
              result.message.match(/(\/Users\/[^\s]+)/);

            if (atMatch) {
              worktreePath = atMatch[1].trim();
            } else if (createdMatch) {
              worktreePath = createdMatch[1].trim();
            } else if (pathMatch) {
              worktreePath = pathMatch[1].trim();
            }

            console.log("Extracted worktree path:", worktreePath);

            // Extract worktree name from path (last component)
            const extractedName =
              worktreePath?.split("/").pop() || worktreeName || "worktree";

            if (worktreePath) {
              await openInTerminal(
                worktreePath,
                `${xlaude} open`,
                extractedName,
              );
              await showHUD("Opened in terminal");
            } else {
              console.error(
                "Could not extract worktree path from:",
                result.message,
              );
              await showHUD("Created but couldn't auto-open");
            }
          } catch (e) {
            console.error("Could not open worktree:", e);
          }
        }

        await popToRoot();
      } else {
        // Store full error for display in form
        setLastError(result.message);
        console.error("xlaude create error:", result.message);
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to create worktree",
          message: result.message.substring(0, 100),
          primaryAction: {
            title: "Copy Full Error",
            onAction: () => Clipboard.copy(result.message),
          },
        });
      }
    } catch (error) {
      const errorMsg = String(error);
      setLastError(errorMsg);
      console.error("xlaude create exception:", errorMsg);
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: errorMsg.substring(0, 100),
        primaryAction: {
          title: "Copy Full Error",
          onAction: () => Clipboard.copy(errorMsg),
        },
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
          <Action.SubmitForm title="Create Worktree" onSubmit={handleSubmit} />
          <Action
            title="Open Extension Preferences"
            onAction={openExtensionPreferences}
          />
          {lastError && (
            <Action.CopyToClipboard
              title="Copy Full Error"
              content={lastError}
            />
          )}
        </ActionPanel>
      }
    >
      <Form.TextField
        id="name"
        title="Worktree Name"
        placeholder="Leave empty for random name"
        value={name}
        onChange={setName}
        info="The name for the new worktree. If empty, xlaude will generate a random BIP39 word."
      />
      <Form.Checkbox
        id="openAfter"
        title="Open After Creation"
        label="Open in terminal after creating"
        defaultValue={true}
      />
      {defaultRepoPath ? (
        <Form.Description
          title="Repository"
          text={`Will create worktree in: ${defaultRepoPath}`}
        />
      ) : (
        <Form.Description
          title="⚠️ Repository Not Set"
          text="Set 'Default Repository Path' in extension preferences (⌘,)"
        />
      )}
      {lastError && <Form.Description title="❌ Error" text={lastError} />}
    </Form>
  );
}
