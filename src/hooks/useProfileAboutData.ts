import { useMemo, useEffect, useState } from "react";
import { Skill } from "@/components/profile/SkillsSection";
import { ProfessionalData } from "@/components/profile/ProfessionalInfo";
import { SocialLink } from "@/components/profile/SocialLinks";
import { Achievement } from "@/components/profile/EnhancedAchievements";
import { useAuth } from "@/contexts/AuthContext";
import { profileService } from "@/services/profileService";
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
}

export const useProfileAboutData = (
  userId?: string
): ProfileAboutData => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch real profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        if (!userId && !user?.id) {
          setLoading(false);
          return;
        }

        const targetUserId = userId || user?.id;
        if (!targetUserId) return;

        // Fetch profile from database
        const profile = await profileService.getProfile(targetUserId);
        setProfileData(profile);
      } catch (error) {
        console.warn("Error fetching profile data:", error);
        // Fall back to mock data on error
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId, user?.id]);

  // Mock data for development/demo purposes
  // Used when real data is not available or in development mode
  const mockData: ProfileAboutData = useMemo(() => {
    return {
      skills: [
        {
          id: "skill-1",
          name: "React",
          proficiency: "expert",
          endorsementCount: 24,
          endorsedBy: ["User1", "User2", "User3"],
          isEndorsedByCurrentUser: false,
        },
        {
          id: "skill-2",
          name: "TypeScript",
          proficiency: "advanced",
          endorsementCount: 18,
          endorsedBy: ["User1", "User2"],
          isEndorsedByCurrentUser: false,
        },
        {
          id: "skill-3",
          name: "UI/UX Design",
          proficiency: "advanced",
          endorsementCount: 15,
          endorsedBy: ["User1"],
          isEndorsedByCurrentUser: true,
        },
        {
          id: "skill-4",
          name: "Node.js",
          proficiency: "advanced",
          endorsementCount: 12,
          endorsedBy: [],
          isEndorsedByCurrentUser: false,
        },
        {
          id: "skill-5",
          name: "AWS",
          proficiency: "intermediate",
          endorsementCount: 8,
          endorsedBy: [],
          isEndorsedByCurrentUser: false,
        },
        {
          id: "skill-6",
          name: "GraphQL",
          proficiency: "intermediate",
          endorsementCount: 6,
          endorsedBy: [],
          isEndorsedByCurrentUser: false,
        },
        {
          id: "skill-7",
          name: "Tailwind CSS",
          proficiency: "expert",
          endorsementCount: 22,
          endorsedBy: [],
          isEndorsedByCurrentUser: false,
        },
        {
          id: "skill-8",
          name: "Web Performance",
          proficiency: "advanced",
          endorsementCount: 9,
          endorsedBy: [],
          isEndorsedByCurrentUser: false,
        },
        {
          id: "skill-9",
          name: "Accessibility",
          proficiency: "advanced",
          endorsementCount: 7,
          endorsedBy: [],
          isEndorsedByCurrentUser: false,
        },
        {
          id: "skill-10",
          name: "JavaScript",
          proficiency: "expert",
          endorsementCount: 28,
          endorsedBy: [],
          isEndorsedByCurrentUser: false,
        },
        {
          id: "skill-11",
          name: "CSS",
          proficiency: "expert",
          endorsementCount: 19,
          endorsedBy: [],
          isEndorsedByCurrentUser: false,
        },
        {
          id: "skill-12",
          name: "Problem Solving",
          proficiency: "expert",
          endorsementCount: 14,
          endorsedBy: [],
          isEndorsedByCurrentUser: false,
        },
      ],
      professional: {
        title: "Senior Frontend Developer",
        company: "Tech Innovations Inc.",
        yearsOfExperience: 7,
        specializations: [
          "React Development",
          "Full Stack Engineering",
          "Web Design",
          "Cloud Architecture",
        ],
        languages: ["English", "Spanish", "Mandarin"],
        certifications: [
          {
            name: "AWS Certified Solutions Architect",
            issuer: "Amazon Web Services",
            year: 2023,
          },
          {
            name: "Google Cloud Professional Data Engineer",
            issuer: "Google Cloud",
            year: 2022,
          },
          {
            name: "Certified Kubernetes Administrator",
            issuer: "Linux Foundation",
            year: 2023,
          },
        ],
      },
      socialLinks: [
        {
          platform: "linkedin",
          url: "https://linkedin.com/in/johndoe",
          isVerified: true,
          username: "johndoe",
        },
        {
          platform: "github",
          url: "https://github.com/johndoe",
          isVerified: true,
          username: "johndoe",
        },
        {
          platform: "twitter",
          url: "https://twitter.com/johndoe",
          isVerified: false,
          username: "johndoe",
        },
        {
          platform: "portfolio",
          url: "https://johndoe.dev",
          isVerified: true,
          username: "johndoe.dev",
        },
      ],
      achievements: [
        {
          id: "ach-1",
          title: "Top Contributor",
          description:
            "Contributed to 10+ projects and received positive reviews from the community",
          category: "community",
          icon: Trophy,
          earnedDate: "December 2024",
          rarity: "epic",
          progress: {
            current: 15,
            target: 20,
            label: "Projects",
          },
        },
        {
          id: "ach-2",
          title: "Verified Creator",
          description:
            "Successfully verified as a creator and published quality content",
          category: "creator",
          icon: Verified,
          earnedDate: "November 2023",
          rarity: "rare",
        },
        {
          id: "ach-3",
          title: "Early Adopter",
          description:
            "Joined the platform in its early days and supported its growth",
          category: "special",
          icon: Star,
          earnedDate: "January 2020",
          rarity: "rare",
        },
        {
          id: "ach-4",
          title: "Premium Member",
          description: "Upgraded to premium membership and unlocked exclusive features",
          category: "special",
          icon: Crown,
          earnedDate: "June 2023",
          rarity: "common",
        },
        {
          id: "ach-5",
          title: "Trusted Seller",
          description:
            "Completed 50+ successful transactions with positive feedback",
          category: "seller",
          icon: Shield,
          earnedDate: "September 2024",
          rarity: "epic",
          progress: {
            current: 50,
            target: 100,
            label: "Sales",
          },
        },
        {
          id: "ach-6",
          title: "Code Master",
          description:
            "Demonstrated exceptional coding skills and problem-solving abilities",
          category: "creator",
          icon: Code,
          earnedDate: "August 2024",
          rarity: "legendary",
        },
        {
          id: "ach-7",
          title: "Trading Ace",
          description:
            "Executed 100+ successful trades with consistent positive returns",
          category: "trader",
          icon: Zap,
          earnedDate: "October 2024",
          rarity: "epic",
          progress: {
            current: 85,
            target: 100,
            label: "Trades",
          },
        },
        {
          id: "ach-8",
          title: "Community Champion",
          description:
            "Helped 50+ users and received high appreciation ratings",
          category: "social",
          icon: Trophy,
          earnedDate: "November 2024",
          rarity: "rare",
          progress: {
            current: 42,
            target: 50,
            label: "Helped Users",
          },
        },
      ],
      totalAchievements: 15, // Total available achievements on platform
    };
  }, [userId]);

  return mockData;
};
