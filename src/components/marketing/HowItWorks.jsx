import { useRevealOnScroll } from "../../hooks/useRevealOnScroll";

const steps = [
  {
    num: "01",
    title: "Start Camera",
    desc: "Position your device. MediaPipe tracks 33 critical skeletal points in 3D space instantly without storing video."
  },
  {
    num: "02",
    title: "Perform Exercise",
    desc: "Execute your sets. The AI engine continuously measures joint angles, depth, and tempo in real-time."
  },
  {
    num: "03",
    title: "Review Analytics",
    desc: "Receive actionable insights on symmetry, fatigue trends, and precise form breakdowns."
  },
  {
    num: "04",
    title: "Export & Share",
    desc: "Generate comprehensive PDF reports of your session progress to share with a coach or therapist."
  }
];

export default function HowItWorks() {
  const revealRef = useRevealOnScroll();

  return (
    <section className="py-24 bg-sv-surface border-y border-sv-border" ref={revealRef}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-16 gap-8">
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-4xl font-bold text-sv-text mb-4 tracking-tight">
              Clinical-grade tracking,<br/> zero friction.
            </h2>
            <p className="text-lg text-sv-muted">
              Built for privacy and performance. No downloads required, processes locally in your browser.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-8 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-[28px] left-10 right-10 h-0.5 bg-sv-border z-0"></div>
          
          {steps.map((step, idx) => (
            <div key={idx} className="relative z-10 flex flex-col pt-2">
              <div className="w-14 h-14 bg-sv-bg border-2 border-sv-accent text-sv-accent rounded-full flex items-center justify-center font-bold text-xl mb-6 shadow-sm shadow-sv-accent/10">
                {step.num}
              </div>
              <h3 className="text-xl font-semibold text-sv-text mb-3">{step.title}</h3>
              <p className="text-sv-muted leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
