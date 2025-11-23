import { component$, useSignal, $, useComputed$, useVisibleTask$ } from '@builder.io/qwik';
import { RichTextEditor, MarkdownPreview } from '@qwik-rte/lib';

/**
 * Highlights words with different colors
 */
function highlightWordsMultiColor(html, wordColorMap) {
  if (!html || !wordColorMap || wordColorMap.length === 0) {
    return html;
  }

  let result = html;
  
  // Sort by word length (longest first) to handle overlapping
  const sorted = [...wordColorMap].sort((a, b) => b.word.length - a.word.length);
  
  sorted.forEach(({ word, color }) => {
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?![^<]*>)(\\b${escapedWord}\\b)`, 'gi');
    result = result.replace(regex, `<span class="${color.class} ${color.text} px-0.5 rounded font-medium">$1</span>`);
  });
  
  return result;
}

/**
 * Custom preview component with multi-color highlighting
 */
const MultiColorPreview = component$(({ html, keywords }) => {
  const highlightedHtml = highlightWordsMultiColor(html || '', keywords || []);
  
  return (
    <div 
      class="min-h-[300px] p-5 text-base leading-relaxed overflow-y-auto flex-1 bg-white [&_h1]:text-3xl [&_h1]:my-3 [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:my-3 [&_h2]:font-bold [&_h3]:text-xl [&_h3]:my-3 [&_h3]:font-bold [&_p]:my-2 [&_ul]:my-2 [&_ul]:pl-8 [&_ul]:list-disc [&_ol]:my-2 [&_ol]:pl-8 [&_ol]:list-decimal [&_li]:my-1 [&_li]:ml-4 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_a]:text-blue-500 [&_a]:underline [&_img]:max-w-full [&_img]:h-auto" 
      dangerouslySetInnerHTML={highlightedHtml} 
    />
  );
});

// Pastel color palette for keywords
const PASTEL_COLORS = [
  { name: 'Lavender', class: 'bg-purple-200', text: 'text-purple-800' },
  { name: 'Mint', class: 'bg-green-200', text: 'text-green-800' },
  { name: 'Peach', class: 'bg-orange-200', text: 'text-orange-800' },
  { name: 'Sky', class: 'bg-blue-200', text: 'text-blue-800' },
  { name: 'Rose', class: 'bg-pink-200', text: 'text-pink-800' },
  { name: 'Butter', class: 'bg-yellow-200', text: 'text-yellow-800' },
  { name: 'Aqua', class: 'bg-cyan-200', text: 'text-cyan-800' },
  { name: 'Lilac', class: 'bg-indigo-200', text: 'text-indigo-800' },
];

// Mock text content
const MOCK_TEXT = `
<h1>The Art of Digital Storytelling</h1>

<p>In the modern era of content creation, <strong>storytelling</strong> has evolved beyond traditional narratives. Digital platforms have transformed how we communicate, share ideas, and connect with audiences. The power of <em>compelling content</em> lies not just in the words themselves, but in how they are presented and experienced.</p>

<h2>The Evolution of Content</h2>

<p>Content creation has become an art form that combines <strong>creativity</strong>, <strong>technology</strong>, and <strong>strategy</strong>. Writers and creators must understand their audience, craft messages that resonate, and leverage the right tools to bring their visions to life. The digital landscape offers unprecedented opportunities for expression and engagement.</p>

<p>Whether you're writing a blog post, creating marketing materials, or developing educational content, the principles of effective <em>communication</em> remain constant. Clarity, authenticity, and relevance are the cornerstones of impactful writing. These elements work together to create experiences that inform, inspire, and influence.</p>

<h2>Key Principles</h2>

<ul>
  <li><strong>Clarity</strong> - Your message must be clear and understandable</li>
  <li><strong>Engagement</strong> - Content should capture and hold attention</li>
  <li><strong>Value</strong> - Every piece should provide value to the reader</li>
  <li><strong>Authenticity</strong> - Genuine voice builds trust and connection</li>
</ul>

<p>The future of content creation is bright, with new <strong>technologies</strong> and platforms emerging constantly. As creators, we must stay adaptable, continuously learning and evolving our craft. The tools we use today may change, but the fundamental need for meaningful <em>communication</em> will always remain.</p>
`;

export default component$(() => {
  // Keywords with their assigned colors
  const keywords = useSignal([
    { word: 'storytelling', color: PASTEL_COLORS[0] },
    { word: 'content', color: PASTEL_COLORS[1] },
    { word: 'creativity', color: PASTEL_COLORS[2] },
    { word: 'technology', color: PASTEL_COLORS[3] },
    { word: 'communication', color: PASTEL_COLORS[4] },
    { word: 'engagement', color: PASTEL_COLORS[5] },
  ]);

  const editorContent = useSignal(MOCK_TEXT);
  const editorText = useSignal('');
  const editorHtml = useSignal(MOCK_TEXT);
  const editorMarkdown = useSignal('');

  const handleChange$ = $((text, html, markdown) => {
    editorText.value = text;
    editorHtml.value = html;
    editorMarkdown.value = markdown;
  });

  // Get all words to highlight (for basic highlighting)
  const highlightWords = useComputed$(() => {
    return keywords.value.map(k => k.word);
  });

  // Get highlighted HTML with multi-color support
  const highlightedHtml = useComputed$(() => {
    return highlightWordsMultiColor(editorHtml.value, keywords.value);
  });

  // Calculate statistics
  const stats = useComputed$(() => {
    const text = editorText.value || '';
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const totalWords = words.length;
    const totalChars = text.length;
    const totalCharsNoSpaces = text.replace(/\s/g, '').length;
    
    // Count highlighted words
    const highlightedCounts = keywords.value.map(keyword => {
      const regex = new RegExp(`\\b${keyword.word}\\b`, 'gi');
      const matches = text.match(regex);
      return {
        word: keyword.word,
        count: matches ? matches.length : 0,
        color: keyword.color,
      };
    });

    const totalHighlighted = highlightedCounts.reduce((sum, item) => sum + item.count, 0);
    const uniqueHighlighted = highlightedCounts.filter(item => item.count > 0).length;

    return {
      totalWords,
      totalChars,
      totalCharsNoSpaces,
      totalHighlighted,
      uniqueHighlighted,
      highlightedCounts,
    };
  });

  return (
    <div class="min-h-screen flex flex-col bg-gray-50">
      {/* Nav */}
      <nav class="bg-white border-b border-gray-200 px-8 py-4">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <h1 class="text-xl font-bold text-gray-800">Qwik Ink - Text Analysis</h1>
          <div class="flex items-center gap-4">
            <a 
              href="/" 
              class="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
            >
              Home
            </a>
            <a 
              href="/side-by-side" 
              class="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
            >
              Side-by-Side
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content - Full Height Layout */}
      <main class="flex-1 flex overflow-hidden">
        {/* Left Side - Full Height Editor */}
        <div class="flex-1 flex flex-col overflow-hidden">
          <div class="p-6 bg-white border-b border-gray-200">
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Text Editor</h2>
            <p class="text-sm text-gray-600">Edit the text and see keywords highlighted in preview mode</p>
          </div>
          <div class="flex-1 overflow-hidden p-6">
            <div class="h-full flex flex-col">
              <RichTextEditor
                placeholder="Start typing..."
                initialContent={MOCK_TEXT}
                highlightWords={highlightWords.value}
                onChange={handleChange$}
                hideModeSwitcher={true}
              />
            </div>
          </div>
        </div>

        {/* Right Side - Legend & Stats */}
        <div class="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
          {/* Keyword Legend */}
          <div class="p-6 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Keyword Legend</h3>
            <div class="space-y-2">
              {keywords.value.map((keyword, index) => (
                <div 
                  key={index}
                  class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div class={`w-6 h-6 rounded ${keyword.color.class} border-2 border-white shadow-sm`}></div>
                  <div class="flex-1">
                    <div class="font-medium text-gray-900">{keyword.word}</div>
                    <div class={`text-xs ${keyword.color.text}`}>{keyword.color.name}</div>
                  </div>
                  {stats.value.highlightedCounts[index]?.count > 0 && (
                    <div class="text-sm font-semibold text-gray-600">
                      {stats.value.highlightedCounts[index].count}x
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Multi-Color Preview Section */}
          <div class="p-6 border-b border-gray-200 bg-gray-50">
            <h3 class="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Multi-Color Preview</h3>
            <div class="bg-white border border-gray-200 rounded overflow-hidden" style="max-height: 200px;">
              <MultiColorPreview html={editorHtml.value} keywords={keywords.value} />
            </div>
          </div>

          {/* Statistics Panel */}
          <div class="flex-1 overflow-y-auto p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
            <div class="space-y-4">
              {/* Word Count Stats */}
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Word Count</h4>
                <div class="space-y-2">
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Total Words</span>
                    <span class="text-lg font-bold text-gray-900">{stats.value.totalWords}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Total Characters</span>
                    <span class="text-lg font-bold text-gray-900">{stats.value.totalChars}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Characters (no spaces)</span>
                    <span class="text-lg font-bold text-gray-900">{stats.value.totalCharsNoSpaces}</span>
                  </div>
                </div>
              </div>

              {/* Highlighting Stats */}
              <div class="bg-purple-50 rounded-lg p-4">
                <h4 class="text-sm font-semibold text-purple-700 mb-3 uppercase tracking-wide">Highlighting</h4>
                <div class="space-y-2">
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-purple-600">Total Highlighted</span>
                    <span class="text-lg font-bold text-purple-900">{stats.value.totalHighlighted}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-purple-600">Unique Keywords</span>
                    <span class="text-lg font-bold text-purple-900">{stats.value.uniqueHighlighted}</span>
                  </div>
                  <div class="flex justify-between items-center pt-2 border-t border-purple-200">
                    <span class="text-sm text-purple-600">Highlight Density</span>
                    <span class="text-lg font-bold text-purple-900">
                      {stats.value.totalWords > 0 
                        ? ((stats.value.totalHighlighted / stats.value.totalWords) * 100).toFixed(1)
                        : '0'
                      }%
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Highlighted Words */}
              {stats.value.highlightedCounts.some(item => item.count > 0) && (
                <div class="bg-blue-50 rounded-lg p-4">
                  <h4 class="text-sm font-semibold text-blue-700 mb-3 uppercase tracking-wide">Top Keywords</h4>
                  <div class="space-y-2">
                    {stats.value.highlightedCounts
                      .filter(item => item.count > 0)
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 5)
                      .map((item, index) => (
                        <div key={index} class="flex items-center justify-between">
                          <div class="flex items-center gap-2">
                            <div class={`w-4 h-4 rounded ${item.color.class}`}></div>
                            <span class="text-sm text-gray-700">{item.word}</span>
                          </div>
                          <span class="text-sm font-semibold text-gray-900">{item.count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
});

export const head = {
  title: 'Qwik Ink - Text Analysis',
  meta: [
    {
      name: 'description',
      content: 'Text analysis demo with keyword highlighting',
    },
  ],
};

