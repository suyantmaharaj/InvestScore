import { PortfolioEmploymentData } from '@/hooks/usePortfolioEmployment';
import { PMPortfolioEntry } from '@/hooks/usePMData';

export async function exportPortfolioPDF(
  employmentData: PortfolioEmploymentData,
  portfolio:      PMPortfolioEntry[],
  period:         string = 'Q2 2026'
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = 210;
  const navy:  [number, number, number] = [1, 83, 118];
  const teal:  [number, number, number] = [0, 181, 237];
  const green: [number, number, number] = [0, 166, 81];
  const amber: [number, number, number] = [232, 160, 32];
  const gray:  [number, number, number] = [74, 85, 104];
  const white: [number, number, number] = [255, 255, 255];
  const bg:    [number, number, number] = [244, 246, 248];

  let y = 0;

  // ── Cover ────────────────────────────────────────────────────────────────
  doc.setFillColor(...navy);
  doc.rect(0, 0, W, 60, 'F');

  doc.setTextColor(...white);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('104+ SMME Growth & Empowerment Solution', 14, 14);

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('INvestScore', 14, 30);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.text('Portfolio Employment & Impact Report', 14, 42);

  doc.setFontSize(9);
  doc.setTextColor(201, 238, 251);
  const generated = new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(`Reporting period: ${period}  |  Generated ${generated}`, 14, 54);

  y = 72;

  // ── Section 1: Portfolio Overview ────────────────────────────────────────
  doc.setTextColor(...navy);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Portfolio Overview', 14, y);
  y += 8;

  const overviewStats = [
    { label: 'Active companies',         value: String(portfolio.length)                                                           },
    { label: 'Companies reporting',      value: String(employmentData.reportingCompanies)                                          },
    { label: 'Total portfolio employment', value: String(employmentData.totalEmployees)                                             },
    { label: 'High Impact companies',    value: String(portfolio.filter(e => e.scorecard?.classification === 'High').length)       },
    { label: 'Medium Impact companies',  value: String(portfolio.filter(e => e.scorecard?.classification === 'Medium').length)     },
    { label: 'Low Impact companies',     value: String(portfolio.filter(e => e.scorecard?.classification === 'Low').length)        },
  ];

  overviewStats.forEach((stat, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x   = 14 + col * 96;
    const yy  = y + row * 16;

    doc.setFillColor(...bg);
    doc.rect(x, yy, 92, 13, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text(stat.label, x + 4, yy + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navy);
    doc.text(stat.value, x + 4, yy + 10.5);
  });

  y += Math.ceil(overviewStats.length / 2) * 16 + 10;

  // ── Section 2: Employment Summary ────────────────────────────────────────
  doc.setTextColor(...navy);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Employment Summary', 14, y);
  y += 8;

  const te = employmentData.totalEmployees;
  const pct = (n: number) => te > 0 ? Math.round(n / te * 100) : 0;

  const employmentStats = [
    { label: 'Total employees',         value: String(te),                                                                        color: teal  },
    { label: 'Black employees',         value: `${pct(employmentData.blackEmployees)}% (${employmentData.blackEmployees})`,       color: teal  },
    { label: 'Female employees',        value: `${pct(employmentData.femaleEmployees)}% (${employmentData.femaleEmployees})`,     color: green },
    { label: 'Youth employees (<=35)',  value: `${pct(employmentData.youthEmployees)}% (${employmentData.youthEmployees})`,      color: amber },
    { label: 'Permanent employment',    value: `${pct(employmentData.staffEmployees + employmentData.managementEmployees)}%`,     color: green },
    { label: 'Management roles',        value: `${pct(employmentData.managementEmployees)}% (${employmentData.managementEmployees})`, color: teal },
    { label: 'Contract workers',        value: `${pct(employmentData.contractorEmployees)}% (${employmentData.contractorEmployees})`, color: amber },
  ];

  doc.setFillColor(...navy);
  doc.rect(14, y, W - 28, 7, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Metric', 18, y + 5);
  doc.text('Portfolio value', 120, y + 5);
  y += 7;

  employmentStats.forEach((stat, i) => {
    const rowBg: [number, number, number] = i % 2 === 0 ? white : bg;
    doc.setFillColor(...rowBg);
    doc.rect(14, y, W - 28, 8, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text(stat.label, 18, y + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...stat.color);
    doc.text(stat.value, 120, y + 5.5);
    y += 8;
  });

  y += 10;

  // ── Section 3: SDG Performance ───────────────────────────────────────────
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setTextColor(...navy);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('3. SDG Performance Summary', 14, y);
  y += 8;

  doc.setFillColor(...navy);
  doc.rect(14, y, W - 28, 7, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Company',        18,  y + 5);
  doc.text('Score',         100,  y + 5);
  doc.text('Classification', 120, y + 5);
  doc.text('Mandate',        160, y + 5);
  y += 7;

  portfolio.forEach(({ company, scorecard }, i) => {
    if (y > 265) { doc.addPage(); y = 20; }

    const rowBg: [number, number, number] = i % 2 === 0 ? white : bg;
    doc.setFillColor(...rowBg);
    doc.rect(14, y, W - 28, 8, 'F');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text(company.name.substring(0, 28), 18, y + 5.5);

    if (scorecard) {
      const sc = scorecard.overallScore;
      const scoreColor: [number, number, number] = sc >= 2.4 ? green : sc >= 1.6 ? amber : [208, 2, 27];
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...scoreColor);
      doc.text(sc.toFixed(2), 100, y + 5.5);
      doc.text(scorecard.classification, 120, y + 5.5);
    } else {
      doc.setTextColor(...gray);
      doc.text('N/A', 100, y + 5.5);
      doc.text('No data', 120, y + 5.5);
    }

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text(company.mandate || '-', 160, y + 5.5);
    y += 8;
  });

  // ── Footer on every page ─────────────────────────────────────────────────
  const pageCount = (doc as any).getNumberOfPages?.() ?? (doc.internal as any).pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...navy);
    doc.rect(0, 287, W, 10, 'F');
    doc.setTextColor(...white);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('INvestScore  |  Sanlam Investments  |  104+ SMME Growth & Empowerment Solution', 14, 293);
    doc.text(`Page ${i} of ${pageCount}  |  CONFIDENTIAL`, W - 50, 293);
  }

  doc.save(`INvestScore_Portfolio_Report_${period.replace(/\s+/g, '_')}.pdf`);
}
