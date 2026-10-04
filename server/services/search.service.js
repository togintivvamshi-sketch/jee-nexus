// Search Service - Architecture for future web search integration
// Currently provides a clean interface with TODO for implementation

const SEARCH_SYSTEM_PROMPT = `You are JEE Nexus Search Assistant.

Help find legitimate educational resources for JEE Main preparation.

SEARCH PRINCIPLES:
1. Only search legitimate, publicly available educational sources
2. Prefer: official websites, .gov/.edu domains, established educational platforms
3. Avoid: pirated content, copyrighted books, unauthorized question banks
4. Preserve source attribution
4. Return links/resources, not full copyrighted content

CURRENT STATUS: Web search not yet configured.
This is a placeholder service architecture.

TODO for implementation:
- Integrate with search API (SerpAPI, Google Custom Search, Brave Search, etc.)
- Add source credibility filtering
- Add duplicate detection
- Add subject/chapter/topic classification
- Add relevance scoring for JEE Main`;

async function searchWeb(query, options = {}) {
  // TODO: Implement actual web search when API is configured
  // For now, return a helpful message
  
  return {
    success: false,
    message: 'Web search is not yet configured. This feature will be available in a future phase.',
    query: query,
    results: [],
    note: 'To enable web search, configure a search API (SerpAPI, Brave Search, etc.) in search.service.js'
  };
}

async function searchEducationalResources(query, subject = '') {
  // Future: Search for specific educational resources
  return searchWeb(`${subject} ${query} JEE Main study material`);
}

module.exports = {
  searchWeb,
  searchEducationalResources,
  SEARCH_SYSTEM_PROMPT
};