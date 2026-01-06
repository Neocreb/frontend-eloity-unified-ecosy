# 🔧 FREELANCE SERVICE IMPLEMENTATION GUIDE

Complete guide to implementing all freelance services without mocks.

---

## 📝 Service Method Implementations

### 1. Enhanced freelanceService Methods

#### Profile Management Methods

```typescript
// Get freelancer profile
static async getFreelancerProfile(freelancerId: string): Promise<FreelancerProfile | null> {
  try {
    const { data, error } = await supabase
      .from('freelancer_profiles')
      .select(`
        *,
        ratings:freelancer_ratings(*)
      `)
      .eq('user_id', freelancerId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return data ? this.mapDatabaseToProfile(data) : null;
  } catch (error) {
    console.error("Error in getFreelancerProfile:", error);
    return null;
  }
}

// Create freelancer profile
static async createFreelancerProfile(
  profile: Partial<FreelancerProfile>
): Promise<FreelancerProfile> {
  try {
    const { data, error } = await supabase
      .from('freelancer_profiles')
      .insert({
        user_id: profile.userId,
        title: profile.title,
        description: profile.description,
        skills: profile.skills || [],
        hourly_rate: profile.hourlyRate,
        experience: profile.experience,
        portfolio: profile.portfolio || [],
        rating: 5,
        review_count: 0,
        total_earnings: 0,
        completed_projects: 0,
        availability: 'available',
        languages: profile.languages || [],
        education: profile.education || [],
        certifications: profile.certifications || [],
      })
      .select()
      .single();

    if (error) throw error;

    // Create stats record
    await supabase
      .from('freelance_stats')
      .insert({
        user_id: profile.userId,
        total_projects: 0,
        completed_projects: 0,
      });

    return this.mapDatabaseToProfile(data);
  } catch (error) {
    console.error("Error creating profile:", error);
    throw error;
  }
}

// Update freelancer profile
static async updateFreelancerProfile(
  id: string,
  updates: Partial<FreelancerProfile>
): Promise<FreelancerProfile> {
  try {
    const { data, error } = await supabase
      .from('freelancer_profiles')
      .update({
        title: updates.title,
        description: updates.description,
        skills: updates.skills,
        hourly_rate: updates.hourlyRate,
        experience: updates.experience,
        portfolio: updates.portfolio,
        languages: updates.languages,
        education: updates.education,
        certifications: updates.certifications,
        availability: updates.availability,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await this.logActivity({
      user_id: updates.userId || '',
      activity_type: 'profile_updated',
      entity_type: 'freelancer',
      entity_id: id,
      description: 'Updated freelancer profile',
    });

    return this.mapDatabaseToProfile(data);
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
}

// Search freelancers
static async searchFreelancers(filters: SearchFilters): Promise<FreelancerProfile[]> {
  try {
    let query = supabase
      .from('freelancer_profiles')
      .select(`
        *,
        ratings:freelancer_ratings(*)
      `);

    // Apply filters
    if (filters.query) {
      query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
    }

    if (filters.skills && filters.skills.length > 0) {
      query = query.overlaps('skills', filters.skills);
    }

    if (filters.budgetMin) {
      query = query.gte('hourly_rate', filters.budgetMin);
    }

    if (filters.budgetMax) {
      query = query.lte('hourly_rate', filters.budgetMax);
    }

    if (filters.sortBy === 'rating') {
      query = query.order('rating', { ascending: false });
    } else if (filters.sortBy === 'hourly_rate') {
      query = query.order('hourly_rate', { ascending: true });
    }

    const { data, error } = await query.limit(50);

    if (error) throw error;

    return (data || []).map(p => this.mapDatabaseToProfile(p));
  } catch (error) {
    console.error("Error searching freelancers:", error);
    return [];
  }
}

// Get freelancer recommendations for job
static async getFreelancerRecommendations(
  clientId: string,
  jobId: string
): Promise<FreelancerProfile[]> {
  try {
    // Get job details
    const job = await this.getJobPosting(jobId);
    if (!job) return [];

    // Search for freelancers with matching skills
    const { data, error } = await supabase
      .from('freelancer_profiles')
      .select(`
        *,
        ratings:freelancer_ratings(*)
      `)
      .overlaps('skills', job.skills)
      .order('rating', { ascending: false })
      .limit(10);

    if (error) throw error;

    return (data || []).map(p => this.mapDatabaseToProfile(p));
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return [];
  }
}
```

#### Job Posting Methods

```typescript
// Create job posting
static async createJobPosting(job: Partial<JobPosting>): Promise<JobPosting> {
  try {
    const { data, error } = await supabase
      .from('job_postings')
      .insert({
        client_id: job.clientId,
        title: job.title,
        description: job.description,
        category: job.category,
        subcategory: job.subcategory,
        skills: job.skills || [],
        budget_type: job.budget?.type,
        budget_amount: job.budget?.amount,
        budget_min: job.budget?.range?.min,
        budget_max: job.budget?.range?.max,
        duration: job.duration,
        experience_level: job.experience,
        status: 'active',
        deadline: job.deadline?.toISOString(),
        attachments: job.attachments || [],
        location: job.location,
        is_remote: job.isRemote,
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await this.logActivity({
      user_id: job.clientId || '',
      activity_type: 'job_posted',
      entity_type: 'job',
      entity_id: data.id,
      description: `Posted job: ${job.title}`,
    });

    return this.mapJobData(data);
  } catch (error) {
    console.error("Error creating job:", error);
    throw error;
  }
}

// Get active jobs with real-time counts
static async getActiveJobs(clientId: string): Promise<JobPosting[]> {
  try {
    const { data, error } = await supabase
      .from('job_postings')
      .select(`
        *,
        proposals:proposals(
          id,
          status
        )
      `)
      .eq('client_id', clientId)
      .eq('status', 'active')
      .order('posted_date', { ascending: false });

    if (error) throw error;

    return (data || []).map(job => ({
      ...this.mapJobData(job),
      applicationsCount: job.proposals?.length || 0,
    }));
  } catch (error) {
    console.error("Error fetching active jobs:", error);
    return [];
  }
}
```

#### Proposal Methods

```typescript
// Submit proposal
static async submitProposal(proposal: Partial<Proposal>): Promise<Proposal> {
  try {
    const { data, error } = await supabase
      .from('proposals')
      .insert({
        job_id: proposal.jobId,
        freelancer_id: proposal.freelancerId,
        cover_letter: proposal.coverLetter,
        proposed_rate: proposal.proposedRate,
        proposed_duration: proposal.proposedDuration,
        attachments: proposal.attachments || [],
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Update job applications count
    await supabase.rpc('increment_job_applications', {
      job_id: proposal.jobId,
    });

    // Log activity
    await this.logActivity({
      user_id: proposal.freelancerId || '',
      activity_type: 'proposal_submitted',
      entity_type: 'proposal',
      entity_id: data.id,
      description: `Submitted proposal for job: ${proposal.jobId}`,
    });

    // Send notification to client
    await this.notifyJobClient(proposal.jobId, 'proposal_received');

    return this.mapProposalData(data);
  } catch (error) {
    console.error("Error submitting proposal:", error);
    throw error;
  }
}

// Accept proposal and create project
static async acceptProposal(proposalId: string): Promise<Project> {
  try {
    // Get proposal with job details
    const { data: proposalData, error: proposalError } = await supabase
      .from('proposals')
      .select(`
        *,
        job_postings(*)
      `)
      .eq('id', proposalId)
      .single();

    if (proposalError) throw proposalError;

    // Create project from job
    const { data: projectData, error: projectError } = await supabase
      .from('freelance_projects')
      .insert({
        job_id: proposalData.job_id,
        client_id: proposalData.job_postings.client_id,
        freelancer_id: proposalData.freelancer_id,
        title: proposalData.job_postings.title,
        description: proposalData.job_postings.description,
        budget: proposalData.job_postings.budget_amount || proposalData.proposed_rate,
        status: 'pending',
        start_date: new Date().toISOString(),
        contract_terms: 'Standard',
      })
      .select()
      .single();

    if (projectError) throw projectError;

    // Update proposal status
    await supabase
      .from('proposals')
      .update({ status: 'accepted' })
      .eq('id', proposalId);

    // Reject other proposals
    await supabase
      .from('proposals')
      .update({ status: 'rejected' })
      .eq('job_id', proposalData.job_id)
      .neq('id', proposalId);

    // Log activities
    await this.logActivity({
      user_id: proposalData.job_postings.client_id,
      activity_type: 'proposal_accepted',
      entity_type: 'proposal',
      entity_id: proposalId,
      description: 'Accepted proposal',
    });

    await this.logActivity({
      user_id: proposalData.freelancer_id,
      activity_type: 'project_started',
      entity_type: 'project',
      entity_id: projectData.id,
      description: 'Project started',
    });

    return this.mapProjectData(projectData);
  } catch (error) {
    console.error("Error accepting proposal:", error);
    throw error;
  }
}
```

#### Project and Milestone Methods

```typescript
// Get project details with all related data
static async getProjectDetails(projectId: string): Promise<any> {
  try {
    const { data: project, error } = await supabase
      .from('freelance_projects')
      .select(`
        *,
        client:auth.users!client_id(id, full_name, avatar_url),
        freelancer:auth.users!freelancer_id(id, full_name, avatar_url),
        milestones:milestones(*)
      `)
      .eq('id', projectId)
      .single();

    if (error) throw error;

    return {
      ...this.mapProjectData(project),
      client: project.client,
      freelancer: project.freelancer,
      milestones: project.milestones || [],
    };
  } catch (error) {
    console.error("Error fetching project details:", error);
    return null;
  }
}

// Create milestone
static async createMilestone(milestone: Partial<Milestone>): Promise<Milestone> {
  try {
    const { data, error } = await supabase
      .from('milestones')
      .insert({
        project_id: milestone.projectId,
        title: milestone.title,
        description: milestone.description,
        amount: milestone.amount,
        due_date: milestone.dueDate?.toISOString(),
        deliverables: milestone.deliverables || [],
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Lock escrow amount
    await this.lockEscrowForMilestone(milestone.projectId, milestone.amount);

    return this.mapMilestoneData(data);
  } catch (error) {
    console.error("Error creating milestone:", error);
    throw error;
  }
}

// Complete milestone
static async completeMilestone(
  milestoneId: string,
  deliverables: string[]
): Promise<Milestone> {
  try {
    const { data, error } = await supabase
      .from('milestones')
      .update({
        status: 'completed',
        deliverables: deliverables,
        submission_date: new Date().toISOString(),
      })
      .eq('id', milestoneId)
      .select()
      .single();

    if (error) throw error;

    // Notify client for approval
    await this.notifyForMilestoneApproval(milestoneId);

    return this.mapMilestoneData(data);
  } catch (error) {
    console.error("Error completing milestone:", error);
    throw error;
  }
}

// Approve milestone and release payment
static async approveMilestone(milestoneId: string): Promise<void> {
  try {
    // Update milestone
    await supabase
      .from('milestones')
      .update({
        status: 'approved',
        approval_date: new Date().toISOString(),
      })
      .eq('id', milestoneId);

    // Get milestone and project details
    const { data: milestone } = await supabase
      .from('milestones')
      .select('project_id, amount')
      .eq('id', milestoneId)
      .single();

    // Release escrow payment
    if (milestone) {
      await this.releaseEscrowPayment(milestone.project_id, milestone.amount);
    }

    // Log activity
    await this.logActivity({
      user_id: '',
      activity_type: 'milestone_approved',
      entity_type: 'milestone',
      entity_id: milestoneId,
      description: 'Milestone approved and payment released',
    });
  } catch (error) {
    console.error("Error approving milestone:", error);
    throw error;
  }
}
```

#### Review and Rating Methods

```typescript
// Submit review
static async submitReview(
  freelancerId: string,
  reviewData: {
    projectId: string;
    rating: number;
    title: string;
    content: string;
    aspects: Record<string, number>;
    byUserId: string;
  }
): Promise<void> {
  try {
    // Insert review
    const { error: reviewError } = await supabase
      .from('freelancer_reviews')
      .insert({
        freelancer_id: freelancerId,
        reviewer_id: reviewData.byUserId,
        project_id: reviewData.projectId,
        rating: reviewData.rating,
        title: reviewData.title,
        content: reviewData.content,
        aspects: reviewData.aspects,
        status: 'published',
      });

    if (reviewError) throw reviewError;

    // Update freelancer ratings
    await this.updateFreelancerRating(freelancerId);

    // Log activity
    await this.logActivity({
      user_id: reviewData.byUserId,
      activity_type: 'review_received',
      entity_type: 'review',
      entity_id: freelancerId,
      description: `Received review with ${reviewData.rating} stars`,
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    throw error;
  }
}

// Update freelancer ratings (aggregate function)
static async updateFreelancerRating(freelancerId: string): Promise<void> {
  try {
    // Get all reviews
    const { data: reviews } = await supabase
      .from('freelancer_reviews')
      .select('rating, aspects')
      .eq('freelancer_id', freelancerId)
      .eq('status', 'published');

    if (!reviews || reviews.length === 0) return;

    // Calculate averages
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const avgCommunication = reviews.reduce((sum, r) => sum + (r.aspects?.communication || 5), 0) / reviews.length;
    const avgQuality = reviews.reduce((sum, r) => sum + (r.aspects?.quality || 5), 0) / reviews.length;
    const avgProfessionalism = reviews.reduce((sum, r) => sum + (r.aspects?.professionalism || 5), 0) / reviews.length;
    const avgTimeliness = reviews.reduce((sum, r) => sum + (r.aspects?.timeliness || 5), 0) / reviews.length;

    // Update ratings
    const { error } = await supabase
      .from('freelancer_ratings')
      .upsert({
        freelancer_id: freelancerId,
        overall_rating: Math.round(avgRating * 100) / 100,
        avg_communication: Math.round(avgCommunication * 100) / 100,
        avg_quality: Math.round(avgQuality * 100) / 100,
        avg_professionalism: Math.round(avgProfessionalism * 100) / 100,
        avg_timeliness: Math.round(avgTimeliness * 100) / 100,
        total_ratings: reviews.length,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'freelancer_id',
      });

    if (error) throw error;

    // Update freelancer profile
    await supabase
      .from('freelancer_profiles')
      .update({
        rating: avgRating,
        review_count: reviews.length,
      })
      .eq('user_id', freelancerId);
  } catch (error) {
    console.error("Error updating rating:", error);
  }
}
```

#### Earnings and Statistics

```typescript
// Get freelancer statistics
static async getFreelancerStats(freelancerId: string): Promise<FreelanceStats> {
  try {
    const { data, error } = await supabase
      .from('freelance_stats')
      .select('*')
      .eq('user_id', freelancerId)
      .single();

    if (error) throw error;

    // Calculate response time
    const responseTime = data.response_time || 24;

    return {
      totalProjects: data.total_projects || 0,
      completedProjects: data.completed_projects || 0,
      totalEarnings: data.total_earnings || 0,
      averageRating: data.average_rating || 5,
      responseTime: responseTime,
      successRate: data.success_rate || 100,
      repeatClients: data.repeat_clients || 0,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return {
      totalProjects: 0,
      completedProjects: 0,
      totalEarnings: 0,
      averageRating: 5,
      responseTime: 24,
      successRate: 100,
      repeatClients: 0,
    };
  }
}

// Calculate earnings for a period
static async calculateEarnings(
  freelancerId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('milestones')
      .select('amount')
      .eq('freelancer_id', freelancerId)
      .eq('status', 'approved')
      .gte('approval_date', startDate.toISOString())
      .lte('approval_date', endDate.toISOString());

    if (error) throw error;

    return (data || []).reduce((sum, m) => sum + (m.amount || 0), 0);
  } catch (error) {
    console.error("Error calculating earnings:", error);
    return 0;
  }
}
```

#### Activity Logging

```typescript
// Log activity
static async logActivity(activity: {
  user_id: string;
  activity_type: string;
  entity_type?: string;
  entity_id?: string;
  description: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    await supabase
      .from('freelance_activity_logs')
      .insert({
        user_id: activity.user_id,
        activity_type: activity.activity_type,
        entity_type: activity.entity_type,
        entity_id: activity.entity_id,
        description: activity.description,
        metadata: activity.metadata || {},
        created_at: new Date().toISOString(),
      });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}

// Get activity log
static async getActivityLog(
  userId: string,
  limit: number = 20
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('freelance_activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching activity log:", error);
    return [];
  }
}
```

---

## 📱 Component Updates

### Update JobDetailPage.tsx

**Remove Mock Data:**
```typescript
// DELETE THIS
const mockJobs: JobPosting[] = [...]
const mockJob = mockJobs.find(j => j.id === jobId)

// REPLACE WITH
const [job, setJob] = useState<JobPosting | null>(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  const loadJob = async () => {
    try {
      setLoading(true)
      const jobData = await FreelanceService.getJobPosting(jobId)
      if (!jobData) {
        setError('Job not found')
      } else {
        setJob(jobData)
      }
    } catch (err) {
      setError('Failed to load job')
    } finally {
      setLoading(false)
    }
  }
  loadJob()
}, [jobId])
```

### Update ClientDashboard.tsx

**Remove Mock Data:**
```typescript
// DELETE THIS
const getMockFreelancers = () => [...]
const getMockProposals = () => [...]

// REPLACE WITH
const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([])
const [proposals, setProposals] = useState<Proposal[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  const loadData = async () => {
    if (!user) return
    try {
      setLoading(true)
      const jobsData = await FreelanceService.getActiveJobs(user.id)
      
      const allProposals: Proposal[] = []
      for (const job of jobsData) {
        const jobProposals = await FreelanceService.getJobProposals(job.id)
        allProposals.push(...jobProposals)
      }
      setProposals(allProposals)

      // Get recommended freelancers
      if (jobsData.length > 0) {
        const recs = await FreelanceService.getFreelancerRecommendations(
          user.id,
          jobsData[0].id
        )
        setFreelancers(recs)
      }
    } finally {
      setLoading(false)
    }
  }
  loadData()
}, [user])
```

---

## 🔄 Real-time Subscriptions

```typescript
// Subscribe to project updates
static subscribeToProject(
  projectId: string,
  callback: (project: Project) => void
) {
  return supabase
    .from(`freelance_projects:id=eq.${projectId}`)
    .on('*', (payload) => {
      callback(payload.new)
    })
    .subscribe()
}

// Subscribe to messages
static subscribeToMessages(
  projectId: string,
  callback: (message: FreelanceMessage) => void
) {
  return supabase
    .from(`freelance_messages:project_id=eq.${projectId}`)
    .on('INSERT', (payload) => {
      callback(payload.new)
    })
    .subscribe()
}
```

---

## ✅ Implementation Checklist

- [ ] Create all new database tables
- [ ] Apply migration to Supabase
- [ ] Verify foreign keys and constraints
- [ ] Update freelanceService with all methods
- [ ] Remove mock data from JobDetailPage
- [ ] Remove mock data from ClientDashboard
- [ ] Remove mock data from FreelanceDashboard
- [ ] Implement real-time subscriptions
- [ ] Add error boundaries
- [ ] Add loading states
- [ ] Add empty states
- [ ] Test all service methods
- [ ] Test end-to-end workflows
- [ ] Performance testing
- [ ] Security audit

