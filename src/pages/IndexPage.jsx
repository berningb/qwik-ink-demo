import { component$, useSignal, $, useComputed$, useVisibleTask$ } from '@builder.io/qwik';
import { RichTextEditor } from '@qwik-rte/lib';

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

export const IndexPage = component$(() => {
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

  // Initialize editorText from initial HTML content
  useVisibleTask$(() => {
    if (typeof document !== 'undefined' && !editorText.value) {
      const temp = document.createElement('div');
      temp.innerHTML = MOCK_TEXT;
      editorText.value = temp.textContent || temp.innerText || '';
    }
  });

  const handleChange$ = $((text, html, markdown) => {
    editorText.value = text;
    editorHtml.value = html;
    editorMarkdown.value = markdown;
  });

  // Handle word click - toggle highlighting
  const handleWordClick$ = $((word) => {
    if (!word || word.length < 2) return; // Ignore very short words
    
    const normalizedWord = word.toLowerCase().trim();
    const existingIndex = keywords.value.findIndex(k => k.word.toLowerCase() === normalizedWord);
    
    if (existingIndex >= 0) {
      // Remove from keywords (unhighlight)
      keywords.value = keywords.value.filter((_, i) => i !== existingIndex);
    } else {
      // Add to keywords (highlight) - assign next available color
      const usedColors = keywords.value.map(k => k.color.class);
      const availableColor = PASTEL_COLORS.find(c => !usedColors.includes(c.class)) || PASTEL_COLORS[keywords.value.length % PASTEL_COLORS.length];
      
      keywords.value = [...keywords.value, { word: normalizedWord, color: availableColor }];
    }
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
    <div class="h-screen flex flex-col bg-slate-900 overflow-hidden">
      {/* Nav */}
      <nav class="bg-slate-800 border-b border-slate-700 px-8 py-4 shadow-lg shrink-0">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <h1 class="text-xl font-bold text-white">Qwik Ink</h1>
          <div class="flex items-center gap-4">
            <a 
              href="#side-by-side" 
              class="text-sm text-purple-300 hover:text-purple-200 font-medium transition-colors"
            >
              Side-by-Side
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content - 50/50 Split Layout */}
      <main class="flex-1 flex overflow-hidden min-h-0">
        {/* Left Side - Editor */}
        <div class="w-1/2 flex flex-col overflow-hidden border-r border-slate-700 bg-slate-800 min-h-0">
          {/* Editor */}
          <div class="flex-1 overflow-hidden p-6 min-h-0">
            <div class="h-full flex flex-col min-h-0">
              <RichTextEditor
                placeholder="Start typing..."
                initialContent={MOCK_TEXT}
                highlightWords={highlightWords.value}
                highlightWordColors={keywords.value}
                onChange={handleChange$}
                onWordClick$={handleWordClick$}
                hideModeSwitcher={false}
              />
            </div>
          </div>
        </div>

        {/* Right Side - Legend and Stats */}
        <div class="w-1/2 bg-slate-800 flex flex-col overflow-hidden min-h-0">
          {/* Keyword Legend */}
          <div class="p-4 border-b border-slate-700 bg-slate-800 shrink-0">
            <h3 class="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">Keywords</h3>
            <div class="flex flex-wrap items-center gap-2">
              {keywords.value.map((keyword, index) => (
                <div 
                  key={index}
                  class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-700 hover:bg-slate-600 transition-all border border-slate-600 cursor-pointer"
                  onClick$={() => handleWordClick$(keyword.word)}
                >
                  <div class={`w-3 h-3 rounded ${keyword.color.class} border border-slate-700`}></div>
                  <span class="text-xs font-medium text-slate-200">{keyword.word}</span>
                  {stats.value.highlightedCounts[index]?.count > 0 && (
                    <span class="text-xs font-bold text-purple-300 bg-purple-900/50 px-1.5 py-0.5 rounded">
                      {stats.value.highlightedCounts[index].count}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Statistics Panel - Compact */}
          <div class="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-slate-800 to-slate-900 min-h-0">
            <div class="grid grid-cols-2 gap-3">
              {/* Word Count Stats */}
              <div class="bg-white rounded-lg p-3 shadow-lg border border-gray-100">
                <h4 class="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                  <span class="w-0.5 h-3 bg-blue-500 rounded"></span>
                  Word Count
                </h4>
                <div class="space-y-1.5">
                  <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-600">Words</span>
                    <span class="text-lg font-bold text-blue-600">{stats.value.totalWords}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-600">Chars</span>
                    <span class="text-lg font-bold text-blue-600">{stats.value.totalChars}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-600">No Spaces</span>
                    <span class="text-lg font-bold text-blue-600">{stats.value.totalCharsNoSpaces}</span>
                  </div>
                </div>
              </div>

              {/* Highlighting Stats */}
              <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 shadow-lg border border-purple-100">
                <h4 class="text-xs font-semibold text-purple-700 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                  <span class="w-0.5 h-3 bg-purple-500 rounded"></span>
                  Highlighting
                </h4>
                <div class="space-y-1.5">
                  <div class="flex justify-between items-center">
                    <span class="text-xs text-purple-700 font-medium">Total</span>
                    <span class="text-lg font-bold text-purple-600">{stats.value.totalHighlighted}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-xs text-purple-700 font-medium">Unique</span>
                    <span class="text-lg font-bold text-purple-600">{stats.value.uniqueHighlighted}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-xs text-purple-700 font-medium">Density</span>
                    <span class="text-lg font-bold text-purple-600">
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
                <div class="col-span-2 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-3 shadow-lg border border-indigo-100">
                  <h4 class="text-xs font-semibold text-indigo-700 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                    <span class="w-0.5 h-3 bg-indigo-500 rounded"></span>
                    Top Keywords
                  </h4>
                  <div class="grid grid-cols-2 gap-1.5">
                    {stats.value.highlightedCounts
                      .filter(item => item.count > 0)
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 6)
                      .map((item, index) => (
                        <div key={index} class="flex items-center justify-between py-1 px-2 rounded bg-white/60 hover:bg-white transition-colors">
                          <div class="flex items-center gap-1.5">
                            <div class={`w-3 h-3 rounded ${item.color.class} border border-white`}></div>
                            <span class="text-xs font-medium text-gray-700">{item.word}</span>
                          </div>
                          <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{item.count}</span>
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
