import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InviteFriendsSection from "./sections/InviteFriendsSection";
import ReferralProgramSection from "./sections/ReferralProgramSection";
import PartnershipsSection from "./sections/PartnershipsSection";
import { Users, TrendingUp, Handshake } from "lucide-react";

export default function UnifiedGrowthHub() {
  const [activeTab, setActiveTab] = useState("invite");

  const tabConfig = [
    {
      value: "invite",
      label: "Invite Friends",
      icon: Users,
      description: "Grow your network and earn rewards",
    },
    {
      value: "referrals",
      label: "Referral Program",
      icon: TrendingUp,
      description: "Track structured referral earnings",
    },
    {
      value: "partnerships",
      label: "Partnerships",
      icon: Handshake,
      description: "Explore affiliate opportunities",
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Growth Hub
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Grow your earnings through referrals, partnerships, and invitations
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-6">
          {tabConfig.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Invite Friends Tab */}
        <TabsContent value="invite" className="mt-0">
          <InviteFriendsSection />
        </TabsContent>

        {/* Referral Program Tab */}
        <TabsContent value="referrals" className="mt-0">
          <ReferralProgramSection />
        </TabsContent>

        {/* Partnerships Tab */}
        <TabsContent value="partnerships" className="mt-0">
          <PartnershipsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
