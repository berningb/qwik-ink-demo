/**
 * Text parsing utilities for extracting characters, locations, and relationships
 */

/**
 * Extract character names from text
 * Focuses on extracting only character names, not other capitalized words
 * @param {string} text - Text content to analyze
 * @returns {Array<{name: string, count: number, context: string[]}>} Array of character names
 */
export function extractCharacters(text) {
  // Remove HTML tags if present
  const cleanText = text.replace(/<[^>]*>/g, ' ');
  
  // Split into sentences
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  const characterCandidates = new Map();
  const dialogueMarkers = ['said', 'thought', 'asked', 'replied', 'answered', 'whispered', 'shouted', 'exclaimed', 'murmured', 'called', 'told', 'asked'];
  
  // Common words to skip (not character names)
  const skipWords = new Set([
    'The', 'A', 'An', 'And', 'But', 'Or', 'Nor', 'For', 'So', 'Yet', 'As', 'If', 'When', 'Where', 'Why', 'How',
    'I', 'He', 'She', 'They', 'We', 'You', 'It', 'This', 'That', 'These', 'Those',
    'His', 'Her', 'Him', 'Them', 'Their', 'Theirs', 'Themselves',
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 
    'August', 'September', 'October', 'November', 'December',
    'North', 'South', 'East', 'West', 'Northern', 'Southern', 'Eastern', 'Western',
    'Chapter', 'Part', 'Section', 'Page', 'Expression', 'Face', 'Voice', 'Hand', 'Hands', 'Eye', 'Eyes'
  ]);
  
  // Pronouns (case-insensitive check)
  const pronouns = new Set(['they', 'their', 'them', 'theirs', 'themselves', 'he', 'she', 'it', 'we', 'you', 'i', 'his', 'her', 'him']);
  
  // Extract from dialogue markers (most reliable indicator of character names)
  sentences.forEach(sentence => {
    dialogueMarkers.forEach(marker => {
      // Pattern: "said Alex" or "Alex said"
      const patterns = [
        new RegExp(`\\b${marker}\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)`, 'gi'),
        new RegExp(`([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)\\s+${marker}`, 'gi')
      ];
      
      patterns.forEach(regex => {
        const matches = sentence.matchAll(regex);
        for (const match of matches) {
          const name = match[1].trim();
          // Only accept names that:
          // - Start with capital letter (proper noun)
          // - Are 2-30 chars
          // - Not in skip list
          // - Not a pronoun
          // - Don't contain lowercase words (filters out phrases like "their expression")
          const isProperNoun = /^[A-Z]/.test(name);
          const hasNoLowercaseWords = !/\b[a-z]+\b/.test(name);
          const isNotPronoun = !pronouns.has(name.toLowerCase());
          
          if (isProperNoun && name.length >= 2 && name.length <= 30 && 
              !skipWords.has(name) && isNotPronoun && hasNoLowercaseWords) {
            if (!characterCandidates.has(name)) {
              characterCandidates.set(name, { name, count: 0, context: [] });
            }
            characterCandidates.get(name).count++;
            // Only add context if sentence is meaningful (at least 15 chars) and not just the dialogue marker
            const trimmedSentence = sentence.trim();
            if (characterCandidates.get(name).context.length < 5 && 
                trimmedSentence.length >= 15 && 
                !trimmedSentence.match(/^["']?\s*[A-Z][a-z]+\s+(said|asked|replied|answered|whispered|shouted|exclaimed|murmured|called|told)\s*["']?$/i)) {
              // Get a better context window - look for the full sentence including dialogue
              // Try to find the quote before the dialogue marker
              const beforeMatch = sentence.match(/(["'`][^"'`]+["'`])\s*,\s*[A-Z][a-z]+\s+\w+/i);
              if (beforeMatch) {
                // Include the quote
                const fullContext = sentence.substring(Math.max(0, sentence.indexOf(beforeMatch[0]) - 50), sentence.length).trim();
                if (fullContext.length >= 20) {
                  characterCandidates.get(name).context.push(fullContext);
                }
              } else {
                // Just use the sentence if it's complete enough
                characterCandidates.get(name).context.push(trimmedSentence);
              }
            }
          }
        }
      });
    });
  });
  
  // Extract names from dialogue/quotes (e.g., "Hello," Alex said)
  const quotePattern = /["'`]([^"'`]+)["'`]\s*,\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi;
  let match;
  while ((match = quotePattern.exec(cleanText)) !== null) {
    const name = match[2].trim();
    const isProperNoun = /^[A-Z]/.test(name);
    const hasNoLowercaseWords = !/\b[a-z]+\b/.test(name);
    const isNotPronoun = !pronouns.has(name.toLowerCase());
    
    if (isProperNoun && name.length >= 2 && name.length <= 30 && 
        !skipWords.has(name) && isNotPronoun && hasNoLowercaseWords) {
      if (!characterCandidates.has(name)) {
        characterCandidates.set(name, { name, count: 0, context: [] });
      }
      characterCandidates.get(name).count++;
    }
  }
  
  // Extract capitalized words that appear frequently AND in name-like contexts
  // Only consider words that appear after common name indicators
  const nameContextMarkers = ['met', 'saw', 'knew', 'told', 'asked', 'called', 'named', 'introduced'];
  const nameContextWords = new Map();
  
  sentences.forEach(sentence => {
    nameContextMarkers.forEach(marker => {
      const regex = new RegExp(`\\b${marker}\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)`, 'gi');
      const matches = sentence.matchAll(regex);
      for (const match of matches) {
        const name = match[1].trim();
        const isProperNoun = /^[A-Z]/.test(name);
        const hasNoLowercaseWords = !/\b[a-z]+\b/.test(name);
        const isNotPronoun = !pronouns.has(name.toLowerCase());
        
        if (isProperNoun && name.length >= 2 && name.length <= 30 && 
            !skipWords.has(name) && isNotPronoun && hasNoLowercaseWords) {
          nameContextWords.set(name, (nameContextWords.get(name) || 0) + 1);
        }
      }
    });
  });
  
  // Add names from context if they appear multiple times
  nameContextWords.forEach((count, name) => {
    if (count >= 2 && !characterCandidates.has(name)) {
      characterCandidates.set(name, { name, count, context: [] });
    }
  });
  
  // Filter out common false positives (locations, common nouns, pronouns)
  const locationWords = new Set(['Forest', 'Tower', 'Keep', 'City', 'Village', 'Town', 'Kingdom', 'Realm', 'Palace', 'Castle', 'Temple', 'Shrine']);
  const filtered = Array.from(characterCandidates.values())
    .filter(char => {
      const name = char.name;
      // Must start with capital letter
      if (!/^[A-Z]/.test(name)) return false;
      // Must not be a pronoun
      if (pronouns.has(name.toLowerCase())) return false;
      // Must not contain lowercase words (filters phrases)
      if (/\b[a-z]+\b/.test(name)) return false;
      // Must not be a location
      if (locationWords.has(name)) return false;
      // Must not be in skip list
      if (skipWords.has(name)) return false;
      return true;
    })
    .filter(char => char.count >= 2); // Must appear at least twice to be considered
  
  return filtered.sort((a, b) => b.count - a.count);
}

/**
 * Extract location names from text
 * @param {string} text - Text content to analyze
 * @returns {Array<{name: string, count: number}>} Array of location candidates
 */
export function extractLocations(text) {
  const cleanText = text.replace(/<[^>]*>/g, ' ');
  
  // Look for capitalized words after location markers
  const locationMarkers = ['in', 'at', 'to', 'from', 'near', 'inside', 'outside', 'within'];
  const locations = new Map();
  
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  sentences.forEach(sentence => {
    locationMarkers.forEach(marker => {
      const regex = new RegExp(`\\b${marker}\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)`, 'gi');
      const matches = sentence.matchAll(regex);
      for (const match of matches) {
        const location = match[1].trim();
        if (location.length > 2 && location.length < 30) {
          locations.set(location, (locations.get(location) || 0) + 1);
        }
      }
    });
  });
  
  return Array.from(locations.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Analyze character co-occurrences to suggest relationships
 * @param {string} text - Text content to analyze
 * @param {Array<string>} characterNames - List of character names to analyze
 * @returns {Array<{char1: string, char2: string, strength: number, context: string[]}>} Relationship suggestions
 */
export function analyzeRelationships(text, characterNames) {
  const cleanText = text.replace(/<[^>]*>/g, ' ');
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  const relationships = new Map();
  
  sentences.forEach(sentence => {
    const foundChars = characterNames.filter(char => {
      // Case-insensitive match for character names
      const regex = new RegExp(`\\b${char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(sentence);
    });
    
    // If multiple characters appear in the same sentence, they might have a relationship
    if (foundChars.length >= 2) {
      for (let i = 0; i < foundChars.length; i++) {
        for (let j = i + 1; j < foundChars.length; j++) {
          const char1 = foundChars[i];
          const char2 = foundChars[j];
          const key = [char1, char2].sort().join('|');
          
          if (!relationships.has(key)) {
            relationships.set(key, {
              char1: char1,
              char2: char2,
              strength: 0,
              context: [],
            });
          }
          
          const rel = relationships.get(key);
          rel.strength++;
          if (rel.context.length < 5) {
            rel.context.push(sentence.trim());
          }
        }
      }
    }
  });
  
  return Array.from(relationships.values())
    .filter(rel => rel.strength >= 2) // At least 2 co-occurrences
    .sort((a, b) => b.strength - a.strength);
}

/**
 * Extract all entities (characters, locations) from multiple files
 * @param {Array<{name: string, content: string}>} files - Array of file objects
 * @returns {{characters: Array, locations: Array, relationships: Array}} Extracted entities
 */
export function parseFiles(files) {
  const allCharacters = new Map();
  const allLocations = new Map();
  const allText = files.map(f => f.content).join('\n\n');
  
  // Extract characters and locations from all files combined
  const characters = extractCharacters(allText);
  const locations = extractLocations(allText);
  
  // Build character name list for relationship analysis
  const characterNames = characters.map(c => c.name);
  
  // Analyze relationships
  const relationships = analyzeRelationships(allText, characterNames);
  
  return {
    characters,
    locations,
    relationships,
  };
}




