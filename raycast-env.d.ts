/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** xlaude Binary Path - Path to the xlaude binary (leave empty to use PATH) */
  "xlaudePath": string,
  /** Default Repository Path - Base path where your repositories are located */
  "defaultRepoPath"?: string,
  /** Terminal Application - Which terminal to open worktrees in */
  "terminal": "iterm" | "terminal" | "warp" | "kitty",
  /** Use Split Panes (iTerm only) - Open worktrees in split panes instead of new tabs */
  "useSplitPanes": boolean,
  /** Max Panes per Tab - Maximum number of split panes per tab (iTerm only) */
  "maxPanesPerTab": "2" | "3" | "4"
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `list` command */
  export type List = ExtensionPreferences & {}
  /** Preferences accessible in the `open` command */
  export type Open = ExtensionPreferences & {}
  /** Preferences accessible in the `create` command */
  export type Create = ExtensionPreferences & {}
  /** Preferences accessible in the `delete` command */
  export type Delete = ExtensionPreferences & {}
  /** Preferences accessible in the `checkout` command */
  export type Checkout = ExtensionPreferences & {}
  /** Preferences accessible in the `create-from-ticket` command */
  export type CreateFromTicket = ExtensionPreferences & {}
  /** Preferences accessible in the `delete-all` command */
  export type DeleteAll = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `list` command */
  export type List = {}
  /** Arguments passed to the `open` command */
  export type Open = {}
  /** Arguments passed to the `create` command */
  export type Create = {
  /** worktree name (optional) */
  "name": string
}
  /** Arguments passed to the `delete` command */
  export type Delete = {}
  /** Arguments passed to the `checkout` command */
  export type Checkout = {
  /** branch name or PR # */
  "branchOrPr": string
}
  /** Arguments passed to the `create-from-ticket` command */
  export type CreateFromTicket = {
  /** ENG-123 */
  "ticketId": string
}
  /** Arguments passed to the `delete-all` command */
  export type DeleteAll = {}
}

