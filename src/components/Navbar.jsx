import { Link } from "react-router-dom";
import logo from "../assets/logo.svg";
import { useState, useEffect, useLayoutEffect, useRef } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef(null);

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
