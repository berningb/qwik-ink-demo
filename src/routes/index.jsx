import { component$, $ } from '@builder.io/qwik';
import { RichTextEditor } from '@qwik-rte/lib';

export default component$(() => {
  const handleChange$ = $((text, html, markdown) => {
    console.log('Content changed:', { text, html, markdown });
  });

  return (
    <div class="min-h-screen flex flex-col bg-gray-50">
      {/* Simple Nav */}
      <nav class="bg-white border-b border-gray-200 px-8 py-4">
        <div class="max-w-6xl mx-auto flex items-center justify-between">
          <h1 class="text-xl font-bold text-gray-800">Qwik Ink</h1>
          <div class="flex items-center gap-4">
            <a 
              href="/side-by-side" 
              class="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
            >
              Side-by-Side
            </a>
            <a 
              href="/text-analysis" 
              class="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
            >
              Text Analysis
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main class="flex-1 py-12 px-8">
        <div class="max-w-4xl mx-auto">
          <div class="mb-8 text-center">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Rich Text Editor</h2>
          </div>
          
          <RichTextEditor
            placeholder="Start typing..."
            initialContent="<h2>Welcome!</h2><p>Try out the <strong>rich text editor</strong>. Toggle between WYSIWYG, Markdown, and HTML modes.</p>"
            onChange={handleChange$}
          />
        </div>
      </main>
    </div>
  );
});

export const head = {
  title: 'Qwik Ink - Rich Text Editor',
  meta: [
    {
      name: 'description',
      content: 'A reusable Rich Text Editor built with Qwik signals',
    },
  ],
};

