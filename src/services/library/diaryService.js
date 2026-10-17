import { hearingService } from './hearingService';

// diaryService acts as a practice/hearing diary view over the real hearings backend.
export const diaryService = {
  async getEntries() {
    const hearings = await hearingService.getHearings();
    return hearings.map(h => ({
      id: h.id,
      caseNumber: h.caseNumber,
      caseTitle: h.caseTitle,
      court: h.court,
      judge: h.judge,
      hearingDate: h.hearingDate,
      nextDate: h.nextHearingDate,
      status: h.status ? h.status.toLowerCase() : 'scheduled',
      client: h.oppositeParty ? `Vs. ${h.oppositeParty}` : '',
      oppositeParty: h.oppositeParty,
      remarks: h.remarks,
      hearingHistory: Array.isArray(h.timeline) ? h.timeline : [],
      category: 'Hearing',
    }));
  },

  async getEntryById(id) {
    const h = await hearingService.getHearingById(id);
    if (!h) return null;
    return {
      id: h.id,
      caseNumber: h.caseNumber,
      caseTitle: h.caseTitle,
      court: h.court,
      judge: h.judge,
      hearingDate: h.hearingDate,
      nextDate: h.nextHearingDate,
      status: h.status ? h.status.toLowerCase() : 'scheduled',
      client: h.oppositeParty ? `Vs. ${h.oppositeParty}` : '',
      oppositeParty: h.oppositeParty,
      remarks: h.remarks,
      hearingHistory: Array.isArray(h.timeline) ? h.timeline : [],
      category: 'Hearing',
    };
  },

  async createEntry(entryData) {
    const hearingData = {
      caseNumber: entryData.caseNumber,
      caseTitle: entryData.caseTitle,
      court: entryData.court,
      judge: entryData.judge,
      hearingDate: entryData.hearingDate,
      nextHearingDate: entryData.nextDate || null,
      status: entryData.status ? (entryData.status.charAt(0).toUpperCase() + entryData.status.slice(1)) : 'Scheduled',
      oppositeParty: entryData.oppositeParty || entryData.client || null,
      remarks: entryData.remarks || null,
      timeline: entryData.hearingHistory || [],
    };
    const created = await hearingService.createHearing(hearingData);
    return {
      id: created.id,
      caseNumber: created.caseNumber,
      caseTitle: created.caseTitle,
      court: created.court,
      judge: created.judge,
      hearingDate: created.hearingDate,
      nextDate: created.nextHearingDate,
      status: created.status.toLowerCase(),
      client: created.oppositeParty ? `Vs. ${created.oppositeParty}` : '',
      oppositeParty: created.oppositeParty,
      remarks: created.remarks,
      hearingHistory: created.timeline,
      category: 'Hearing',
    };
  },

  async updateEntry(id, entryData) {
    const hearingData = {};
    if (entryData.caseNumber !== undefined) hearingData.caseNumber = entryData.caseNumber;
    if (entryData.caseTitle !== undefined) hearingData.caseTitle = entryData.caseTitle;
    if (entryData.court !== undefined) hearingData.court = entryData.court;
    if (entryData.judge !== undefined) hearingData.judge = entryData.judge;
    if (entryData.hearingDate !== undefined) hearingData.hearingDate = entryData.hearingDate;
    if (entryData.nextDate !== undefined) hearingData.nextHearingDate = entryData.nextDate;
    if (entryData.status !== undefined) {
      hearingData.status = entryData.status.charAt(0).toUpperCase() + entryData.status.slice(1);
    }
    if (entryData.oppositeParty !== undefined) hearingData.oppositeParty = entryData.oppositeParty;
    if (entryData.remarks !== undefined) hearingData.remarks = entryData.remarks;
    if (entryData.hearingHistory !== undefined) hearingData.timeline = entryData.hearingHistory;

    const updated = await hearingService.updateHearing(id, hearingData);
    return {
      id: updated.id,
      caseNumber: updated.caseNumber,
      caseTitle: updated.caseTitle,
      court: updated.court,
      judge: updated.judge,
      hearingDate: updated.hearingDate,
      nextDate: updated.nextHearingDate,
      status: updated.status.toLowerCase(),
      client: updated.oppositeParty ? `Vs. ${updated.oppositeParty}` : '',
      oppositeParty: updated.oppositeParty,
      remarks: updated.remarks,
      hearingHistory: updated.timeline,
      category: 'Hearing',
    };
  },

  async deleteEntry(id) {
    return await hearingService.deleteHearing(id);
  },
};
