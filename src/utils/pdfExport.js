// FILE: src/utils/pdfExport.js

/**
 * Export Session History to PDF Client-Side
 * jsPDF is dynamically imported to avoid bloating main bundle.
 */
export async function exportSessionsToPDF(sessions) {
  if (!sessions || sessions.length === 0) {
    alert("No sessions to export.");
    return;
  }

  // ✅ Lazy-load jsPDF only when needed
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const bottomLimit = pageHeight - 20;

  let y = 20;

  function ensureSpace(h) {
    if (y + h > bottomLimit) {
      doc.addPage();
      y = 20;
    }
  }

  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text("PoseRx Session History", marginX, y);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  y += 6;
  doc.text(`Generated: ${new Date().toLocaleString()}`, marginX, y);
  y += 10;

  sessions.forEach((s) => {
    let splitSummary = [];
    let summaryHeight = 0;

    if (s.aiSummary) {
      splitSummary = doc.splitTextToSize(s.aiSummary, pageWidth - 30);
      summaryHeight = splitSummary.length * 5 + 2;
    }

    ensureSpace(25);

    doc.setDrawColor(200, 200, 200);
    doc.line(marginX, y, pageWidth - 14, y);
    y += 8;

    doc.setFontSize(14);
    doc.setTextColor(0, 50, 150);
    doc.text(s.exercise ?? "Session", marginX, y);

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const dateObj = new Date(s.createdAt);
    const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toLocaleString() : "Unknown Date";
    doc.text(dateStr, pageWidth - 14, y, { align: "right" });
    y += 7;

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const scoreText = `Score: ${s.score ?? 0} (${s.tier ?? "-"})`;
    const repsText = `Reps: ${s.reps ?? 0}`;
    const durText = `Duration: ${s.durationSec ?? 0}s`;
    doc.text(`${scoreText}   |   ${repsText}   |   ${durText}`, marginX, y);
    y += 7;

    const extraStats = [];
    if (Number.isFinite(s.calibration?.margin)) extraStats.push(`Calib Margin: ${s.calibration.margin.toFixed(3)}`);
    if (s.fatigue?.trend) extraStats.push(`Fatigue: ${s.fatigue.trend}`);

    if (extraStats.length) {
      ensureSpace(6);
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(extraStats.join("  •  "), marginX, y);
      y += 6;
    }

    if (splitSummary.length) {
      ensureSpace(summaryHeight);
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text(splitSummary, marginX, y);
      y += summaryHeight;
    }

    if (Array.isArray(s.timeline) && s.timeline.length) {
      const values = s.timeline
        .map((p) => (typeof p === "number" ? p : p?.hd))
        .filter((v) => Number.isFinite(v));

      if (values.length) {
        ensureSpace(7);
        const min = Math.min(...values).toFixed(3);
        const max = Math.max(...values).toFixed(3);
        const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(3);

        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(`Timeline Symmetry: min ${min} / avg ${avg} / peak ${max}`, marginX, y);
        y += 5;
      }
    }

    if (s.mistakes) {
      const topMistakes = Object.entries(s.mistakes)
        .filter(([, count]) => count > 0)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([k, v]) =>
          `${k.replace(/([A-Z])/g, " $1").trim().toLowerCase()}: ${v}`
        );
      if (topMistakes.length) {
        ensureSpace(7);
        doc.setFontSize(9);
        doc.setTextColor(150, 50, 50);
        doc.text(`Faults: ${topMistakes.join(", ")}`, marginX, y);
        y += 6;
      }
    }

    y += 4;
  });

  const now = new Date();
  const filenameDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  doc.save(`poserx-history-${filenameDate}.pdf`);
}