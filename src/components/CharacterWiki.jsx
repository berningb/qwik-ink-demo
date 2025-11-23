import { component$, useSignal, $, useStore, useVisibleTask$, useComputed$ } from '@builder.io/qwik';
import { RichTextEditor } from '@qwik-rte/lib';

export const CharacterWiki = component$(({ userId, characters, parsedCharacters, chapters, selectedCharacterName, onCharacterSelect, onUpdate }) => {
  const selectedCharacter = useSignal(null);
  const editing = useSignal(false);
  const characterForm = useStore({
    name: '',
    description: '',
    background: '',
    notes: '',
    tags: [],
  });

  const startEdit$ = $((character) => {
    selectedCharacter.value = character;
    editing.value = true;
    characterForm.name = character.name || '';
    characterForm.description = character.description || '';
    characterForm.background = character.background || '';
    characterForm.notes = character.notes || '';
    characterForm.tags = character.tags || [];
  });

  const saveCharacter$ = $(() => {
    try {
      const charData = {
        ...characterForm,
        id: selectedCharacter.value?.id || Date.now().toString(),
      };
      
      // Load existing characters from localStorage
      const stored = localStorage.getItem('ficflow_characters');
      const allCharacters = stored ? JSON.parse(stored) : [];
      
      // Update or add character
      const index = allCharacters.findIndex(c => c.id === charData.id);
      if (index >= 0) {
        allCharacters[index] = charData;
      } else {
        allCharacters.push(charData);
      }
      
      // Save back to localStorage
      localStorage.setItem('ficflow_characters', JSON.stringify(allCharacters));
      
      editing.value = false;
      selectedCharacter.value = null;
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error saving character:', error);
    }
  });

  const deleteCharacter$ = $((characterId) => {
    if (confirm('Are you sure you want to delete this character?')) {
      try {
        const stored = localStorage.getItem('ficflow_characters');
        const allCharacters = stored ? JSON.parse(stored) : [];
        const filtered = allCharacters.filter(c => c.id !== characterId);
        localStorage.setItem('ficflow_characters', JSON.stringify(filtered));
        
        if (onUpdate) {
          onUpdate();
        }
      } catch (error) {
        console.error('Error deleting character:', error);
      }
    }
  });

  const cancelEdit$ = $(() => {
    editing.value = false;
    selectedCharacter.value = null;
    characterForm.name = '';
    characterForm.description = '';
    characterForm.background = '';
    characterForm.notes = '';
    characterForm.tags = [];
  });

  // Get character details from parsed characters and chapters
  const characterDetails = useComputed$(() => {
    // selectedCharacterName is a prop (value), not a signal
    const charName = selectedCharacterName;
    if (!charName) return null;
    
    if (!parsedCharacters || !Array.isArray(parsedCharacters)) return null;
    
    const parsedChar = parsedCharacters.find(c => c.name === charName);
    if (!parsedChar) return null;
    
    // Find all mentions of this character in chapters
    const mentions = [];
    if (chapters && Array.isArray(chapters)) {
      chapters.forEach(chapter => {
        if (chapter && chapter.content) {
          const regex = new RegExp(`\\b${charName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          const matches = chapter.content.match(regex);
          if (matches && matches.length > 0) {
            mentions.push({
              chapter: chapter.name || 'Unknown',
              count: matches.length,
              content: chapter.content.substring(0, 500) // First 500 chars for preview
            });
          }
        }
      });
    }
    
    // Get saved character data if exists
    const savedChar = characters && Array.isArray(characters) 
      ? characters.find(c => c.name === charName)
      : null;
    
    return {
      name: charName,
      mentionCount: parsedChar.count || 0,
      mentions,
      savedData: savedChar || null,
      context: parsedChar.context || []
    };
  });

  // Get all available characters (from parsed + saved)
  const allCharacters = useComputed$(() => {
    const parsed = parsedCharacters?.map(c => ({ id: c.name, name: c.name, source: 'parsed' })) || [];
    const saved = characters.map(c => ({ ...c, source: 'saved' }));
    
    // Merge, prioritizing saved data
    const merged = new Map();
    parsed.forEach(c => {
      if (!merged.has(c.name)) {
        merged.set(c.name, c);
      }
    });
    saved.forEach(c => {
      merged.set(c.name, { ...merged.get(c.name), ...c });
    });
    
    return Array.from(merged.values());
  });

  return (
    <>
      {/* Character Details View */}
      {selectedCharacterName && characterDetails.value && !editing.value && (
        <div class="bg-slate-800 rounded-lg p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <button
                onClick$={() => {
                  if (onCharacterSelect) {
                    onCharacterSelect(null);
                  }
                }}
                class="text-slate-400 hover:text-white mb-2 text-sm"
              >
                ← Back to Characters
              </button>
              <h2 class="text-2xl font-semibold">{characterDetails.value.name}</h2>
              <p class="text-slate-400 text-sm mt-1">Mentioned {characterDetails.value.mentionCount} times</p>
            </div>
            <button
              onClick$={() => {
                const charToEdit = characterDetails.value.savedData || { name: characterDetails.value.name };
                startEdit$(charToEdit);
              }}
              class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {characterDetails.value.savedData ? 'Edit' : 'Add Details'}
            </button>
          </div>

          <div class="space-y-6">
            {/* Saved Character Data */}
            {characterDetails.value.savedData && (
              <div class="bg-slate-700 rounded-lg p-6 space-y-4">
                {characterDetails.value.savedData.description && (
                  <div>
                    <h3 class="text-lg font-semibold mb-2">Description</h3>
                    <p class="text-slate-300">{characterDetails.value.savedData.description}</p>
                  </div>
                )}
                {characterDetails.value.savedData.background && (
                  <div>
                    <h3 class="text-lg font-semibold mb-2">Background</h3>
                    <div 
                      class="prose prose-invert max-w-none text-slate-300"
                      dangerouslySetInnerHTML={characterDetails.value.savedData.background}
                    />
                  </div>
                )}
                {characterDetails.value.savedData.notes && (
                  <div>
                    <h3 class="text-lg font-semibold mb-2">Notes</h3>
                    <p class="text-slate-300 whitespace-pre-wrap">{characterDetails.value.savedData.notes}</p>
                  </div>
                )}
                {characterDetails.value.savedData.tags && characterDetails.value.savedData.tags.length > 0 && (
                  <div>
                    <h3 class="text-lg font-semibold mb-2">Tags</h3>
                    <div class="flex flex-wrap gap-2">
                      {characterDetails.value.savedData.tags.map((tag, idx) => (
                        <span key={idx} class="bg-purple-900/50 text-purple-200 text-xs px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Context from Story */}
            {characterDetails.value.context && characterDetails.value.context.length > 0 && (
              <div class="bg-slate-700 rounded-lg p-6">
                <h3 class="text-lg font-semibold mb-4">Story Context</h3>
                <div class="space-y-3">
                  {characterDetails.value.context
                    .filter(ctx => ctx && ctx.trim().length > 10) // Filter out very short contexts
                    .map((ctx, idx) => {
                      // Clean up the context - remove extra quotes and normalize
                      const cleaned = ctx.trim().replace(/^["']+|["']+$/g, '').trim();
                      return cleaned.length > 10 ? (
                        <div key={idx} class="bg-slate-600 p-3 rounded text-sm text-slate-300">
                          {cleaned}
                        </div>
                      ) : null;
                    })
                    .filter(Boolean)}
                </div>
              </div>
            )}

            {/* Chapter Mentions */}
            {characterDetails.value.mentions && characterDetails.value.mentions.length > 0 && (
              <div class="bg-slate-700 rounded-lg p-6">
                <h3 class="text-lg font-semibold mb-4">Chapter Mentions</h3>
                <div class="space-y-3">
                  {characterDetails.value.mentions.map((mention, idx) => (
                    <div key={idx} class="bg-slate-600 p-4 rounded">
                      <div class="flex items-center justify-between mb-2">
                        <span class="font-semibold">{mention.chapter}</span>
                        <span class="text-sm text-slate-400">Mentioned {mention.count} times</span>
                      </div>
                      <p class="text-sm text-slate-300 line-clamp-3">{mention.content.replace(/<[^>]*>/g, '').substring(0, 200)}...</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!characterDetails.value.savedData && (
              <div class="bg-slate-700/50 rounded-lg p-6 text-center text-slate-400">
                <p>No additional details saved for this character.</p>
                <button
                  onClick$={() => {
                    const charToEdit = { name: characterDetails.value.name };
                    startEdit$(charToEdit);
                  }}
                  class="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Add Details
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Form */}
      {editing.value && (
        <div class="bg-slate-800 rounded-lg p-6">
          <div class="bg-slate-700 rounded-lg p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Name</label>
              <input
                type="text"
                value={characterForm.name}
                onInput$={(e) => characterForm.name = e.target.value}
                class="w-full bg-slate-600 text-white px-4 py-2 rounded-lg border border-slate-500 focus:border-purple-500 focus:outline-none"
                placeholder="Character name"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Description</label>
              <textarea
                value={characterForm.description}
                onInput$={(e) => characterForm.description = e.target.value}
                class="w-full bg-slate-600 text-white px-4 py-2 rounded-lg border border-slate-500 focus:border-purple-500 focus:outline-none"
                rows="3"
                placeholder="Brief description"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Background</label>
              <RichTextEditor
                initialContent={characterForm.background}
                onChange={$((text, html) => {
                  characterForm.background = html;
                })}
                hideModeSwitcher={true}
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Notes</label>
              <textarea
                value={characterForm.notes}
                onInput$={(e) => characterForm.notes = e.target.value}
                class="w-full bg-slate-600 text-white px-4 py-2 rounded-lg border border-slate-500 focus:border-purple-500 focus:outline-none"
                rows="3"
                placeholder="Additional notes"
              />
            </div>

            <div class="flex gap-2">
              <button
                onClick$={saveCharacter$}
                class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Save
              </button>
              <button
                onClick$={cancelEdit$}
                class="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              {selectedCharacter.value?.id && (
                <button
                  onClick$={() => deleteCharacter$(selectedCharacter.value.id)}
                  class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors ml-auto"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Character List View */}
      {!selectedCharacterName && !editing.value && (
        <div class="bg-slate-800 rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold">Character Wiki</h2>
            <button
              onClick$={() => startEdit$({})}
              class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + New Character
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allCharacters.value.map((char) => (
              <div
                key={char.id || char.name}
                onClick$={() => {
                  if (onCharacterSelect) {
                    onCharacterSelect(char.name);
                  } else {
                    startEdit$(char);
                  }
                }}
                class="bg-slate-700 hover:bg-slate-600 p-4 rounded-lg cursor-pointer transition-colors"
              >
                <h3 class="font-semibold text-lg mb-2">{char.name}</h3>
                {char.description && (
                  <p class="text-sm text-slate-300 mb-2 line-clamp-2">{char.description}</p>
                )}
                {char.tags && char.tags.length > 0 && (
                  <div class="flex flex-wrap gap-1 mt-2">
                    {char.tags.map((tag, idx) => (
                      <span key={idx} class="bg-purple-900/50 text-purple-200 text-xs px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {parsedCharacters && parsedCharacters.find(c => c.name === char.name) && (
                  <div class="text-xs text-slate-400 mt-2">
                    Mentioned {parsedCharacters.find(c => c.name === char.name).count} times
                  </div>
                )}
              </div>
            ))}
            {allCharacters.value.length === 0 && (
              <div class="col-span-full text-center text-slate-400 py-8">
                No characters found. Sync a repository to see characters.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
});



