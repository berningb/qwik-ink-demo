import { component$, useStore, $ } from '@builder.io/qwik';
import { RichTextEditor } from '@qwik-rte/lib';

export const SideBySidePage = component$(() => {
  const sharedContent = useStore({
    html: '<h2>Welcome to Side-by-Side View!</h2><p>Edit any editor and watch the others <strong>sync automatically</strong>.</p>',
  });

  const handleChange$ = $((text, html, markdown) => {
    sharedContent.html = html;
  });

  return (
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-white border-b border-gray-200 px-8 py-4">
        <div class="max-w-[1800px] mx-auto flex items-center justify-between">
          <h1 class="text-xl font-bold text-gray-800">Qwik Ink</h1>
          <div class="flex items-center gap-4">
            <a 
              href="#index" 
              class="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
            >
              Home
            </a>
            <a 
              href="#index" 
              class="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
            >
              Home
            </a>
          </div>
        </div>
      </nav>

      <header class="bg-white border-b border-gray-200 py-8 px-8 text-center">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Side-by-Side View</h1>
        <p class="text-gray-600">
          Three modes, one editor - watch them sync in real-time
        </p>
      </header>

      <main class="py-8 px-8 max-w-[1800px] mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="flex flex-col">
            <RichTextEditor
              initialContent={sharedContent.html}
              initialMode="wysiwyg"
              onChange={handleChange$}
            />
          </div>

          <div class="flex flex-col">
            <RichTextEditor
              initialContent={sharedContent.html}
              initialMode="markdown"
              onChange={handleChange$}
            />
          </div>

          <div class="flex flex-col">
            <RichTextEditor
              initialContent={sharedContent.html}
              initialMode="html"
              onChange={handleChange$}
            />
          </div>
        </div>
      </main>
    </div>
  );
});



