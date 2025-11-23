# Qwik RTE Demo Site

Demo site for the Qwik RTE (Rich Text Editor) - a reusable Rich Text Editor built with Qwik's signals and reactive state management system.

## Features

- 🎯 **Built with Qwik Signals** - Leverages Qwik's reactive signals and stores for automatic reactivity
- ⚡ **Lightweight** - No heavy dependencies, just Qwik's native APIs
- ♻️ **Reusable** - Easy to export and use in any Qwik project
- 🎨 **Customizable** - Simple to extend with custom commands and styling
- 📝 **Full-featured** - Bold, italic, underline, headings, lists, and more

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Visit `http://localhost:5173` to see the demo.

### Build

```bash
npm run build
```

## Usage

### Rich Text Editor

Import the RichTextEditor component and use it in your Qwik app:

```tsx
import { component$, useSignal, $ } from '@builder.io/qwik';
import { RichTextEditor } from '@qwik-rte/lib';

export default component$(() => {
  const content = useSignal('');
  const html = useSignal('');

  const handleChange$ = $((text: string, htmlContent: string) => {
    content.value = text;
    html.value = htmlContent;
    console.log('Content updated!', { text, htmlContent });
  });

  return (
    <RichTextEditor
      placeholder="Start typing..."
      initialContent="<p>Hello World!</p>"
      onChange={handleChange$}
    />
  );
});
```

### Markdown Preview (Exportable)

You can also use the standalone MarkdownPreview component:

```tsx
import { component$ } from '@builder.io/qwik';
import { MarkdownPreview, markdownToHtml } from '@qwik-rte/lib';

export default component$(() => {
  const markdown = '## Hello World\n\nThis is **bold** and *italic*.';
  const html = markdownToHtml(markdown);
  
  return <MarkdownPreview html={html} />;
});
```

## API

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `placeholder` | `string` | `'Start typing...'` | Placeholder text when editor is empty |
| `initialContent` | `string` | `''` | Initial HTML content |
| `onChange` | `(text: string, html: string) => void` | `undefined` | Callback fired when content changes |

### Features

The editor includes the following formatting options:

- **Text Formatting**: Bold, Italic, Underline
- **Headings**: H1, H2, Paragraph
- **Lists**: Bullet lists, Numbered lists
- **Clear Formatting**: Remove all formatting

## Using in Other Projects

The RTE is now available as a standalone library package. To use it in another Qwik project:

1. Install the library:
   ```bash
   npm install @qwik-rte/lib
   ```

2. Import and use the component:
   ```tsx
   import { RichTextEditor } from '@qwik-rte/lib';
   ```

The library is located in the sibling `../qwik-rte` directory and can be published to npm or used as a local package.

## Why Qwik Signals?

This editor demonstrates the power of Qwik's signals:

- **Automatic reactivity** - No need for manual re-renders
- **Fine-grained updates** - Only affected components update
- **Simple API** - Easy to understand and use
- **Performant** - Minimal overhead

## License

MIT

