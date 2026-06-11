const toDisplay = (s: number) => Math.round(((s - 1) / 2) * 100);

export async function exportScorecardPDF(
  companyName: string,
  sector: string,
  period: string,
  overallScore: number,
  classification: string,
  sdgScores: Array<{ sdgId: number; sdgName: string; score: number; classification: string; sectorAvg: number }>,
  improvementActions?: Array<{ action: string; sdgId: number; priority: string; timeframe: string }>
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = 210;
  const navy = [1, 83, 118] as [number, number, number];
  const teal = [0, 181, 237] as [number, number, number];
  const green = [0, 166, 81] as [number, number, number];
  const amber = [232, 160, 32] as [number, number, number];
  const red = [208, 2, 27] as [number, number, number];
  const gray = [74, 85, 104] as [number, number, number];
  const bg = [244, 246, 248] as [number, number, number];
  const white = [255, 255, 255] as [number, number, number];

  const scoreColor = (s: number): [number, number, number] =>
    s >= 2.4 ? green : s >= 1.6 ? amber : red;

  let y = 0;

  doc.setFillColor(...navy);
  doc.rect(0, 0, W, 45, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Sanlam Investments', 14, 12);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('InvestScore', 14, 24);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('SDG Scorecard Report', 14, 32);
  doc.setFontSize(8);
  doc.setTextColor(200, 230, 251);
  doc.text(`Generated ${new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 40);

  y = 55;

  doc.setFillColor(...bg);
  doc.rect(14, y, W - 28, 24, 'F');
  doc.setTextColor(...navy);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, 20, y + 9);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text(`${sector.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}  |  Reporting period: ${period}`, 20, y + 17);

  y += 32;

  const sc = scoreColor(overallScore);
  doc.setFillColor(...sc);
  doc.rect(14, y, 55, 32, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(toDisplay(overallScore).toString(), 20, y + 18);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('/ 100  Overall SDG Score', 20, y + 26);

  doc.setFillColor(...bg);
  doc.rect(74, y, 122, 32, 'F');
  doc.setTextColor(...navy);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${classification} Impact`, 80, y + 13);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text(`${sdgScores.filter(s => s.classification === 'High').length} High | ${sdgScores.filter(s => s.classification === 'Medium').length} Medium | ${sdgScores.filter(s => s.classification === 'Low').length} Low`, 80, y + 22);

  y += 42;

  doc.setTextColor(...navy);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('SDG Performance', 14, y);
  y += 6;

  doc.setFillColor(...navy);
  doc.rect(14, y, W - 28, 7, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('SDG', 17, y + 5);
  doc.text('Goal Name', 30, y + 5);
  doc.text('Score', 118, y + 5);
  doc.text('Sector Avg', 136, y + 5);
  doc.text('Classification', 158, y + 5);
  y += 7;

  sdgScores.forEach((s, i) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    const rowBg: [number, number, number] = i % 2 === 0 ? white : bg;
    doc.setFillColor(...rowBg);
    doc.rect(14, y, W - 28, 7, 'F');
    doc.setTextColor(...gray);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`SDG ${s.sdgId}`, 17, y + 5);
    doc.text(s.sdgName.substring(0, 28), 30, y + 5);
    doc.text(toDisplay(s.score).toString(), 118, y + 5);
    doc.text(toDisplay(s.sectorAvg).toString(), 136, y + 5);

    const cc = scoreColor(s.score);
    doc.setTextColor(...cc);
    doc.setFont('helvetica', 'bold');
    doc.text(s.classification, 158, y + 5);
    y += 7;
  });

  y += 10;

  if (improvementActions && improvementActions.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setTextColor(...navy);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Priority Improvement Actions', 14, y);
    y += 8;

    improvementActions.slice(0, 8).forEach(action => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      const priorityColor: [number, number, number] =
        action.priority === 'critical' ? red : action.priority === 'high' ? amber : teal;

      doc.setFillColor(...priorityColor);
      doc.rect(14, y, 3, 12, 'F');
      doc.setFillColor(...bg);
      doc.rect(17, y, W - 31, 12, 'F');
      doc.setTextColor(...priorityColor);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(`SDG ${action.sdgId} | ${action.priority.toUpperCase()} | ${action.timeframe}`, 21, y + 5);

      doc.setTextColor(...navy);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const actionText = doc.splitTextToSize(action.action, W - 45);
      doc.text(actionText[0], 21, y + 10);
      y += 15;
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...navy);
    doc.rect(0, 287, W, 10, 'F');
    doc.setTextColor(...white);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('InvestScore | Sanlam Investments | Twin Transition Challenge 2026', 14, 293);
    doc.text(`Page ${i} of ${pageCount}`, W - 25, 293);
  }

  doc.save(`${companyName.replace(/\s+/g, '_')}_SDG_Scorecard_${period.replace(/\s+/g, '_')}.pdf`);
}
