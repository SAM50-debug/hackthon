// FILE: src/components/Sparkline.jsx
export default function Sparkline({
  data = [],
  width = 140,
  height = 36,
  strokeWidth = 2,
  valueKey = "hd", // for timeline objects
  pad = 2, // inner padding so line doesn't touch edges
}) {
  if (!data || data.length < 2) {
    return <div className="text-xs text-gray-400">No timeline</div>;
  }

  // Support both: numbers[] OR objects[]
  const values = data
    .map((d) => (typeof d === "number" ? d : Number(d?.[valueKey])))
    .filter((v) => Number.isFinite(v));

  if (values.length < 2) {
    return <div className="text-xs text-gray-400">No timeline</div>;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1e-6, max - min);

  const W = Math.max(1, width - pad * 2);
  const H = Math.max(1, height - pad * 2);

  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * W;
    const norm = (v - min) / span;
    const y = pad + (1 - norm) * H; // smaller value -> lower line? (keeps chart consistent)
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={pts.join(" ")}
      />
    </svg>
  );
}
