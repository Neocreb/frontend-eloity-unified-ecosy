// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";
import JobDetails from "@/components/freelance/JobDetails";
import { JobPosting } from "@/types/freelance";
import { useFreelance } from "@/hooks/use-freelance";
// Phase 4 Integrations
import { FreelanceSkeletons } from "@/components/freelance/FreelanceSkeletons";
import { FreelanceErrorBoundary } from "@/components/freelance/FreelanceErrorBoundary";

export const JobDetailPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const { getJob } = useFreelance();

  useEffect(() => {
    const loadJob = async () => {
      if (!jobId) {
        navigate("/app/freelance");
        return;
      }

      setLoading(true);
      try {
        const fetchedJob = await getJob(jobId);
        if (fetchedJob) {
          setJob(fetchedJob);
        } else {
          // Job not found - navigate back
          navigate("/app/freelance");
          return;
        }
      } catch (error) {
        console.error("Error loading job:", error);
        // Navigate back on error
        navigate("/app/freelance");
        return;
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [jobId, getJob, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={() => navigate("/app/freelance")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </Button>
          </div>

          <FreelanceSkeletons.JobDetailSkeleton />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={() => navigate("/app/freelance")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The job you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate("/app/freelance")}>
                Browse Jobs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/app/freelance")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
          
          {job.is_sponsored && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Sponsored
              </Badge>
            </div>
          )}
        </div>

        <FreelanceErrorBoundary>
          <JobDetails job={job} />
        </FreelanceErrorBoundary>
      </div>
    </div>
  );
};

export default JobDetailPage;
