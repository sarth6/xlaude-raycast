import { getPreferenceValues } from "@raycast/api";
import { runAppleScript } from "@raycast/utils";

interface Preferences {
  xlaudePath: string;
  defaultRepoPath?: string;
  terminal: "iterm" | "terminal" | "warp" | "kitty";
  useSplitPanes?: boolean;
  maxPanesPerTab?: string;
}

export async function openInTerminal(
  directory: string,
  command?: string,
  tabName?: string,
  knownWorktreeNames?: string[],
): Promise<void> {
  const { terminal, useSplitPanes, maxPanesPerTab } =
    getPreferenceValues<Preferences>();
  const maxPanes = parseInt(maxPanesPerTab || "2", 10);

  switch (terminal) {
    case "iterm":
      if (useSplitPanes) {
        await openInITermWithSplitPanes(directory, command, tabName, maxPanes, knownWorktreeNames || []);
      } else {
        await openInITerm(directory, command, tabName);
      }
      break;
    case "terminal":
      await openInAppleTerminal(directory, command, tabName);
      break;
    case "warp":
      await openInWarp(directory, command, tabName);
      break;
    case "kitty":
      await openInKitty(directory, command, tabName);
      break;
    default:
      await openInITerm(directory, command, tabName);
  }
}

async function openInITerm(
  directory: string,
  command?: string,
  tabName?: string,
): Promise<void> {
  const cdCommand = `cd ${escapeForShell(directory)}`;
  const fullCommand = command ? `${cdCommand} && ${command}` : cdCommand;

  // To make the tab name stick, we need to:
  // 1. Set the session name
  // 2. Run a command to set the terminal title via escape sequences
  // The escape sequence \033]0;TITLE\007 sets both tab and window title
  const titleEscapeSeq = tabName
    ? `printf '\\033]0;${tabName.replace(/'/g, "\\'")}\\007'`
    : "";
  const fullCommandWithTitle = titleEscapeSeq
    ? `${titleEscapeSeq} && ${fullCommand}`
    : fullCommand;

  const script = `
    tell application "iTerm"
      activate

      -- Check if there's a window, create one if not
      if (count of windows) = 0 then
        create window with default profile
      else
        -- Create a new tab in the current window
        tell current window
          create tab with default profile
        end tell
      end if

      -- Small delay to ensure tab is ready
      delay 0.2

      -- Write the command (title escape sequence is embedded)
      tell current session of current window
        write text ${JSON.stringify(fullCommandWithTitle)}
        select
      end tell
    end tell
  `;

  await runAppleScript(script);
}

async function openInITermWithSplitPanes(
  directory: string,
  command?: string,
  tabName?: string,
  maxPanes: number = 2,
  knownWorktreeNames: string[] = [],
): Promise<void> {
  const cdCommand = `cd ${escapeForShell(directory)}`;
  const fullCommand = command ? `${cdCommand} && ${command}` : cdCommand;

  // Escape for AppleScript string (double quotes need to be escaped as \")
  const safeTabName = (tabName || "worktree")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
  const safeFullCommand = fullCommand
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');

  // Build AppleScript list of known worktree names for validation
  const safeWorktreeNames = knownWorktreeNames.map(
    (name) => `"${name.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
  );
  const worktreeNamesListStr = safeWorktreeNames.length > 0
    ? `{${safeWorktreeNames.join(", ")}}`
    : "{}";

  // This AppleScript:
  // 1. Checks if there's a tab with fewer than maxPanes sessions where ALL sessions are xlaude worktrees
  // 2. If found, splits it vertically and updates the tab title to "name1 / name2 / ..."
  // 3. If not found, creates a new tab
  const script = `
    -- Helper: check if a session name matches any known worktree
    -- Matches if session name contains any worktree name (handles "name1 / name2" format)
    on sessionIsWorktree(sessName, worktreeList)
      if (count of worktreeList) = 0 then return false
      repeat with wt in worktreeList
        if sessName contains wt then return true
      end repeat
      return false
    end sessionIsWorktree

    tell application "iTerm"
      activate

      set newWorktreeName to "${safeTabName}"
      set fullCmd to "${safeFullCommand}"
      set maxPanesAllowed to ${maxPanes}
      set knownWorktrees to ${worktreeNamesListStr}
      set titleCmd to "printf '\\\\033]0;" & newWorktreeName & "\\\\007'"
      set fullCmdWithTitle to titleCmd & " && " & fullCmd

      -- Check if there's a window
      if (count of windows) = 0 then
        -- No window, create one
        create window with default profile
        delay 0.2
        tell current session of current window
          write text fullCmdWithTitle
          select
        end tell
      else
        -- Look for a tab where ALL sessions are xlaude worktrees and has room for more
        set foundTabToSplit to false
        set targetTab to missing value
        set existingName to ""

        tell current window
          repeat with t in tabs
            -- Count sessions in this tab
            set tabSessions to sessions of t
            set sessionCount to count of tabSessions

            if sessionCount < maxPanesAllowed and sessionCount > 0 then
              -- Check if ALL sessions in this tab are known worktrees
              set allAreWorktrees to true
              repeat with s in tabSessions
                set sessName to name of s
                if not my sessionIsWorktree(sessName, knownWorktrees) then
                  set allAreWorktrees to false
                  exit repeat
                end if
              end repeat

              if allAreWorktrees then
                set firstSession to item 1 of tabSessions
                set existingName to name of firstSession
                set foundTabToSplit to true
                set targetTab to t
                exit repeat
              end if
            end if
          end repeat

          if foundTabToSplit and targetTab is not missing value then
            -- Select the target tab
            select targetTab
            delay 0.1

            -- Split the current session vertically
            tell current session
              set newSession to split vertically with default profile
            end tell

            delay 0.2

            -- Write command to the new split pane and focus it
            tell newSession
              write text fullCmdWithTitle
              select
            end tell

            -- Update the tab title to show all worktree names
            -- If existing name already has " / ", append to it; otherwise combine
            if existingName contains " / " then
              set combinedTitle to existingName & " / " & newWorktreeName
            else
              set combinedTitle to existingName & " / " & newWorktreeName
            end if
            set combinedTitleCmd to "printf '\\\\033]0;" & combinedTitle & "\\\\007'"

            -- Set title on the original pane too so tab shows combined name
            tell current session
              write text combinedTitleCmd
            end tell

          else
            -- No splittable tab found, create a new tab
            create tab with default profile
            delay 0.2
            tell current session
              write text fullCmdWithTitle
              select
            end tell
          end if
        end tell
      end if
    end tell
  `;

  await runAppleScript(script);
}

async function openInAppleTerminal(
  directory: string,
  command?: string,
  tabName?: string,
): Promise<void> {
  const cdCommand = `cd ${escapeForShell(directory)}`;
  const fullCommand = command ? `${cdCommand} && ${command}` : cdCommand;

  // Terminal.app: set custom title by changing window name
  const setNameScript = tabName
    ? `set custom title of front window to ${JSON.stringify(tabName)}`
    : "";

  const script = `
    tell application "Terminal"
      activate
      do script ${JSON.stringify(fullCommand)}
      ${setNameScript}
    end tell
  `;

  await runAppleScript(script);
}

async function openInWarp(
  directory: string,
  command?: string,
  tabName?: string,
): Promise<void> {
  const cdCommand = `cd ${escapeForShell(directory)}`;
  const fullCommand = command ? `${cdCommand} && ${command}` : cdCommand;

  // Warp doesn't have easy AppleScript tab naming, so we skip it
  const script = `
    tell application "Warp"
      activate
      delay 0.3
      tell application "System Events"
        tell process "Warp"
          keystroke "t" using command down
          delay 0.2
          keystroke ${JSON.stringify(fullCommand)}
          keystroke return
        end tell
      end tell
    end tell
  `;

  await runAppleScript(script);
}

async function openInKitty(
  directory: string,
  command?: string,
  tabName?: string,
): Promise<void> {
  const cdCommand = `cd ${escapeForShell(directory)}`;
  const fullCommand = command ? `${cdCommand} && ${command}` : cdCommand;

  // Set tab title using escape sequence like iTerm
  const titleEscapeSeq = tabName
    ? `printf '\\033]0;${tabName.replace(/'/g, "\\'")}\\007'`
    : "";
  const fullCommandWithTitle = titleEscapeSeq
    ? `${titleEscapeSeq} && ${fullCommand}`
    : fullCommand;

  // Kitty uses ⌘T for new tab on macOS
  const script = `
    tell application "kitty"
      activate
      delay 0.3
      tell application "System Events"
        tell process "kitty"
          keystroke "t" using command down
          delay 0.2
          keystroke ${JSON.stringify(fullCommandWithTitle)}
          keystroke return
        end tell
      end tell
    end tell
  `;

  await runAppleScript(script);
}

function escapeForShell(str: string): string {
  // Escape single quotes and wrap in single quotes
  return `'${str.replace(/'/g, "'\\''")}'`;
}

export async function openXlaudeInTerminal(
  worktreeName: string,
  worktreePath: string,
  knownWorktreeNames?: string[],
): Promise<void> {
  const { xlaudePath } = getPreferenceValues<Preferences>();
  // Use full path to xlaude, defaulting to common cargo install location
  const xlaude =
    xlaudePath && xlaudePath !== "xlaude"
      ? xlaudePath
      : `${process.env.HOME || "~"}/.cargo/bin/xlaude`;

  // Open the worktree directory and run xlaude open, with tab named after worktree
  await openInTerminal(worktreePath, `${xlaude} open`, worktreeName, knownWorktreeNames);
}

/**
 * Close any iTerm sessions/tabs that have the given worktree name in their title.
 * This handles both single tabs and split panes.
 */
export async function closeWorktreeInTerminal(
  worktreeName: string,
): Promise<void> {
  const { terminal } = getPreferenceValues<Preferences>();

  if (terminal !== "iterm") {
    // Only iTerm is supported for now
    return;
  }

  const safeWorktreeName = worktreeName
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');

  const script = `
    tell application "iTerm"
      if (count of windows) = 0 then return

      set worktreeToClose to "${safeWorktreeName}"

      -- Iterate through all windows
      repeat with w in windows
        -- Collect tabs to close (we can't modify while iterating)
        set tabsToClose to {}
        set sessionsToClose to {}

        repeat with t in tabs of w
          set tabSessions to sessions of t
          set sessionCount to count of tabSessions

          -- Get the tab name (which we set via escape sequence)
          set tabName to ""
          try
            set tabName to name of current session of t
          end try

          repeat with s in tabSessions
            set sessName to name of s

            -- Check if session name or tab name contains the worktree name
            if sessName contains worktreeToClose or tabName contains worktreeToClose then

              if sessionCount = 1 then
                -- Single session tab - mark whole tab for closing
                set end of tabsToClose to t
                exit repeat
              else
                -- Split pane - mark just this session for closing
                set end of sessionsToClose to s
              end if
            end if
          end repeat
        end repeat

        -- Close individual sessions (split panes) first
        repeat with s in sessionsToClose
          try
            tell s to close
          end try
        end repeat

        -- Close whole tabs
        repeat with t in tabsToClose
          try
            tell t to close
          end try
        end repeat
      end repeat
    end tell
  `;

  try {
    await runAppleScript(script);
  } catch (error) {
    // Silently fail - the tab might already be closed or iTerm might not be running
    console.error("Failed to close iTerm sessions:", error);
  }
}
