import { mockLegalDictionary, dictionaryCategories } from "../../data/mockLegalDictionary";

export const dictionaryService = {
  getTerms: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockLegalDictionary;
  },
  
  getTermById: async (termId) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockLegalDictionary.find(term => term.id === termId);
  },
  
  searchTerms: async (query, category = "All") => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    let results = [...mockLegalDictionary];
    
    if (category && category !== "All") {
      results = results.filter(term => term.category === category);
    }
    
    if (query && query.trim()) {
      const lowerQuery = query.toLowerCase().trim();
      results = results.filter(term => 
        term.term.toLowerCase().includes(lowerQuery) || 
        term.shortMeaning.toLowerCase().includes(lowerQuery) || 
        term.definition.toLowerCase().includes(lowerQuery) ||
        term.keywords.some(k => k.toLowerCase().includes(lowerQuery))
      );
    }
    
    return results;
  },
  
  getCategories: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return dictionaryCategories;
  }
};
