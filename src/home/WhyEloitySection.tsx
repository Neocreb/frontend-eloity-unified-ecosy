import React from "react";
import {
  TrendingUp,
  Shield,
  Zap,
  Globe,
  Users,
  Award,
} from "lucide-react";

const WhyEloitySection = () => {
  const benefits = [
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Multiple Income Streams",
      description:
        "Sell products, offer services, create content, trade crypto, and receive tips—maximize your earnings potential with one account.",
      stat: "10M+ users earning",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Secure & Trustworthy",
      description:
        "Bank-grade security with 2FA, encrypted payments, and secure escrow for P2P transactions. Your money is always safe.",
      stat: "$2B+ transactions",
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Instant Payouts",
      description:
        "Get paid instantly to your wallet or bank account. No waiting, no hidden fees. Keep 100% of your earnings.",
      stat: "Average 2-hour payout",
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Global Marketplace",
      description:
        "Access customers in 150+ countries with support for 50+ currencies and local payment methods.",
      stat: "150+ countries supported",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Smart Matching",
      description:
        "AI-powered algorithms connect you with the right customers and opportunities tailored to your skills and interests.",
      stat: "3x faster growth",
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Grow With Rewards",
      description:
        "Earn achievements, level up, and unlock exclusive benefits. The more you grow, the more benefits you unlock.",
      stat: "Earn 50K+ points/month",
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted dark:from-background dark:to-muted" id="why-eloity">
      <div className="container-wide">
        <div className="text-center mb-16">
          <h2 className="heading-lg mb-6">
            Why <span className="gradient-text">10 Million Users</span> Choose Eloity
          </h2>
          <p className="body-md text-muted-foreground max-w-2xl mx-auto">
            We've built the most comprehensive earning platform. Here's what makes us different.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="relative group bg-card dark:bg-card p-8 rounded-xl border border-border dark:border-border shadow-sm hover:shadow-lg hover:border-eloity-primary/50 transition-all duration-300 overflow-hidden"
            >
              {/* Gradient background on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-eloity-primary/5 to-eloity-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-eloity-primary/20 to-eloity-cyan/20 text-eloity-primary rounded-lg mb-5 group-hover:from-eloity-primary/30 group-hover:to-eloity-cyan/30 transition-colors duration-300">
                  {benefit.icon}
                </div>

                <h3 className="text-xl font-bold mb-3 text-foreground">{benefit.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">{benefit.description}</p>

                <div className="pt-4 border-t border-border/30">
                  <p className="text-sm font-semibold text-eloity-primary">{benefit.stat}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 pt-16 border-t border-border/30">
          <div className="text-center mb-10">
            <h3 className="text-lg font-bold mb-4">Trusted by millions worldwide</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            <div className="text-center p-4 rounded-lg bg-muted/50 dark:bg-muted/20">
              <div className="text-3xl font-bold gradient-text">10M+</div>
              <div className="text-sm text-muted-foreground mt-2">Active Users</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50 dark:bg-muted/20">
              <div className="text-3xl font-bold gradient-text">$2B+</div>
              <div className="text-sm text-muted-foreground mt-2">Transactions</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50 dark:bg-muted/20">
              <div className="text-3xl font-bold gradient-text">150+</div>
              <div className="text-sm text-muted-foreground mt-2">Countries</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50 dark:bg-muted/20">
              <div className="text-3xl font-bold gradient-text">4.8/5</div>
              <div className="text-sm text-muted-foreground mt-2">User Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyEloitySection;
