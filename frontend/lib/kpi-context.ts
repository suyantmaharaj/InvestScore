export interface KPIContext {
  id:           string;
  whySanlam:    string;
  howToCollect: string;
  typicalRange: string;
  example:      string;
}

export const KPI_CONTEXT_MAP: Record<string, KPIContext> = {

  total_employees: {
    id: 'total_employees',
    whySanlam:    'Employment creation is the primary impact metric for the 104+ portfolio. Sanlam measures this to demonstrate that the capital deployed is translating into real jobs in South Africa.',
    howToCollect: 'Your payroll system or HR records are the source of truth. Count permanent and part-time staff as of your financial year end date. Do not include contractors here - they have their own field.',
    typicalRange: 'Portfolio companies range from 3 to 108 employees. Most early-stage Empowerment mandate companies have 10–30 staff.',
    example:      'A manufacturing company in the portfolio employs 71 people - all permanent, in production and management roles.',
  },

  youth_employees: {
    id: 'youth_employees',
    whySanlam:    'South Africa has over 32% youth unemployment. Sanlam specifically tracks youth employment (under 35) as a priority transformation metric across all 104+ mandates.',
    howToCollect: 'From your payroll records, filter for employees born after your year end date minus 35 years. Most HR systems can generate this report in minutes.',
    typicalRange: 'Some portfolio companies report 70%+ youth workforces - particularly in tech and solar sectors. A typical range is 30–50%.',
    example:      'A clean energy company in the portfolio has 52 of their 72 staff under the age of 35 - over 70% youth employment.',
  },

  female_employees: {
    id: 'female_employees',
    whySanlam:    'Gender equity is a core SDG 5 metric and a B-BBEE consideration. Sanlam uses this to track transformation in sectors that have historically been male-dominated.',
    howToCollect: 'From your HR records or employment equity report (required annually under the Employment Equity Act). If you submit EE reports to the DoL, this data is already collected.',
    typicalRange: 'Portfolio companies range from 15% to 68% female. The portfolio average is 39%.',
    example:      'A digital mortgage company has 17 of their 25 staff as women - 68% female, particularly strong in financial advisory and customer roles.',
  },

  management_employees: {
    id: 'management_employees',
    whySanlam:    'The share of employees in management signals leadership depth and transformation in governance. Sanlam uses this to assess whether growth is creating career pathways, not just entry-level jobs.',
    howToCollect: 'Count anyone who manages people or holds a senior title (manager, director, head of, VP, C-suite). Use your organogram or employment equity report (occupational level: management and senior management).',
    typicalRange: '15–30% of staff in management is typical. Portfolio average is 28% in management roles.',
    example:      'A solar company has 29 of their 72 employees in management roles - a deliberately flat structure to support rapid scale-up.',
  },

  contractor_employees: {
    id: 'contractor_employees',
    whySanlam:    'Sanlam prefers permanent employment as it creates more sustainable economic impact. A high contractor ratio may indicate a gap in the permanent employment score. Tracking this separately lets Sanlam support your transition plan.',
    howToCollect: 'Count anyone on a fixed-term, project-based, or labour broker contract who works primarily for your business. Do not include once-off service providers.',
    typicalRange: 'Best-performing companies have 0 contractors. Portfolio average is 6%. High contractor ratios are common in solar installation and construction.',
    example:      'A solar company uses 10 contractors for installation work - they are actively converting these to permanent roles as volume grows.',
  },

  scope1_co2e: {
    id: 'scope1_co2e',
    whySanlam:    'Scope 1 emissions measure the direct carbon footprint of your operations. This feeds into SDG 13 (Climate Action) and helps Sanlam track the environmental impact of the portfolio.',
    howToCollect: 'Track fuel used in company vehicles and generators. Petrol: multiply litres by 2.31. Diesel: multiply litres by 2.68. Divide by 1000 to get tonnes of CO2e. Your fuel receipts or fleet manager can provide monthly totals.',
    typicalRange: 'Office-based companies: under 20 tCO2e. Manufacturing and logistics: 100–700 tCO2e.',
    example:      'A logistics company with 5 vehicles using 8,000 litres of diesel per year produces approximately 21.4 tCO2e in Scope 1 emissions.',
  },

  scope2_co2e: {
    id: 'scope2_co2e',
    whySanlam:    'Scope 2 is your electricity footprint - one of the biggest levers for South African businesses given the coal-heavy Eskom grid. Reducing this directly improves your SDG 7 and 13 scores.',
    howToCollect: 'Find your total annual kWh on your Eskom or municipal electricity bills. Multiply by 0.00093 to get tCO2e. Example: 50,000 kWh × 0.00093 = 46.5 tCO2e.',
    typicalRange: 'Small offices: 5–20 tCO2e. Medium businesses: 20–100 tCO2e. Manufacturing: 100–500 tCO2e.',
    example:      'A fintech company using 22,000 kWh per year has Scope 2 emissions of approximately 20.5 tCO2e.',
  },

  electricity_consumption: {
    id: 'electricity_consumption',
    whySanlam:    'Your raw electricity consumption helps Sanlam assess energy efficiency and renewable transition potential across the portfolio.',
    howToCollect: 'Sum your monthly kWh figures from your electricity bills for the financial year. Your Eskom or City Power account shows monthly usage.',
    typicalRange: 'Small office: 3,000–15,000 kWh. Medium business: 15,000–50,000 kWh. Manufacturing: 50,000–200,000 kWh.',
    example:      'A 25-person digital company uses approximately 4,200 kWh per year - equivalent to a large household.',
  },

  renewable_energy_produced: {
    id: 'renewable_energy_produced',
    whySanlam:    'Renewable energy production is a primary SDG 7 metric and a climate action lever. It directly reduces your Scope 2 emissions and demonstrates environmental leadership.',
    howToCollect: "If you have solar panels, your inverter's monitoring app (SolarEdge, Fronius, GoodWe) shows monthly and annual kWh produced. If you don't have solar yet, enter 0 - and consider the Learning Centre for guidance on getting started.",
    typicalRange: 'Zero for most early-stage companies. Solar-equipped businesses: 5,000–50,000 kWh per year depending on system size.',
    example:      'A food manufacturing company with a rooftop solar installation produces 28,000 kWh per year - offsetting about 26 tCO2e annually.',
  },

  recycled_waste_pct: {
    id: 'recycled_waste_pct',
    whySanlam:    'Waste recycling feeds into SDG 12 (Responsible Consumption) and SDG 13. It is an easy win for most businesses and signals environmental management maturity.',
    howToCollect: 'Weigh your recycling bin and general waste bin weekly for one month. Recycling rate = (recycled kg ÷ total kg) × 100. Or ask your waste removal company for a split report.',
    typicalRange: 'No programme: 0–5%. Basic separation: 10–30%. Strong programme: 50–70%.',
    example:      'An agri-processing company with a formal separation-at-source programme achieves 68% recycling rate across paper, plastic, and organic waste.',
  },

  total_water_consumption: {
    id: 'total_water_consumption',
    whySanlam:    "Water consumption tracks your impact on SDG 6 (Clean Water) and SDG 14. In South Africa's water-stressed context, efficient water use is increasingly material.",
    howToCollect: 'Read your municipal water meter at the start and end of your financial year. Alternatively, sum monthly water bills which show kilolitres (kL) consumed.',
    typicalRange: 'Office: 50–300 kL. Manufacturing: 500–5,000 kL. Agriculture-adjacent: 1,000–20,000 kL.',
    example:      'A 25-person fintech company uses approximately 120 kL per year - primarily from bathrooms and kitchen use.',
  },

  bbbee_rating: {
    id: 'bbbee_rating',
    whySanlam:    "B-BBEE level is a primary transformation metric and a core criterion for the Empowerment mandate. Sanlam uses this to track the portfolio's contribution to South Africa's economic transformation agenda.",
    howToCollect: "You need a B-BBEE certificate from a SANAS-accredited verification agency. If you don't have one, an EME (under R10m turnover) with 51%+ Black ownership qualifies for Level 1 automatically - contact a SANAS agency to confirm.",
    typicalRange: 'Portfolio companies: Level 1 (2 companies), Level 2 (4 companies), Level 4 (1 company).',
    example:      'A transformer manufacturer with 100% Black female ownership holds Level 1 B-BBEE - the highest rating achievable.',
  },

  black_ownership_pct: {
    id: 'black_ownership_pct',
    whySanlam:    'Black ownership percentage is the single most important transformation indicator for the 104+ portfolio. It directly determines B-BBEE ownership points and mandate eligibility.',
    howToCollect: "Calculate as: (value of shares held by Black shareholders ÷ total equity) × 100. Your shareholders' register has this information. Black means African, Coloured, and Indian South African citizens.",
    typicalRange: 'Empowerment mandate companies must have 51%+. Growth mandate companies range from 25% to 100%.',
    example:      'A fintech company achieved 25% Black ownership through a structured BEE transaction with SAAD Investment Holdings.',
  },

  black_female_ownership_pct: {
    id: 'black_female_ownership_pct',
    whySanlam:    'Black female ownership receives additional recognition under B-BBEE because Black women face compounded economic disadvantage. Sanlam specifically tracks this as a priority transformation metric.',
    howToCollect: "From your shareholders' register, identify shares held by Black women specifically. Express as a percentage of total equity.",
    typicalRange: '0% for many early-stage companies. Portfolio leaders: 30–100%.',
    example:      'A transformer manufacturer is 100% owned by a Black woman - the maximum possible score on this metric.',
  },

  black_board_pct: {
    id: 'black_board_pct',
    whySanlam:    'Board diversity tracks management control - a key B-BBEE pillar. Sanlam uses this to ensure transformation reaches decision-making levels, not just the workforce.',
    howToCollect: 'Count your board members (directors). Calculate what percentage are Black (African, Coloured, or Indian South African). Your Companies and Intellectual Property Commission (CIPC) registration has board details.',
    typicalRange: '40–100% Black board representation across the portfolio.',
    example:      'A solar company has 4 board members, 3 of whom are Black - 80% Black board representation.',
  },

  procurement_black_owned_pct: {
    id: 'procurement_black_owned_pct',
    whySanlam:    'Procurement transformation tracks how your spending multiplies impact beyond your own business. Buying from Black-owned suppliers creates economic value throughout the supply chain.',
    howToCollect: 'Pull your accounts payable for the year. For each supplier, check if they have a B-BBEE certificate showing majority Black ownership. Most suppliers will send their certificate on request.',
    typicalRange: '40–85% across the portfolio. High-performing companies channel over 80% of procurement to Black-owned businesses.',
    example:      'A digital mortgage company channels over 80% of procurement to Black-owned SMEs - developers, brokers, and service providers.',
  },

  procurement_women_owned_pct: {
    id: 'procurement_women_owned_pct',
    whySanlam:    'Procurement to women-owned businesses tracks gender equity beyond your own hiring - it extends transformation into your supply chain.',
    howToCollect: "From your accounts payable, identify suppliers that are majority women-owned. Ask suppliers directly or check their B-BBEE certificate for ownership details.",
    typicalRange: '20–62% across the portfolio.',
    example:      'An agri-processing company directs 62% of procurement spend to women-owned suppliers - primarily local female farmers and cooperatives.',
  },

  total_annual_revenue: {
    id: 'total_annual_revenue',
    whySanlam:    'Revenue confirms which mandate tier your business falls into (Growth or Empowerment). It also signals economic activity and growth trajectory to Sanlam as an investor.',
    howToCollect: 'From your annual financial statements - the top line income figure before any deductions. Your accountant or bookkeeper will have this.',
    typicalRange: 'Empowerment mandate: under R50m. Growth mandate: R50m–R200m.',
    example:      'A food manufacturing company projects R128m in revenue for FY2024 - comfortably within the Growth mandate range.',
  },

  csi_spend: {
    id: 'csi_spend',
    whySanlam:    'CSI spend feeds directly into SDG 1 (No Poverty) and signals your commitment to community development beyond your own business. Even small amounts demonstrate intent.',
    howToCollect: 'Sum all payments made to schools, charities, welfare organisations, and community programmes during the year. Keep receipts and payment records. If you donate goods, estimate the value.',
    typicalRange: 'R0 for many early-stage companies. Established companies: R20,000–R185,000 per year.',
    example:      'A food company supports local schools, charities, and animal welfare in the Eastern Cape - spending R185,000 in CSI last year.',
  },

  local_suppliers: {
    id: 'local_suppliers',
    whySanlam:    'Local supplier count tracks your contribution to the broader South African economy. Every local supplier is a business that supports more jobs and keeps money circulating in the community.',
    howToCollect: 'Count unique suppliers that are registered South African businesses (not international suppliers). Your accounts payable list is the starting point.',
    typicalRange: '5–24 local suppliers across the portfolio.',
    example:      'A food manufacturer works with 24 local suppliers - local grain producers, packaging companies, and transport providers.',
  },

  smes_in_supply_chain: {
    id: 'smes_in_supply_chain',
    whySanlam:    'SME supplier count specifically measures enterprise development - supporting smaller businesses in your supply chain multiplies the impact of your own growth.',
    howToCollect: 'From your local supplier list, identify which ones have annual turnover under R50m (i.e. are themselves SMEs). A quick conversation with your key suppliers will confirm this.',
    typicalRange: '4–18 SME suppliers across the portfolio.',
    example:      'A food manufacturer has 18 SMEs in their supply chain - from small local farms to independent packaging SMEs.',
  },

  smes_funded: {
    id: 'smes_funded',
    whySanlam:    'For financial services companies, the number of SMEs you fund directly is your primary SDG 1 impact metric. This is how your capital deployment translates into economic activity.',
    howToCollect: 'Count unique business clients that received funding from you during the financial year. Your loan management system or client records will have this.',
    typicalRange: '5–20 SMEs funded per year for early-stage RBF providers.',
    example:      'A revenue-based finance company funded 14 Black-owned SMEs last year, supporting 92 downstream jobs.',
  },

  capital_deployed_smes: {
    id: 'capital_deployed_smes',
    whySanlam:    'Total capital deployed measures the scale of your financial inclusion impact. It directly feeds into SDG 1 and SDG 8 for financial services companies.',
    howToCollect: 'Sum all loan disbursements, revenue-based finance advances, or investment capital deployed to SME clients during the financial year.',
    typicalRange: 'R1m–R20m per year for early-stage alternative finance providers.',
    example:      'A revenue-based finance provider deployed R3.8m to Black-owned SMEs last year, enabling growth without equity dilution.',
  },
};

export const getKPIContext = (kpiId: string): KPIContext | null =>
  KPI_CONTEXT_MAP[kpiId] || null;
