"use strict";

const vscode = require("vscode");
const path = require("path");
const { runCompare, resolveOriginalPath } = require("./runner");

class ThoughtDiffViewProvider {
  /**
   * @param {vscode.Uri} extensionUri
   * @param {vscode.ExtensionContext} context
   */
  constructor(extensionUri, context) {
    this.extensionUri = extensionUri;
    this.context = context;
    /** @type {vscode.WebviewView | undefined} */
    this.view = undefined;
    this._lastError = null;
    this._lastResult = null;
    this._busy = false;
  }

  /**
   * @param {vscode.WebviewView} webviewView
   */
  resolveWebviewView(webviewView) {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };
    webviewView.webview.html = this._html(
      this._lastError
        ? { error: this._lastError }
        : this._lastResult || { placeholder: true }
    );
    webviewView.webview.onDidReceiveMessage(async (msg) => {
      if (msg && msg.type === "refresh") {
        await this.refresh();
      }
      if (msg && msg.type === "setOriginal") {
        await vscode.commands.executeCommand("thoughtDiff.setOriginalFolder");
      }
    });
    // Initial load
    this.refresh().catch(() => {});
  }

  showError(message) {
    this._lastError = message;
    this._lastResult = null;
    if (this.view) {
      this.view.webview.html = this._html({ error: message });
    }
  }

  async refresh() {
    if (this._busy) {
      return;
    }
    this._busy = true;
    try {
      const cfg = vscode.workspace.getConfiguration("thoughtDiff");
      const folders = vscode.workspace.workspaceFolders || [];
      const workspaceRoot = folders[0] ? folders[0].uri.fsPath : undefined;
      const working =
        (cfg.get("workingFolder") || "").trim() || workspaceRoot;
      if (!working) {
        throw new Error("Open a folder in Cursor/VS Code to use as the working copy.");
      }

      const originalInfo = await resolveOriginalPath({
        originalFolder: cfg.get("originalFolder") || "",
        originalGitRef: cfg.get("originalGitRef") || "",
        workspaceRoot,
      });

      try {
        const result = await runCompare({
          pythonPath: cfg.get("pythonPath") || "python3",
          extensionPath: this.context.extensionPath,
          original: originalInfo.path,
          working,
        });
        this._lastError = null;
        this._lastResult = {
          ...result,
          meta: {
            original: originalInfo.source,
            working,
            refreshedAt: new Date().toISOString(),
          },
        };
        if (this.view) {
          this.view.webview.html = this._html(this._lastResult);
        }
      } finally {
        if (originalInfo.cleanup) {
          originalInfo.cleanup();
        }
      }
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      this.showError(msg);
      throw err;
    } finally {
      this._busy = false;
    }
  }

  /**
   * @param {any} data
   */
  _html(data) {
    const nonce = String(Date.now());
    const esc = (s) =>
      String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    let body;
    if (data && data.error) {
      body = `<div class="banner error">${esc(data.error)}</div>
        <p class="hint">Use <b>Thought Diff: Set Original Folder</b>, then <b>Thought Diff: Refresh</b>.</p>`;
    } else if (data && data.placeholder) {
      body = `<p class="hint">Loading thought diff…</p>`;
    } else {
      const meta = data.meta || {};
      const thought = (data.thought_diff || []).map((l) => esc(l)).join("\n") || "(no interpretation changes)";
      const structure = (data.structure_diff || []).map((l) => esc(l)).join("\n") || "(no structure changes)";
      const code = esc(data.code_diff || "(no changes)");
      body = `
        <div class="banner info">Not regeneration. Interpretations are AST readings from the Python <code>thought_diff</code> library — not recovered hidden model thoughts.</div>
        <div class="meta">original: <code>${esc(meta.original || "")}</code><br/>working: <code>${esc(meta.working || "")}</code><br/>refreshed: ${esc(meta.refreshedAt || "")}${data.empty ? " · <b>identical</b>" : ""}</div>
        <h2>Thought diff</h2>
        <pre class="block thought">${thought}</pre>
        <h2>Structure diff</h2>
        <pre class="block structure">${structure}</pre>
        <h2>Code diff</h2>
        <pre class="block code">${code}</pre>
      `;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 8px 10px 24px; font-size: 12px; }
    h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; margin: 16px 0 6px; opacity: 0.85; }
    .banner { padding: 8px 10px; border-radius: 4px; margin-bottom: 10px; line-height: 1.4; }
    .banner.info { background: color-mix(in srgb, var(--vscode-editorInfo-foreground) 18%, transparent); border: 1px solid var(--vscode-editorInfo-foreground); }
    .banner.error { background: color-mix(in srgb, var(--vscode-errorForeground) 18%, transparent); border: 1px solid var(--vscode-errorForeground); }
    .meta { opacity: 0.8; margin-bottom: 8px; word-break: break-all; }
    pre.block { white-space: pre-wrap; word-break: break-word; background: var(--vscode-editor-background); border: 1px solid var(--vscode-widget-border, #444); padding: 8px; border-radius: 4px; max-height: 40vh; overflow: auto; }
    .actions { display: flex; gap: 8px; margin-bottom: 10px; }
    button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 4px 10px; border-radius: 2px; cursor: pointer; }
    button.secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
    .hint { opacity: 0.85; }
    code { font-family: var(--vscode-editor-font-family); }
  </style>
</head>
<body>
  <div class="actions">
    <button id="refresh">Refresh</button>
    <button id="setOriginal" class="secondary">Set original folder</button>
  </div>
  ${body}
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    document.getElementById('refresh').addEventListener('click', () => vscode.postMessage({ type: 'refresh' }));
    document.getElementById('setOriginal').addEventListener('click', () => vscode.postMessage({ type: 'setOriginal' }));
  </script>
</body>
</html>`;
  }
}

module.exports = { ThoughtDiffViewProvider };
