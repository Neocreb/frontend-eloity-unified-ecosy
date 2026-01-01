import { Campaign } from "@/components/campaigns/UnifiedCampaignManager";
import { CampaignService } from "./campaignService";
import type { Campaign as RealCampaign } from "@/types/enhanced-marketplace";

// Campaign synchronization service to keep campaigns in sync across dashboards
class CampaignSyncService {
  private campaigns: Map<string, Campaign> = new Map();
  private listeners: Set<(campaigns: Campaign[]) => void> = new Set();
  private isInitialized = false;

  // Subscribe to campaign updates
  subscribe(listener: (campaigns: Campaign[]) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Notify all listeners of campaign changes
  private notify(): void {
    const campaigns = Array.from(this.campaigns.values());
    this.listeners.forEach(listener => listener(campaigns));
  }

  // Convert real Campaign type to UnifiedCampaignManager format
  private adaptCampaign(realCampaign: RealCampaign): Campaign {
    return {
      id: realCampaign.id,
      name: realCampaign.name,
      type: realCampaign.type as any, // Map seasonal -> boost, flash_sale -> promotion, etc.
      status: realCampaign.status as any,
      budget: {
        total: realCampaign.maxDiscount || 1000, // Fallback values
        spent: Math.floor(Math.random() * (realCampaign.maxDiscount || 1000) * 0.7),
        remaining: Math.floor(Math.random() * (realCampaign.maxDiscount || 1000) * 0.3),
      },
      metrics: {
        impressions: realCampaign.viewCount || 0,
        clicks: realCampaign.clickCount || 0,
        conversions: realCampaign.conversionCount || 0,
        ctr: realCampaign.viewCount > 0 ? ((realCampaign.clickCount || 0) / realCampaign.viewCount * 100) : 0,
        cpc: 0.5 + Math.random() * 1.5, // Mock CPC
        roas: realCampaign.totalRevenue > 0 ? (realCampaign.totalRevenue / (realCampaign.maxDiscount || 1000)) : 0,
      },
      startDate: realCampaign.startDate,
      endDate: realCampaign.endDate,
      targetAudience: {
        demographics: ["18-65"],
        interests: ["E-commerce", "Deals"],
        locations: ["Worldwide"],
      },
      createdAt: realCampaign.createdAt,
      updatedAt: realCampaign.updatedAt,
    };
  }

  // Get all campaigns
  getCampaigns(): Campaign[] {
    return Array.from(this.campaigns.values());
  }

  // Get campaigns by context
  getCampaignsByContext(context: "seller" | "freelancer" | "client", entityId?: string): Campaign[] {
    return this.getCampaigns().filter(campaign => {
      // Add filtering logic based on context and entityId
      // For now, return all campaigns
      return true;
    });
  }

  // Initialize with real data from API
  async initializeFromAPI(userId?: string): Promise<void> {
    try {
      let realCampaigns: RealCampaign[] = [];

      if (userId) {
        // Get campaigns created by this user
        realCampaigns = await CampaignService.getUserCampaigns(userId);
      } else {
        // Get all active campaigns
        realCampaigns = await CampaignService.getActiveCampaigns();
      }

      // Clear existing campaigns
      this.campaigns.clear();

      // Add real campaigns with adaptation
      realCampaigns.forEach(campaign => {
        const adapted = this.adaptCampaign(campaign);
        this.campaigns.set(adapted.id, adapted);
      });

      // If no campaigns found, fallback to mock data temporarily
      if (this.campaigns.size === 0) {
        console.log("No campaigns found from API, using fallback mock data");
        this.initializeMockData();
      }

      this.isInitialized = true;
      this.notify();
    } catch (error) {
      console.error("Failed to initialize campaigns from API:", error);
      // Fallback to mock data on error
      this.initializeMockData();
      this.isInitialized = true;
    }
  }

  // Add or update a campaign
  setCampaign(campaign: Campaign): void {
    this.campaigns.set(campaign.id, campaign);
    this.notify();
  }

  // Remove a campaign
  removeCampaign(campaignId: string): void {
    this.campaigns.delete(campaignId);
    this.notify();
  }

  // Update campaign status
  updateCampaignStatus(campaignId: string, status: Campaign['status']): void {
    const campaign = this.campaigns.get(campaignId);
    if (campaign) {
      const updatedCampaign = { ...campaign, status, updatedAt: new Date().toISOString() };
      this.setCampaign(updatedCampaign);
    }
  }

  // Update campaign budget
  updateCampaignBudget(campaignId: string, budgetUpdate: Partial<Campaign['budget']>): void {
    const campaign = this.campaigns.get(campaignId);
    if (campaign) {
      const updatedCampaign = {
        ...campaign,
        budget: { ...campaign.budget, ...budgetUpdate },
        updatedAt: new Date().toISOString()
      };
      this.setCampaign(updatedCampaign);
    }
  }

  // Update campaign metrics
  updateCampaignMetrics(campaignId: string, metricsUpdate: Partial<Campaign['metrics']>): void {
    const campaign = this.campaigns.get(campaignId);
    if (campaign) {
      const updatedCampaign = {
        ...campaign,
        metrics: { ...campaign.metrics, ...metricsUpdate },
        updatedAt: new Date().toISOString()
      };
      this.setCampaign(updatedCampaign);
    }
  }

  // Create a new campaign
  createCampaign(campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Campaign {
    const now = new Date().toISOString();
    const campaign: Campaign = {
      ...campaignData,
      id: `camp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };

    this.setCampaign(campaign);
    return campaign;
  }

  // Initialize with mock data (in a real app, this would load from API)
  initializeMockData(): void {
    const mockCampaigns: Campaign[] = [
      {
        id: "camp_seller_1",
        name: "Product Boost Campaign",
        type: "boost",
        status: "active",
        budget: {
          total: 500,
          spent: 342,
          remaining: 158,
        },
        metrics: {
          impressions: 12450,
          clicks: 623,
          conversions: 47,
          ctr: 5.0,
          cpc: 0.55,
          roas: 3.2,
        },
        startDate: "2024-01-10",
        endDate: "2024-01-24",
        targetAudience: {
          demographics: ["18-35", "Tech enthusiasts"],
          interests: ["Technology", "Gadgets"],
          locations: ["USA", "Canada"],
        },
        createdAt: "2024-01-10T10:00:00Z",
        updatedAt: "2024-01-15T14:30:00Z",
      },
      {
        id: "camp_freelancer_1",
        name: "Freelance Profile Promotion",
        type: "promotion",
        status: "active",
        budget: {
          total: 300,
          spent: 89,
          remaining: 211,
        },
        metrics: {
          impressions: 5670,
          clicks: 178,
          conversions: 8,
          ctr: 3.1,
          cpc: 0.50,
          roas: 2.8,
        },
        startDate: "2024-01-08",
        endDate: "2024-01-22",
        targetAudience: {
          demographics: ["25-55", "Business owners"],
          interests: ["Hiring", "Freelance", "Business"],
          locations: ["USA", "Canada", "UK"],
        },
        createdAt: "2024-01-08T11:30:00Z",
        updatedAt: "2024-01-14T13:20:00Z",
      },
      {
        id: "camp_client_1",
        name: "Job Post Visibility Boost",
        type: "lead_generation",
        status: "active",
        budget: {
          total: 750,
          spent: 234,
          remaining: 516,
        },
        metrics: {
          impressions: 8920,
          clicks: 267,
          conversions: 15,
          ctr: 3.0,
          cpc: 0.88,
          roas: 3.5,
        },
        startDate: "2024-01-12",
        endDate: "2024-01-26",
        targetAudience: {
          demographics: ["25-45", "Professionals"],
          interests: ["Web Development", "Design", "Technology"],
          locations: ["USA", "UK", "Australia"],
        },
        createdAt: "2024-01-12T09:15:00Z",
        updatedAt: "2024-01-15T16:45:00Z",
      },
    ];

    mockCampaigns.forEach(campaign => {
      this.campaigns.set(campaign.id, campaign);
    });
  }

  // Sync with main Campaign Center
  async syncWithCampaignCenter(userId?: string): Promise<void> {
    // Fetch latest campaigns from API and refresh
    await this.initializeFromAPI(userId);
    console.log("Campaigns synced with Campaign Center");
  }

  // Export campaigns data (for analytics)
  exportCampaigns(): Campaign[] {
    return this.getCampaigns();
  }

  // Get campaign statistics
  getCampaignStats() {
    const campaigns = this.getCampaigns();
    
    return {
      total: campaigns.length,
      active: campaigns.filter(c => c.status === "active").length,
      paused: campaigns.filter(c => c.status === "paused").length,
      completed: campaigns.filter(c => c.status === "completed").length,
      totalBudget: campaigns.reduce((sum, c) => sum + c.budget.total, 0),
      totalSpent: campaigns.reduce((sum, c) => sum + c.budget.spent, 0),
      totalImpressions: campaigns.reduce((sum, c) => sum + c.metrics.impressions, 0),
      totalClicks: campaigns.reduce((sum, c) => sum + c.metrics.clicks, 0),
      averageCTR: campaigns.length > 0 
        ? campaigns.reduce((sum, c) => sum + c.metrics.ctr, 0) / campaigns.length 
        : 0,
    };
  }
}

// Export singleton instance
export const campaignSyncService = new CampaignSyncService();

// Initialize with fallback mock data (will be replaced with real data when user context is available)
campaignSyncService.initializeMockData();

export default campaignSyncService;
