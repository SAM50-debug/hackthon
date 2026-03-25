# PoseRx

PoseRx is a browser-based posture coaching application that analyzes exercise form in real time using webcam pose estimation and stores session results for later review.

It currently supports **Squat** and **Shoulder Raise** tracking, with live rep detection, movement-quality scoring, session summaries, and history export.

---

## Overview

PoseRx combines three main capabilities in one frontend application:

1. **Live movement tracking** through webcam-based pose estimation
2. **Exercise-specific analysis** for rep counting and form quality
3. **Session persistence and review** through local storage or Supabase-backed sync

The system is designed to work directly in the browser, without requiring a native app or video upload workflow.

---

## What the System Does

- captures live camera input in the browser
- runs **MediaPipe Pose** to estimate body landmarks
- analyzes motion for:
  - squat depth and phase
  - shoulder raise symmetry and timing
- tracks repetition counts and movement state in real time
- computes session metrics such as:
  - score
  - duration
  - instability
  - asymmetry
  - fatigue trend
- saves completed sessions:
  - locally for guest users
  - to Supabase for authenticated users
- displays session history with summaries and sparklines
- exports session history to PDF

---

## Core Features

### Real-Time Pose Tracking
PoseRx uses **MediaPipe Pose** in the browser to estimate body landmarks from the webcam stream.

This enables:
- live motion analysis
- joint-angle calculations
- pose overlay rendering on top of the video feed

### Exercise-Specific Coaching
The coaching screen currently supports two exercises:

- **Squat**
- **Shoulder Raise**

Each exercise uses its own movement logic and rep detection rules.

### Session Analytics
During and after a session, the app derives metrics such as:
- repetition count
- session duration
- session score
- performance tier
- instability events
- asymmetry indicators
- fatigue trend
- text summary of session quality

### Session History
Completed sessions can be reviewed on the history page.

History includes:
- exercise type
- score and performance tier
- reps and duration
- summary text
- trend sparkline data

### PDF Export
Users can export their recorded session history as a PDF report.

### Authentication and Sync
PoseRx supports:
- guest usage without sign-in
- sign in / sign up with **Supabase Auth**
- cloud session storage for authenticated users

---

## Tech Stack

- **Frontend:** React + Vite
- **Routing:** React Router
- **Pose Estimation:** MediaPipe Pose
- **Auth / Cloud Data:** Supabase
- **PDF Export:** jsPDF
- **Styling:** Tailwind CSS + custom theme variables

---

## Application Routes

- `/` — landing page
- `/coach` — live posture coaching
- `/history` — session history and export
- `/auth` — sign in / sign up

---

## Project Structure

src/
├── components/
│   ├── marketing/           # Landing page sections
│   ├── skeletons/           # Loading placeholders
│   ├── ui/                  # Shared primitive UI components
│   ├── CameraView.jsx       # Webcam stream component
│   ├── ExerciseSelector.jsx # Exercise mode switching
│   ├── Navbar.jsx
│   ├── PoseOverlay.jsx      # Landmark overlay canvas
│   └── Sparkline.jsx        # Small trend visualization
├── hooks/
│   ├── usePose.js           # MediaPipe processing loop
│   ├── useRevealOnScroll.js
│   ├── useSessionHistory.js # History loader / storage selection
│   └── useTheme.js
├── lib/
│   ├── pose/
│   │   ├── poseConfig.js
│   │   └── poseEngine.js
│   ├── storage/
│   │   ├── sessionStore.js
│   │   └── sessionCloudStore.js
│   └── supabaseClient.js
├── pages/
│   ├── Landing.jsx
│   ├── Coach.jsx
│   ├── History.jsx
│   └── Auth.jsx
├── utils/
│   ├── analytics.js
│   ├── angles.js
│   ├── ema.js
│   ├── pdfExport.js
│   ├── performance.js
│   ├── repCounter.js
│   ├── scoring.js
│   ├── shoulderRepCounter.js
│   └── variance.js
└── theme/
    └── sapphireVeil.css
How It Works
Live Coaching Flow
User opens /coach
→ camera stream starts
→ MediaPipe Pose estimates landmarks
→ exercise logic analyzes movement
→ reps, phase, and quality metrics update in real time
→ session summary is computed when session ends
→ session is saved locally or to Supabase
History Flow
User opens /history
→ app checks auth state
→ guest users load local sessions
→ signed-in users load cloud sessions
→ history is rendered with scores, summaries, and sparklines
→ user can export report as PDF
Storage Model
Guest Mode

If the user is not signed in, sessions are stored locally through the browser.

Signed-In Mode

If the user is authenticated, sessions are stored in Supabase and fetched from the sessions table.

Environment Setup

This project expects Supabase environment variables for authenticated usage:

VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key

Without valid Supabase credentials, guest mode and local session storage remain the primary usable path.

Important Notes
Pose estimation runs in the browser using MediaPipe
The application currently supports only Squat and Shoulder Raise
Session summaries are generated from rule-based analytics, not from an external LLM
Cloud history depends on Supabase being configured correctly
Limitations
exercise support is limited to two movement types
no backend service layer beyond Supabase integration
no clinician workflow or multi-user admin tooling
no server-side analytics pipeline
no persisted video, only derived session data
some landing-page marketing copy is more aspirational than the implemented runtime scope
Use Cases
movement-quality demos
browser-based posture coaching prototypes
fitness or rehab analytics MVPs
pose-estimation portfolios with measurable outputs
License

MIT
