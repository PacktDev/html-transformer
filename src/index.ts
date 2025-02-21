import type { Cheerio, CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";

export interface TranformationRule {
    selector: string[];
    rule: (node: Cheerio<AnyNode>, $: CheerioAPI) => Promise<void>
}

export async function transform($: CheerioAPI, rules: TranformationRule[]) {
    return Promise.allSettled(rules.map(async ({ selector, rule }) => {
        const nodes = selector.flatMap(s => $(s).toArray());
        await Promise.allSettled(nodes.map(async node => {
            await rule($(node), $);
        }));
    }
    ));
}