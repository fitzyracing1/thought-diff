"use strict";

const vscode = require("vscode");
const path = require("path");
const { ThoughtDiffViewProvider } = require("./webviewProvider");
const { runCompare, resolveOriginalPath } = require("./runner");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const provider = new ThoughtDiffViewProvider(context.extensionUri, context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("thoughtDiff.panel", provider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );

  const refresh = async () => {
    try {
      await provider.refresh();
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      vscode.window.showErrorMessage(`Thought Diff: ${msg}`);
      provider.showError(msg);
    }
  };

  context.subscriptions.push(
    vscode.commands.registerCommand("thoughtDiff.refresh", refresh),
    vscode.commands.registerCommand("thoughtDiff.openView", async () => {
      await vscode.commands.executeCommand("thoughtDiff.panel.focus");
      await refresh();
    }),
    vscode.commands.registerCommand("thoughtDiff.setOriginalFolder", async () => {
      const picked = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: "Use as frozen original",
      });
      if (!picked || !picked[0]) {
        return;
      }
      const folder = picked[0].fsPath;
      await vscode.workspace
        .getConfiguration("thoughtDiff")
        .update("originalFolder", folder, vscode.ConfigurationTarget.Workspace);
      // Clear git ref when setting an explicit folder so the folder wins.
      await vscode.workspace
        .getConfiguration("thoughtDiff")
        .update("originalGitRef", "", vscode.ConfigurationTarget.Workspace);
      vscode.window.showInformationMessage(`Thought Diff original folder set to ${folder}`);
      await refresh();
    }),
    vscode.workspace.onDidSaveTextDocument(() => {
      // Fire-and-forget refresh on save; errors surface in the webview.
      provider.refresh().catch(() => {});
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("thoughtDiff")) {
        provider.refresh().catch(() => {});
      }
    })
  );
}

function deactivate() {}

module.exports = { activate, deactivate, runCompare, resolveOriginalPath };
