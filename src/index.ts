import { Readable } from 'node:stream';
import type { Cheerio, CheerioAPI, CheerioOptions } from 'cheerio';
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';

export interface TransformationRule {
  selector: string[];
  rule: (node: Cheerio<AnyNode>, $: CheerioAPI) => Promise<void>;
}

export class Transformer {
  private _rules: TransformationRule[];

  constructor(rules: TransformationRule[]) {
    this._rules = rules;
  }

  async transform(
    $: CheerioAPI,
    cheerioOptions?: CheerioOptions | null,
    isDocument?: boolean,
  ): Promise<string>;
  async transform(
    html: string,
    cheerioOptions?: CheerioOptions | null,
    isDocument?: boolean,
  ): Promise<string>;
  async transform(
    html: Buffer,
    cheerioOptions?: CheerioOptions | null,
    isDocument?: boolean,
  ): Promise<string>;
  async transform(
    html: Readable,
    cheerioOptions?: CheerioOptions | null,
    isDocument?: boolean,
  ): Promise<string>;
  async transform(
    input: CheerioAPI | string | Buffer | Readable,
    cheerioOptions?: CheerioOptions | null,
    isDocument?: boolean,
  ): Promise<string> {
    let $: CheerioAPI;

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

  public addRule(rule: TransformationRule): void;
  public addRule(rules: TransformationRule[]): void;
  public addRule(rule: TransformationRule | TransformationRule[]): void {
    if (Array.isArray(rule)) {
      this._rules.push(...rule);
    } else {
      this._rules.push(rule);
    }
  }

  public removeRule(selector: string): void {
    this._rules = this._rules.filter((rule) => !rule.selector.includes(selector));
  }

  public clearRules(): void {
    this._rules = [];
  }

  get rules(): TransformationRule[] {
    return this._rules;
  }
}
