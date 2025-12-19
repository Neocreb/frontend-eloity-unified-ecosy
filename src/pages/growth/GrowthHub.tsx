import UnifiedGrowthHub from "@/components/rewards/UnifiedGrowthHub";

export default function GrowthHub() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-purple-600 to-blue-600 dark:from-purple-900 dark:to-blue-800 pt-8 pb-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Growth Hub</h1>
            <p className="text-purple-100 text-lg">
              Grow your earnings through referrals, partnerships, and invitations
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        <UnifiedGrowthHub />
      </div>
    </div>
  );
}
