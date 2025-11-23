import { component$, useSignal, $ } from '@builder.io/qwik';

export const Timeline = component$(({ chapters, onChapterSelect }) => {
  const selectedChapter = useSignal(null);

  const selectChapter$ = $((chapter) => {
    selectedChapter.value = chapter;
    if (onChapterSelect) {
      onChapterSelect(chapter);
    }
  });

  return (
    <div class="bg-slate-800 rounded-lg p-6">
      <h2 class="text-xl font-semibold mb-4">Story Timeline</h2>
      {chapters.length === 0 ? (
        <div class="text-slate-400 text-center py-12">
          No chapters found. Sync a repository to see chapters.
        </div>
      ) : (
        <div class="relative">
          {/* Timeline line */}
          <div class="absolute left-8 top-0 bottom-0 w-0.5 bg-purple-600"></div>
          
          {/* Timeline items */}
          <div class="space-y-6">
            {chapters.map((chapter, idx) => (
              <div
                key={chapter.id || idx}
                class="relative flex items-start gap-4 cursor-pointer group"
                onClick$={() => selectChapter$(chapter)}
              >
                {/* Timeline dot */}
                <div class={`relative z-10 w-4 h-4 rounded-full ${
                  selectedChapter.value === chapter 
                    ? 'bg-purple-500 ring-4 ring-purple-500/50' 
                    : 'bg-purple-600 group-hover:bg-purple-500'
                } transition-all`}></div>
                
                {/* Chapter card */}
                <div class={`flex-1 bg-slate-700 rounded-lg p-4 transition-all ${
                  selectedChapter.value === chapter 
                    ? 'ring-2 ring-purple-500 shadow-lg' 
                    : 'group-hover:bg-slate-600'
                }`}>
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <h3 class="font-semibold text-lg mb-1">{chapter.name}</h3>
                      {chapter.path && (
                        <p class="text-sm text-slate-400 mb-2">{chapter.path}</p>
                      )}
                      {chapter.content && (
                        <p class="text-sm text-slate-300 line-clamp-2">
                          {chapter.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                        </p>
                      )}
                    </div>
                    <div class="text-xs text-slate-400 ml-4">
                      #{idx + 1}
                    </div>
                  </div>
                  
                  {/* Chapter stats */}
                  {chapter.content && (
                    <div class="flex gap-4 mt-3 text-xs text-slate-400">
                      <span>
                        {chapter.content.replace(/<[^>]*>/g, '').split(/\s+/).length} words
                      </span>
                      <span>
                        {chapter.content.replace(/<[^>]*>/g, '').length} chars
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});




