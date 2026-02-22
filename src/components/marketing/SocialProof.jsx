export default function SocialProof() {
  return (
    <section className="py-10 border-y border-sv-border bg-sv-surface">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <p className="text-sm font-medium text-sv-muted mb-6 tracking-wide uppercase">
          Trusted by clinics and fitness professionals globally
        </p>
        <div className="flex flex-wrap justify-center items-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          {/* Mock Logos mapped with simple svgs */}
          <div className="flex items-center gap-2 font-bold text-xl text-sv-text">
            <div className="w-6 h-6 bg-sv-accent rounded flex items-center justify-center text-white text-xs">M</div> MediFit
          </div>
          <div className="flex items-center gap-2 font-bold text-xl text-sv-text">
            <div className="w-6 h-6 border-2 border-sv-accent2 rounded flex items-center justify-center text-sv-accent2 text-xs">A</div> ApexTherapy
          </div>
          <div className="flex items-center gap-2 font-bold text-xl text-sv-text">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sv-accent"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> Kinematics
          </div>
          <div className="flex items-center gap-2 font-bold text-xl text-sv-text">
            <div className="w-6 h-6 bg-sv-text rounded-full flex items-center justify-center text-sv-surface text-xs">C</div> CoreAlign
          </div>
        </div>
      </div>
    </section>
  );
}
