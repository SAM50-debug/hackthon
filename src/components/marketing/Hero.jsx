import { Link } from "react-router-dom";
import logo from "../../assets/logo.svg";

export default function Hero() {
  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      {/* Subtle bottom Shimmer Line for premium pulse */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-sv-accent/30 to-transparent motion-safe:animate-[pulse_6s_ease-in-out_infinite]" />

      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        {/* Left: Copy */}
        <div className="flex flex-col items-start gap-6 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sv-elev border border-sv-border rounded-full text-xs font-semibold text-sv-accent mb-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-sv-success animate-pulse"></span>
            Real-time AI Coaching
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-sv-text tracking-tight leading-[1.15] md:leading-[1.1]">
            Perfect your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sv-accent to-sv-accent2">movement.</span>
          </h1>
          <p className="text-lg md:text-xl text-sv-muted max-w-lg leading-relaxed tracking-wide">
            AI-powered rehabilitation assistant for real-time posture monitoring
            and corrective feedback. Precision tracking, directly in your browser.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-5">
            <Link
              to="/auth"
              className="relative px-8 py-3.5 bg-gradient-to-br from-sv-accent2 to-sv-accent text-sv-bg font-medium rounded-lg hover:from-sv-accent hover:to-sv-accent2 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 shadow-md shadow-sv-accent/20 overflow-hidden group"
            >
               <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              Start for free
            </Link>
            <Link
              to="/coach"
              className="px-8 py-3.5 bg-sv-surface/80 backdrop-blur-sm text-sv-text border border-sv-border/70 font-medium rounded-lg hover:bg-sv-elev hover:border-sv-muted transition-all duration-300 shadow-sm"
            >
              Try Demo
            </Link>
          </div>
        </div>

        {/* Right: Brand Mark / Depth Stack */}
        <div className="relative h-96 w-full flex items-center justify-center group">
           {/* Ambient Outer Aura */}
           <div className="absolute inset-4 bg-gradient-to-r from-sv-accent to-sv-accent2 rounded-full filter blur-[80px] opacity-10 group-hover:opacity-[0.14] transition-opacity duration-700 pointer-events-none"></div>
           
           {/* Core Card with Top Highlight Trick via Box Shadow / Border */}
           <div className="relative w-full h-full flex items-center justify-center bg-sv-surface/70 border border-sv-border/60 backdrop-blur-lg rounded-3xl shadow-lg overflow-hidden before:absolute before:inset-0 before:p-[1px] before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none before:-z-10 before:rounded-3xl">
            {/* Internal Highlight Radial Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-sv-accent/10 via-transparent to-transparent blur-2xl pointer-events-none"></div>
            
            <img src={logo} alt="PoseRx Dashboard Mark" className="w-64 h-64 object-contain opacity-[0.85] drop-shadow-2xl animate-[pulse_5s_ease-in-out_infinite] z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
