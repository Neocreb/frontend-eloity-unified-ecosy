import React, { ReactNode, useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  // Scroll to top on initial render
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background dark:bg-background text-foreground dark:text-foreground relative">
      <Header />
      <main className="flex-grow pt-20 relative z-0">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
