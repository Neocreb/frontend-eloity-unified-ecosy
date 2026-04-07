import { useState, useEffect, useMemo } from "react";
import { Skill } from "@/components/profile/SkillsSection";
import { ProfessionalData } from "@/components/profile/ProfessionalInfo";
import { SocialLink } from "@/components/profile/SocialLinks";
import { Achievement } from "@/components/profile/EnhancedAchievements";
import { ProfileService } from "@/services/profileService";
import {
  Code,
  PenTool,
  Database,
  Smartphone,
  Cloud,
  GitBranch,
  Trophy,
  Star,
  Verified,
  Crown,
  Shield,
  Zap,
} from "lucide-react";

interface ProfileAboutData {
  skills: Skill[];
  professional: ProfessionalData;
  socialLinks: SocialLink[];
  achievements: Achievement[];
  totalAchievements: number;
  isLoading: boolean;
  error: Error | null;
}

// Map string skills to Skill objects
const mapSkillsData = (skillsArray?: string[]): Skill[] => {
  if (!skillsArray || !Array.isArray(skillsArray)) {
    return [];
  }

  return skillsArray.map((skill, index) => ({
    id: `skill-${index}`,
    name: skill,
    proficiency: "intermediate" as const,
    endorsementCount: 0,
    endorsedBy: [],
    isEndorsedByCurrentUser: false,
  }));
};

// Map professional info JSONB to ProfessionalData
const mapProfessionalData = (professionalInfo?: any): ProfessionalData => {
  if (!professionalInfo) {
    return {
      title: "",
      company: "",
      yearsOfExperience: 0,
      specializations: [],
      languages: [],
      certifications: [],
    };
  }

  return {
    title: professionalInfo.title || "",
    company: professionalInfo.company || "",
    yearsOfExperience: professionalInfo.yearsOfExperience || 0,
    specializations: professionalInfo.specializations || [],
    languages: professionalInfo.languages || [],
    certifications: professionalInfo.certifications || [],
  };
};

// Map social links JSONB or individual URL fields to SocialLink[]
const mapSocialLinks = (socialLinksData?: any, linkedinUrl?: string, githubUrl?: string, twitterUrl?: string, portfolioUrl?: string): SocialLink[] => {
  const links: SocialLink[] = [];

  // If social_links JSONB field exists, use it
  if (socialLinksData && Array.isArray(socialLinksData)) {
    return socialLinksData.map((link: any) => ({
      platform: link.platform || "portfolio",
      url: link.url || "",
      isVerified: link.isVerified || false,
      username: link.username || "",
    }));
  }

  // Otherwise, build from individual URL fields
  if (linkedinUrl) {
    links.push({
      platform: "linkedin",
      url: linkedinUrl,
      isVerified: true,
      username: linkedinUrl.split("/").pop() || "",
    });
  }
  if (githubUrl) {
    links.push({
      platform: "github",
      url: githubUrl,
      isVerified: true,
      username: githubUrl.split("/").pop() || "",
    });
  }
  if (twitterUrl) {
    links.push({
      platform: "twitter",
      url: twitterUrl,
      isVerified: false,
      username: twitterUrl.split("/").pop() || "",
    });
  }
  if (portfolioUrl) {
    links.push({
      platform: "portfolio",
      url: portfolioUrl,
      isVerified: true,
      username: portfolioUrl.replace(/^https?:\/\/?/, ""),
    });
  }

  return links;
};

// Default achievements (can be loaded from API in future)
const getDefaultAchievements = (): Achievement[] => [
  {
    id: "ach-1",
    title: "Early Adopter",
    description: "Joined the platform in its early days and supported its growth",
    category: "special",
    icon: Star,
    earnedDate: "",
    rarity: "rare",
  },
  {
    id: "ach-2",
    title: "Verified Creator",
    description: "Successfully verified as a creator and published quality content",
    category: "creator",
    icon: Verified,
    earnedDate: "",
    rarity: "rare",
  },
  {
    id: "ach-3",
    title: "Community Champion",
    description: "Helped 50+ users and received high appreciation ratings",
    category: "social",
    icon: Trophy,
    earnedDate: "",
    rarity: "rare",
  },
];

export const useProfileAboutData = (
  userId?: string
): ProfileAboutData => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [profileData, setProfileData] = useState<any>(null);

  // Fetch profile data from API
  useEffect(() => {
    if (!userId) {
      setProfileData(null);
      return;
    }

    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const profileService = new ProfileService();
        const profile = await profileService.getUserById(userId);

        if (profile) {
          setProfileData(profile);
        } else {
          setError(new Error("Failed to fetch profile data"));
        }
      } catch (err) {
        console.error("Error fetching profile About data:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [userId]);

  // Default sample skills
  const defaultSkills: Skill[] = [
    {
      id: 'skill-1',
      name: 'React',
      proficiency: 'advanced',
      endorsementCount: 12,
      endorsedBy: [],
      isEndorsedByCurrentUser: false,
    },
    {
      id: 'skill-2',
      name: 'TypeScript',
      proficiency: 'advanced',
      endorsementCount: 8,
      endorsedBy: [],
      isEndorsedByCurrentUser: false,
    },
    {
      id: 'skill-3',
      name: 'Web Development',
      proficiency: 'expert',
      endorsementCount: 15,
      endorsedBy: [],
      isEndorsedByCurrentUser: false,
    },
    {
      id: 'skill-4',
      name: 'UI/UX Design',
      proficiency: 'intermediate',
      endorsementCount: 5,
      endorsedBy: [],
      isEndorsedByCurrentUser: false,
    },
  ];

  // Default professional info
  const defaultProfessional: ProfessionalData = {
    title: 'Full Stack Developer',
    company: 'Tech Innovations Inc',
    yearsOfExperience: 5,
    specializations: ['Web Development', 'Cloud Architecture', 'DevOps'],
    languages: ['English', 'Spanish', 'French'],
    certifications: [
      {
        id: 'cert-1',
        name: 'AWS Certified Solutions Architect',
        issuer: 'Amazon Web Services',
        year: 2023,
      },
      {
        id: 'cert-2',
        name: 'Google Cloud Professional',
        issuer: 'Google Cloud',
        year: 2022,
      },
    ],
  };

  // Default social links
  const defaultSocialLinks: SocialLink[] = [
    {
      platform: 'github',
      url: 'https://github.com/user',
      isVerified: true,
      username: 'user',
    },
    {
      platform: 'linkedin',
      url: 'https://linkedin.com/in/user',
      isVerified: true,
      username: 'user',
    },
    {
      platform: 'twitter',
      url: 'https://twitter.com/user',
      isVerified: false,
      username: 'user',
    },
  ];

  // Format the fetched data
  const data: ProfileAboutData = useMemo(() => {
    if (!profileData) {
      return {
        skills: defaultSkills,
        professional: defaultProfessional,
        socialLinks: defaultSocialLinks,
        achievements: getDefaultAchievements(),
        totalAchievements: 15,
        isLoading,
        error,
      };
    }

    // Use real data if available, otherwise use defaults
    const skills = mapSkillsData(profileData.skills);
    const professional = mapProfessionalData(profileData.professional_info);
    const socialLinks = mapSocialLinks(
      profileData.social_links,
      profileData.linkedin_url,
      profileData.github_url,
      profileData.twitter_url,
      profileData.portfolio_url
    );

    return {
      skills: skills.length > 0 ? skills : defaultSkills,
      professional: professional.title ? professional : defaultProfessional,
      socialLinks: socialLinks.length > 0 ? socialLinks : defaultSocialLinks,
      achievements: profileData.achievements || getDefaultAchievements(),
      totalAchievements: profileData.totalAchievements || 15,
      isLoading,
      error,
    };
  }, [profileData, isLoading, error]);

  return data;
};
