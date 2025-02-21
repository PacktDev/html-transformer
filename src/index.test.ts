import { describe, it, expect } from 'vitest';
import { transform, type TranformationRule } from '.';
import * as cheerio from 'cheerio';

describe('Application Tests', () => {
    it('hello world!', () => {
        expect(1 + 1).toBe(2);
    });
});
it('should apply single transformation rule', async () => {
    const html = '<div class="test">Hello</div>';

    const $ = cheerio.load(html);

    const rules: TranformationRule[] = [{
        selector: ['.test'],
        rule: async (node) => {
            node.text('Transformed');
        }
    }];

    await transform($, rules);
    expect($('.test').text()).toBe('Transformed');
});

it('should handle multiple selectors in rule', async () => {
    const html = '<div class="test1">Hello</div><div class="test2">World</div>';

    const $ = cheerio.load(html);

    const rules: TranformationRule[] = [{
        selector: ['.test1', '.test2'],
        rule: async (node) => {
            node.text('Changed');
        }
    }];

    await transform($, rules);
    expect($('.test1').text()).toBe('Changed');
    expect($('.test2').text()).toBe('Changed');
});

it('should handle multiple rules', async () => {
    const html = '<div class="a">A</div><div class="b">B</div>';

    const $ = cheerio.load(html);

    const rules: TranformationRule[] = [
        {
            selector: ['.a'],
            rule: async (node) => { node.text('A2'); }
        },
        {
            selector: ['.b'],
            rule: async (node) => { node.text('B2'); }
        }
    ];

    await transform($, rules);
    expect($('.a').text()).toBe('A2');
    expect($('.b').text()).toBe('B2');
});

it('should handle empty rules array', async () => {
    const html = '<div>Test</div>';

    const $ = cheerio.load(html);

    const result = await transform($, []);
    expect(result).toEqual([]);
});

it('should handle failed transformations gracefully', async () => {
    const html = '<div class="test">Test</div>';

    const $ = cheerio.load(html);

    const rules: TranformationRule[] = [{
        selector: ['.test'],
        rule: async () => {
            throw new Error('Test error');
        }
    }];

    const result = await transform($, rules);
    expect(result[0].status).toBe('fulfilled');
});