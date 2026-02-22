import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Hero from "../components/marketing/Hero";
import SocialProof from "../components/marketing/SocialProof";
import FeatureGrid from "../components/marketing/FeatureGrid";
import HowItWorks from "../components/marketing/HowItWorks";
import Footer from "../components/marketing/Footer";
import LandingSkeleton from "../components/skeletons/LandingSkeleton";

export default function Landing() {
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setInitLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (initLoading) return <LandingSkeleton />;

  return (
    <div className="min-h-screen bg-sv-bg font-sans overflow-hidden animate-in fade-in duration-300">
      <Hero />
      <SocialProof />
      <FeatureGrid />
      <HowItWorks />
      
      {/* CTA Section */}
      <section className="py-24 bg-sv-bg">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-sv-text mb-6 tracking-tight">
            Ready to correct your form?
          </h2>
          <p className="text-lg text-sv-muted mb-10 max-w-2xl mx-auto">
            Join thousands of professionals and users enhancing their movement quality effortlessly in the browser.
          </p>
          <Link
            to="/auth"
            className="inline-block px-10 py-4 bg-sv-text text-sv-bg font-medium rounded-lg hover:bg-sv-accent hover:text-white transition-all duration-300 transform hover:-translate-y-1 shadow-xl shadow-sv-text/10"
          >
            Create your account
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
