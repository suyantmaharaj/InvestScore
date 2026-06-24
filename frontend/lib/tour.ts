export interface TourStep {
  id:          string;
  route:       string;
  selector:    string;
  title:       string;
  description: string;
  position:    'top' | 'bottom' | 'left' | 'right' | 'center';
  portal?:     'sme' | 'pm' | 'admin';
  waitMs?:     number;
}

export const TOUR_STEPS: TourStep[] = [
  // LOGIN
  {
    id:          'login-form',
    route:       '/login',
    selector:    '[data-tour="login-form"]',
    title:       'Two user types, one platform',
    description: 'Portfolio Managers and SME owners each have their own portal. The login detects your role and routes you to the right experience.',
    position:    'right',
    portal:      'sme',
  },

  // REGISTER
  {
    id:          'register-form',
    route:       '/register',
    selector:    '[data-tour="register-form"]',
    title:       'Joining the portfolio',
    description: 'New SMEs apply through a passcode-gated form. A Portfolio Manager reviews the request in the admin panel, approves it, and the company appears in the portfolio immediately.',
    position:    'right',
    portal:      'sme',
    waitMs:      400,
  },

  // SME: DASHBOARD
  {
    id:          'sme-hero-score',
    route:       '/dashboard',
    selector:    '[data-tour="sme-hero-score"]',
    title:       'Your SDG Impact score',
    description: 'Sipho sees his overall SDG score the moment he logs in, calculated from his submitted data using the scoring methodology. Every field he fills in affects this number.',
    position:    'bottom',
    portal:      'sme',
    waitMs:      700,
  },
  {
    id:          'pm-activity-signal',
    route:       '/dashboard',
    selector:    '[data-tour="pm-activity-signal"]',
    title:       'Your Portfolio Manager is watching',
    description: 'When Lerato views his profile, sets his targets, or logs an interaction, Sipho sees it here. The relationship is visible, not a one-way reporting form.',
    position:    'bottom',
    portal:      'sme',
  },
  {
    id:          'sme-targets-card',
    route:       '/dashboard',
    selector:    '[data-tour="sme-targets-card"]',
    title:       'Targets set by your Portfolio Manager',
    description: 'Lerato set SDG 6 (Clean Water) to Medium Impact for next quarter. Sipho sees this target on his dashboard and knows exactly what to focus on.',
    position:    'bottom',
    portal:      'sme',
  },

  // SME: SCORECARD
  {
    id:          'scorecard-bbbee-badge',
    route:       '/scorecard',
    selector:    '[data-tour="scorecard-bbbee-badge"]',
    title:       'B-BBEE awaiting verification',
    description: 'Sipho uploaded his B-BBEE certificate and claimed Level 2. Sanlam Investments will verify it before it reflects on the scorecard. Amber badge until approved.',
    position:    'bottom',
    portal:      'sme',
    waitMs:      500,
  },
  {
    id:          'scorecard-sdg-grid',
    route:       '/scorecard',
    selector:    '[data-tour="scorecard-sdg-grid"]',
    title:       'All 17 SDGs with official UN icons',
    description: 'Every goal shows its score, classification (Low / Medium / High), and the sector average. Click any goal to see the full breakdown of contributing KPIs.',
    position:    'top',
    portal:      'sme',
  },

  // SME: SUBMISSION
  {
    id:          'submission-prefill-banner',
    route:       '/submit',
    selector:    '[data-tour="submission-prefill-banner"]',
    title:       'Pre-filled from last quarter',
    description: 'The form opens with last period values pre-filled. Sipho only updates what changed: total employees, new solar panels, improved B-BBEE level. Submission time drops from 30 minutes to 5.',
    position:    'bottom',
    portal:      'sme',
    waitMs:      600,
  },
  {
    id:          'submission-progress',
    route:       '/submit',
    selector:    '[data-tour="submission-progress"]',
    title:       '5-step guided form',
    description: 'Employment, Environmental, Transformation, Community. Each step has help chips explaining why Sanlam collects each field and how to calculate it.',
    position:    'bottom',
    portal:      'sme',
  },

  // SME: CHASE
  {
    id:          'chase-input',
    route:       '/coach',
    selector:    '[data-tour="chase-input"]',
    title:       'Chase, your SDG coach',
    description: 'Chase is the Sanlam cheetah mascot. Ask him anything about your scores. He knows your submitted data, your sector, your PM targets, and your score history.',
    position:    'top',
    portal:      'sme',
    waitMs:      500,
  },
  {
    id:          'chase-upload',
    route:       '/coach',
    selector:    '[data-tour="chase-upload"]',
    title:       'Upload any document',
    description: 'Chase reads PDFs, Word docs, Excel files, and images. Upload a B-BBEE certificate, an electricity bill, or a financial statement and Chase extracts the relevant KPIs.',
    position:    'top',
    portal:      'sme',
  },

  // SME: SCORE HISTORY
  {
    id:          'history-chart',
    route:       '/history',
    selector:    '[data-tour="history-chart"]',
    title:       'Your score journey',
    description: 'Every submission period plotted on a line chart. The classification zones (Low / Medium / High) are shaded behind the line so you can see your score climbing into the green zone.',
    position:    'top',
    portal:      'sme',
    waitMs:      600,
  },
  {
    id:          'history-milestones',
    route:       '/history',
    selector:    '[data-tour="history-milestones"]',
    title:       'Milestones',
    description: 'Every time a company crosses a classification boundary, Low to Medium or Medium to High, it is recorded as a milestone. When this happens on the dashboard, a confetti celebration fires.',
    position:    'top',
    portal:      'sme',
  },

  // SME: LEARNING
  {
    id:          'learning-courses',
    route:       '/learning',
    selector:    '[data-tour="learning-courses"]',
    title:       'SDG Learning Centre',
    description: 'Bite-sized courses and lessons on every SDG. Chase-linked recommendations surface when a score is Low. Completing a course earns a badge on the company profile.',
    position:    'bottom',
    portal:      'sme',
    waitMs:      600,
  },

  // PM: DASHBOARD
  {
    id:          'pm-hero-stats',
    route:       '/pm-dashboard',
    selector:    '[data-tour="pm-hero-stats"]',
    title:       'Portfolio at a glance',
    description: 'Lerato sees the entire portfolio in 4 numbers: companies, employees, average SDG score, and how many need her attention this week. Every card links to the relevant deep-dive view.',
    position:    'bottom',
    portal:      'pm',
    waitMs:      700,
  },
  {
    id:          'pm-attention-alerts',
    route:       '/pm-dashboard',
    selector:    '[data-tour="pm-attention-alerts"]',
    title:       'Companies needing attention',
    description: 'The top Priority and Watch companies surface automatically, calculated from score velocity, submission consistency, target attainment, and data completeness. No manual flagging needed.',
    position:    'top',
    portal:      'pm',
  },

  // PM: ATTENTION QUADRANT
  {
    id:          'attention-quadrant',
    route:       '/attention',
    selector:    '[data-tour="attention-quadrant"]',
    title:       'The investment decision view',
    description: 'X axis: SDG impact score. Y axis: how much PM attention this company needs. Priority companies are Low SDG and disengaged. On Track companies are High SDG and consistent.',
    position:    'top',
    portal:      'pm',
    waitMs:      600,
  },

  // PM: HEAT MAP
  {
    id:          'heatmap-grid',
    route:       '/heatmap',
    selector:    '[data-tour="heatmap-grid"]',
    title:       'Portfolio overview',
    description: 'Every company with its SDG score, classification, B-BBEE level, and submission status. Filter by impact, mandate, or B-BBEE level. Lerato can see in seconds which companies need attention.',
    position:    'top',
    portal:      'pm',
    waitMs:      500,
  },

  // PM: EMPLOYMENT
  {
    id:          'employment-hero',
    route:       '/employment',
    selector:    '[data-tour="employment-hero"]',
    title:       'Portfolio employment data',
    description: 'The aggregate transformation picture: total employees, % Black, % female, % youth. This is what Thabang Selota uses to produce the annual impact report, built from the 104+ Impact Report structure.',
    position:    'bottom',
    portal:      'pm',
    waitMs:      500,
  },

  // PM: COMPANY DETAIL
  {
    id:          'company-detail-overview',
    route:       '/company/company_001',
    selector:    '[data-tour="company-detail-overview"]',
    title:       'Khaya Capital company profile',
    description: 'Each company gets a full profile card showing its overall SDG score, classification trend, B-BBEE level, and sector. Employment and transformation are the primary metrics for this mandate.',
    position:    'right',
    portal:      'pm',
    waitMs:      700,
  },
  {
    id:          'company-targets-panel',
    route:       '/company/company_001',
    selector:    '[data-tour="company-targets-panel"]',
    title:       'Setting PM targets',
    description: 'Lerato selects a classification target per SDG. The SME sees this on their scorecard immediately. The two-sided relationship is live and targets feed into the Attention Score calculation.',
    position:    'left',
    portal:      'pm',
  },
  {
    id:          'engagement-log',
    route:       '/company/company_001',
    selector:    '[data-tour="engagement-log"]',
    title:       'Engagement log',
    description: 'Lerato logs every call, email, site visit, and submission review. Commitments from the SME are tracked as checklist items and she can mark them complete after the fact.',
    position:    'top',
    portal:      'pm',
  },

  // PM: SCORE DETAIL DRILL-DOWN
  {
    id:          'score-detail-tab',
    route:       '/company/company_001',
    selector:    '[data-tour="score-detail-tab"]',
    title:       'Score Detail tab',
    description: "Opens a per-SDG drill-down: raw submitted KPI values, the exact calculation formula, and a Claude-powered investment insight for each goal. Everything Lerato needs for a defensible investment memo.",
    position:    'bottom',
    portal:      'pm',
    waitMs:      600,
  },
  {
    id:          'score-detail-sdg-selector',
    route:       '/company/company_001?tab=score',
    selector:    '[data-tour="score-detail-sdg-selector"]',
    title:       'SDG goal selector',
    description: "All 17 SDGs listed with their current score. Click any goal to load its full KPI breakdown — which indicators were reported and how each compares to Sanlam's Low / Medium / High thresholds.",
    position:    'right',
    portal:      'pm',
    waitMs:      900,
  },
  {
    id:          'score-detail-panels',
    route:       '/company/company_001?tab=score',
    selector:    '[data-tour="score-detail-panels"]',
    title:       'Raw Data, Calculation, and AI Insight',
    description: "Three views of the same goal: submitted values with visual threshold bars, the exact weighted score formula, and a Claude-generated investment insight grounded in the company's actual data.",
    position:    'top',
    portal:      'pm',
    waitMs:      700,
  },

  // ADMIN: DASHBOARD
  {
    id:          'admin-bbbee-queue',
    route:       '/admin/dashboard',
    selector:    '[data-tour="admin-bbbee-queue"]',
    title:       'B-BBEE verification queue',
    description: 'When an SME uploads their certificate, it lands here. Koko opens the PDF, verifies it is from a SANAS-accredited agency, then approves or rejects with a reason.',
    position:    'top',
    portal:      'admin',
    waitMs:      600,
  },

  // ADMIN: SCORING CONFIG
  {
    id:          'scoring-thresholds',
    route:       '/admin/scoring',
    selector:    '[data-tour="scoring-thresholds"]',
    title:       'Scoring methodology editor',
    description: 'The team adjusts KPI thresholds through the UI with no redeploy needed. Every change requires a written reason and is logged to the audit trail.',
    position:    'top',
    portal:      'admin',
    waitMs:      500,
  },

  // ADMIN: AUDIT LOG
  {
    id:          'audit-log-entries',
    route:       '/audit',
    selector:    '[data-tour="audit-log-entries"]',
    title:       'Complete audit trail',
    description: 'Every meaningful action (score calculated, target set, B-BBEE verified, config changed) is timestamped and searchable. This is the CRISA and UNPRI-ready governance layer.',
    position:    'top',
    portal:      'admin',
    waitMs:      500,
  },

  // END
  {
    id:          'tour-end',
    route:       '/login',
    selector:    '[data-tour="login-form"]',
    title:       'Tour complete',
    description: 'PM: pm@investscore.co.za / PM@2026!  |  SME: sme1@investscore.co.za / SME@2026!  |  Admin: admin@investscore.co.za / Admin@2026!',
    position:    'right',
    portal:      'sme',
    waitMs:      500,
  },
];

export const TOTAL_TOUR_STEPS = TOUR_STEPS.length;

// Step range constants for each portal tour
export const SME_TOUR_START   = 2;   // sme-hero-score
export const SME_TOUR_END     = 13;  // learning-courses
export const PM_TOUR_START    = 14;  // pm-hero-stats
export const PM_TOUR_END      = 24;  // score-detail-panels
export const ADMIN_TOUR_START = 25;  // admin-bbbee-queue
export const ADMIN_TOUR_END   = 27;  // audit-log-entries

// Credentials for each portal tour
export const TOUR_CREDENTIALS = {
  sme:   { email: 'sme1@investscore.co.za', password: 'SME@2026!'   },
  pm:    { email: 'pm@investscore.co.za',   password: 'PM@2026!'    },
  admin: { email: 'admin@investscore.co.za', password: 'Admin@2026!' },
} as const;
