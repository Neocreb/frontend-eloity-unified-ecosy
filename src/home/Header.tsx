import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 dark:bg-background/95 shadow-lg backdrop-blur-sm py-3 border-b border-border"
          : "bg-transparent py-4"
      }`}
    >
      <div className="container-wide flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <span className="text-2xl font-bold eloity-text-gradient">Eloity</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <NavLinks />
          <ThemeToggle />
          <Button className="btn-primary" asChild>
            <Link to="/auth">
              Launch App
            </Link>
          </Button>
        </nav>

        {/* Mobile Navigation Toggle */}
        <button
          className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-background dark:bg-background shadow-lg border-b border-border py-4 px-6 animate-fade-in backdrop-blur-md">
          <nav className="flex flex-col space-y-4">
            <NavLinks
              mobile={true}
              closeMenu={() => setIsMobileMenuOpen(false)}
            />
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
            <Button className="btn-primary w-full" asChild>
              <Link to="/auth">
                Launch App
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

// NavLinks component for reusability between desktop and mobile
const NavLinks = ({ mobile = false, closeMenu = () => {} }) => {
  const links = [
    { text: "Home", href: "/" },
    { text: "Features", href: "#features" },
    { text: "Track Package", href: "/delivery/track" },
    { text: "Become Driver", href: "/delivery/apply" },
    { text: "Blog", href: "/blog" },
    { text: "Newsletter", href: "#contact" },
  ];

  return (
    <>
      {links.map((link) => (
        <a
          key={link.text}
          href={link.href}
          className={`${
            mobile ? "block py-2 text-lg" : "text-sm font-medium"
          } text-foreground dark:text-foreground hover:text-eloity-primary dark:hover:text-eloity-accent transition-colors`}
          onClick={closeMenu}
        >
          {link.text}
        </a>
      ))}
    </>
  );
};

export default Header;
