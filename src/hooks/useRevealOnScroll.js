import { useEffect, useRef } from 'react';

export function useRevealOnScroll(options = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }) {
  const ref = useRef(null);

  useEffect(() => {
    // Check for user's motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (prefersReducedMotion.matches) {
      if (ref.current) {
         ref.current.classList.add('opacity-100');
         ref.current.classList.remove('opacity-0', 'translate-y-4');
      }
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-4');
          obs.unobserve(entry.target); // Only observe once
        }
      });
    }, options);

    const currentRef = ref.current;
    if (currentRef) {
      currentRef.classList.add('opacity-0', 'translate-y-4', 'transition-all', 'duration-700', 'ease-out');
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [options.threshold, options.rootMargin]); // eslint-disable-line react-hooks/exhaustive-deps

  return ref;
}
