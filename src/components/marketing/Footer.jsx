import { Link } from "react-router-dom";
import logo from "../../assets/logo.svg";

export default function Footer() {
  return (
    <footer className="bg-sv-bg pt-16 pb-8 border-t border-sv-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div className="flex items-center gap-2 text-xl font-bold text-sv-text">
            <img src={logo} alt="PoseRx" className="h-6 w-auto grayscale opacity-80" />
            PoseRx
          </div>
          <div className="flex flex-wrap gap-8 text-sm font-medium">
            <Link to="/coach" className="text-sv-muted hover:text-sv-text transition-colors">Coach</Link>
            <Link to="/history" className="text-sv-muted hover:text-sv-text transition-colors">History</Link>
            <Link to="/auth" className="text-sv-muted hover:text-sv-text transition-colors">Sign In</Link>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center border-t border-sv-border pt-8 text-xs text-sv-muted gap-4">
          <p>© {new Date().getFullYear()} PoseRx. All rights reserved.</p>
          <p className="max-w-md text-center md:text-right">
            This tool is for educational purposes only and does not provide
            medical advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
