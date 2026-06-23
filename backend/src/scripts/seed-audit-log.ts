import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

const EVENTS = [
  // ── Registration approvals / rejections ────────────────────────────────────
  { action: 'registration_approved', actor: 'admin@investscore.co.za', actorRole: 'admin', companyId: 'company_001', companyName: 'Khaya Capital',           detail: 'Approved registration for Sipho Nkosi — Khaya Capital onboarded to the platform.',            timestamp: daysAgo(142) },
  { action: 'registration_approved', actor: 'admin@investscore.co.za', actorRole: 'admin', companyId: 'company_002', companyName: 'Nkosi Manufacturing',       detail: 'Approved registration for Amahle Zulu — Nkosi Manufacturing onboarded.',                       timestamp: daysAgo(138) },
  { action: 'registration_approved', actor: 'admin@investscore.co.za', actorRole: 'admin', companyId: 'company_003', companyName: 'Tshiamo Tech',              detail: 'Approved registration for Thabo Mokoena — Tshiamo Tech onboarded.',                            timestamp: daysAgo(135) },
  { action: 'registration_approved', actor: 'admin@investscore.co.za', actorRole: 'admin', companyId: 'stark-industries-sa', companyName: 'Stark Industries SA', detail: 'Approved registration for Tony Stark-Dlamini — Stark Industries SA onboarded.',             timestamp: daysAgo(120) },
  { action: 'registration_approved', actor: 'admin@investscore.co.za', actorRole: 'admin', companyId: 'wakanda-capital', companyName: 'Wakanda Capital',       detail: "Approved registration for T'Challa Ndlovu — Wakanda Capital onboarded.",                      timestamp: daysAgo(118) },
  { action: 'registration_approved', actor: 'admin@investscore.co.za', actorRole: 'admin', companyId: 'rogers-housing-solutions', companyName: 'Rogers Housing Solutions', detail: 'Approved registration for Steve Rogers — Rogers Housing Solutions onboarded.',          timestamp: daysAgo(115) },
  { action: 'registration_approved', actor: 'admin@investscore.co.za', actorRole: 'admin', companyId: 'company_004', companyName: 'Lungelo Housing',           detail: 'Approved registration for Nokwanda Dube — Lungelo Housing onboarded.',                        timestamp: daysAgo(110) },
  { action: 'registration_approved', actor: 'admin@investscore.co.za', actorRole: 'admin', companyId: 'company_005', companyName: 'Ubuntu Logistics',          detail: 'Approved registration for Mandla Sithole — Ubuntu Logistics onboarded.',                      timestamp: daysAgo(105) },
  { action: 'registration_rejected', actor: 'admin@investscore.co.za', actorRole: 'admin', detail: 'Rejected registration for MVDG Consulting — company revenue exceeds the programme threshold.', timestamp: daysAgo(103) },
  { action: 'registration_approved', actor: 'admin@investscore.co.za', actorRole: 'admin', companyId: 'company_006', companyName: 'Siyanda Retail Group',      detail: 'Approved registration for Refilwe Moagi — Siyanda Retail Group onboarded.',                  timestamp: daysAgo(100) },
  { action: 'registration_approved', actor: 'admin@investscore.co.za', actorRole: 'admin', companyId: 'banner-green-tech', companyName: 'Banner Green Tech',   detail: 'Approved registration for Bruce Banner — Banner Green Tech onboarded.',                      timestamp: daysAgo(98) },
  { action: 'registration_approved', actor: 'admin@investscore.co.za', actorRole: 'admin', companyId: 'maximoff-energy', companyName: 'Maximoff Energy',       detail: 'Approved registration for Wanda Maximoff — Maximoff Energy onboarded.',                      timestamp: daysAgo(95) },
  { action: 'registration_rejected', actor: 'admin@investscore.co.za', actorRole: 'admin', detail: 'Rejected registration for Joubert Trading CC — incomplete application, documents not submitted within timeframe.', timestamp: daysAgo(90) },
  { action: 'registration_approved', actor: 'admin@investscore.co.za', actorRole: 'admin', companyId: 'company_007', companyName: 'Amanzi Water Solutions',    detail: 'Approved registration for Tshepo Letsie — Amanzi Water Solutions onboarded.',                timestamp: daysAgo(88) },
  { action: 'registration_approved', actor: 'admin@investscore.co.za', actorRole: 'admin', companyId: 'danvers-logistics', companyName: 'Danvers Logistics',   detail: 'Approved registration for Carol Danvers — Danvers Logistics onboarded.',                     timestamp: daysAgo(85) },
  { action: 'registration_approved', actor: 'admin@investscore.co.za', actorRole: 'admin', companyId: 'parker-retail-group', companyName: 'Parker Retail Group', detail: 'Approved registration for Peter Parker — Parker Retail Group onboarded.',                  timestamp: daysAgo(82) },
  { action: 'registration_approved', actor: 'admin@investscore.co.za', actorRole: 'admin', companyId: 'company_008', companyName: 'Ziyanda Agri Co',           detail: 'Approved registration for Ziyanda Ntuli — Ziyanda Agri Co onboarded.',                       timestamp: daysAgo(80) },
  { action: 'registration_approved', actor: 'admin@investscore.co.za', actorRole: 'admin', companyId: 'romanoff-associates', companyName: 'Romanoff & Associates', detail: 'Approved registration for Natasha Romanoff — Romanoff & Associates onboarded.',           timestamp: daysAgo(78) },
  { action: 'registration_approved', actor: 'admin@investscore.co.za', actorRole: 'admin', companyId: 'odinson-agri', companyName: 'Odinson Agri',             detail: 'Approved registration for Thor Odinson — Odinson Agri onboarded.',                           timestamp: daysAgo(75) },
  { action: 'registration_approved', actor: 'admin@investscore.co.za', actorRole: 'admin', companyId: 'company_009', companyName: 'Ithemba Digital',           detail: 'Approved registration for Lungelo Dlamini — Ithemba Digital onboarded.',                     timestamp: daysAgo(72) },

  // ── User creation ──────────────────────────────────────────────────────────
  { action: 'user_created', actor: 'admin@investscore.co.za', actorRole: 'admin', detail: 'Created PM account for Lerato Dlamini (pm@investscore.co.za).', timestamp: daysAgo(145) },
  { action: 'user_created', actor: 'admin@investscore.co.za', actorRole: 'admin', companyId: 'company_001', companyName: 'Khaya Capital',      detail: 'Created SME account for Sipho Nkosi linked to Khaya Capital.',        timestamp: daysAgo(142) },
  { action: 'user_created', actor: 'admin@investscore.co.za', actorRole: 'admin', companyId: 'company_002', companyName: 'Nkosi Manufacturing', detail: 'Created SME account for Amahle Zulu linked to Nkosi Manufacturing.',   timestamp: daysAgo(138) },
  { action: 'user_created', actor: 'admin@investscore.co.za', actorRole: 'admin', companyId: 'company_003', companyName: 'Tshiamo Tech',        detail: 'Created SME account for Thabo Mokoena linked to Tshiamo Tech.',       timestamp: daysAgo(135) },

  // ── Company profile updates ────────────────────────────────────────────────
  { action: 'company_profile_updated', actor: 'admin@investscore.co.za', actorRole: 'admin', companyId: 'company_001', companyName: 'Khaya Capital',          detail: 'Updated company profile: sector classification changed to Financial Services.',             timestamp: daysAgo(130) },
  { action: 'company_profile_updated', actor: 'pm@investscore.co.za',    actorRole: 'pm',    companyId: 'stark-industries-sa', companyName: 'Stark Industries SA', detail: 'Updated company profile: Target IRR set to 22%. Mandate confirmed as Growth.',        timestamp: daysAgo(119) },
  { action: 'company_profile_updated', actor: 'admin@investscore.co.za', actorRole: 'admin', companyId: 'company_004', companyName: 'Lungelo Housing',         detail: 'Created company profile for Lungelo Housing (Housing sector, Empowerment mandate).',    timestamp: daysAgo(110) },
  { action: 'company_profile_updated', actor: 'admin@investscore.co.za', actorRole: 'admin', companyId: 'company_005', companyName: 'Ubuntu Logistics',        detail: 'Created company profile for Ubuntu Logistics (Logistics sector, Growth mandate).',      timestamp: daysAgo(105) },
  { action: 'company_profile_updated', actor: 'pm@investscore.co.za',    actorRole: 'pm',    companyId: 'wakanda-capital', companyName: 'Wakanda Capital',      detail: "Updated Wakanda Capital profile: B-BBEE level revised to Level 1 following re-audit.", timestamp: daysAgo(60) },
  { action: 'company_profile_updated', actor: 'admin@investscore.co.za', actorRole: 'admin', companyId: 'company_006', companyName: 'Siyanda Retail Group',    detail: 'Updated spokesperson contact details for Siyanda Retail Group.',                       timestamp: daysAgo(45) },
  { action: 'company_profile_updated', actor: 'pm@investscore.co.za',    actorRole: 'pm',    companyId: 'banner-green-tech', companyName: 'Banner Green Tech',  detail: 'Updated Banner Green Tech: Target IRR revised from 14% to 16% following Q1 review.',    timestamp: daysAgo(30) },

  // ── Submission received + scored ───────────────────────────────────────────
  { action: 'submission_received', actor: 'sme1@investscore.co.za', actorRole: 'sme', companyId: 'company_001', companyName: 'Khaya Capital',          detail: 'Q1 2026 SDG data submission received from Khaya Capital.',                         timestamp: daysAgo(90) },
  { action: 'submission_scored',   actor: 'system',                  actorRole: 'system', companyId: 'company_001', companyName: 'Khaya Capital',      detail: 'Q1 2026 submission scored — overall SDG score: 72/100.',                           timestamp: daysAgo(90) },
  { action: 'submission_received', actor: 'sme2@investscore.co.za', actorRole: 'sme', companyId: 'company_002', companyName: 'Nkosi Manufacturing',    detail: 'Q1 2026 SDG data submission received from Nkosi Manufacturing.',                  timestamp: daysAgo(88) },
  { action: 'submission_scored',   actor: 'system',                  actorRole: 'system', companyId: 'company_002', companyName: 'Nkosi Manufacturing', detail: 'Q1 2026 submission scored — overall SDG score: 68/100.',                          timestamp: daysAgo(88) },
  { action: 'submission_received', actor: 'sme.stark@investscore.co.za', actorRole: 'sme', companyId: 'stark-industries-sa', companyName: 'Stark Industries SA', detail: 'Q3 2025 SDG data submission received from Stark Industries SA.',        timestamp: daysAgo(180) },
  { action: 'submission_scored',   actor: 'system', actorRole: 'system', companyId: 'stark-industries-sa', companyName: 'Stark Industries SA',         detail: 'Q3 2025 submission scored — overall SDG score: 81/100. Classified: High Performer.', timestamp: daysAgo(180) },
  { action: 'submission_received', actor: 'sme3@investscore.co.za', actorRole: 'sme', companyId: 'company_003', companyName: 'Tshiamo Tech',            detail: 'Q1 2026 SDG data submission received from Tshiamo Tech.',                        timestamp: daysAgo(85) },
  { action: 'submission_scored',   actor: 'system', actorRole: 'system', companyId: 'company_003', companyName: 'Tshiamo Tech',                         detail: 'Q1 2026 submission scored — overall SDG score: 74/100.',                          timestamp: daysAgo(85) },
  { action: 'submission_received', actor: 'sme.wakanda@investscore.co.za', actorRole: 'sme', companyId: 'wakanda-capital', companyName: 'Wakanda Capital', detail: 'Q1 2026 SDG data submission received from Wakanda Capital.',                  timestamp: daysAgo(82) },
  { action: 'submission_scored',   actor: 'system', actorRole: 'system', companyId: 'wakanda-capital', companyName: 'Wakanda Capital',                  detail: 'Q1 2026 submission scored — overall SDG score: 88/100. Classified: High Performer.', timestamp: daysAgo(82) },
  { action: 'submission_received', actor: 'sme.banner@investscore.co.za', actorRole: 'sme', companyId: 'banner-green-tech', companyName: 'Banner Green Tech', detail: 'Q4 2025 SDG data submission received from Banner Green Tech.',           timestamp: daysAgo(75) },
  { action: 'submission_scored',   actor: 'system', actorRole: 'system', companyId: 'banner-green-tech', companyName: 'Banner Green Tech',              detail: 'Q4 2025 submission scored — overall SDG score: 77/100.',                          timestamp: daysAgo(75) },
  { action: 'submission_received', actor: 'sme.rogers@investscore.co.za', actorRole: 'sme', companyId: 'rogers-housing-solutions', companyName: 'Rogers Housing Solutions', detail: 'Q1 2026 SDG data submission received from Rogers Housing Solutions.', timestamp: daysAgo(60) },
  { action: 'submission_scored',   actor: 'system', actorRole: 'system', companyId: 'rogers-housing-solutions', companyName: 'Rogers Housing Solutions', detail: 'Q1 2026 submission scored — overall SDG score: 71/100.',                        timestamp: daysAgo(60) },
  { action: 'submission_received', actor: 'sme.danvers@investscore.co.za', actorRole: 'sme', companyId: 'danvers-logistics', companyName: 'Danvers Logistics', detail: 'Q1 2026 SDG data submission received from Danvers Logistics.',          timestamp: daysAgo(55) },
  { action: 'submission_scored',   actor: 'system', actorRole: 'system', companyId: 'danvers-logistics', companyName: 'Danvers Logistics',               detail: 'Q1 2026 submission scored — overall SDG score: 64/100.',                          timestamp: daysAgo(55) },
  { action: 'submission_received', actor: 'sme.parker@investscore.co.za', actorRole: 'sme', companyId: 'parker-retail-group', companyName: 'Parker Retail Group', detail: 'Q1 2026 SDG data submission received from Parker Retail Group.',       timestamp: daysAgo(50) },
  { action: 'submission_scored',   actor: 'system', actorRole: 'system', companyId: 'parker-retail-group', companyName: 'Parker Retail Group',           detail: 'Q1 2026 submission scored — overall SDG score: 59/100.',                          timestamp: daysAgo(50) },

  // ── Scoring config ─────────────────────────────────────────────────────────
  { action: 'scoring_config_updated', actor: 'admin@investscore.co.za', actorRole: 'admin', detail: 'Updated KPI thresholds for Environmental group — renewable energy utilisation target raised to reflect Q1 2026 portfolio benchmarks.', timestamp: daysAgo(95) },
  { action: 'scoring_config_updated', actor: 'admin@investscore.co.za', actorRole: 'admin', detail: 'Adjusted sector weights for Manufacturing: Employment weighting increased from 0.25 to 0.30 following methodology review.', timestamp: daysAgo(60) },
  { action: 'scoring_config_updated', actor: 'admin@investscore.co.za', actorRole: 'admin', detail: 'Updated B-BBEE threshold: Level 3 now requires minimum 55% black board representation.', timestamp: daysAgo(30) },
  { action: 'scoring_config_reset',   actor: 'admin@investscore.co.za', actorRole: 'admin', detail: 'Scoring configuration reset to platform defaults for ICT sector — custom thresholds reverted after pilot review.', timestamp: daysAgo(15) },

  // ── Targets ────────────────────────────────────────────────────────────────
  { action: 'target_set', actor: 'pm@investscore.co.za', actorRole: 'pm', companyId: 'company_001', companyName: 'Khaya Capital',             detail: 'Set Q2 2026 targets for Khaya Capital: Employment +10%, B-BBEE Level 3.',           timestamp: daysAgo(85) },
  { action: 'target_set', actor: 'pm@investscore.co.za', actorRole: 'pm', companyId: 'stark-industries-sa', companyName: 'Stark Industries SA', detail: 'Set 2026 annual targets: 15% renewable energy increase, scope 1 emissions down 8%.', timestamp: daysAgo(80) },
  { action: 'target_set', actor: 'pm@investscore.co.za', actorRole: 'pm', companyId: 'company_003', companyName: 'Tshiamo Tech',              detail: 'Set Q2 2026 targets: Youth employment to reach 45% of workforce.',                  timestamp: daysAgo(75) },
  { action: 'target_set', actor: 'pm@investscore.co.za', actorRole: 'pm', companyId: 'wakanda-capital', companyName: 'Wakanda Capital',        detail: 'Set 2026 targets: Black female ownership to reach 30%, CSI spend +20%.',           timestamp: daysAgo(70) },
  { action: 'target_set', actor: 'pm@investscore.co.za', actorRole: 'pm', companyId: 'company_007', companyName: 'Amanzi Water Solutions',    detail: 'Set targets: Water loss reduction to 12%, 500 new water connections by Q3 2026.',   timestamp: daysAgo(65) },
  { action: 'target_deleted', actor: 'pm@investscore.co.za', actorRole: 'pm', companyId: 'company_002', companyName: 'Nkosi Manufacturing',   detail: 'Deleted Q1 2026 interim targets for Nkosi Manufacturing — superseded by annual plan.', timestamp: daysAgo(62) },
  { action: 'target_set', actor: 'pm@investscore.co.za', actorRole: 'pm', companyId: 'company_002', companyName: 'Nkosi Manufacturing',       detail: 'Set revised 2026 targets: Local raw material sourcing to 80%, apprentices +5.',      timestamp: daysAgo(60) },
  { action: 'target_set', actor: 'pm@investscore.co.za', actorRole: 'pm', companyId: 'banner-green-tech', companyName: 'Banner Green Tech',   detail: 'Set 2026 renewable energy targets: 100% self-sufficient by Q4 2026.',               timestamp: daysAgo(40) },

  // ── AI context ─────────────────────────────────────────────────────────────
  { action: 'ai_context_updated', actor: 'admin@investscore.co.za', actorRole: 'admin', detail: 'Updated AI coaching context: Added Twin Transition guidance for ICT sector companies.', timestamp: daysAgo(88) },
  { action: 'ai_context_updated', actor: 'admin@investscore.co.za', actorRole: 'admin', detail: 'Updated AI coaching context: Revised water conservation recommendations for Infrastructure and Housing sectors.', timestamp: daysAgo(45) },
  { action: 'ai_context_updated', actor: 'admin@investscore.co.za', actorRole: 'admin', detail: 'Updated AI coaching context: Added Q2 2026 SDG Taxonomy alignment notes and new ESG reporting templates.', timestamp: daysAgo(10) },

  // ── Notifications ──────────────────────────────────────────────────────────
  { action: 'notification_sent', actor: 'system', actorRole: 'system', companyId: 'parker-retail-group', companyName: 'Parker Retail Group',  detail: 'Risk alert sent to PM: Parker Retail Group SDG score dropped below 60 — at-risk classification.', timestamp: daysAgo(48) },
  { action: 'notification_sent', actor: 'system', actorRole: 'system', companyId: 'company_005', companyName: 'Ubuntu Logistics',            detail: 'Submission reminder sent to Ubuntu Logistics — 30 days overdue for Q1 2026 data.',    timestamp: daysAgo(35) },
  { action: 'notification_sent', actor: 'system', actorRole: 'system', companyId: 'company_008', companyName: 'Ziyanda Agri Co',             detail: 'Submission reminder sent to Ziyanda Agri Co — Q1 2026 submission still pending.',     timestamp: daysAgo(28) },
  { action: 'notification_sent', actor: 'system', actorRole: 'system', companyId: 'company_009', companyName: 'Ithemba Digital',             detail: 'Submission reminder sent to Ithemba Digital — Q1 2026 submission still pending.',     timestamp: daysAgo(21) },
  { action: 'notification_sent', actor: 'pm@investscore.co.za', actorRole: 'pm', companyId: 'company_001', companyName: 'Khaya Capital',     detail: 'Classification change notification sent: Khaya Capital upgraded to High Performer.', timestamp: daysAgo(89) },
  { action: 'notification_sent', actor: 'system', actorRole: 'system', companyId: 'danvers-logistics', companyName: 'Danvers Logistics',     detail: 'Watchlist alert triggered: Danvers Logistics added to at-risk watchlist by PM.',      timestamp: daysAgo(20) },

  // ── Watchlist ──────────────────────────────────────────────────────────────
  { action: 'watchlist_updated', actor: 'pm@investscore.co.za', actorRole: 'pm', companyId: 'parker-retail-group', companyName: 'Parker Retail Group', detail: 'Added Parker Retail Group to watchlist — SDG score below threshold, monitoring required.', timestamp: daysAgo(49) },
  { action: 'watchlist_updated', actor: 'pm@investscore.co.za', actorRole: 'pm', companyId: 'danvers-logistics', companyName: 'Danvers Logistics',     detail: 'Added Danvers Logistics to watchlist — employment KPIs trending below target.',       timestamp: daysAgo(21) },
  { action: 'watchlist_updated', actor: 'pm@investscore.co.za', actorRole: 'pm', companyId: 'company_002', companyName: 'Nkosi Manufacturing',          detail: 'Removed Nkosi Manufacturing from watchlist — Q1 targets met, score recovered.',       timestamp: daysAgo(12) },

  // ── Engagement ─────────────────────────────────────────────────────────────
  { action: 'engagement_logged', actor: 'pm@investscore.co.za', actorRole: 'pm', companyId: 'company_001', companyName: 'Khaya Capital',        detail: 'Site visit completed — reviewed Q4 2025 environmental data with Sipho Nkosi.',          timestamp: daysAgo(100) },
  { action: 'engagement_logged', actor: 'pm@investscore.co.za', actorRole: 'pm', companyId: 'stark-industries-sa', companyName: 'Stark Industries SA', detail: 'Board presentation delivered — SDG scorecard reviewed with executive committee.', timestamp: daysAgo(78) },
  { action: 'engagement_logged', actor: 'pm@investscore.co.za', actorRole: 'pm', companyId: 'company_003', companyName: 'Tshiamo Tech',          detail: 'Workshop: digital reporting tools training conducted for Tshiamo Tech data team.',       timestamp: daysAgo(55) },
  { action: 'engagement_logged', actor: 'pm@investscore.co.za', actorRole: 'pm', companyId: 'wakanda-capital', companyName: 'Wakanda Capital',    detail: 'Quarterly review call — discussed B-BBEE improvement plan and ownership restructuring.',  timestamp: daysAgo(42) },
  { action: 'engagement_logged', actor: 'pm@investscore.co.za', actorRole: 'pm', companyId: 'parker-retail-group', companyName: 'Parker Retail Group', detail: 'Remediation meeting — agreed action plan to address score decline over next 2 quarters.', timestamp: daysAgo(47) },
  { action: 'engagement_logged', actor: 'pm@investscore.co.za', actorRole: 'pm', companyId: 'company_007', companyName: 'Amanzi Water Solutions', detail: 'Field visit to Limpopo water treatment site — verified infrastructure impact metrics.',  timestamp: daysAgo(25) },
  { action: 'engagement_logged', actor: 'pm@investscore.co.za', actorRole: 'pm', companyId: 'company_004', companyName: 'Lungelo Housing',        detail: 'Site inspection: 120 affordable units verified on-site in Soweto development.',         timestamp: daysAgo(18) },
  { action: 'engagement_logged', actor: 'pm@investscore.co.za', actorRole: 'pm', companyId: 'maximoff-energy', companyName: 'Maximoff Energy',    detail: 'Portfolio review: Maximoff Energy solar rollout on track — 6MW installed to date.',      timestamp: daysAgo(8) },
];

async function main() {
  console.log('\nSeeding audit log events...\n');

  const batch = db.batch();
  for (const e of EVENTS) {
    batch.set(db.collection('auditLog').doc(), e);
  }
  await batch.commit();

  console.log(`✅ Added ${EVENTS.length} audit log events.\n`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
