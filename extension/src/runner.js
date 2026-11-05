"use strict";

const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

/**
 * Locate the bundled thought_diff package directory (parent of the package).
 * @param {string} extensionPath
 */
function bundledPythonRoot(extensionPath) {
  return path.join(extensionPath, "python");
}

/**
 * Resolve the frozen original path: either a configured folder, or a git ref
 * archived into a temp directory.
 * @param {{ originalFolder: string, originalGitRef: string, workspaceRoot: string|undefined }} opts
 * @returns {Promise<{ path: string, cleanup?: () => void, source: string }>}
 */
async function resolveOriginalPath(opts) {
  const ref = (opts.originalGitRef || "").trim();
  if (ref) {
    if (!opts.workspaceRoot) {
      throw new Error("originalGitRef needs an open workspace folder (git root).");
    }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "thought-diff-orig-"));
    try {
      await new Promise((resolve, reject) => {
        const git = spawn("git", ["archive", "--format=tar", ref], {
          cwd: opts.workspaceRoot,
        });
        const tar = spawn("tar", ["-x", "-C", tmp]);
        let errBuf = "";
        git.stderr.on("data", (d) => {
          errBuf += d.toString();
        });
        tar.stderr.on("data", (d) => {
          errBuf += d.toString();
        });
        git.on("error", reject);
        tar.on("error", reject);
        git.stdout.pipe(tar.stdin);
        tar.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(errBuf.trim() || `tar exit ${code}`));
          }
        });
        git.on("close", (code) => {
          if (code !== 0) {
            try {
              tar.stdin.end();
            } catch (_) {
              /* ignore */
            }
            reject(new Error(errBuf.trim() || `git archive exit ${code}`));
          }
        });
      });
    } catch (err) {
      fs.rmSync(tmp, { recursive: true, force: true });
      const msg = (err && err.message) || String(err);
      throw new Error(`Could not resolve git ref "${ref}": ${msg}`);
    }
    return {
      path: tmp,
      source: `git:${ref}`,
      cleanup: () => fs.rmSync(tmp, { recursive: true, force: true }),
    };
  }

  const folder = (opts.originalFolder || "").trim();
  if (!folder) {
    throw new Error(
      'No original configured. Run "Thought Diff: Set Original Folder" or set thoughtDiff.originalFolder / thoughtDiff.originalGitRef.'
    );
  }
  if (!fs.existsSync(folder)) {
    throw new Error(`Original folder does not exist: ${folder}`);
  }
  return { path: folder, source: folder };
}

/**
 * Run `python -m thought_diff compare ORIG WORK --json`.
 * @param {{ pythonPath: string, extensionPath: string, original: string, working: string }} opts
 * @returns {Promise<object>}
 */
function runCompare(opts) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env };
    const bundled = bundledPythonRoot(opts.extensionPath);
    const existing = env.PYTHONPATH || "";
    env.PYTHONPATH = existing ? `${bundled}${path.delimiter}${existing}` : bundled;

    const args = ["-m", "thought_diff", "compare", opts.original, opts.working, "--json"];
    const child = spawn(opts.pythonPath, args, {
      env,
      cwd: opts.working,
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("error", (err) => {
      if (err && err.code === "ENOENT") {
        reject(
          new Error(
            `Python not found ("${opts.pythonPath}"). Install Python 3.10+ and set thoughtDiff.pythonPath if needed.`
          )
        );
        return;
      }
      reject(err);
    });
    child.on("close", (code) => {
      if (code !== 0 && !stdout.trim()) {
        const hint = stderr.trim() || `exit ${code}`;
        if (/No module named thought_diff/i.test(hint)) {
          reject(
            new Error(
              `thought_diff module not found. The extension bundles it under extension/python; PYTHONPATH was ${bundled}. Detail: ${hint}`
            )
          );
          return;
        }
        reject(new Error(`thought_diff failed: ${hint}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (err) {
        reject(
          new Error(
            `Could not parse thought_diff JSON output. Is Python available? stderr: ${stderr || (err && err.message)}`
          )
        );
      }
    });
  });
}

module.exports = { runCompare, resolveOriginalPath, bundledPythonRoot };
