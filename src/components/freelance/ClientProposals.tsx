import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  DollarSign,
  Clock,
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Eye,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Award,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
// Phase 4 Integrations
import { FreelanceRewardsIntegrationService } from "@/services/freelanceRewardsIntegrationService";
import { FreelanceNotificationsService } from "@/services/freelanceNotificationsService";
import { useAuth } from "@/contexts/AuthContext";

interface ClientProposal {
  id: string;
  jobTitle: string;
  jobId: string;
  freelancer: {
    name: string;
    avatar?: string;
    rating: number;
    completedJobs: number;
    hourlyRate: number;
    skills: string[];
    responseTime: string;
  };
  budgetProposed: number;
  timeline: string;
  coverLetter: string;
  attachments?: string[];
  submittedAt: Date;
  status: "new" | "reviewed" | "shortlisted" | "hired" | "declined";
}

const mockProposals: ClientProposal[] = [
  {
    id: "1",
    jobTitle: "E-commerce Website Development",
    jobId: "job_001",
    freelancer: {
      name: "Alice Thompson",
      avatar: "/api/placeholder/40/40",
      rating: 4.9,
      completedJobs: 47,
      hourlyRate: 65,
      skills: ["React", "Node.js", "E-commerce", "PostgreSQL"],
      responseTime: "Usually responds within 2 hours",
    },
    budgetProposed: 3500,
    timeline: "6 weeks",
    coverLetter: "I'm excited to help you build your e-commerce platform. With over 5 years of experience in full-stack development and specifically 15+ e-commerce projects completed, I can deliver exactly what you're looking for...",
    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    status: "new",
  },
  {
    id: "2",
    jobTitle: "Mobile App UI/UX Design",
    jobId: "job_002",
    freelancer: {
      name: "Marcus Chen",
      avatar: "/api/placeholder/40/40",
      rating: 4.8,
      completedJobs: 32,
      hourlyRate: 55,
      skills: ["UI/UX Design", "Figma", "Mobile Design", "Prototyping"],
      responseTime: "Usually responds within 1 hour",
    },
    budgetProposed: 2200,
    timeline: "4 weeks",
    coverLetter: "Hello! I'm a senior UI/UX designer with 7+ years of experience. I've designed over 30 mobile applications that are currently live on App Store and Play Store...",
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    status: "reviewed",
  },
  {
    id: "3",
    jobTitle: "WordPress Website Redesign",
    jobId: "job_003",
    freelancer: {
      name: "Sarah Johnson",
      avatar: "/api/placeholder/40/40",
      rating: 4.7,
      completedJobs: 89,
      hourlyRate: 45,
      skills: ["WordPress", "PHP", "CSS", "Responsive Design"],
      responseTime: "Usually responds within 4 hours",
    },
    budgetProposed: 1800,
    timeline: "3 weeks",
    coverLetter: "I specialize in WordPress development and have redesigned 50+ websites. I focus on creating fast, SEO-optimized, and mobile-responsive websites...",
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    status: "shortlisted",
  },
  {
    id: "4",
    jobTitle: "E-commerce Website Development",
    jobId: "job_001",
    freelancer: {
      name: "David Rodriguez",
      avatar: "/api/placeholder/40/40",
      rating: 4.6,
      completedJobs: 23,
      hourlyRate: 50,
      skills: ["React", "Express", "MongoDB", "Stripe"],
      responseTime: "Usually responds within 6 hours",
    },
    budgetProposed: 2800,
    timeline: "8 weeks",
    coverLetter: "I'm a full-stack developer with strong experience in e-commerce solutions. I've built 12 e-commerce platforms with payment integration...",
    submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    status: "declined",
  },
];

export const ClientProposals: React.FC = () => {
  const [proposals, setProposals] = useState<ClientProposal[]>(mockProposals);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedProposal, setSelectedProposal] = useState<ClientProposal | null>(null);

  const getStatusColor = (status: ClientProposal["status"]) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "reviewed":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "shortlisted":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "hired":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "declined":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch = proposal.freelancer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || proposal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: Date) => {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  };

  const updateProposalStatus = (proposalId: string, newStatus: ClientProposal["status"]) => {
    setProposals(prev => prev.map(p => 
      p.id === proposalId ? { ...p, status: newStatus } : p
    ));
  };

  const ProposalCard: React.FC<{ proposal: ClientProposal }> = ({ proposal }) => (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {proposal.jobTitle}
              </h3>
              <Badge variant="outline" className="text-xs">
                #{proposal.jobId}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={proposal.freelancer.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white font-medium">
                  {proposal.freelancer.name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {proposal.freelancer.name}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>{proposal.freelancer.rating}</span>
                  </div>
                  <span>•</span>
                  <span>{proposal.freelancer.completedJobs} jobs</span>
                  <span>•</span>
                  <span>${proposal.freelancer.hourlyRate}/hr</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Badge className={`${getStatusColor(proposal.status)} font-medium`}>
              {proposal.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedProposal(proposal)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateProposalStatus(proposal.id, "shortlisted")}>
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  Shortlist
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateProposalStatus(proposal.id, "declined")}>
                  <ThumbsDown className="mr-2 h-4 w-4" />
                  Decline
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Message
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">Proposal</p>
              <p className="font-bold text-lg text-green-600 dark:text-green-400">
                ${proposal.budgetProposed.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">Timeline</p>
              <p className="font-bold text-lg text-blue-600 dark:text-blue-400">
                {proposal.timeline}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {proposal.freelancer.skills.slice(0, 4).map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {proposal.freelancer.skills.length > 4 && (
              <Badge variant="secondary" className="text-xs">
                +{proposal.freelancer.skills.length - 4}
              </Badge>
            )}
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">Cover Letter Preview</p>
            <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
              {proposal.coverLetter}
            </p>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Submitted {formatDate(proposal.submittedAt)}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              {proposal.freelancer.responseTime}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              onClick={() => updateProposalStatus(proposal.id, "hired")}
              className="flex-1"
            >
              <ThumbsUp className="w-4 h-4 mr-1" />
              Hire
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateProposalStatus(proposal.id, "shortlisted")}
              className="flex-1"
            >
              <Award className="w-4 h-4 mr-1" />
              Shortlist
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedProposal(proposal)}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const statsData = {
    totalProposals: proposals.length,
    newProposals: proposals.filter(p => p.status === "new").length,
    shortlisted: proposals.filter(p => p.status === "shortlisted").length,
    hired: proposals.filter(p => p.status === "hired").length,
  };

  const groupedByJob = proposals.reduce((acc, proposal) => {
    if (!acc[proposal.jobId]) {
      acc[proposal.jobId] = {
        jobTitle: proposal.jobTitle,
        proposals: [],
      };
    }
    acc[proposal.jobId].proposals.push(proposal);
    return acc;
  }, {} as Record<string, { jobTitle: string; proposals: ClientProposal[] }>);

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{statsData.totalProposals}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Proposals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{statsData.newProposals}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">New</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{statsData.shortlisted}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Shortlisted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{statsData.hired}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Hired</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Received Proposals</h2>
          <p className="text-gray-600 dark:text-gray-400">Review and manage proposals for your jobs</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search proposals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="shortlisted">Shortlisted</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Proposals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProposals.map((proposal) => (
          <ProposalCard key={proposal.id} proposal={proposal} />
        ))}
      </div>

      {filteredProposals.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm || statusFilter !== "all" ? "No proposals found" : "No proposals yet"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria"
                : "Post a job to start receiving proposals from freelancers"
              }
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button>
                Post Your First Job
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Proposal Details Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedProposal.jobTitle}</CardTitle>
                  <p className="text-sm text-gray-600">Proposal from {selectedProposal.freelancer.name}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedProposal(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Freelancer Info */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={selectedProposal.freelancer.avatar} />
                    <AvatarFallback className="text-lg">{selectedProposal.freelancer.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{selectedProposal.freelancer.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{selectedProposal.freelancer.rating} ({selectedProposal.freelancer.completedJobs} jobs)</span>
                      </div>
                      <span>${selectedProposal.freelancer.hourlyRate}/hr</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedProposal.freelancer.responseTime}
                    </p>
                  </div>
                </div>

                {/* Proposal Details */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Proposed Budget</p>
                    <p className="text-2xl font-bold text-green-600">${selectedProposal.budgetProposed.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Timeline</p>
                    <p className="text-2xl font-bold text-blue-600">{selectedProposal.timeline}</p>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProposal.freelancer.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Cover Letter */}
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Cover Letter</p>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm leading-relaxed">{selectedProposal.coverLetter}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => updateProposalStatus(selectedProposal.id, "declined")}>
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                  <Button variant="outline" onClick={() => updateProposalStatus(selectedProposal.id, "shortlisted")}>
                    <Award className="w-4 h-4 mr-2" />
                    Shortlist
                  </Button>
                  <Button>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button onClick={() => updateProposalStatus(selectedProposal.id, "hired")}>
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Hire Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ClientProposals;
