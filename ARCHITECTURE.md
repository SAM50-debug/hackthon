---
# Architecture

## System Overview

PoseRx is a client-side posture coaching application that combines:

1. browser webcam capture
2. MediaPipe-based pose estimation
3. exercise-specific movement analysis
4. local or cloud-backed session persistence

The application is built as a React SPA with separate routes for marketing, authentication, live coaching, and session history.

---

## High-Level Architecture

```text
User
→ React SPA
→ Webcam Input
→ MediaPipe Pose
→ Exercise Analysis Logic
→ Session Metrics + Summary
→ Local Storage or Supabase
→ History / PDF Export
Runtime Areas
1. Landing and Authentication

Routes:

/
/auth

Responsibilities:

explain the product concept
allow sign in / sign up
support guest entry to the coaching route

This layer is mostly presentational, except for Supabase authentication in Auth.jsx.

2. Coaching Runtime

Route:

/coach

Responsibilities:

manage active exercise state
start and stop camera usage
process live landmarks
calculate exercise metrics
compute session score and summary
persist completed sessions

This is the core runtime of the system.

3. Session Review

Route:

/history

Responsibilities:

load stored sessions
switch between local and cloud history based on auth state
render summaries and metrics
export report data to PDF
clear stored history
Core Architectural Layers
A. Pose Capture and Inference Layer
Components and Modules
CameraView.jsx
PoseOverlay.jsx
usePose.js
lib/pose/poseEngine.js
lib/pose/poseConfig.js
Responsibilities
CameraView
requests webcam access with getUserMedia
attaches the stream to a <video> element
stops tracks when inactive or unmounted
reports access failure visually
usePose
starts and stops the MediaPipe processing loop
uses requestAnimationFrame to send video frames for inference
pauses processing when the page is hidden
exposes latest poseLandmarks
poseEngine
creates the MediaPipe Pose instance
applies pose config
routes inference results to the React hook
PoseOverlay
draws pose connectors and landmarks on a canvas over the camera view
Data Flow
Webcam Video
→ HTMLVideoElement
→ MediaPipe Pose
→ poseLandmarks
→ React state
→ overlay rendering + exercise analysis
B. Exercise Analysis Layer
Main Runtime Container
pages/Coach.jsx
Supporting Utilities
utils/angles.js
utils/repCounter.js
utils/shoulderRepCounter.js
utils/ema.js
utils/variance.js
Responsibilities

The coaching page performs:

exercise selection
session start / stop behavior
live metric updates
session aggregation
save-to-storage orchestration
Supported Exercises
1. Squat

Uses:

hip, knee, and ankle landmarks
knee-angle calculation
phase detection (UP / DOWN)
rep counting through threshold transitions

Tracked concepts include:

angle depth
too-high squat frames
unstable frames in partial depth ranges
2. Shoulder Raise

Uses:

shoulder and elbow landmarks
EMA-smoothed elbow positions
a calibration phase for dynamic margin selection
bilateral symmetry checks
raise / lower phase detection

Tracked concepts include:

whether both sides are raised
left-right height difference
instability events
tempo-related quality
C. Analytics and Scoring Layer
Modules
utils/scoring.js
utils/performance.js
utils/analytics.js
Responsibilities
Session Score

computeSessionScore converts bad-frame and instability counts into a bounded score.

Performance Tier

getPerformanceTier maps the numeric score into labels such as:

Elite
Excellent
Good
Needs Improvement
Rep-Level Analytics

computeRepScore estimates per-repetition quality using:

asymmetry
instability ratio
tempo penalties
Fatigue Trend

computeFatigueTrend analyzes rep-score trends over time to classify:

STABLE
MILD_FATIGUE
HIGH_FATIGUE
Text Summary

sessionSummaryEngine builds a rule-based written summary from session signals such as:

dominant fault type
fatigue trend
average rep quality

This summary is generated locally from computed metrics.

D. Persistence Layer
Local Persistence
lib/storage/sessionStore.js

Used when the user is not authenticated.

Responsibilities:

save session payloads locally
load local session history
clear local history
Cloud Persistence
lib/storage/sessionCloudStore.js
lib/supabaseClient.js

Used when the user is authenticated.

Responsibilities:

retrieve current user ID from Supabase session
insert session payload into sessions
load user-specific session history
clear cloud history
History Selection Logic
hooks/useSessionHistory.js

Responsibilities:

determine whether the current user is signed in
load local history immediately
replace with cloud history for authenticated users
refresh on auth state changes
Storage Flow
Session Completed
→ check auth state
→ guest: save to local storage
→ signed-in: save payload to Supabase
E. Reporting Layer
Modules
utils/pdfExport.js
components/Sparkline.jsx
Responsibilities
PDF Export
dynamically imports jspdf
generates a report from current session history
includes exercise, score, reps, duration, summary, and derived metrics
Sparkline
provides a compact trend visualization for session timeline data
Route Structure
/
  Landing page and marketing sections

/auth
  Supabase sign in / sign up flow

/coach
  Live webcam coaching and session recording

/history
  Session review, filtering, clearing, and PDF export
UI and Theme System
Theme
hooks/useTheme.js
theme/sapphireVeil.css

Responsibilities:

persist light/dark selection in localStorage
apply theme variables through data-theme
Layout Elements
Navbar
marketing sections
skeleton screens
shared UI primitives

These modules support the application shell but are not part of the exercise-analysis core.

End-to-End Flow
Guest User
User visits /coach
→ selects exercise
→ starts session
→ camera + pose tracking run
→ metrics are computed in browser
→ session ends
→ session is saved locally
→ /history loads local sessions
Authenticated User
User signs in through Supabase
→ starts coaching session
→ session metrics are computed in browser
→ completed session is inserted into Supabase
→ /history loads cloud sessions for current user
→ sessions can be exported to PDF
Key Design Characteristics
frontend-first architecture
real-time browser-side pose estimation
no custom backend server
auth and cloud storage delegated to Supabase
exercise logic separated from presentation components
history system adapts to guest vs authenticated usage
Architectural Strengths
clear separation between pose inference, analysis, persistence, and presentation
camera processing stays in the client runtime
optional auth does not block guest use
session history is portable through export
Architectural Constraints
implemented exercise coverage is limited
analytics are rule-based rather than model-driven
cloud sync depends entirely on Supabase configuration
no dedicated backend for auditability, multi-user management, or centralized analytics
landing-page claims should be interpreted as product positioning, not strict feature parity
