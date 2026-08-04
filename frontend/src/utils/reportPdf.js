import { jsPDF } from "jspdf";

// Programmatic PDF generation. We deliberately avoid html2canvas-style screenshot
// approaches because the app's Tailwind v4 theme uses oklch() colors, which those
// libraries cannot parse. Building the document by hand keeps it crisp and portable.

const MARGIN = 48;
const LINE = 16;

const SCORE_ROWS = [
    ["overallScore", "Overall score"],
    ["technicalScore", "Technical"],
    ["communicationScore", "Communication"],
    ["confidenceScore", "Confidence"],
    ["problemSolvingScore", "Problem solving"],
];

function clampScore(value) {
    return Math.max(0, Math.min(100, Math.round(Number(value ?? 0))));
}

export function downloadReportPdf({ report, integrity, title = "Interview report" } = {}) {
    if (!report) return;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - MARGIN * 2;
    let y = MARGIN;

    const ensureSpace = (needed) => {
        if (y + needed > pageHeight - MARGIN) {
            doc.addPage();
            y = MARGIN;
        }
    };

    const heading = (text, size = 14) => {
        ensureSpace(LINE * 2);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(size);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text(text, MARGIN, y);
        y += LINE * 1.4;
    };

    const paragraph = (text, { size = 11, color = [51, 65, 85] } = {}) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(size);
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(String(text ?? ""), contentWidth);
        lines.forEach((line) => {
            ensureSpace(LINE);
            doc.text(line, MARGIN, y);
            y += LINE;
        });
    };

    const bulletList = (items) => {
        if (!Array.isArray(items) || items.length === 0) {
            paragraph("No details available.", { color: [100, 116, 139] });
            return;
        }
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(51, 65, 85);
        items.forEach((item) => {
            const lines = doc.splitTextToSize(String(item ?? ""), contentWidth - 16);
            lines.forEach((line, index) => {
                ensureSpace(LINE);
                if (index === 0) {
                    doc.setTextColor(2, 132, 199); // sky-600
                    doc.text("•", MARGIN, y);
                    doc.setTextColor(51, 65, 85);
                }
                doc.text(line, MARGIN + 16, y);
                y += LINE;
            });
        });
    };

    // ---- Title -------------------------------------------------------------
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text(title, MARGIN, y);
    y += LINE * 1.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated ${new Date().toLocaleString()}`, MARGIN, y);
    y += LINE * 1.6;

    // ---- Scores ------------------------------------------------------------
    heading("Scores");
    SCORE_ROWS.forEach(([key, label]) => {
        const score = clampScore(report[key]);
        ensureSpace(LINE + 10);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(51, 65, 85);
        doc.text(label, MARGIN, y);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(`${score}%`, pageWidth - MARGIN, y, { align: "right" });
        y += 6;

        // track + fill bar
        const barY = y;
        const barWidth = contentWidth;
        doc.setFillColor(226, 232, 240); // slate-200
        doc.roundedRect(MARGIN, barY, barWidth, 6, 3, 3, "F");
        doc.setFillColor(2, 132, 199); // sky-600
        doc.roundedRect(MARGIN, barY, (barWidth * score) / 100, 6, 3, 3, "F");
        y += LINE + 4;
    });
    y += LINE * 0.4;

    // ---- Overall feedback --------------------------------------------------
    heading("Overall feedback");
    paragraph(report.overallFeedback || "No feedback available.");
    y += LINE * 0.6;

    // ---- Integrity ---------------------------------------------------------
    if (integrity) {
        const tabSwitches = integrity.tabSwitchCount ?? 0;
        const fullscreenExits = integrity.fullscreenExits ?? 0;
        const flags = tabSwitches + fullscreenExits;
        heading("Interview integrity");
        if (flags === 0) {
            paragraph("No proctoring flags — the candidate stayed focused throughout.", {
                color: [4, 120, 87], // emerald-700
            });
        } else {
            paragraph(
                `${flags} proctoring ${flags === 1 ? "flag" : "flags"} recorded during this interview.`,
                { color: [180, 83, 9] } // amber-700
            );
            paragraph(`Tab switches: ${tabSwitches}    Fullscreen exits: ${fullscreenExits}`, {
                color: [146, 64, 14], // amber-800
            });
        }
        y += LINE * 0.6;
    }

    // ---- Strengths / Weaknesses / Improvement plan -------------------------
    heading("Strengths");
    bulletList(report.strengths);
    y += LINE * 0.6;

    heading("Weaknesses");
    bulletList(report.weaknesses);
    y += LINE * 0.6;

    heading("Improvement plan");
    bulletList(report.improvementPlan);

    doc.save("interview-report.pdf");
}
