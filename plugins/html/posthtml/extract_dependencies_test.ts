import { assertEquals } from "../../../test_deps.ts";
import { DependencyFormat, DependencyType } from "../../plugin.ts";
import { extractDependencies } from "./extract_dependencies.ts";

Deno.test({
  name: "importMap",
  async fn() {
    const importMap = {
      imports: {
        "file:///path/": "file:///custom/path/",
      },
    };
    const input = "a.html";
    const source = `<html><body><img src="path/b.png"></body></html>`;
    const dependencies = await extractDependencies(input, source, {
      importMap,
    });

    assertEquals(dependencies, [
      {
        input: "file:///custom/path/b.png",
        type: DependencyType.ImportExport,
        format: DependencyFormat.Binary,
      },
    ]);
  },
});

Deno.test({
  name: "base",
  async fn() {
    const importMap = {
      imports: {
        "file:///path/": "file:///custom/path/",
      },
    };

    const input = "a.html";
    const source = `<html>
        <head><base href="custom/path/"></head>
        <body><img src="b.png"></body></html>`;
    const dependencies = await extractDependencies(input, source, {
      importMap,
    });

    assertEquals(dependencies, [
      {
        input: "file:///custom/path/b.png",
        type: DependencyType.ImportExport,
        format: DependencyFormat.Binary,
      },
    ]);
  },
});

Deno.test({
  name: "base and importMap",
  async fn() {
    const importMap = {
      imports: {
        "file:///path/": "file:///custom/path/",
      },
    };
    const input = "a.html";
    const source = `<html>
        <head><base href="custom/"></head>
        <body><img src="path/b.png"></body></html>`;
    const dependencies = await extractDependencies(input, source, {
      importMap,
    });

    assertEquals(dependencies, [
      {
        input: "file:///custom/path/b.png",
        type: DependencyType.ImportExport,
        format: DependencyFormat.Binary,
      },
    ]);
  },
});

Deno.test({
  name: "img",
  async fn(t) {
    await t.step({
      name: "src",
      async fn() {
        const input = "a.html";
        const source = `<html><head><img src="b.png"></head></html>`;
        const dependencies = await extractDependencies(input, source);

        assertEquals(dependencies, [
          {
            input: "file:///b.png",
            type: DependencyType.ImportExport,
            format: DependencyFormat.Binary,
          },
        ]);
      },
    });

    await t.step({
      name: "srcset",
      async fn() {
        const input = "a.html";
        const source = `<html><head><img srcset="b.png"></head></html>`;
        const dependencies = await extractDependencies(input, source);

        assertEquals(dependencies, [
          {
            input: "file:///b.png",
            type: DependencyType.ImportExport,
            format: DependencyFormat.Binary,
          },
        ]);
      },
    });

    await t.step({
      name: "img multiple srcset",
      async fn() {
        const input = "a.html";
        const source =
          `<html><head><img srcset=" b.png 480w, c.png 800w "></head></html>`;
        const dependencies = await extractDependencies(input, source);

        assertEquals(dependencies, [
          {
            input: "file:///b.png",
            type: DependencyType.ImportExport,
            format: DependencyFormat.Binary,
          },
          {
            input: "file:///c.png",
            type: DependencyType.ImportExport,
            format: DependencyFormat.Binary,
          },
        ]);
      },
    });
  },
});

Deno.test({
  name: "source",
  async fn() {
    const input = "a.html";
    const source =
      `<html><head><video><source src="b.mp4"></video></head></html>`;
    const dependencies = await extractDependencies(input, source);

    assertEquals(dependencies, [
      {
        input: "file:///b.mp4",
        type: DependencyType.ImportExport,
        format: DependencyFormat.Binary,
      },
    ]);
  },
});

Deno.test({
  name: "link",
  async fn() {
    const input = "a.html";

    const source =
      `<html><head><link rel="stylesheet" href="b.css"></head></html>`;
    const dependencies = await extractDependencies(input, source);

    assertEquals(dependencies, [
      {
        input: "file:///b.css",
        type: DependencyType.ImportExport,
        format: DependencyFormat.Style,
      },
    ]);
  },
});

Deno.test({
  name: "webmanifest",
  async fn() {
    const input = "a.html";

    const source =
      `<html><head><link rel="manifest" href="webmanifest.json"></div></head></html>`;
    const dependencies = await extractDependencies(input, source);

    assertEquals(dependencies, [
      {
        input: "file:///webmanifest.json",
        type: DependencyType.WebManifest,
        format: DependencyFormat.Json,
      },
    ]);
  },
});

Deno.test({
  name: "script",
  async fn() {
    const input = "a.html";

    const source = `<html><body><script src="b.js"></script></body></html>`;
    const dependencies = await extractDependencies(input, source);

    assertEquals(dependencies, [
      {
        input: "file:///b.js",
        type: DependencyType.ImportExport,
        format: DependencyFormat.Script,
      },
    ]);
  },
});

Deno.test({
  name: "style",
  async fn() {
    const input = "a.html";
    const source = `<html><head><style>@import "b.css";</style></head></html>`;
    const dependencies = await extractDependencies(input, source);

    assertEquals(dependencies, [
      {
        input: "file:///b.css",
        type: DependencyType.ImportExport,
        format: DependencyFormat.Style,
      },
    ]);
  },
});

Deno.test({
  name: "inline style",
  async fn() {
    const input = "a.html";
    const source =
      `<html><body><div style="background: url('b.png')"></div></body></html>`;
    const dependencies = await extractDependencies(input, source);

    assertEquals(dependencies, [
      {
        input: "file:///b.png",
        type: DependencyType.ImportExport,
        format: DependencyFormat.Binary,
      },
    ]);
  },
});
