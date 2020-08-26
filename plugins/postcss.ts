import postcssCore from "https://jspm.dev/postcss";
import { Exclude, Include, plugin } from "../plugin.ts";
export function postcss(
  config: {
    include?: Include;
    exclude?: Exclude;
    options?: { use: unknown[] };
  } = {},
) {
  const { include, exclude, options } = {
    include: (path: string) => /\.css$/.test(path),
    options: { use: [] },
    ...config,
  };

  const transform = async (source: string, path: string) => {
    const engine = (postcssCore as Function)();
    options.use.forEach((plugin: unknown) => engine.use(plugin));
    const result = await engine.process(source, { from: undefined });
    return result.css;
  };

  return plugin({
    name: "postcss",
    include,
    exclude,
    transform,
  });
}
