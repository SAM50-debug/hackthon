import { useRevealOnScroll } from "../../hooks/useRevealOnScroll";

const features = [
  {
    title: "Real-time Scoring",
    desc: "Instant feedback on your posture with millisecond latency right in the browser.",
    icon: (
      <svg className="w-6 h-6 text-sv-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    )
  },
  {
    title: "Rep Quality Analysis",
    desc: "Go beyond counting. Understand the form and depth of every single repetition.",
    icon: (
      <svg className="w-6 h-6 text-sv-accent2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )
  },
  {
    title: "Fatigue Detection",
    desc: "AI identifies form breakdown over time to prevent overtraining and injury.",
    icon: (
      <svg className="w-6 h-6 text-sv-warn" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )
  },
  {
    title: "Symmetry Timeline",
    desc: "Track bilateral imbalances to isolate weaknesses and correct compensations.",
    icon: (
      <svg className="w-6 h-6 text-sv-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
    )
  },
  {
    title: "AI Session Summary",
    desc: "Automated insights detailing optimal sets, weak points, and actionable next steps.",
    icon: (
      <svg className="w-6 h-6 text-sv-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    )
  },
  {
    title: "PDF Export",
    desc: "Generate professional session reports instantly for clients or practitioners.",
    icon: (
      <svg className="w-6 h-6 text-sv-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    )
  }
];

export default function FeatureGrid() {
  const revealRef = useRevealOnScroll();
  
  return (
    <section className="py-24 bg-sv-bg" ref={revealRef}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-sv-text mb-4 tracking-tight">
            Precision analytics, simplified.
          </h2>
          <p className="text-lg text-sv-muted">
            Everything you need to capture, analyze, and communicate movement data efficiently.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className="group p-8 bg-sv-surface rounded-2xl border border-sv-border hover:border-sv-accent/50 hover:shadow-xl hover:shadow-sv-accent/5 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-sv-elev rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-sv-text mb-3">
                {feature.title}
              </h3>
              <p className="text-sv-muted leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
