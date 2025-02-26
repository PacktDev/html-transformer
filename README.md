# HTML Transformer

[![JSR](https://jsr.io/badges/@packt/html-transformer)](https://jsr.io/badges/@packt/html-transformer)
[![NPM]()]

A flexible and powerful HTML transformation library that allows you to apply rules to HTML content using CSS selectors.

## Features

- Transform HTML content from various input types (string, Buffer, Readable stream, or Cheerio API)
- Apply multiple transformation rules in sequence
- Use any valid CSS selector supported by Cheerio (including complex pseudo-selectors)
- Support for asynchronous transformation rules
- Modify content, attributes, structure, and more
- Transform elements in both `<head>` and `<body>` sections

## Installation

```bash
npm install @packt/html-transformer
```

## Usage

### Basic Example

```typescript
import { Transformer, TranformationRule } from '@packt/html-transformer';

// Define transformation rules
const rules: TranformationRule[] = [
  {
    selector: ['h1'], // Target all h1 elements
    rule: async (node, $) => {
      node.addClass('title');
      node.text(`Modified: ${node.text()}`);
    }
  },
  {
    selector: ['a'], // Target all links
    rule: async (node, $) => {
      const href = node.attr('href');
      if (href && !href.startsWith('https://')) {
        node.attr('href', `https://example.com${href}`);
      }
    }
  }
];

// Create transformer
const transformer = new Transformer(rules);

// Transform HTML string
const html = '<html><body><h1>Original Title</h1><a href="/link">Link</a></body></html>';
const result = await transformer.transform(html);

console.log(result);
// Outputs: HTML with modified title and link
```

### Using Multiple Input Types

The transformer accepts various input types:

```typescript
// String input
const htmlString = '<div>Hello world</div>';
const result1 = await transformer.transform(htmlString);

// Buffer input
const buffer = Buffer.from('<div>Hello world</div>');
const result2 = await transformer.transform(buffer);

// Stream input
const stream = Readable.from(['<div>Hello', ' world</div>']);
const result3 = await transformer.transform(stream);

// Cheerio API input
const $ = cheerio.load('<div>Hello world</div>');
await transformer.transform($);
const result4 = $.html();
```

### Complex Selectors

The library supports all CSS selectors available in Cheerio:

```typescript
const rules: TranformationRule[] = [
  {
    // Target divs that contain spans
    selector: ['div:has(span)'],
    rule: async (node, $) => {
      node.addClass('has-span');
    }
  },
  {
    // Target the second item in lists
    selector: ['li:nth-child(2)'],
    rule: async (node, $) => {
      node.addClass('second-item');
    }
  },
  {
    // Target paragraphs that don't have a specific class
    selector: ['p:not(.exclude)'],
    rule: async (node, $) => {
      node.addClass('included');
    }
  },
  {
    // Target multiple selectors in one rule
    selector: ['h1', 'h2', 'h3'],
    rule: async (node, $) => {
      node.addClass('heading');
    }
  }
];
```

### Modifying the Document Head

You can also target and modify elements in the `<head>` section:

```typescript
const rules: TranformationRule[] = [
  {
    selector: ['title'],
    rule: async (node, $) => {
      node.text('New Page Title');
    }
  },
  {
    selector: ['meta[name="description"]'],
    rule: async (node, $) => {
      node.attr('content', 'Updated description for SEO');
    }
  },
  {
    selector: ['head'],
    rule: async (node, $) => {
      // Add a new meta tag
      node.append('<meta name="robots" content="noindex">');
    }
  }
];
```

### Common Transformations

#### Adding Classes

```typescript
{
  selector: ['.target'],
  rule: async (node, $) => {
    node.addClass('new-class');
  }
}
```

#### Changing Attributes

```typescript
{
  selector: ['img'],
  rule: async (node, $) => {
    node.attr('alt', 'Descriptive alt text');
    node.attr('loading', 'lazy');
  }
}
```

#### Wrapping Elements

```typescript
{
  selector: ['table'],
  rule: async (node, $) => {
    node.wrap('<div class="table-responsive"></div>');
  }
}
```

#### Modifying Content

```typescript
{
  selector: ['p'],
  rule: async (node, $) => {
    const text = node.text();
    node.html(`<strong>${text}</strong>`);
  }
}
```

#### Using the Full Cheerio API

The rule function provides access to the Cheerio API, allowing for more complex manipulations:

```typescript
{
  selector: ['article'],
  rule: async (node, $) => {
    // Find all images without alt text within this article
    const images = node.find('img:not([alt])');
    images.each((i, img) => {
      $(img).attr('alt', 'Article image');
    });
    
    // Add a class to all paragraphs within this article
    node.find('p').addClass('article-text');
  }
}
```

## API Reference

### Class: Transformer

The main class for transforming HTML.

#### Constructor

```typescript
constructor(rules: TranformationRule[])
```

Creates a new Transformer instance with the specified rules.

#### Methods

```typescript
async transform($: CheerioAPI): Promise<void>;
async transform(html: string): Promise<string>;
async transform(html: Buffer): Promise<string>;
async transform(html: Readable): Promise<string>;
```

Transforms the input HTML according to the rules.

### Interface: TranformationRule

```typescript
interface TranformationRule {
  selector: string[]; // Array of CSS selectors
  rule: (node: Cheerio<AnyNode>, $: CheerioAPI) => Promise<void>;
}
```

- `selector`: An array of CSS selectors that determine which elements the rule will be applied to
- `rule`: An async function that receives the matched element and the Cheerio API instance

## License

MIT

