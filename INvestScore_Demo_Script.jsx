import { useState, useEffect } from "react";

const BRAND = {
  navy:  "#015376",
  teal:  "#00B5ED",
  green: "#00A651",
  amber: "#E8A020",
  red:   "#D0021B",
};

const CREDENTIALS = [
  { role: "Admin",    email: "admin@investscore.co.za",       password: "Admin@2026!",    note: "Platform oversight" },
  { role: "PM",       email: "pm@investscore.co.za",          password: "PM@2026!",       note: "Lerato's view" },
  { role: "SME Star", email: "sme.wakanda@investscore.co.za", password: "Wakanda@2026!",  note: "Wakanda Capital – High Impact" },
  { role: "SME Low",  email: "sme.banner@investscore.co.za",  password: "Banner@2026!",   note: "Banner Green Tech – Low Impact" },
  { role: "SME Mid",  email: "sme.stark@investscore.co.za",   password: "Stark@2026!",    note: "Stark Industries – improving" },
];

const CHECKLIST = [
  "Platform is deployed and accessible at the demo URL",
  "Splash screen plays on hard refresh",
  "All 18 companies seeded and visible in PM portal",
  "Wakanda Capital shows High Impact (2.72)",
  "Banner Green Tech shows Low Impact and Priority quadrant",
  "Chase chatbot responds – test one message before the room",
  "Official UN SDG icons rendering on scorecard",
  "B-BBEE pending badge shows on Banner Green Tech scorecard",
  "PM Dashboard shows 3 attention alerts",
  "Score history shows trend chart for Stark Industries",
  "Dark mode and light mode both work",
  "Onboarding tour set to always show (useState(true))",
  "Printed credentials card ready for judges to take away",
];

const SCRIPT = [
  {
    act: "Act 1",
    title: "The Problem (90 seconds)",
    tagline: "Sanlam already has the methodology. What they don't have is the product.",
    steps: [
      {
        label: "Open with the gap",
        screen: "No screen – face the judges",
        dialogue: "Sanlam Investments manages a portfolio of 104 South African SMEs. They have a proprietary SDG scoring methodology, built on UN indicators and MSCI data. But right now, that methodology lives in spreadsheets. Portfolio managers spend their quarterly cycle collecting, cleaning, and compiling data. SMEs get no feedback. And no one can see whether the portfolio is actually improving. We built the digital layer that makes this methodology actionable.",
        timing: "0:00 – 0:45",
      },
      {
        label: "Show the splash screen",
        screen: "Hard refresh the browser",
        dialogue: "INvestScore. A platform for the 104+ SMME Growth and Empowerment Solution – built for Sanlam Investments.",
        timing: "0:45 – 1:00",
        note: "Let the splash screen play in full – 6 seconds. Do not skip it.",
      },
      {
        label: "Introduce the two user journeys",
        screen: "Login page",
        dialogue: "Two users. Lerato, the Portfolio Manager – she needs to make investment decisions. And Sipho, the SME owner – he needs to understand his scores and improve. We built for both.",
        timing: "1:00 – 1:30",
      },
    ],
  },
  {
    act: "Act 2",
    title: "The PM Experience (3 minutes)",
    tagline: "Show Lerato making an investment decision in under 2 minutes.",
    steps: [
      {
        label: "Log in as PM",
        screen: "pm@investscore.co.za / PM@2026!",
        dialogue: "Lerato logs in on a Monday morning. First thing she sees is the portfolio dashboard – 18 companies, 850 employees, 87% Black workforce. Three companies need her attention this week.",
        timing: "1:30 – 2:00",
        note: "Point to the Attention Alerts card – Banner Green Tech and Parker Retail should be in Priority.",
      },
      {
        label: "Show the Attention Score quadrant",
        screen: "Navigate to Attention Score (/attention)",
        dialogue: "This is the investment decision view. X axis is SDG impact score. Y axis is how much PM attention the company needs – calculated from score velocity, submission consistency, target attainment, and data completeness. No IRR required. Everything is calculated from the data we already have.",
        timing: "2:00 – 2:45",
        note: "Hover over Banner Green Tech dot – tooltip shows Low SDG, high attention. Hover over Wakanda Capital – On Track.",
      },
      {
        label: "Open Wakanda Capital – the star",
        screen: "Click Wakanda Capital in On Track quadrant",
        dialogue: "Wakanda Capital. 100% Black-owned, Level 1 B-BBEE, High Impact across two consecutive periods. This is the company Lerato showcases to Sanlam leadership. SDG score 2.72 and still improving.",
        timing: "2:45 – 3:15",
        note: "Show the Company Detail Overview tab – employment data leads. Show the SDG scorecard tab with the UN icons.",
      },
      {
        label: "Show the heat map",
        screen: "Navigate to Portfolio Overview / Heat Map",
        dialogue: "The heat map gives Lerato the full picture – 18 companies, all 17 SDGs, colour-coded by performance. She can see in seconds where the portfolio has systematic gaps.",
        timing: "3:15 – 3:45",
        note: "Briefly show the heat map – green concentration on SDG 8 and 10, red on SDG 7 and 13 for most companies.",
      },
      {
        label: "Set a target for Banner Green Tech",
        screen: "Open Banner Green Tech – Company Detail – Targets panel",
        dialogue: "Lerato sets a target. SDG 6 – Water. She wants Banner to reach Medium Impact by next quarter. One click. The target is now visible to Banner on their scorecard. The two-sided relationship is live.",
        timing: "3:45 – 4:30",
        note: "Click Medium next to SDG 6. Click Save targets. Banner's SME portal will now show this target.",
      },
    ],
  },
  {
    act: "Act 3",
    title: "The SME Experience (2 minutes)",
    tagline: "Show Sipho understanding his scores and taking action.",
    steps: [
      {
        label: "Log in as Banner Green Tech",
        screen: "sme.banner@investscore.co.za / Banner@2026!",
        dialogue: "Now we switch to Sipho – the owner of Banner Green Tech. He logs in for the first time.",
        timing: "4:30 – 4:45",
        note: "The onboarding tour should fire. Step through 2–3 steps then close it to keep time.",
      },
      {
        label: "Show the dashboard with PM target",
        screen: "SME Dashboard",
        dialogue: "His dashboard shows his SDG score, the target his Portfolio Manager just set, and a message telling him his PM last viewed his profile. The relationship is visible. It's not a one-way reporting form.",
        timing: "4:45 – 5:15",
        note: "Point to the PM Activity Signal card and the targets progress card.",
      },
      {
        label: "Show the scorecard with the target badge",
        screen: "Navigate to Scorecard",
        dialogue: "On his scorecard, SDG 6 now shows Target: Medium Impact. And next to his Low-scoring goals, real stories from peer companies – anonymised – showing exactly how someone in a similar sector improved the same goal.",
        timing: "5:15 – 5:45",
        note: "Point to the target line on SDG 6. Point to the peer story card on a Low-scoring SDG.",
      },
      {
        label: "Show Chase",
        screen: "Navigate to AI Coach (Chase)",
        dialogue: "This is Chase – named after the Sanlam cheetah mascot. A fully contextual AI coach. Chase knows Banner's scores, their submitted data, their sector, and their PM targets. Watch this.",
        timing: "5:45 – 6:15",
        note: "Type: 'Why is my SDG 6 score Low and what should I do about it?' Let Chase respond. Point out that it references the actual company data.",
      },
      {
        label: "Upload a document to Chase",
        screen: "Click the paperclip icon in Chase",
        dialogue: "Chase can read documents too. Upload a PDF – an electricity bill, a B-BBEE certificate, a financial statement – and Chase extracts the relevant KPIs and offers to pre-fill the submission form.",
        timing: "6:15 – 6:30",
        note: "Upload any PDF. Chase should offer to extract KPIs. Point to the pre-fill button.",
      },
    ],
  },
  {
    act: "Act 4",
    title: "The Admin and Governance Layer (1 minute)",
    tagline: "Show that the platform is governed, auditable, and manageable.",
    steps: [
      {
        label: "Log in as Admin",
        screen: "admin@investscore.co.za / Admin@2026!",
        dialogue: "The Admin portal gives Koko full control – user management, company management, B-BBEE certificate verification, scoring configuration, and a complete audit log. Every action on the platform is timestamped and traceable.",
        timing: "6:30 – 7:00",
        note: "Show the Admin Dashboard – B-BBEE pending queue if any. Show the Audit Log page briefly.",
      },
      {
        label: "Show the scoring config editor",
        screen: "Navigate to Scoring Config (/scoring)",
        dialogue: "Thabang's team can adjust KPI thresholds through the UI – no redeploy needed. Every change requires a written reason and is logged to the audit trail. This is the CRISA and UNPRI-ready governance layer.",
        timing: "7:00 – 7:30",
        note: "Open the Thresholds tab. Point to the change reason field. Do not actually save anything.",
      },
    ],
  },
  {
    act: "Act 5",
    title: "The Close (1.5 minutes)",
    tagline: "Land the three things that differentiate this from everything else.",
    steps: [
      {
        label: "The three differentiators",
        screen: "No screen – face the judges",
        dialogue: "Three things make INvestScore different from any other ESG platform in South Africa. First: it is built specifically for the 104+ methodology – not adapted from a generic ESG tool. Second: it serves both sides of the relationship – the PM making investment decisions and the SME improving their business. Third: Chase. An AI coach that knows each company's data, speaks plain English to a first-generation business owner in Soweto, and can read their documents. No other impact investment platform in SA has this.",
        timing: "7:30 – 8:30",
      },
      {
        label: "The invitation",
        screen: "Show login page or dashboard",
        dialogue: "The platform is live. You each have a credentials card. Log in as Wakanda Capital to see what High Impact looks like. Log in as Banner Green Tech to see what Low Impact feels like – and what the platform does to help. Log in as the PM to see how this changes the investment decision.",
        timing: "8:30 – 9:00",
        note: "Hand out the credentials cards.",
      },
      {
        label: "Handle questions",
        screen: "Keep dashboard visible",
        dialogue: "We're happy to demo any specific feature. The platform has a full submission flow, learning centre, PDF exports, comparison tools, and an employment dashboard built directly from the 104+ Impact Report structure.",
        timing: "9:00 – 10:00",
      },
    ],
  },
];

const JUDGE_QUESTIONS = [
  {
    q: "How is the SDG score calculated?",
    a: "Using Sanlam's own KPI thresholds – Low, Medium, High for each indicator. The sector weights are configurable by the Admin team through the UI, no code changes needed. The algorithm is immutable – only the thresholds can be adjusted, and every change is logged.",
  },
  {
    q: "What happens to the data after a company submits?",
    a: "It is stored in Firebase Firestore, processed through the scoring engine, and immediately reflected on both the SME scorecard and the PM portfolio views. The audit log records every submission and score calculation with a timestamp.",
  },
  {
    q: "How does Chase know about the company's data?",
    a: "Chase receives the company profile, current SDG scores, submitted KPI values, PM-set targets, and score history in every message. It also reads the Admin-configured coaching rules and sector context. Every response is grounded in that company's actual data.",
  },
  {
    q: "Is this production-ready?",
    a: "The architecture is production-ready – Firebase for auth and storage, Node/Express backend, Next.js frontend, Claude API for AI features. What would need to happen before production is a security audit, penetration testing, and a formal data processing agreement with Sanlam under POPIA.",
  },
  {
    q: "How does the B-BBEE verification work?",
    a: "The SME uploads their certificate and selects their claimed level. This goes to the Admin queue as a pending item. Admin opens the PDF, verifies it is from a SANAS-accredited agency and is current, then approves or rejects with a reason. Approval writes the verified level to the company record and triggers score recalculation.",
  },
  {
    q: "What about mobile – most SMEs are on their phones?",
    a: "The dashboard, scorecard, and coach are all responsive. The submission form is desktop-first in this build – that is the next major development priority for production.",
  },
];

export default function DemoScript() {
  const [activeAct,  setActiveAct]  = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [view,       setView]       = useState("script"); // script | checklist | credentials | questions
  const [checked,    setChecked]    = useState({});

  const act  = SCRIPT[activeAct];
  const step = act?.steps[activeStep];

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        if (activeStep < act.steps.length - 1) {
          setActiveStep(s => s + 1);
        } else if (activeAct < SCRIPT.length - 1) {
          setActiveAct(a => a + 1);
          setActiveStep(0);
        }
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        if (activeStep > 0) {
          setActiveStep(s => s - 1);
        } else if (activeAct > 0) {
          setActiveAct(a => a - 1);
          setActiveStep(SCRIPT[activeAct - 1].steps.length - 1);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeAct, activeStep, act]);

  const totalSteps   = SCRIPT.reduce((s, a) => s + a.steps.length, 0);
  const currentStep  = SCRIPT.slice(0, activeAct).reduce((s, a) => s + a.steps.length, 0) + activeStep + 1;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "#0a0f1a", minHeight: "100vh", color: "white", display: "flex", flexDirection: "column" }}>

      {/* Top nav */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "#015376" }}>
        <div style={{ fontWeight: 700, fontSize: "16px", color: BRAND.teal }}>INvestScore</div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Grand Finale Demo – 26 June 2026</div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "4px" }}>
          {["script", "checklist", "credentials", "questions"].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding: "6px 12px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 500,
                background: view === v ? BRAND.teal : "rgba(255,255,255,0.08)",
                color: view === v ? "white" : "rgba(255,255,255,0.6)" }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* SCRIPT VIEW */}
      {view === "script" && (
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Left: act list */}
          <div style={{ width: "220px", flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.08)", padding: "16px 12px", overflowY: "auto" }}>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginBottom: "12px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {currentStep}/{totalSteps} steps
            </div>
            {SCRIPT.map((a, ai) => (
              <div key={ai}>
                <button onClick={() => { setActiveAct(ai); setActiveStep(0); }}
                  style={{ width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: "8px", border: "none", cursor: "pointer", marginBottom: "2px",
                    background: ai === activeAct ? "rgba(0,181,237,0.15)" : "transparent",
                    color: ai === activeAct ? BRAND.teal : "rgba(255,255,255,0.5)" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700 }}>{a.act}</div>
                  <div style={{ fontSize: "11px", marginTop: "2px" }}>{a.title}</div>
                </button>
                {ai === activeAct && a.steps.map((s, si) => (
                  <button key={si} onClick={() => setActiveStep(si)}
                    style={{ width: "100%", textAlign: "left", padding: "5px 10px 5px 20px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "11px",
                      background: si === activeStep ? "rgba(255,255,255,0.06)" : "transparent",
                      color: si === activeStep ? "white" : "rgba(255,255,255,0.35)" }}>
                    {si + 1}. {s.label}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Centre: current step */}
          <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: BRAND.teal, color: "white" }}>
                {act?.act}
              </span>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>{act?.title}</span>
            </div>

            <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px", color: "white" }}>
              {step?.label}
            </h2>
            <div style={{ fontSize: "12px", color: BRAND.amber, marginBottom: "20px", fontFamily: "monospace" }}>
              {step?.timing}
            </div>

            {/* Screen instruction */}
            <div style={{ background: "#1a2332", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px", borderLeft: `3px solid ${BRAND.teal}` }}>
              <div style={{ fontSize: "11px", color: BRAND.teal, fontWeight: 600, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Screen
              </div>
              <div style={{ fontSize: "14px", color: "white", fontFamily: "monospace" }}>
                {step?.screen}
              </div>
            </div>

            {/* Dialogue */}
            <div style={{ background: "#1a2332", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px", borderLeft: `3px solid ${BRAND.green}` }}>
              <div style={{ fontSize: "11px", color: BRAND.green, fontWeight: 600, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Dialogue
              </div>
              <div style={{ fontSize: "15px", color: "rgba(255,255,255,0.9)", lineHeight: "1.7" }}>
                "{step?.dialogue}"
              </div>
            </div>

            {/* Note */}
            {step?.note && (
              <div style={{ background: "rgba(232,160,32,0.1)", borderRadius: "12px", padding: "12px 16px", borderLeft: `3px solid ${BRAND.amber}` }}>
                <div style={{ fontSize: "11px", color: BRAND.amber, fontWeight: 600, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Note
                </div>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>
                  {step.note}
                </div>
              </div>
            )}

            {/* Nav buttons */}
            <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
              <button
                onClick={() => {
                  if (activeStep > 0) setActiveStep(s => s - 1);
                  else if (activeAct > 0) { setActiveAct(a => a - 1); setActiveStep(SCRIPT[activeAct - 1].steps.length - 1); }
                }}
                style={{ padding: "10px 20px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "13px" }}>
                &larr; Previous
              </button>
              <button
                onClick={() => {
                  if (activeStep < act.steps.length - 1) setActiveStep(s => s + 1);
                  else if (activeAct < SCRIPT.length - 1) { setActiveAct(a => a + 1); setActiveStep(0); }
                }}
                style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: BRAND.teal, color: "white", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
                Next &rarr;
              </button>
              <div style={{ marginLeft: "auto", fontSize: "12px", color: "rgba(255,255,255,0.3)", alignSelf: "center" }}>
                Use ← → arrow keys
              </div>
            </div>
          </div>

          {/* Right: act tagline + progress */}
          <div style={{ width: "220px", flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.08)", padding: "20px 16px" }}>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Act goal
            </div>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: "1.6", fontStyle: "italic" }}>
              "{act?.tagline}"
            </p>
            <div style={{ marginTop: "20px" }}>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Progress
              </div>
              <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(currentStep / totalSteps) * 100}%`, background: BRAND.teal, transition: "width 300ms" }} />
              </div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "6px" }}>
                {currentStep} of {totalSteps} steps
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHECKLIST VIEW */}
      {view === "checklist" && (
        <div style={{ flex: 1, padding: "32px", maxWidth: "700px", margin: "0 auto", width: "100%" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Pre-Demo Checklist</h2>
          <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: "24px", fontSize: "13px" }}>Complete all items before walking into the room.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {CHECKLIST.map((item, i) => (
              <button key={i} onClick={() => setChecked(c => ({ ...c, [i]: !c[i] }))}
                style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", background: checked[i] ? "rgba(0,166,81,0.1)" : "rgba(255,255,255,0.03)", cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "6px", border: `2px solid ${checked[i] ? BRAND.green : "rgba(255,255,255,0.2)"}`, background: checked[i] ? BRAND.green : "transparent", flexShrink: 0, marginTop: "1px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {checked[i] && <span style={{ color: "white", fontSize: "12px", fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontSize: "14px", color: checked[i] ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.85)", textDecoration: checked[i] ? "line-through" : "none" }}>
                  {item}
                </span>
              </button>
            ))}
          </div>
          <div style={{ marginTop: "20px", padding: "14px 16px", borderRadius: "12px", background: "rgba(0,181,237,0.08)", border: "1px solid rgba(0,181,237,0.2)" }}>
            <span style={{ fontSize: "13px", color: BRAND.teal }}>
              {Object.values(checked).filter(Boolean).length} of {CHECKLIST.length} checked
            </span>
          </div>
        </div>
      )}

      {/* CREDENTIALS VIEW */}
      {view === "credentials" && (
        <div style={{ flex: 1, padding: "32px", maxWidth: "700px", margin: "0 auto", width: "100%" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Demo Credentials</h2>
          <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: "24px", fontSize: "13px" }}>Share with judges after the pitch.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {CREDENTIALS.map((c, i) => (
              <div key={i} style={{ padding: "16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: BRAND.teal, color: "white" }}>{c.role}</span>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{c.note}</span>
                </div>
                <div style={{ fontFamily: "monospace", fontSize: "14px", color: "rgba(255,255,255,0.85)", marginBottom: "4px" }}>{c.email}</div>
                <div style={{ fontFamily: "monospace", fontSize: "14px", color: BRAND.teal }}>{c.password}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "20px", padding: "14px 16px", borderRadius: "12px", background: "rgba(232,160,32,0.08)", border: "1px solid rgba(232,160,32,0.2)" }}>
            <div style={{ fontSize: "12px", color: BRAND.amber, marginBottom: "4px", fontWeight: 600 }}>Registration passcode for new users</div>
            <div style={{ fontFamily: "monospace", fontSize: "18px", color: "white", letterSpacing: "0.1em" }}>INVEST2026</div>
          </div>
        </div>
      )}

      {/* JUDGE QUESTIONS VIEW */}
      {view === "questions" && (
        <div style={{ flex: 1, padding: "32px", maxWidth: "800px", margin: "0 auto", width: "100%", overflowY: "auto" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Likely Judge Questions</h2>
          <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: "24px", fontSize: "13px" }}>Prepare these answers before you walk in.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {JUDGE_QUESTIONS.map((qa, i) => (
              <div key={i} style={{ padding: "16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: BRAND.teal, marginBottom: "8px" }}>
                  Q: {qa.q}
                </div>
                <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: "1.7" }}>
                  A: {qa.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
