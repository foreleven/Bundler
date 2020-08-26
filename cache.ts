import { join, resolve } from "https://deno.land/std/path/mod.ts";
import { green } from "https://deno.land/std/fmt/colors.ts";
import { Sha256 } from "https://deno.land/std/hash/sha256.ts";
import {
  exists,
  existsSync,
  writeJson,
  ensureFile,
} from "https://deno.land/std/fs/mod.ts";
import {
  getDependencies,
  resolve as resolveDependencyPath,
} from "./dependencies.ts";
import { isURL } from "./_helpers.ts";

/**
 * API for rust cache_dir
 */
function cachedir(): string {
  const env = Deno.env;
  const os = Deno.build.os;

  const deno = env.get("DENO_DIR");

  if (deno) return resolve(deno);

  let home: string | undefined;
  let cachedir: string;
  const POSIX_HOME = "HOME";

  switch (os) {
    case "linux": {
      const xdg = env.get("XDG_CACHE_HOME");
      home = xdg ?? env.get(POSIX_HOME);
      cachedir = xdg ? "deno" : join(".cache", "deno");
      break;
    }
    case "darwin":
      home = env.get(POSIX_HOME);
      cachedir = join("Library", "Caches", "deno");
      break;

    case "windows":
      home = env.get("LOCALAPPDATA");
      home = home ?? env.get("USERPROFILE");
      cachedir = "deno";
      break;
  }

  cachedir = home ? cachedir : ".deno";
  if (!home) return cachedir;
  return resolve(join(home, cachedir));
}

/**
 * creates path to cache file of a path
 * @param url 
 */
function createCacheModulePathForURL(url: string) {
  const fileUrl = new URL(url);
  const hash = new Sha256().update(fileUrl.pathname).hex();
  return join(
    cachedir(),
    "deps",
    fileUrl.protocol.replace(":", ""),
    fileUrl.hostname,
    hash,
  );
}

/**
 * resolves path to cache file of a path. Returns null if path is not cached
 * @param path 
 */
function resolveURLToCacheModulePath(url: string) {
  if (!isURL(url)) return;
  const cacheModulePath = createCacheModulePathForURL(url);
  return cacheModulePath && existsSync(cacheModulePath)
    ? cacheModulePath
    : null;
}

export { resolveURLToCacheModulePath as resolve };

/**
 * API for deno cache
 * Fetches path files recusively and caches them to deno cache dir.
 */
export async function cache(specifier: string, reload = false) {
  if (!isURL(specifier)) return;

  const queue = [specifier];
  while (queue.length) {
    const specifier = queue.pop()!;
    const cachedFilePath = createCacheModulePathForURL(specifier);

    let source: string;
    if (reload || !await exists(cachedFilePath)) {
      console.log(green("Download"), specifier);
      const response = await fetch(specifier, { redirect: "follow" });
      source = await response.text();
      const headers: { [key: string]: string } = {};
      for (const [key, value] of response.headers) headers[key] = value;
      const metaFilePath = `${cachedFilePath}.metadata.json`;
      await ensureFile(cachedFilePath);
      await Deno.writeTextFile(cachedFilePath, source);
      await writeJson(metaFilePath, { specifier, headers }, { spaces: "  " });
    } else {
      source = await Deno.readTextFile(cachedFilePath);
    }

    const dependencyMap = await getDependencies(source);

    queue.push(
      ...dependencyMap.map((dependency) =>
        resolveDependencyPath(specifier, dependency)
      ),
    );
  }
}
