/**
 * NEURALIS // Client-Side Information Retrieval & TF-IDF Cosine Similarity Engine
 */

// Stop words list to filter out common English words during indexing
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'cant', 'cannot', 'could',
  'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'hadnt', 'has', 'hasnt', 'have', 'havent', 'having', 'he', 'hed', 'hell', 'hes', 'her', 'here',
  'heres', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'hows', 'i', 'id', 'ill', 'im', 'ive', 'if', 'in',
  'into', 'is', 'isnt', 'it', 'its', 'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor',
  'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such', 'than', 'that',
  'thats', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres', 'these', 'they', 'theyd',
  'theyll', 'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was',
  'wasnt', 'we', 'wed', 'well', 'were', 'weve', 'werent', 'what', 'whats', 'when', 'whens', 'where', 'wheres',
  'which', 'while', 'who', 'whos', 'whom', 'why', 'whys', 'with', 'wont', 'would', 'wouldnt', 'you', 'youd',
  'youll', 'youre', 'youve', 'your', 'yours', 'yourself', 'yourselves'
]);

export class TfIdfEngine {
  constructor() {
    this.documents = {}; // Map of path -> { path, content, tokens, tfMap }
  }

  // Tokenize and clean text: lowercase, remove punctuation, remove stop words
  tokenize(text) {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^\w\s\-\.]/g, ' ') // Replace punctuation with space
      .split(/[\s_+=\[\]\{\}\(\)\<\>\/\:\;\,\.\?\!\-\*\&\|\^\%\$\#\@]/) // Split on common separators
      .map(t => t.trim())
      .filter(t => t.length > 1 && !STOP_WORDS.has(t));
  }

  // Generate a term-frequency map for a set of tokens
  getTermFrequency(tokens) {
    const tf = {};
    if (tokens.length === 0) return tf;
    tokens.forEach(t => {
      tf[t] = (tf[t] || 0) + 1;
    });
    // Normalize counts to get frequency
    const total = tokens.length;
    for (const term in tf) {
      tf[term] = tf[term] / total;
    }
    return tf;
  }

  // Add or update document in the database
  addDocument(path, content) {
    const tokens = this.tokenize(content);
    const tfMap = this.getTermFrequency(tokens);
    this.documents[path] = {
      path,
      content,
      tokens,
      tfMap
    };
  }

  // Remove a document
  removeDocument(path) {
    delete this.documents[path];
  }

  // Compute Inverse Document Frequency (IDF) for all terms in the catalog
  getIdfs(allTerms) {
    const idfs = {};
    const totalDocs = Object.keys(this.documents).length;
    if (totalDocs === 0) return idfs;

    allTerms.forEach(term => {
      let docsWithTerm = 0;
      for (const path in this.documents) {
        if (this.documents[path].tfMap[term]) {
          docsWithTerm++;
        }
      }
      // Standard IDF formula: ln(Total Docs / Docs Containing Term). Add 1 to prevent division by zero.
      idfs[term] = Math.log(1 + (totalDocs / (1 + docsWithTerm)));
    });

    return idfs;
  }

  // Calculate Cosine Similarity search on index matching the query
  search(queryStr) {
    const queryTokens = this.tokenize(queryStr);
    if (queryTokens.length === 0 || Object.keys(this.documents).length === 0) {
      return [];
    }

    // Term Frequency of query
    const queryTf = this.getTermFrequency(queryTokens);

    // Get all unique terms in the query and documents
    const uniqueTerms = new Set([...queryTokens]);
    for (const path in this.documents) {
      Object.keys(this.documents[path].tfMap).forEach(term => {
        uniqueTerms.add(term);
      });
    }

    // Get IDFs for all terms
    const idfs = this.getIdfs(uniqueTerms);

    // Build query vector: term -> TF * IDF
    const queryVector = {};
    queryTokens.forEach(term => {
      queryVector[term] = (queryTf[term] || 0) * (idfs[term] || 0);
    });

    const results = [];

    // Calculate Cosine Similarity against each document
    for (const path in this.documents) {
      const doc = this.documents[path];
      const docVector = {};

      // Build document TF-IDF vector
      for (const term in doc.tfMap) {
        docVector[term] = doc.tfMap[term] * (idfs[term] || 0);
      }

      // Compute dot product
      let dotProduct = 0;
      for (const term in queryVector) {
        if (docVector[term]) {
          dotProduct += queryVector[term] * docVector[term];
        }
      }

      // Compute magnitudes
      let queryMag = 0;
      for (const term in queryVector) {
        queryMag += queryVector[term] * queryVector[term];
      }
      queryMag = Math.sqrt(queryMag);

      let docMag = 0;
      for (const term in docVector) {
        docMag += docVector[term] * docVector[term];
      }
      docMag = Math.sqrt(docMag);

      // Cosine Similarity score
      let score = 0;
      if (queryMag > 0 && docMag > 0) {
        score = dotProduct / (queryMag * docMag);
      }

      // Only return documents that have some similarity (score > 0)
      if (score > 0) {
        results.push({
          path: doc.path,
          score: Math.round(score * 1000) / 1000, // Round to 3 decimals
          matchedTokens: queryTokens.filter(t => doc.tfMap[t] !== undefined)
        });
      }
    }

    // Sort descending by score
    return results.sort((a, b) => b.score - a.score);
  }
}
