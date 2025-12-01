import {
  showHUD,
  showToast,
  Toast,
  getPreferenceValues,
  LaunchProps,
} from "@raycast/api";
import { createWorktree } from "./utils/xlaude";
import { openInTerminal } from "./utils/terminal";

interface Preferences {
  xlaudePath: string;
  defaultRepoPath?: string;
  terminal: "iterm" | "terminal" | "warp";
}

interface Arguments {
  ticketId: string;
}

export default async function Command(
  props: LaunchProps<{ arguments: Arguments }>,
) {
  const { ticketId } = props.arguments;
  const { defaultRepoPath, xlaudePath } = getPreferenceValues<Preferences>();

  if (!ticketId || !ticketId.trim()) {
    await showHUD("❌ No ticket ID provided");
    return;
  }

  if (!defaultRepoPath) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Repository path not set",
      message: "Set Default Repository Path in extension preferences",
    });
    return;
  }

  const sanitizedTicketId = ticketId.trim();

  try {
    await showHUD(`Creating worktree: ${sanitizedTicketId}...`);

    const result = await createWorktree(sanitizedTicketId);

    if (result.success) {
      // Extract the worktree path from the result
      let worktreePath: string | null = null;

      const atMatch = result.message.match(/at\s+(\/[^\s]+)/);
      const createdMatch = result.message.match(/[Cc]reated.*?(\/[^\s]+)/);
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

      if (worktreePath) {
        const xlaude =
          xlaudePath && xlaudePath !== "xlaude"
            ? xlaudePath
            : `${process.env.HOME}/.cargo/bin/xlaude`;

        await openInTerminal(worktreePath, `${xlaude} open`, sanitizedTicketId);
        await showHUD(`✅ ${sanitizedTicketId} ready`);
      } else {
        await showHUD(`✅ Created ${sanitizedTicketId} (couldn't auto-open)`);
      }
    } else {
      console.error("create-from-ticket error:", result.message);
      await showHUD(`❌ Failed: ${result.message.substring(0, 50)}`);
    }
  } catch (error) {
    console.error("create-from-ticket exception:", error);
    await showHUD(`❌ Error: ${String(error).substring(0, 50)}`);
  }
}
