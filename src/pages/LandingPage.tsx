import React from "react";
import Layout from "@/home/Layout";
import HeroSection from "@/home/HeroSection";
import FeaturesSection from "@/home/FeaturesSection";
import AdvancedFeaturesSection from "@/home/AdvancedFeaturesSection";
import ProblemSolutionSection from "@/home/ProblemSolutionSection";
import WhyEloitySection from "@/home/WhyEloitySection";
import ScreenshotCarousel from "@/home/ScreenshotCarousel";
import { SocialProofSection } from "@/home/SocialProofSection";
import { TestimonialsSection } from "@/home/TestimonialsSection";
import { UseCasesSection } from "@/home/UseCasesSection";
import { FAQSection } from "@/home/FAQSection";
import { ComparisonSection } from "@/home/ComparisonSection";
import NewsletterSection from "@/home/NewsletterSection";

const LandingPage = () => {
  return (
    <Layout>
      <HeroSection />
      <FeaturesSection />
      <AdvancedFeaturesSection />
      <SocialProofSection />
      <ProblemSolutionSection />
      <WhyEloitySection />
      <ScreenshotCarousel />
      <TestimonialsSection />
      <UseCasesSection />
      <ComparisonSection />
      <FAQSection />
      <NewsletterSection />
    </Layout>
  );
};

export default LandingPage;
