import { mockBareActs } from '../../data/mockBareActs';
import { importedActs } from '../../data/bareacts/registry';

// Combine our imported acts from registry with the existing mock acts
const allActs = [...importedActs, ...mockBareActs];

export const getActs = () => {
  console.log("[getActs()] Returned Acts:", allActs);
  console.log("[getActs()] Returned Count:", allActs.length);
  return allActs;
};

export const getActById = (actId) => {
  return allActs.find(act => act.id === actId);
};

export const getSections = (actId, chapterId = null) => {
  const act = getActById(actId);
  if (!act) return [];
  
  if (chapterId) {
    const chapter = act.chapters.find(ch => ch.id === chapterId);
    return chapter ? chapter.sections : [];
  }
  
  // Return all sections from all chapters
  return act.chapters.flatMap(ch => ch.sections);
};

export const searchSections = (query) => {
  const lowerQuery = query.toLowerCase();
  
  return allActs.flatMap(act => 
    act.chapters.flatMap(chapter => 
      chapter.sections
        .filter(section => 
          section.number.toLowerCase().includes(lowerQuery) ||
          section.title.toLowerCase().includes(lowerQuery) ||
          section.content.toLowerCase().includes(lowerQuery) ||
          act.name.toLowerCase().includes(lowerQuery) ||
          chapter.title.toLowerCase().includes(lowerQuery) ||
          chapter.subtitle.toLowerCase().includes(lowerQuery)
        )
        .map(section => ({
          ...section,
          actId: act.id,
          actName: act.name,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          chapterSubtitle: chapter.subtitle
        }))
    )
  );
};

export const getCategories = () => {
  const cats = new Set(['All']);
  allActs.forEach(act => {
    if (act.category) cats.add(act.category);
  });
  return Array.from(cats);
};

export const searchActs = (query) => {
  const q = (query || '').toLowerCase().trim();
  if (!q) return allActs;
  return allActs.filter(act => 
    act.name?.toLowerCase().includes(q) ||
    act.shortName?.toLowerCase().includes(q) ||
    act.actNumber?.toLowerCase().includes(q) ||
    act.description?.toLowerCase().includes(q)
  );
};
