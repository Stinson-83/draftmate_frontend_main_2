import { API_CONFIG } from '../endpoints';

export const integrationService = {
  getIntegrationStatus: async () => {
    const response = await fetch(`${API_CONFIG.LIBRARY.BASE_URL}/api/v1/library/integrations/status`);
    if (!response.ok) {
      throw new Error('Failed to get integration status');
    }
    return response.json();
  },

  refreshProviderStatus: async () => {
    // This will re-fetch the integration status
    return integrationService.getIntegrationStatus();
  }
};
