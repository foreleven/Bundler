import { terser } from "../../deps.ts";
import { TextFilePlugin } from "../file/text_file.ts";
import { DependencyFormat, DependencyType } from "../plugin.ts";
import { getDependencyFormat } from "../_util.ts";

export class TerserPlugin extends TextFilePlugin {
  options: terser.MinifyOptions;
  constructor({ options = {} }: { options?: terser.MinifyOptions } = {}) {
    super();
    this.options = options;
  }
  test(input: string, _type: DependencyType, format: DependencyFormat) {
    switch (format) {
      case DependencyFormat.Script:
        return true;
      case DependencyFormat.Unknown:
        return getDependencyFormat(input) === DependencyFormat.Script;
      default:
        return false;
    }
  }
  async optimizeSource(source: string) {
    const { code } = await terser.minify(source, this.options);
    if (code === undefined) {
      throw new Error(`code must not be undefined`);
    }
    return code;
  }
}
