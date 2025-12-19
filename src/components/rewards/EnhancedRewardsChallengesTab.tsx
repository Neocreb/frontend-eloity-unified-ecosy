import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Target,
  Trophy,
  Clock,
  Star,
  Users,
  Zap,
  Gift,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Play,
  RefreshCw,
  Flame,
  Lock,
  Sparkles,
  Search,
  Filter,
  ChevronRight,
  Award,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { useChallengesProgress } from "@/hooks/useChallengesProgress";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";

const EnhancedRewardsChallengesTab = () => {
  const { toast } = useToast();
  const { challenges, isLoading, error, updateProgress, claimReward, refresh } = useChallengesProgress();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isClaimingReward, setIsClaimingReward] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(true);

  const categories = [
    { value: "all", label: "All Challenges", icon: Target },
    { value: "daily", label: "Daily", icon: Clock },
    { value: "content", label: "Content", icon: Zap },
    { value: "engagement", label: "Engagement", icon: TrendingUp },
    { value: "referral", label: "Referral", icon: Users },
    { value: "marketplace", label: "Marketplace", icon: Gift },
    { value: "challenge", label: "Challenge", icon: Trophy },
  ];

  const filteredChallenges = (selectedCategory === "all"
    ? challenges
    : challenges.filter((c) => c.type === selectedCategory)
  ).filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Categorize challenges
  const activeChallenges = filteredChallenges.filter(
    (c) => c.userProgress && c.userProgress.status === "active"
  );
  const upcomingChallenges = filteredChallenges.filter(
    (c) => !c.userProgress || c.userProgress.status === "not_started"
  );
  const completedChallenges = filteredChallenges.filter(
    (c) => c.userProgress && c.userProgress.status === "completed"
  );

  // Discovery recommendations - suggest high-reward challenges not started
  const discoveryRecommendations = challenges
    .filter((c) => !c.userProgress || c.userProgress.status === "not_started")
    .sort((a, b) => b.points_reward - a.points_reward)
    .slice(0, 3);

  const getDifficultyColor = (difficulty?: string): string => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getStatusIcon = (isCompleted: boolean) => {
    return isCompleted ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <Play className="h-5 w-5 text-blue-500" />
    );
  };

  const totalActiveRewards = filteredChallenges
    .filter((c) => !c.userProgress?.reward_claimed)
    .reduce((sum, c) => sum + c.points_reward, 0);

  const completedCount = challenges.filter(
    (c) => c.userProgress?.status === "completed"
  ).length;

  const handleClaimReward = async (challengeId: string) => {
    setIsClaimingReward(challengeId);
    const success = await claimReward(challengeId);

    if (success) {
      toast({
        title: "🎉 Reward Claimed!",
        description: `You've earned points for completing this challenge!`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to claim reward. Please try again.",
        variant: "destructive",
      });
    }

    setIsClaimingReward(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    toast({
      title: "✓ Refreshed",
      description: "Challenge progress updated",
    });
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 dark:text-red-400 mb-2 font-black">MISSION CONTROL ERROR</div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{error.message}</p>
        <Button onClick={handleRefresh} className="mt-4 font-bold">Retry Connection</Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
      role="main"
      aria-label="Challenges Tab - Complete challenges and earn rewards"
    >
      {/* Hero Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Active", value: activeChallenges.length, icon: Target, color: "text-blue-500", bgColor: "bg-blue-100" },
          { label: "Completed", value: completedCount, icon: CheckCircle, color: "text-green-500", bgColor: "bg-green-100" },
          { label: "Rewards", value: totalActiveRewards, icon: Gift, color: "text-purple-500", bgColor: "bg-purple-100" },
          { label: "Rate", value: `${challenges.length > 0 ? Math.round((completedCount / challenges.length) * 100) : 0}%`, icon: Trophy, color: "text-yellow-500", bgColor: "bg-yellow-100" }
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow cursor-default group overflow-hidden relative border-0 shadow-sm bg-white dark:bg-gray-900">
              <div className={`absolute top-0 right-0 w-16 h-16 ${stat.bgColor} dark:bg-opacity-10 rounded-bl-full opacity-50 transform translate-x-4 -translate-y-4 group-hover:scale-150 transition-transform duration-500`} />
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.bgColor} dark:bg-opacity-20`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                    <p className="text-2xl font-black">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Challenge Discovery */}
      <AnimatePresence>
        {showDiscovery && discoveryRecommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-0 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl animate-pulse" />
              <CardHeader className="relative z-10 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                      <Sparkles className="h-5 w-5 text-yellow-300" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black tracking-tight">Recommended Missions</CardTitle>
                      <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider mt-1">High yield opportunities detected</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowDiscovery(false)}
                    className="text-white/60 hover:text-white hover:bg-white/10 h-8 text-[10px] font-black uppercase"
                  >
                    Dismiss
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {discoveryRecommendations.map((challenge) => (
                    <motion.div
                      key={challenge.id}
                      whileHover={{ scale: 1.02 }}
                      className="p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/20 transition-all cursor-pointer group"
                      onClick={() => setSelectedCategory(challenge.type || "all")}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <Badge className="bg-yellow-400 text-indigo-900 font-black text-[10px]">HOT</Badge>
                        <div className="text-right">
                          <p className="text-xl font-black text-white leading-none">+{challenge.points_reward}</p>
                          <p className="text-[8px] font-bold uppercase text-white/60">Eloits</p>
                        </div>
                      </div>
                      <h4 className="font-black text-sm mb-1 line-clamp-1">{challenge.title}</h4>
                      <p className="text-white/70 text-[10px] line-clamp-2 mb-4 h-8">{challenge.description}</p>
                      <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-black text-xs py-1 h-8">
                        Start Challenge
                        <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Controls Section */}
      <Card className="shadow-sm border-0 bg-gray-50 dark:bg-gray-900/50">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search missions..." 
                className="pl-10 h-11 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
              <TooltipProvider>
                {categories.map((category) => (
                  <Tooltip key={category.value}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={selectedCategory === category.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category.value)}
                        className={`flex items-center gap-2 h-11 px-4 font-black transition-all shrink-0 ${
                          selectedCategory === category.value ? "shadow-lg scale-105" : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                        }`}
                      >
                        <category.icon className="h-4 w-4" />
                        <span className="hidden sm:inline uppercase text-[10px] tracking-widest">{category.label}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View {category.label}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
              
              <Button
                size="icon"
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-11 w-11 shrink-0 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Challenges Sections */}
      <div className="space-y-12">
        {/* ACTIVE SECTION */}
        {activeChallenges.length > 0 && (
          <section aria-labelledby="active-challenges-heading">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-1.5 bg-blue-600 rounded-full" />
              <h2 id="active-challenges-heading" className="text-xl font-black tracking-tight flex items-center gap-2">
                ACTIVE MISSIONS
                <Badge className="bg-blue-600 text-white ml-2 font-black">{activeChallenges.length}</Badge>
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeChallenges.map((challenge) => renderChallengeCard(challenge))}
            </div>
          </section>
        )}

        {/* UPCOMING SECTION */}
        {upcomingChallenges.length > 0 && (
          <section aria-labelledby="upcoming-challenges-heading">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-1.5 bg-purple-600 rounded-full" />
              <h2 id="upcoming-challenges-heading" className="text-xl font-black tracking-tight flex items-center gap-2">
                NEW DISCOVERIES
                <Badge className="bg-purple-600 text-white ml-2 font-black">{upcomingChallenges.length}</Badge>
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {upcomingChallenges.map((challenge) => renderCompactChallengeCard(challenge))}
            </div>
          </section>
        )}

        {/* COMPLETED SECTION */}
        {completedChallenges.length > 0 && (
          <section aria-labelledby="completed-challenges-heading">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-1.5 bg-green-600 rounded-full" />
              <h2 id="completed-challenges-heading" className="text-xl font-black tracking-tight flex items-center gap-2 text-muted-foreground opacity-60">
                COMPLETED MISSIONS
                <Badge variant="outline" className="ml-2 font-black">{completedChallenges.length}</Badge>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              {completedChallenges.map((challenge) => renderMinimalChallengeCard(challenge))}
            </div>
          </section>
        )}

        {filteredChallenges.length === 0 && (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <div className="mx-auto w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-black">NO MISSIONS FOUND</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2 font-medium">Try adjusting your filters or search terms to find available challenges.</p>
            <Button variant="link" onClick={() => {setSelectedCategory("all"); setSearchTerm("");}} className="mt-4 text-blue-600 font-black uppercase text-xs tracking-widest underline">Clear all filters</Button>
          </div>
        )}
      </div>

      {/* Pro Tips Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900 shadow-sm overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-xl group-hover:rotate-12 transition-transform">
                <Flame className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-black text-lg mb-2">PRO MASTER TIPS</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-xs">
                    <div className="h-5 w-5 bg-white dark:bg-black rounded flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black shadow-sm">1</div>
                    <p className="font-bold text-amber-900 dark:text-amber-200">Daily Streaks matter. Complete any daily mission to keep your multiplier alive.</p>
                  </li>
                  <li className="flex items-start gap-2 text-xs">
                    <div className="h-5 w-5 bg-white dark:bg-black rounded flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black shadow-sm">2</div>
                    <p className="font-bold text-amber-900 dark:text-amber-200">High Difficulty = High Trust. Hard missions boost your trust score by 2x.</p>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900 shadow-sm">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-black text-lg mb-2">TIME-SENSITIVE EVENTS</h3>
                <p className="text-xs text-blue-900 dark:text-blue-200 mb-4 font-bold uppercase tracking-tight">Special limited-time events appear during weekends. Keep an eye on the clock!</p>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600 text-white font-black text-[10px]">INCOMING</Badge>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 animate-pulse">Next event: Saturday 00:00 UTC</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );

  // --- Helper Render Functions ---

  function renderChallengeCard(challenge: any) {
    const progress = challenge.userProgress;
    const isCompleted = progress?.status === "completed";
    const currentProgress = progress?.progress || 0;
    const targetValue = progress?.target_value || challenge.target_value;
    const progressPercentage = Math.min((currentProgress / targetValue) * 100, 100);

    return (
      <motion.div
        key={challenge.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -4 }}
        className="group h-full"
      >
        <Card className={`overflow-hidden h-full border-2 transition-all duration-300 ${
          isCompleted ? "border-green-500 bg-green-50/30 dark:bg-green-950/10 shadow-lg shadow-green-500/10" : "border-gray-100 dark:border-gray-800 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5"
        }`}>
          <CardContent className="p-0 flex flex-col h-full">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-lg leading-tight uppercase tracking-tight">{challenge.title}</h3>
                    {challenge.difficulty && (
                      <Badge className={`${getDifficultyColor(challenge.difficulty)} text-[10px] font-black uppercase tracking-tighter shrink-0`}>
                        {challenge.difficulty}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground font-bold line-clamp-2 uppercase tracking-tight mt-1">{challenge.description}</p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center min-w-[70px] shrink-0">
                  <p className="text-xs font-black text-green-600 dark:text-green-400 leading-none">+{challenge.points_reward}</p>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1 tracking-tighter">ELOITS</p>
                </div>
              </div>

              <div className="space-y-3 mt-6">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">MISSION PROGRESS</p>
                  <p className="text-sm font-black text-blue-600">{currentProgress} / {targetValue}</p>
                </div>
                <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1.2, ease: "circOut" }}
                    className={`h-full rounded-full ${isCompleted ? "bg-green-500" : "bg-gradient-to-r from-blue-500 to-indigo-600"}`} 
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                <Clock className="h-3 w-3" />
                <span>Expires in 4d</span>
              </div>
              
              {isCompleted ? (
                <Button 
                  size="sm" 
                  onClick={() => handleClaimReward(challenge.id)}
                  disabled={isClaimingReward === challenge.id || progress?.reward_claimed}
                  className={`${progress?.reward_claimed ? "bg-gray-200 dark:bg-gray-800 text-gray-500" : "bg-green-600 hover:bg-green-700 text-white"} font-black px-6 shadow-lg text-[10px] h-8`}
                >
                  {progress?.reward_claimed ? "CLAIMED" : "COLLECT REWARD"}
                </Button>
              ) : (
                <Button variant="ghost" size="sm" className="font-black text-[10px] tracking-widest hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 h-8">
                  DETAILS <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  function renderCompactChallengeCard(challenge: any) {
    return (
      <motion.div
        key={challenge.id}
        whileHover={{ y: -2 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="hover:shadow-lg transition-all cursor-pointer border border-gray-100 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Zap className="h-4 w-4 text-purple-600" />
              </div>
              <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-purple-200">{challenge.type}</Badge>
            </div>
            <h4 className="font-black text-sm mb-1 uppercase tracking-tight">{challenge.title}</h4>
            <p className="text-[10px] text-muted-foreground line-clamp-2 h-8 font-bold uppercase tracking-tight leading-tight">{challenge.description}</p>
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <span className="text-xs font-black text-green-600">+{challenge.points_reward} PTS</span>
              <Button size="sm" className="h-7 text-[10px] font-black px-4 uppercase tracking-widest" onClick={() => setSelectedCategory(challenge.type || "all")}>START</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  function renderMinimalChallengeCard(challenge: any) {
    return (
      <Card key={challenge.id} className="bg-gray-50/50 dark:bg-gray-900/20 border-0 shadow-none hover:shadow-sm transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center shrink-0">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-[10px] truncate uppercase tracking-tight">{challenge.title}</h4>
              <p className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter mt-0.5">COMPLETED {new Date(challenge.userProgress?.completion_date || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
};

export default EnhancedRewardsChallengesTab;
