import { Link } from "react-router-dom";
import logo from "../assets/logo.svg";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useTheme } from "../hooks/useTheme";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 4);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useLayoutEffect(() => {
    const updateNavHeight = () => {
      if (navRef.current) {
        document.documentElement.style.setProperty('--nav-h', `${navRef.current.offsetHeight}px`);
      }
    };
    updateNavHeight();
    window.addEventListener('resize', updateNavHeight);
    return () => window.removeEventListener('resize', updateNavHeight);
  }, []);

  const navLinkClass = "text-sv-muted hover:text-sv-text transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-sv-text after:transition-all py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-sv-bg rounded-sm";

  return (
    <nav ref={navRef} className="sticky top-0 z-50 w-full isolate flex flex-wrap justify-between items-center transition-all duration-300">
      
      {/* Background layer for blur to keep text crisp */}
      <div 
        aria-hidden="true" 
        className={`absolute inset-0 z-0 bg-sv-bg/85 backdrop-blur-md transition-all duration-300 ${scrolled ? "shadow-sm border-b border-sv-border" : "border-b border-sv-border/60"}`}
      ></div>

      {/* Animated shimmer border overlay for premium pulse */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-sv-accent/20 to-transparent motion-safe:animate-[pulse_8s_ease-in-out_infinite] pointer-events-none z-0" />

      {/* Content Layer (No Blur) */}
      <div className="relative z-10 w-full px-6 py-4 flex flex-wrap justify-between items-center">
        <Link 
          to="/" 
          className="text-lg md:text-xl font-semibold tracking-tight text-sv-text flex items-center gap-3 md:gap-4 transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-sv-bg rounded-md"
        >
          <img src={logo} alt="PoseRx" className="h-9 md:h-10 w-auto object-contain shrink-0 select-none" />
          <span>PoseRx</span>
        </Link>

        <div className="flex gap-6 items-center text-sm font-medium">
          <Link to="/" className={navLinkClass}>
            Home
          </Link>
          <Link to="/coach" className={navLinkClass}>
            Coach
          </Link>
          <Link to="/history" className={navLinkClass}>
            History
          </Link>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 ml-2 rounded-full border border-sv-border bg-sv-surface hover:bg-sv-elev text-sv-muted hover:text-sv-text transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-accent/40"
            aria-label="Toggle Dark Mode"
          >
            {theme === "light" ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
          <Link 
            to="/auth" 
            className="ml-2 px-4 py-2 rounded-md bg-sv-text text-sv-bg border border-sv-border/70 shadow-sm transition-[box-shadow,background-color] duration-200 hover:bg-sv-accent hover:text-sv-bg hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-sv-bg"
          >
            Sign In
          </Link>
        </div>
      </div>
    </nav>
  );
}
