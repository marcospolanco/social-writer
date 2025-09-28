# Tavily Newsjacking Feature Plan

## Overview
A system that converts brand guides into search queries, periodically searches Tavily using the MCP server for newsjacking opportunities, ranks results by semantic similarity using vector embeddings, and presents ranked article proposals that can be auto-generated with one tap.

## Workflow
1. **Brand Guide Processing** → **Search Query Extraction** → **Periodic Tavily MCP Searches** → **Vector Similarity Ranking** → **One-Tap Article Generation**

## Technical Architecture

### Client-Side Architecture
- **Authentication**: Local storage for API keys and preferences
- **Data Storage**: Client-side state management with localStorage persistence
- **Search Integration**: Direct Tavily MCP server communication
- **Real-time Updates**: Manual search triggers with automatic scheduling

### Frontend Components
- Brand guide upload interface
- Article opportunity ranking view (vector similarity based)
- One-tap article generation button
- Integration with existing markdown editor

### External Services
- **Tavily MCP Server**: For news and event searching via `TAVILY_MCP_URL`
- **Gemini API**: For search query extraction and article generation
- **Vector Embedding Service**: For semantic similarity calculation (Gemini or OpenAI embeddings)
- **Environment Variables**: `TAVILY_MCP_URL` for MCP server connection

## Implementation Approach

### Phase 1: Brand Guide Processing & Search Query Extraction
**Hybrid approach with search queries and vector embeddings:**
- Brand guide processed to extract search queries for Tavily
- Brand guide embedded as vector for semantic similarity ranking
- Search queries used only for Tavily API calls (not shown to users)
- Vector embedding stored for ranking search results
- No keyword management UI needed

```typescript
// Search query extraction for Tavily
interface SearchQueryExtraction {
  content: string; // Original brand guide
  searchQueries: string[]; // Extracted search queries
  brandEmbedding: number[]; // Vector embedding for similarity ranking
}

interface SearchQuery {
  term: string;
  weight: number; // Importance for search frequency
  category: 'industry' | 'values' | 'products' | 'competitors';
}

// Brand guide processing with vector embedding
const processBrandGuide = async (brandGuide: string): Promise<SearchQueryExtraction> => {
  // Extract search queries for Tavily
  const searchQueries = await extractSearchQueries(brandGuide);

  // Create vector embedding for semantic similarity
  const brandEmbedding = await createEmbedding(brandGuide);

  return {
    content: brandGuide,
    searchQueries,
    brandEmbedding
  };
};

// Vector similarity ranking
const rankBySimilarity = async (
  searchResults: Article[],
  brandEmbedding: number[]
): Promise<RankedArticle[]> => {
  // Embed each search result
  const resultEmbeddings = await Promise.all(
    searchResults.map(article => createEmbedding(article.content))
  );

  // Calculate cosine similarity
  return searchResults.map((article, index) => ({
    ...article,
    similarityScore: cosineSimilarity(brandEmbedding, resultEmbeddings[index])
  })).sort((a, b) => b.similarityScore - a.similarityScore);
};
```

### Phase 2: Tavily MCP Integration with Vector Ranking
**Search with vector similarity ranking:**

```typescript
// MCP Server communication
const searchTavily = async (query: string, options: SearchOptions) => {
  const mcpResponse = await fetch(import.meta.env.VITE_TAVILY_MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'tavily_search',
        arguments: {
          query,
          max_results: options.maxResults || 10,
          time_period: options.timePeriod || '24h'
        }
      }
    })
  });

  const result = await mcpResponse.json();
  return result.result.content;
};

// Search with vector ranking
export const searchForOpportunities = async (
  searchQueries: SearchQuery[],
  brandEmbedding: number[]
): Promise<RankedArticle[]> => {
  // Execute searches for all queries
  const searchResults = await Promise.all(
    searchQueries.map(query =>
      searchTavily(query.term, {
        maxResults: 5,
        timePeriod: '24h'
      })
    )
  );

  // Flatten and deduplicate results
  const allArticles = searchResults.flat().filter(
    (article, index, self) =>
      index === self.findIndex(a => a.url === article.url)
  );

  // Rank by semantic similarity
  const rankedArticles = await rankBySimilarity(allArticles, brandEmbedding);

  // Apply additional ranking factors
  return rankedArticles.map(article => ({
    ...article,
    finalScore: calculateFinalScore(article)
  }));
};

// Final score calculation combining multiple factors
const calculateFinalScore = (article: RankedArticle): number => {
  const similarityWeight = 0.6; // 60% semantic relevance
  const recencyWeight = 0.25;   // 25% recency boost
  const sourceWeight = 0.15;    // 15% source credibility

  const recencyBoost = Math.max(0, 1 - (Date.now() - article.publishedAt) / (7 * 24 * 60 * 60 * 1000));
  const sourceScore = getSourceCredibilityScore(article.source);

  return (
    article.similarityScore * similarityWeight +
    recencyBoost * recencyWeight +
    sourceScore * sourceWeight
  );
};
```

### Phase 3: State Management & Embedding Storage
**Local state with search queries and embedding storage:**

```typescript
// State management for hybrid approach
const useNewsjackingState = () => {
  const [brandGuide, setBrandGuide] = useState<string>(() => {
    const saved = localStorage.getItem('newsjacking-brand-guide');
    return saved || '';
  });

  const [searchQueries, setSearchQueries] = useState<SearchQuery[]>(() => {
    const saved = localStorage.getItem('newsjacking-search-queries');
    return saved ? JSON.parse(saved) : [];
  });

  const [brandEmbedding, setBrandEmbedding] = useState<number[]>(() => {
    const saved = localStorage.getItem('newsjacking-brand-embedding');
    return saved ? JSON.parse(saved) : [];
  });

  const [opportunities, setOpportunities] = useState<RankedArticle[]>(() => {
    const saved = localStorage.getItem('newsjacking-opportunities');
    return saved ? JSON.parse(saved) : [];
  });

  const [lastSearchTime, setLastSearchTime] = useState<number>(() => {
    const saved = localStorage.getItem('newsjacking-last-search');
    return saved ? parseInt(saved) : 0;
  });

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem('newsjacking-brand-guide', brandGuide);
  }, [brandGuide]);

  useEffect(() => {
    localStorage.setItem('newsjacking-search-queries', JSON.stringify(searchQueries));
  }, [searchQueries]);

  useEffect(() => {
    localStorage.setItem('newsjacking-brand-embedding', JSON.stringify(brandEmbedding));
  }, [brandEmbedding]);

  // Opportunities are pre-ranked by similarity
  return {
    brandGuide,
    setBrandGuide,
    searchQueries,
    setSearchQueries,
    brandEmbedding,
    setBrandEmbedding,
    opportunities: opportunities.sort((a, b) => b.finalScore - a.finalScore),
    setOpportunities,
    lastSearchTime,
    setLastSearchTime
  };
};

interface RankingFactors {
  similarityScore: number;    // Semantic relevance to brand guide
  recencyBoost: number;        // Newer content gets priority
  sourceCredibility: number;   // Source trustworthiness
  trendingScore: number;       // Trending signals
  uniquenessScore: number;     // Avoid duplicate topics
}
```

### Phase 4: One-Tap Article Generation
**Seamless editor integration with brand context:**

```typescript
// Generate and insert article directly into editor
const generateAndInsertArticle = async (
  opportunity: RankedArticle,
  brandGuide: string,
  setEditorContent: (content: string) => void
) => {
  // Generate article using AI service with full brand context
  const article = await aiGenerateArticle({
    title: opportunity.title,
    summary: opportunity.summary,
    content: opportunity.content,
    brandGuide: brandGuide, // Full brand context for tone and messaging
    similarityScore: opportunity.similarityScore, // Use for relevance emphasis
    brandVoice: "professional" // Could be user-configurable
  });

  // Insert directly into the editor
  setEditorContent(article);

  return { success: true };
};

// Auto-scheduling based on search queries
const useAutoSearch = (searchQueries: SearchQuery[], onSearch: () => Promise<void>) => {
  useEffect(() => {
    if (searchQueries.length === 0) return;

    const checkAndSearch = async () => {
      const lastSearch = parseInt(localStorage.getItem('newsjacking-last-search') || '0');
      const sixHoursInMs = 6 * 60 * 60 * 1000;

      if (Date.now() - lastSearch > sixHoursInMs) {
        await onSearch();
        localStorage.setItem('newsjacking-last-search', Date.now().toString());
      }
    };

    // Check every minute
    const interval = setInterval(checkAndSearch, 60 * 1000);
    return () => clearInterval(interval);
  }, [searchQueries, onSearch]);
};
```

## Client-Side Search Scheduling
```typescript
// Search scheduling utilities
const searchScheduler = {
  scheduleNextSearch: (delayMs: number = 6 * 60 * 60 * 1000) => {
    const nextSearchTime = Date.now() + delayMs;
    localStorage.setItem('newsjacking-next-search', nextSearchTime.toString());
  },

  getTimeUntilNextSearch: () => {
    const nextSearch = parseInt(localStorage.getItem('newsjacking-next-search') || '0');
    return Math.max(0, nextSearch - Date.now());
  },

  shouldSearchNow: () => {
    const lastSearch = parseInt(localStorage.getItem('newsjacking-last-search') || '0');
    const sixHoursInMs = 6 * 60 * 60 * 1000;
    return Date.now() - lastSearch > sixHoursInMs;
  }
};
```

## Environment Variables
```bash
# Tavily MCP Configuration
TAVILY_MCP_URL=https://mcp.tavily.com/mcp/?tavilyApiKey=your_tavily_api_key_here


# Gemini API Configuration (Backend)
GEMINI_API_KEY=your_gemini_api_key_here

# Embedding Service Configuration (Optional - defaults to Gemini)
EMBEDDING_SERVICE=gemini  # or 'openai'
OPENAI_API_KEY=your_openai_api_key_here  # Only if using OpenAI embeddings
```

## Data Models
```typescript
// Search query and embedding types
interface SearchQuery {
  term: string;
  weight: number;
  category: 'industry' | 'values' | 'products' | 'competitors';
}

interface RankedArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  url: string;
  publishedAt: number;
  similarityScore: number; // Cosine similarity with brand guide
  finalScore: number;      // Weighted final ranking score
  isTrending: boolean;
  isDismissed: boolean;
  createdAt: number;
  updatedAt: number;
}

// Local storage types
interface LocalStorageData {
  brandGuide: string;
  searchQueries: SearchQuery[];
  brandEmbedding: number[];
  opportunities: RankedArticle[];
  lastSearchTime: number;
  nextSearchTime: number;
}

// Vector embedding utilities
const createEmbedding = async (text: string): Promise<number[]> => {
  // Use Gemini or OpenAI embedding service
  const response = await fetch('/api/embed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  return response.json();
};

const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
};
```

## User Interface Flow (Client-Side)
1. **Setup**: User uploads brand guide → Gemini extracts search queries client-side → Search queries and brand embedding stored in localStorage
2. **Processing**: Search queries automatically processed for Tavily searches → Brand embedding used for similarity ranking
3. **Search Scheduling**:
   - All search queries searched every 6 hours (client-side scheduling)
   - Manual search trigger available anytime
   - Search results ranked by semantic similarity and stored locally
4. **Opportunity Management**:
   - Real-time filtering by category and trending status
   - Dynamic ranking by semantic similarity to brand guide
   - Dismiss irrelevant opportunities
5. **One-tap Generation**: Click any opportunity → Article generated and inserted into existing editor
6. **Immediate Action**: Edit, refine, or publish using existing LinkedIn writing assistant features

## React Components Structure
```typescript
// Main dashboard component with hybrid approach
const NewsjackingDashboard = () => {
  const [searchQueries, setSearchQueries] = useLocalStorage<SearchQuery[]>('newsjacking-search-queries', []);
  const [brandEmbedding, setBrandEmbedding] = useLocalStorage<number[]>('newsjacking-brand-embedding', []);
  const [opportunities, setOpportunities] = useLocalStorage<RankedArticle[]>('newsjacking-opportunities', []);
  const [lastSearchTime, setLastSearchTime] = useLocalStorage<number>('newsjacking-last-search', 0);

  const { searchForOpportunities, isSearching } = useTavilyMCP();

  return (
    <div className="dashboard-layout">
      <BrandGuideStatus
        searchQueries={searchQueries}
        brandGuide={localStorage.getItem('newsjacking-brand-guide') || ''}
      />
      <OpportunityList
        opportunities={opportunities.sort((a, b) => b.finalScore - a.finalScore)}
        onGenerate={handleGenerateArticle}
        onDismiss={handleDismissOpportunity}
        isSearching={isSearching}
      />
    </div>
  );
};

// Simplified brand guide status component (no keyword management UI)
const BrandGuideStatus = ({ searchQueries, brandGuide }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <h3 className="font-semibold text-gray-800 mb-2">Brand Guide Status</h3>
    <p className="text-sm text-gray-600">
      {searchQueries.length} search queries extracted •
      Brand embedding created •
      {searchQueries.length > 0 ? ' Actively monitoring' : ' Awaiting brand guide'}
    </p>
    {searchQueries.length > 0 && (
      <div className="mt-2 text-xs text-gray-500">
        Last search: {new Date(parseInt(localStorage.getItem('newsjacking-last-search') || '0')).toLocaleString()}
      </div>
    )}
  </div>
);
```

## Success Metrics
- Search query extraction accuracy
- Semantic similarity ranking effectiveness
- Opportunity relevance rate
- Article generation speed
- User adoption rate
- Brand message consistency
- Vector embedding quality

## Security Considerations
- Secure API key management
- User data isolation
- Rate limiting for external APIs
- Content moderation for generated articles