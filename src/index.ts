import { Readable } from 'node:stream';
import type { Cheerio, CheerioAPI, CheerioOptions } from 'cheerio';
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';

export interface TranformationRule {
  selector: string[];
  rule: (node: Cheerio<AnyNode>, $: CheerioAPI) => Promise<void>;
}

export class Transformer {
  private rules: TranformationRule[];

  constructor(rules: TranformationRule[]) {
    this.rules = rules;
  }

  async transform(
    $: CheerioAPI,
    cheerioOptions?: CheerioOptions,
    isDocument?: boolean,
  ): Promise<string>;
  async transform(
    html: string,
    cheerioOptions?: CheerioOptions,
    isDocument?: boolean,
  ): Promise<string>;
  async transform(
    html: Buffer,
    cheerioOptions?: CheerioOptions,
    isDocument?: boolean,
  ): Promise<string>;
  async transform(
    html: Readable,
    cheerioOptions?: CheerioOptions,
    isDocument?: boolean,
  ): Promise<string>;
  async transform(
    input: CheerioAPI | string | Buffer | Readable,
    cheerioOptions?: CheerioOptions,
    isDocument?: boolean,
  ): Promise<string> {
    let $: CheerioAPI;
    //biome-ignore lint/style/noParameterAssign: This is just to ensure the default value is set
    cheerioOptions = cheerioOptions ?? {};
    //biome-ignore lint/style/noParameterAssign: This is just to ensure the default value is set
    isDocument = isDocument ?? true;

    if (input instanceof Buffer || ArrayBuffer.isView(input)) {
      $ = cheerio.load(input.toString(), cheerioOptions, isDocument);
    } else if (input instanceof Readable) {
      const chunks: Buffer[] = [];
      for await (const chunk of input) {
        chunks.push(Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);
      $ = cheerio.load(buffer.toString(), cheerioOptions, isDocument);
    } else if (typeof input === 'string') {
      $ = cheerio.load(input, cheerioOptions, isDocument);
    } else {
      $ = input;
    }

    return this.process($);
  }

  private async process($: CheerioAPI): Promise<string> {
    return Promise.all(
      this.rules.map(async ({ selector, rule }) => {
        const nodes = selector.flatMap((s) => $(s).toArray());
        await Promise.all(
          nodes.map(async (node) => {
            await rule($(node), $);
          }),
        );
      }),
    ).then((_) => {
      return $.html();
    });
  }
}
