import { Readable } from 'node:stream';
import * as cheerio from 'cheerio';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type TransformationRule, Transformer } from './index';

describe('Transformer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should transform string input', async () => {
    const rule: TransformationRule = {
      selector: ['h1'],
      rule: async (node, $) => {
        node.text('Modified Title');
      },
    };

    const transformer = new Transformer([rule]);
    const result = await transformer.transform('<html><h1>Original Title</h1></html>');

    expect(result).toContain('<h1>Modified Title</h1>');
  });

  it('should transform Buffer input', async () => {
    const rule: TransformationRule = {
      selector: ['p'],
      rule: async (node, $) => {
        node.addClass('modified');
      },
    };

    const transformer = new Transformer([rule]);
    const buffer = Buffer.from('<html><p>Test paragraph</p></html>');
    const result = await transformer.transform(buffer);

    expect(result).toContain('<p class="modified">Test paragraph</p>');
  });

  it('should transform Readable stream input', async () => {
    const rule: TransformationRule = {
      selector: ['div'],
      rule: async (node, $) => {
        node.attr('data-modified', 'true');
      },
    };

    const transformer = new Transformer([rule]);
    const readable = Readable.from(['<html><div>Test div</div></html>']);
    const result = await transformer.transform(readable);

    expect(result).toContain('<div data-modified="true">Test div</div>');
  });

  it('should transform CheerioAPI input', async () => {
    const rule: TransformationRule = {
      selector: ['span'],
      rule: async (node, $) => {
        node.text('Modified span');
      },
    };

    const transformer = new Transformer([rule]);
    const $ = cheerio.load('<html><span>Original span</span></html>');
    await transformer.transform($);

    expect($.html()).toContain('<span>Modified span</span>');
  });

  it('should apply multiple rules', async () => {
    const rules: TransformationRule[] = [
      {
        selector: ['h1'],
        rule: async (node, $) => {
          node.addClass('title');
        },
      },
      {
        selector: ['p'],
        rule: async (node, $) => {
          node.text('Modified paragraph');
        },
      },
    ];

    const transformer = new Transformer(rules);
    const result = await transformer.transform(
      '<html><h1>Title</h1><p>Original paragraph</p></html>',
    );

    expect(result).toContain('<h1 class="title">Title</h1>');
    expect(result).toContain('<p>Modified paragraph</p>');
  });

  it('should apply rules to multiple elements matching selector', async () => {
    const rule: TransformationRule = {
      selector: ['.item'],
      rule: async (node, $) => {
        node.addClass('processed');
      },
    };

    const transformer = new Transformer([rule]);
    const result = await transformer.transform(
      '<html><div class="item">Item 1</div><div class="item">Item 2</div></html>',
    );

    expect(result).toContain('<div class="item processed">Item 1</div>');
    expect(result).toContain('<div class="item processed">Item 2</div>');
  });

  it('should support multiple selectors in a rule', async () => {
    const rule: TransformationRule = {
      selector: ['h1', 'h2'],
      rule: async (node, $) => {
        node.addClass('heading');
      },
    };

    const transformer = new Transformer([rule]);
    const result = await transformer.transform(
      '<html><h1>Title</h1><h2>Subtitle</h2><h3>Section</h3></html>',
    );

    expect(result).toContain('<h1 class="heading">Title</h1>');
    expect(result).toContain('<h2 class="heading">Subtitle</h2>');
    expect(result).toContain('<h3>Section</h3>');
  });

  it('should handle nested transformations', async () => {
    const rules: TransformationRule[] = [
      {
        selector: ['.container'],
        rule: async (node, $) => {
          node.addClass('processed');
        },
      },
      {
        selector: ['.container p'],
        rule: async (node, $) => {
          node.text('Modified paragraph');
        },
      },
    ];

    const transformer = new Transformer(rules);
    const input = '<div class="container"><p>Original paragraph</p></div>';
    const result = await transformer.transform(input);

    expect(result).toContain('<div class="container processed">');
    expect(result).toContain('<p>Modified paragraph</p>');
  });

  it('should apply asynchronous rules correctly', async () => {
    const rule: TransformationRule = {
      selector: ['div'],
      rule: async (node, $) => {
        // Simulate async operation
        await new Promise((resolve) => setTimeout(resolve, 10));
        node.text('Async modified');
      },
    };

    const transformer = new Transformer([rule]);
    const result = await transformer.transform('<div>Original</div>');

    expect(result).toContain('<div>Async modified</div>');
  });

  it('should handle complex selectors', async () => {
    const rule: TransformationRule = {
      selector: ['div > p.content'],
      rule: async (node, $) => {
        node.addClass('processed');
      },
    };

    const transformer = new Transformer([rule]);
    const input =
      '<div><p class="content">Direct child</p></div><span><p class="content">Not direct child</p></span>';
    const result = await transformer.transform(input);

    expect(result).toContain('<p class="content processed">Direct child</p>');
    expect(result).toContain('<p class="content">Not direct child</p>');
  });

  it('should transform empty HTML content', async () => {
    const rule: TransformationRule = {
      selector: ['body'],
      rule: async (node, $) => {
        node.append('<p>Added content</p>');
      },
    };

    const transformer = new Transformer([rule]);
    const result = await transformer.transform('');

    expect(result).toContain('<p>Added content</p>');
  });

  it('should allow rules to manipulate the DOM structure', async () => {
    const rule: TransformationRule = {
      selector: ['div'],
      rule: async (node, $) => {
        node.wrap('<section class="wrapper"></section>');
      },
    };

    const transformer = new Transformer([rule]);
    const result = await transformer.transform('<div>Test</div>');

    expect(result).toContain('<section class="wrapper"><div>Test</div></section>');
  });

  it('should support :has() pseudo-selector', async () => {
    const rule: TransformationRule = {
      selector: ['div:has(span)'],
      rule: async (node, $) => {
        node.addClass('contains-span');
      },
    };

    const transformer = new Transformer([rule]);
    const input = '<div><span>Test</span></div><div><p>No span</p></div>';
    const result = await transformer.transform(input);

    // Use a more flexible matching approach to handle HTML wrapping
    expect(result).toMatch(/<div class="contains-span"><span>Test<\/span><\/div>/);
    expect(result).toMatch(/<div><p>No span<\/p><\/div>/);
  });

  it('should support :nth-child() pseudo-selector', async () => {
    const rule: TransformationRule = {
      selector: ['li:nth-child(2)'],
      rule: async (node, $) => {
        node.addClass('second');
      },
    };

    const transformer = new Transformer([rule]);
    const input = '<ul><li>First</li><li>Second</li><li>Third</li></ul>';
    const result = await transformer.transform(input);

    // Check for the presence of the expected pattern, regardless of wrapping
    expect(result).toMatch(/<li>First<\/li><li class="second">Second<\/li><li>Third<\/li>/);
  });

  it('should support :not() pseudo-selector', async () => {
    const rule: TransformationRule = {
      selector: ['p:not(.exclude)'],
      rule: async (node, $) => {
        node.addClass('included');
      },
    };

    const transformer = new Transformer([rule]);
    const input = '<p>Include this</p><p class="exclude">Exclude this</p>';
    const result = await transformer.transform(input);

    // Use more flexible matching to account for HTML wrapping
    expect(result).toMatch(/<p class="included">Include this<\/p>/);
    expect(result).toMatch(/<p class="exclude">Exclude this<\/p>/);
  });

  // Update the test for unchanged content to handle HTML wrapping
  it('should return input with consistent wrapping when no selectors match', async () => {
    const rule: TransformationRule = {
      selector: ['non-existent-element'],
      rule: async (node, $) => {
        node.addClass('modified');
      },
    };

    const transformer = new Transformer([rule]);
    const input = '<div>Test content</div>';
    const result = await transformer.transform(input);

    // The content should be preserved even if the wrapping tags might differ
    expect(result).toMatch(/<div>Test content<\/div>/);
  });

  it('should transform elements in the head section', async () => {
    const rule: TransformationRule = {
      selector: ['title'],
      rule: async (node, $) => {
        node.text('Modified Page Title');
      },
    };

    const transformer = new Transformer([rule]);
    const input = '<html><head><title>Original Title</title></head><body></body></html>';
    const result = await transformer.transform(input);

    expect(result).toMatch(/<title>Modified Page Title<\/title>/);
  });

  it('should transform meta tags in the head section', async () => {
    const rule: TransformationRule = {
      selector: ['meta[name="description"]'],
      rule: async (node, $) => {
        node.attr('content', 'Modified description');
      },
    };

    const transformer = new Transformer([rule]);
    const input =
      '<html><head><meta name="description" content="Original description"></head><body></body></html>';
    const result = await transformer.transform(input);

    expect(result).toMatch(/<meta name="description" content="Modified description">/);
  });

  it('should transform link tags in the head section', async () => {
    const rule: TransformationRule = {
      selector: ['link[rel="stylesheet"]'],
      rule: async (node, $) => {
        node.attr('href', 'modified.css');
      },
    };

    const transformer = new Transformer([rule]);
    const input =
      '<html><head><link rel="stylesheet" href="original.css"></head><body></body></html>';
    const result = await transformer.transform(input);

    expect(result).toMatch(/<link rel="stylesheet" href="modified.css">/);
  });

  it('should add new elements to the head section', async () => {
    const rule: TransformationRule = {
      selector: ['head'],
      rule: async (node, $) => {
        node.append('<meta name="robots" content="noindex">');
      },
    };

    const transformer = new Transformer([rule]);
    const input = '<html><head><title>Test</title></head><body></body></html>';
    const result = await transformer.transform(input);

    expect(result).toMatch(
      /<head><title>Test<\/title><meta name="robots" content="noindex"><\/head>/,
    );
  });

  it('should add a single rule', () => {
    const transformer = new Transformer([]);
    const rule: TransformationRule = {
      selector: ['h1'],
      rule: async (node, $) => {
        node.text('Modified');
      },
    };

    transformer.addRule(rule);
    expect(transformer.rules).toHaveLength(1);
    expect(transformer.rules[0]).toBe(rule);
  });

  it('should add multiple rules at once', () => {
    const transformer = new Transformer([]);
    const rules: TransformationRule[] = [
      {
        selector: ['h1'],
        rule: async (node, $) => {
          node.text('Modified h1');
        },
      },
      {
        selector: ['h2'],
        rule: async (node, $) => {
          node.text('Modified h2');
        },
      },
    ];

    transformer.addRule(rules);
    expect(transformer.rules).toHaveLength(2);
    expect(transformer.rules).toEqual(rules);
  });

  it('should remove rules by selector', () => {
    const rules: TransformationRule[] = [
      {
        selector: ['h1', 'h2'],
        rule: async (node, $) => {
          node.addClass('heading');
        },
      },
      {
        selector: ['p', 'span'],
        rule: async (node, $) => {
          node.addClass('text');
        },
      },
    ];

    const transformer = new Transformer(rules);
    transformer.removeRule('h1');

    expect(transformer.rules).toHaveLength(1);
    expect(transformer.rules[0].selector).toEqual(['p', 'span']);
  });

  it('should clear all rules', () => {
    const rules: TransformationRule[] = [
      {
        selector: ['h1'],
        rule: async (node, $) => {
          node.addClass('heading');
        },
      },
      {
        selector: ['p'],
        rule: async (node, $) => {
          node.addClass('text');
        },
      },
    ];

    const transformer = new Transformer(rules);
    transformer.clearRules();

    expect(transformer.rules).toHaveLength(0);
  });

  it('should pass cheerioOptions to cheerio.load', async () => {
    const spy = vi.spyOn(cheerio, 'load');
    const rule: TransformationRule = {
      selector: ['h1'],
      rule: async (node, $) => {
        node.text('Modified');
      },
    };

    const transformer = new Transformer([rule]);
    const options = { decodeEntities: false };
    await transformer.transform('<h1>Title</h1>', options);

    expect(spy).toHaveBeenCalledWith('<h1>Title</h1>', options, undefined);
  });

  it('should respect isDocument parameter', async () => {
    const spy = vi.spyOn(cheerio, 'load');
    const rule: TransformationRule = {
      selector: ['h1'],
      rule: async (node, $) => {
        node.text('Modified');
      },
    };

    const transformer = new Transformer([rule]);
    await transformer.transform('<h1>Title</h1>', null, false);

    expect(spy).toHaveBeenCalledWith('<h1>Title</h1>', null, false);
  });
});
