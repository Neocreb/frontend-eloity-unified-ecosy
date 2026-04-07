import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted dark:from-background dark:to-muted py-16 sm:py-20 md:py-32">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 -z-10 h-[600px] w-[600px] sm:h-[800px] sm:w-[800px] -translate-x-1/2 opacity-20 bg-gradient-radial from-eloity-primary/40 to-transparent"></div>
        <div className="absolute right-0 bottom-0 -z-10 h-[400px] w-[400px] sm:h-[600px] sm:w-[600px] translate-x-1/3 translate-y-1/3 opacity-20 bg-gradient-radial from-teal-400/40 to-transparent"></div>
      </div>

      <div className="container-wide relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-block mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-eloity-primary/10 to-teal-400/10 border border-eloity-primary/30">
            <span className="text-sm font-semibold gradient-text">🚀 The All-in-One Platform for Creators, Freelancers & Traders</span>
          </div>

          <h1 className="heading-xl mb-6">
            <span className="gradient-text">Build Your Income Empire</span>{" "}
            <span className="text-foreground">in One Unified Platform</span>
          </h1>

          <p className="body-lg mb-10 text-muted-foreground dark:text-muted-foreground max-w-2xl mx-auto">
            Sell products, offer services, create content, trade crypto, and build your community—all in one secure, AI-powered platform.
            {" "}<span className="font-semibold text-foreground">Join 10M+ users already earning on Eloity.</span>
          </p>

          {/* Primary CTA - Focused */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-2xl mx-auto mb-12">
            <Link to="/auth" className="flex-1 sm:flex-none">
              <Button
                size="lg"
                className="bg-gradient-to-r from-eloity-primary to-eloity-cyan hover:from-eloity-primary hover:to-eloity-cyan text-white font-bold text-lg px-10 py-7 rounded-xl w-full transition-all duration-300 shadow-2xl hover:shadow-eloity-primary/50 hover:scale-105 border-2 border-white/20"
              >
                Start Earning Free →
              </Button>
            </Link>
          </div>

          {/* Quick Benefits */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground mb-12 max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">✓</div>
              <span>No fees to start</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">✓</div>
              <span>Instant payouts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">✓</div>
              <span>150+ countries</span>
            </div>
          </div>

          {/* How to Get Started - Simple 3-step */}
          <div className="mt-12 pt-12 border-t border-border/50">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Get Started in 3 Simple Steps</h3>
              <p className="text-muted-foreground">Begin your income journey today</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-eloity-primary to-eloity-cyan text-white flex items-center justify-center text-lg font-bold mx-auto mb-4">1</div>
                <h4 className="font-bold text-center mb-2">Create Your Account</h4>
                <p className="text-sm text-muted-foreground text-center">Sign up with email and complete your profile in minutes</p>
              </div>
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-eloity-primary to-eloity-cyan text-white flex items-center justify-center text-lg font-bold mx-auto mb-4">2</div>
                <h4 className="font-bold text-center mb-2">Choose Your Path</h4>
                <p className="text-sm text-muted-foreground text-center">Be a seller, creator, freelancer, or trader—or do all of them</p>
              </div>
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-eloity-primary to-eloity-cyan text-white flex items-center justify-center text-lg font-bold mx-auto mb-4">3</div>
                <h4 className="font-bold text-center mb-2">Start Earning</h4>
                <p className="text-sm text-muted-foreground text-center">Receive instant payments in 150+ countries</p>
              </div>
            </div>
          </div>

          <div className="mt-16 relative">
            <div className="absolute -inset-px rounded-xl bg-gradient-to-tr from-eloity-500 to-teal-400 opacity-70 blur-sm"></div>
            <div className="relative rounded-xl bg-card dark:bg-card shadow-xl overflow-hidden border border-border dark:border-border">
              <img
                src="https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80&w=1280"
                alt="Eloity app interface"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
