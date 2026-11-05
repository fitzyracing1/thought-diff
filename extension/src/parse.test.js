"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { bundledPythonRoot } = require("./runner");

describe("bundledPythonRoot", () => {
  it("points at extension/python", () => {
    const root = bundledPythonRoot("/tmp/ext");
    assert.equal(root, path.join("/tmp/ext", "python"));
  });
});
