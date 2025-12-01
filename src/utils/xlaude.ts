import { getPreferenceValues, environment } from "@raycast/api";
import { execSync, exec } from "child_process";
import { promisify } from "util";
import { homedir } from "os";
import { closeWorktreeInTerminal } from "./terminal";

const execAsync = promisify(exec);

interface Preferences {
  xlaudePath: string;
  defaultRepoPath?: string;
  terminal: "iterm" | "terminal" | "warp";
}

export interface WorktreeSession {
  last_user_message?: string;
  time_ago?: string;
}

export interface CodexSession {
  session_id?: string;
  last_user_message?: string;
  time_ago?: string;
}

export interface Worktree {
  name: string;
  branch: string;
  path: string;
  repo_name: string;
  created_at: string;
  sessions: WorktreeSession[];
  codex_sessions?: CodexSession[];
}

export interface XlaudeListOutput {
  worktrees: Worktree[];
}

// Common paths where binaries might be installed
function getExtendedPath(): string {
  const home = homedir();
  const additionalPaths = [
    `/bin`,
    `/usr/bin`,
    `/usr/local/bin`,
    `/opt/homebrew/bin`,
    `${home}/.cargo/bin`,
    `${home}/.local/bin`,
    `${home}/.nix-profile/bin`,
  ];
  const currentPath = process.env.PATH || "";
  return [...additionalPaths, currentPath].join(":");
}

export function getXlaudePath(): string {
  const { xlaudePath } = getPreferenceValues<Preferences>();
  // If user specified a path, use it; otherwise default to checking common locations
  if (xlaudePath && xlaudePath !== "xlaude") {
    return xlaudePath;
  }
  // Check if xlaude exists in cargo bin (most likely location)
  const home = homedir();
  const cargoBinPath = `${home}/.cargo/bin/xlaude`;
  try {
    execSync(`test -x "${cargoBinPath}"`, { stdio: "ignore" });
    return cargoBinPath;
  } catch {
    // Fall back to just "xlaude" and hope it's in PATH
    return "xlaude";
  }
}

export function getPreferences(): Preferences {
  return getPreferenceValues<Preferences>();
}

function getExecEnv(extra?: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PATH: getExtendedPath(),
    ...extra,
  };
}

// Standard exec options that ensure shell and PATH are available
function getExecOptions(extra?: {
  cwd?: string;
  extraEnv?: NodeJS.ProcessEnv;
}): {
  cwd?: string;
  env: NodeJS.ProcessEnv;
  shell: string;
} {
  return {
    shell: "/bin/bash",
    env: getExecEnv(extra?.extraEnv),
    ...(extra?.cwd ? { cwd: extra.cwd } : {}),
  };
}

export async function listWorktrees(): Promise<Worktree[]> {
  const xlaudePath = getXlaudePath();
  const { defaultRepoPath } = getPreferences();

  try {
    const options = getExecOptions({ cwd: defaultRepoPath });

    const { stdout } = await execAsync(`${xlaudePath} list --json`, options);
    const parsed: XlaudeListOutput = JSON.parse(stdout);
    return parsed.worktrees || [];
  } catch (error) {
    // If no worktrees exist, xlaude might return an error or empty result
    console.error("Error listing worktrees:", error);
    return [];
  }
}

interface ExecError extends Error {
  stderr?: string;
  stdout?: string;
}

function extractErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const execErr = error as ExecError;
    // Prefer stderr, then stdout, then the error message
    if (execErr.stderr && execErr.stderr.trim()) {
      return execErr.stderr.trim();
    }
    if (execErr.stdout && execErr.stdout.trim()) {
      return execErr.stdout.trim();
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

async function fetchAndPullMain(cwd: string): Promise<void> {
  const options = getExecOptions({ cwd });
  // Fetch latest from origin and pull to ensure we're up to date
  // This runs before xlaude create which requires being on a base branch
  try {
    await execAsync("git fetch origin", options);
    await execAsync("git pull --ff-only", options);
  } catch {
    // Ignore errors - fetch/pull might fail if offline or no upstream
    // xlaude create will still work, just from the current state
  }
}

export async function createWorktree(
  name?: string,
  cwd?: string,
): Promise<{ success: boolean; message: string }> {
  const xlaudePath = getXlaudePath();
  const { defaultRepoPath } = getPreferences();

  try {
    const workingDir = cwd || defaultRepoPath;

    // Fetch and pull latest before creating worktree
    if (workingDir) {
      await fetchAndPullMain(workingDir);
    }

    const options = getExecOptions({
      cwd: workingDir,
      extraEnv: { XLAUDE_NO_AUTO_OPEN: "1" },
    });

    const cmd = name ? `${xlaudePath} create ${name}` : `${xlaudePath} create`;
    const { stdout } = await execAsync(cmd, options);
    return { success: true, message: stdout.trim() };
  } catch (error) {
    return { success: false, message: extractErrorMessage(error) };
  }
}

export async function deleteWorktree(
  name: string,
  cwd?: string,
): Promise<{ success: boolean; message: string }> {
  const xlaudePath = getXlaudePath();
  const { defaultRepoPath } = getPreferences();

  try {
    // Close any iTerm tabs/panes with this worktree before deleting
    await closeWorktreeInTerminal(name);

    const workingDir = cwd || defaultRepoPath;
    const options = getExecOptions({
      cwd: workingDir,
      extraEnv: { XLAUDE_YES: "1" },
    });

    const { stdout } = await execAsync(`${xlaudePath} delete ${name}`, options);
    return { success: true, message: stdout.trim() };
  } catch (error) {
    return { success: false, message: extractErrorMessage(error) };
  }
}

export async function checkoutBranchOrPR(
  branchOrPr: string,
  cwd?: string,
): Promise<{ success: boolean; message: string }> {
  const xlaudePath = getXlaudePath();
  const { defaultRepoPath } = getPreferences();

  try {
    const workingDir = cwd || defaultRepoPath;

    // Fetch latest before checkout to ensure branch/PR refs are available
    if (workingDir) {
      await fetchAndPullMain(workingDir);
    }

    const options = getExecOptions({
      cwd: workingDir,
      extraEnv: { XLAUDE_NO_AUTO_OPEN: "1" },
    });

    const { stdout } = await execAsync(
      `${xlaudePath} checkout ${branchOrPr}`,
      options,
    );
    return { success: true, message: stdout.trim() };
  } catch (error) {
    return { success: false, message: extractErrorMessage(error) };
  }
}

export function getWorktreeDir(name: string): string | null {
  const xlaudePath = getXlaudePath();
  const { defaultRepoPath } = getPreferences();

  try {
    const options = getExecOptions({ cwd: defaultRepoPath });

    const result = execSync(`${xlaudePath} dir ${name}`, {
      ...options,
      encoding: "utf-8",
    });
    return result.trim();
  } catch {
    return null;
  }
}
