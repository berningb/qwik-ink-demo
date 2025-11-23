import { component$, useSignal, $, useVisibleTask$, useComputed$ } from '@builder.io/qwik';
import { parseFiles } from '../lib/textParser';
import { CharacterWiki } from '../components/CharacterWiki';

export const FanFictionDashboard = component$(() => {
  const selectedRepo = useSignal(null);
  const chapters = useSignal([]);
  const parsing = useSignal(false);
  const error = useSignal(null);
  const activeTab = useSignal('overview');
  const savedCharacters = useSignal([]);
  const selectedChapter = useSignal(null);
  const selectedCharacter = useSignal(null);
  const selectedFile = useSignal(null);

  // Load characters from localStorage
  useVisibleTask$(() => {
    try {
      const stored = localStorage.getItem('ficflow_characters');
      if (stored) {
        savedCharacters.value = JSON.parse(stored);
      }
    } catch (err) {
      console.error('Error loading characters:', err);
    }
  });

  const loadCharacters = $(() => {
    try {
      const stored = localStorage.getItem('ficflow_characters');
      savedCharacters.value = stored ? JSON.parse(stored) : [];
    } catch (err) {
      console.error('Error loading characters:', err);
      savedCharacters.value = [];
    }
  });

  // Read files from uploaded folder
  const handleFolderUpload$ = $(async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      error.value = 'No folder selected';
      return;
    }

    try {
      parsing.value = true;
      error.value = null;

      // Filter and read text files, preserving folder structure
      const textExtensions = ['.txt', '.md', '.markdown', '.html', '.htm'];
      const filePromises = [];
      const folderStructure = new Map(); // Track folder structure

      for (const file of Array.from(files)) {
        const fileName = file.name.toLowerCase();
        const isTextFile = textExtensions.some(ext => fileName.endsWith(ext));
        
        if (isTextFile) {
          const relativePath = file.webkitRelativePath || file.name;
          const pathParts = relativePath.split('/');
          const folderPath = pathParts.slice(0, -1).join('/'); // Everything except filename
          
          // Track folder structure
          if (folderPath && !folderStructure.has(folderPath)) {
            folderStructure.set(folderPath, []);
          }
          
          filePromises.push(
            new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                const fileData = {
                  name: file.name,
                  path: relativePath,
                  folderPath: folderPath || '/',
                  content: e.target?.result || '',
                  size: file.size,
                  sha: `${relativePath}-${file.size}`, // Use full path for ID
                };
                
                // Add to folder structure
                if (folderPath) {
                  folderStructure.get(folderPath).push(fileData);
                }
                
                resolve(fileData);
              };
              reader.onerror = () => {
                const fileData = {
                  name: file.name,
                  path: relativePath,
                  folderPath: folderPath || '/',
                  content: '',
                  size: file.size,
                  sha: `${relativePath}-${file.size}`,
                };
                resolve(fileData);
              };
              reader.readAsText(file);
            })
          );
        }
      }

      const loadedFiles = await Promise.all(filePromises);
      
      if (loadedFiles.length === 0) {
        error.value = 'No text files found in the selected folder';
        parsing.value = false;
        return;
      }

      // Sort files by path to maintain folder order
      loadedFiles.sort((a, b) => a.path.localeCompare(b.path));

      // Parse files for characters, locations, relationships
      const parsed = parseFiles(loadedFiles);
      
      // Store chapters with folder structure
      chapters.value = loadedFiles.map((file, index) => ({
        id: file.sha,
        name: file.name,
        path: file.path,
        folderPath: file.folderPath,
        content: file.content,
        order: index,
      }));
      
      // Get folder name from first file's path
      const firstFile = loadedFiles[0];
      const rootFolderName = firstFile.path.split('/')[0] || 'Uploaded Folder';
      
      selectedRepo.value = {
        name: rootFolderName,
        files: loadedFiles,
        parsed,
        folderStructure: Array.from(folderStructure.entries()).map(([path, files]) => ({
          path,
          files: files.length,
        })),
      };
      
      parsing.value = false;
    } catch (err) {
      console.error('Error processing files:', err);
      error.value = err.message || 'Failed to process files';
      parsing.value = false;
    }
  });

  return (
    <div class="min-h-screen bg-slate-900 text-white">
      {/* Nav */}
      <nav class="bg-slate-800 border-b border-slate-700 px-8 py-4">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <h1 class="text-xl font-bold">FicFlow</h1>
        </div>
      </nav>

      {/* Main Content */}
      <main class="max-w-7xl mx-auto px-8 py-8">
        {error.value && (
          <div class="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded mb-6">
            {error.value}
          </div>
        )}

        {/* Folder Upload */}
        {!selectedRepo.value && (
          <div class="bg-slate-800 rounded-lg p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4">Upload Story Folder</h2>
            <p class="text-slate-300 mb-4 text-sm">
              Select a folder containing your story files. The entire folder structure will be preserved.
              <br />
              <span class="text-slate-400">Supported formats: .md, .txt, .html, .htm</span>
            </p>
            <div class="flex gap-2">
              <input
                type="file"
                id="folder-upload"
                webkitdirectory=""
                directory=""
                multiple
                onChange$={handleFolderUpload$}
                disabled={parsing.value}
                class="hidden"
              />
              <label
                for="folder-upload"
                class={`flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-lg transition-colors cursor-pointer text-center ${
                  parsing.value ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {parsing.value ? 'Processing Folder...' : '📁 Select Folder'}
              </label>
            </div>
            <p class="text-slate-400 text-xs mt-2">
              💡 Tip: Click "Select Folder" and choose the folder containing your story files. All subfolders will be included.
            </p>
          </div>
        )}

        {/* Tabs */}
        {selectedRepo.value && (
          <div class="mb-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <div class="flex gap-2 border-b border-slate-700">
                  {['overview', 'wiki'].map((tab) => (
                    <button
                      key={tab}
                      onClick$={() => {
                        activeTab.value = tab;
                        if (tab === 'overview') {
                          selectedCharacter.value = null;
                        }
                      }}
                      class={`px-6 py-3 font-medium transition-colors capitalize ${
                        activeTab.value === tab
                          ? 'text-purple-400 border-b-2 border-purple-400'
                          : 'text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <p class="text-slate-400 text-sm mt-2">
                  {selectedRepo.value.files?.length || 0} files loaded
                </p>
              </div>
              <button
                onClick$={() => {
                  selectedRepo.value = null;
                  chapters.value = [];
                  selectedCharacter.value = null;
                  activeTab.value = 'overview';
                  // Reset file input
                  const fileInput = document.getElementById('folder-upload');
                  if (fileInput) {
                    fileInput.value = '';
                  }
                }}
                class="text-slate-400 hover:text-white text-sm"
              >
                📁 Upload New Folder
              </button>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {selectedRepo.value && (
          <div>
            {/* Overview Tab */}
            {activeTab.value === 'overview' && (
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Characters */}
                <div class="bg-slate-800 rounded-lg p-6">
                  <h3 class="text-lg font-semibold mb-4">Characters ({selectedRepo.value.parsed.characters.length})</h3>
                  <div class="space-y-2 max-h-96 overflow-y-auto">
                    {selectedRepo.value.parsed.characters.slice(0, 20).map((char, idx) => (
                      <div 
                        key={idx} 
                        onClick$={() => {
                          selectedCharacter.value = char.name;
                          activeTab.value = 'wiki';
                        }}
                        class="bg-slate-700 hover:bg-slate-600 p-3 rounded cursor-pointer transition-colors"
                      >
                        <div class="font-medium">{char.name}</div>
                        <div class="text-sm text-slate-400">Mentions: {char.count}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Locations */}
                <div class="bg-slate-800 rounded-lg p-6">
                  <h3 class="text-lg font-semibold mb-4">Locations ({selectedRepo.value.parsed.locations.length})</h3>
                  <div class="space-y-2 max-h-96 overflow-y-auto">
                    {selectedRepo.value.parsed.locations.slice(0, 20).map((loc, idx) => (
                      <div key={idx} class="bg-slate-700 p-3 rounded">
                        <div class="font-medium">{loc.name}</div>
                        <div class="text-sm text-slate-400">Mentions: {loc.count}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Files */}
                <div class="bg-slate-800 rounded-lg p-6">
                  <h3 class="text-lg font-semibold mb-4">Files ({selectedRepo.value.files?.length || 0})</h3>
                  <div class="space-y-2 max-h-96 overflow-y-auto">
                    {selectedRepo.value.files?.slice(0, 20).map((file, idx) => (
                      <div 
                        key={idx}
                        onClick$={() => {
                          // Store file data in sessionStorage to pass to text-analysis page
                          sessionStorage.setItem('ficflow_file_content', file.content);
                          sessionStorage.setItem('ficflow_file_name', file.name);
                          sessionStorage.setItem('ficflow_characters', JSON.stringify(selectedRepo.value.parsed.characters));
                          // Navigate to text-analysis page
                          window.location.href = '/text-analysis';
                        }}
                        class="bg-slate-700 hover:bg-slate-600 p-3 rounded cursor-pointer transition-colors"
                      >
                        <div class="font-medium truncate">{file.name}</div>
                        {file.folderPath && file.folderPath !== '/' && (
                          <div class="text-xs text-slate-500 mt-1 truncate">{file.folderPath}</div>
                        )}
                        <div class="text-sm text-slate-400 mt-1">
                          {(file.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Wiki Tab */}
            {activeTab.value === 'wiki' && (
              <CharacterWiki
                userId="local"
                characters={savedCharacters.value}
                parsedCharacters={selectedRepo.value.parsed.characters}
                chapters={chapters.value}
                selectedCharacterName={selectedCharacter.value}
                onCharacterSelect={$((name) => {
                  selectedCharacter.value = name;
                })}
                onUpdate={loadCharacters}
              />
            )}
          </div>
        )}

        {/* Chapter Viewer Modal */}
        {selectedChapter.value && (
          <div 
            class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick$={() => selectedChapter.value = null}
          >
            <div 
              class="bg-slate-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick$={(e) => e.stopPropagation()}
            >
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-2xl font-bold">{selectedChapter.value.name}</h2>
                <button
                  onClick$={() => selectedChapter.value = null}
                  class="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div 
                class="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={selectedChapter.value.content}
              />
            </div>
          </div>
        )}

        {parsing.value && (
          <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div class="bg-slate-800 rounded-lg p-6">
              <div class="text-white">Parsing repository files...</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
});

