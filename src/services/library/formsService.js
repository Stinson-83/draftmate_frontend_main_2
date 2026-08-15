import { mockLegalForms, formsCategories } from "../../data/mockLegalForms";

export const formsService = {
  getForms: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockLegalForms;
  },

  getFormById: async (formId) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockLegalForms.find(form => form.id === formId);
  },

  searchForms: async (query, category = "All") => {
    await new Promise(resolve => setTimeout(resolve, 200));
    let results = [...mockLegalForms];

    if (category && category !== "All") {
      results = results.filter(form => form.category === category);
    }

    if (query && query.trim()) {
      const lowerQuery = query.toLowerCase().trim();
      results = results.filter(form => 
        form.name.toLowerCase().includes(lowerQuery) || 
        form.category.toLowerCase().includes(lowerQuery) || 
        form.description.toLowerCase().includes(lowerQuery)
      );
    }

    return results;
  },

  getCategories: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return formsCategories;
  }
};
