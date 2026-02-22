export function getPerformanceTier(score) {
  if (score >= 90) return { label: "Elite", className: "bg-green-600 text-white" };
  if (score >= 80) return { label: "Excellent", className: "bg-sv-accent text-white" };
  if (score >= 70) return { label: "Good", className: "bg-yellow-500 text-white" };
  return { label: "Needs Improvement", className: "bg-red-600 text-white" };
}
