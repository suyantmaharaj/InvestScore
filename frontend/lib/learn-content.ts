export interface LearningLesson {
  id:           string;
  sdgId?:       number;
  category?:    string;
  title:        string;
  tagline:      string;
  duration:     string;
  difficulty:   'Beginner' | 'Intermediate' | 'Advanced';
  icon:         string;
  color:        string;
  what:         string;
  why:          string;
  how:          string[];
  example:      string;
  coachPrompt:  string;
  kpis:         string[];
  videoUrl?:    string;
  videoTitle?:  string;
  quiz:         QuizQuestion[];
}

export interface QuizQuestion {
  id:          string;
  question:    string;
  options:     string[];
  correct:     number;
  explanation: string;
}

export interface LearningCourse {
  id:           string;
  title:        string;
  description:  string;
  icon:         string;
  color:        string;
  lessons:      string[];
  estimatedTime:string;
}

export const LEARNING_LESSONS: LearningLesson[] = [
  {
    id: 'sdg-1', sdgId: 1,
    title: 'No Poverty', tagline: 'How your business fights poverty',
    duration: '4 min read', difficulty: 'Beginner',
    icon: '🏠', color: '#E5243B',
    what: 'SDG 1 measures how much your business contributes to reducing poverty — through jobs, financial inclusion, CSI spending, and the capital you deploy to other SMEs.',
    why: 'South Africa has one of the highest inequality rates in the world. SMEs are the primary engine of job creation in underserved communities. Every rand you deploy and every job you create directly counters poverty at the grassroots level.',
    how: [
      'Increase your CSI spend — even small amounts directed at community programmes count.',
      'For financial services companies: track how many SMEs you fund and the total jobs they support.',
      'Hire from local communities, particularly in areas with high unemployment.',
      'Report your total annual revenue accurately — it signals the economic activity your business generates.',
      'Support local suppliers and SMEs in your supply chain.',
    ],
    example: 'A revenue-based finance provider in Johannesburg funds 12 Black-owned SMEs, which collectively employ 87 people. That capital deployment directly scores on SDG 1.',
    coachPrompt: 'How can I improve my SDG 1 score? My company is in the financial services sector.',
    kpis: ['csi_spend', 'smes_funded', 'capital_deployed_smes', 'jobs_supported_smes', 'total_annual_revenue'],
    videoUrl: 'https://www.youtube.com/embed/oArDpS6dyPs',
    videoTitle: 'Understanding SDG 1 - No Poverty',
    quiz: [
      {
        id: 'sdg1-q1',
        question: 'Which KPI most directly contributes to your SDG 1 score as a financial services company?',
        options: ['Total employees', 'Capital deployed to SMEs', 'Scope 2 emissions', 'B-BBEE level'],
        correct: 1,
        explanation: 'Capital deployed to SMEs drives SDG 1 by funding businesses that create jobs and economic activity in underserved communities.',
      },
      {
        id: 'sdg1-q2',
        question: 'What does CSI stand for?',
        options: ['Corporate Sustainability Index', 'Corporate Social Investment', 'Community Service Initiative', 'Carbon Savings Indicator'],
        correct: 1,
        explanation: 'CSI stands for Corporate Social Investment - the rand amount spent on community development, charity, and social programmes.',
      },
      {
        id: 'sdg1-q3',
        question: 'South Africa has one of the world\'s highest levels of which measure?',
        options: ['Carbon emissions', 'Renewable energy use', 'Income inequality', 'Youth employment'],
        correct: 2,
        explanation: 'South Africa has one of the highest Gini coefficients globally, making SDG 1 and SDG 10 particularly critical in the local context.',
      },
    ],
  },

  {
    id: 'sdg-4', sdgId: 4,
    title: 'Quality Education', tagline: 'Skills development in your business',
    duration: '4 min read', difficulty: 'Beginner',
    icon: '📚', color: '#C5192D',
    what: 'SDG 4 measures your investment in education and skills development — through formal apprenticeships, learnerships, SETA programmes, and internal training.',
    why: 'South Africa has a severe skills gap. Businesses that invest in apprenticeships and learnerships not only improve their own capability but contribute directly to reducing youth unemployment.',
    how: [
      'Register with a SETA (Sector Education and Training Authority) relevant to your sector.',
      'Offer formal learnerships or apprenticeships — even one or two per year counts.',
      'Provide in-house training that leads to recognised NQF qualifications.',
      'Partner with a TVET college for work-integrated learning placements.',
      'Document all training activities — only formal programmes count toward your score.',
    ],
    example: 'A manufacturing company in Durban takes on 8 apprentices per year through a MERSETA learnership programme. These 8 individuals are counted in the apprentices_supported KPI.',
    coachPrompt: 'How do I start a learnership programme to improve my SDG 4 score?',
    kpis: ['apprentices_supported'],
    quiz: [],
  },

  {
    id: 'sdg-5', sdgId: 5,
    title: 'Gender Equality', tagline: 'Building a gender-equitable business',
    duration: '5 min read', difficulty: 'Intermediate',
    icon: '⚧️', color: '#FF3A21',
    what: 'SDG 5 measures female representation at all levels of your business — in the workforce, in management, in ownership, and in who you spend money with.',
    why: 'Women remain significantly underrepresented in South African business, particularly in technical, management, and ownership roles. B-BBEE specifically tracks Black female ownership because this group faces compounded disadvantage.',
    how: [
      'Track your female employee count at every level — staff, management, and board.',
      'Set a target: aim for at least 40% female representation across the business.',
      'Review your procurement spend — actively seek out women-owned suppliers.',
      'If you are restructuring ownership, consider Black female shareholders specifically.',
      'Audit your hiring process for unconscious bias in technical roles.',
    ],
    example: 'Wetility Finance employs 32 women out of 72 staff (44%) — rare in the solar energy sector. This strong gender balance significantly boosts their SDG 5 score.',
    coachPrompt: 'My female employee percentage is low. What practical steps can I take to improve SDG 5?',
    kpis: ['female_employees', 'black_female_ownership_pct', 'procurement_women_owned_pct'],
    videoUrl: 'https://www.youtube.com/embed/OQdS0cCflLM',
    videoTitle: 'Gender Equality in South African Business',
    quiz: [
      {
        id: 'sdg5-q1',
        question: 'What percentage of female employees does Wetility Finance have in their workforce?',
        options: ['21%', '39%', '44%', '68%'],
        correct: 2,
        explanation: '44% of Wetility\'s 72 employees are female, rare in the solar energy sector and a key driver of their strong SDG 5 score.',
      },
      {
        id: 'sdg5-q2',
        question: 'Which procurement metric contributes to SDG 5?',
        options: ['Procurement to Black-owned suppliers', 'Procurement to women-owned suppliers', 'Local supplier count', 'SMEs in supply chain'],
        correct: 1,
        explanation: 'Procurement spend directed to women-owned suppliers directly supports gender economic equality and feeds into your SDG 5 score.',
      },
      {
        id: 'sdg5-q3',
        question: 'Why is Black female ownership tracked separately in B-BBEE?',
        options: [
          'It is required by SARS',
          'Black women face compounded disadvantage and receive additional B-BBEE recognition',
          'It counts double in the scoring engine',
          'It is only tracked for manufacturing companies',
        ],
        correct: 1,
        explanation: 'B-BBEE specifically recognises Black female ownership because Black women face both racial and gender-based economic exclusion.',
      },
    ],
  },

  {
    id: 'sdg-7', sdgId: 7,
    title: 'Clean Energy', tagline: 'Reducing your dependence on Eskom',
    duration: '5 min read', difficulty: 'Intermediate',
    icon: '⚡', color: '#FCC30B',
    what: 'SDG 7 measures your transition toward clean, affordable energy — through solar installation, renewable energy consumption, and reducing your Eskom grid dependence.',
    why: 'South Africa generates over 80% of its electricity from coal. Every kilowatt of solar you produce or consume directly displaces coal generation. For businesses, solar also means energy security against load shedding.',
    how: [
      'Install rooftop solar PV — even a small system starts generating kWh that count.',
      'Track your renewable energy produced and consumed separately.',
      'If you cannot install solar, consider a Power Purchase Agreement (PPA) with a renewable provider.',
      'Monitor your total electricity consumption — reducing grid usage improves your score.',
      'Document your Eskom bills monthly — annual consumption is needed for Scope 2 calculations.',
    ],
    example: 'Nkosi Manufacturing installed a 28,000 kWh solar system at their Gauteng plant. This generates 28 MWh annually and is captured in renewable_energy_produced.',
    coachPrompt: 'I want to install solar at my business to improve my clean energy score. Where should I start?',
    kpis: ['renewable_energy_produced', 'renewable_energy_utilised', 'electricity_consumption', 'scope2_co2e'],
    videoUrl: 'https://www.youtube.com/embed/EhAemz1v7dQ',
    videoTitle: 'Solar Energy for South African SMEs',
    quiz: [
      {
        id: 'sdg7-q1',
        question: 'What is the current South African grid emission factor for Scope 2 calculations?',
        options: ['0.00050 kgCO2e/kWh', '0.00093 kgCO2e/kWh', '0.00145 kgCO2e/kWh', '0.00210 kgCO2e/kWh'],
        correct: 1,
        explanation: 'The South African grid emission factor is approximately 0.00093 kgCO2e per kWh.',
      },
      {
        id: 'sdg7-q2',
        question: 'A company uses 28,000 kWh of electricity per year. What are their Scope 2 emissions?',
        options: ['2.8 tCO2e', '26.0 tCO2e', '28.0 tCO2e', '56.0 tCO2e'],
        correct: 1,
        explanation: '28,000 kWh x 0.00093 = 26.04 tCO2e.',
      },
      {
        id: 'sdg7-q3',
        question: 'What does a Power Purchase Agreement (PPA) allow a business to do?',
        options: [
          'Buy electricity directly from Eskom at a fixed rate',
          'Access renewable energy without owning the solar panels',
          'Sell excess solar power back to the grid',
          'Defer electricity payments by 30 days',
        ],
        correct: 1,
        explanation: 'A PPA lets you buy renewable energy from a provider who installs and owns the solar system.',
      },
    ],
  },

  {
    id: 'sdg-8', sdgId: 8,
    title: 'Decent Work & Economic Growth', tagline: 'Creating good jobs that last',
    duration: '6 min read', difficulty: 'Beginner',
    icon: '💼', color: '#A21942',
    what: 'SDG 8 is the most broadly applicable goal for SMEs. It measures total employment, youth employment, permanency of jobs, management representation, and the revenue your business generates.',
    why: 'South Africa has over 32% official unemployment. SMEs create more than 60% of jobs in the country. The quality of those jobs matters — permanent roles with fair wages contribute far more than short-term contracts.',
    how: [
      'Convert contractors to permanent employees where operationally possible.',
      'Actively hire youth (under 35) — this is a priority metric for Sanlam.',
      'Track all employee categories accurately: staff, management, contractors.',
      'Report total annual revenue on your financial statements.',
      'Grow your supply chain of SME suppliers — they create more jobs downstream.',
    ],
    example: 'PCB Power Transformers employs 71 permanent staff with zero contractors. This strong job stability profile maximises their SDG 8 score even at a moderate headcount.',
    coachPrompt: 'How do I improve my SDG 8 score? I have mostly contract workers.',
    kpis: ['total_employees', 'youth_employees', 'management_employees', 'staff_employees', 'contractor_employees', 'total_annual_revenue'],
    videoUrl: 'https://www.youtube.com/embed/kvBWxIBKkCU',
    videoTitle: 'Creating Quality Employment in South Africa',
    quiz: [
      {
        id: 'sdg8-q1',
        question: 'What percentage of South African unemployment is the official rate approximately?',
        options: ['15%', '22%', '32%', '45%'],
        correct: 2,
        explanation: 'South Africa has over 32% official unemployment, one of the highest globally.',
      },
      {
        id: 'sdg8-q2',
        question: 'Youth is defined as employees aged how many years and under?',
        options: ['25', '30', '35', '40'],
        correct: 2,
        explanation: 'The InvestScore platform defines youth as employees aged 35 and under.',
      },
      {
        id: 'sdg8-q3',
        question: 'Which employment type is MOST valued in terms of job quality for SDG 8?',
        options: ['Part-time contractors', 'Fixed-term contracts', 'Permanent employment', 'Freelance workers'],
        correct: 2,
        explanation: 'Permanent employment provides job stability, benefits, and career development.',
      },
    ],
  },

  {
    id: 'sdg-10', sdgId: 10,
    title: 'Reduced Inequalities', tagline: 'B-BBEE and economic transformation',
    duration: '7 min read', difficulty: 'Intermediate',
    icon: '⚖️', color: '#DD1367',
    what: 'SDG 10 measures your contribution to reducing economic inequalities in South Africa — primarily through B-BBEE compliance, Black ownership, Black board representation, and procurement with Black-owned businesses.',
    why: "The legacy of apartheid created structural economic inequality that persists today. B-BBEE is South Africa's policy framework for correcting this imbalance. Your scorecard treats B-BBEE level as a primary transformation indicator.",
    how: [
      'Get a B-BBEE verification certificate from an accredited SANAS agency — even Level 4 is a starting point.',
      'Review your ownership structure — achieving 25%+ Black ownership qualifies for B-BBEE recognition.',
      'Diversify your board — Black board members must be part of your governance plan.',
      'Audit your supplier spend — channel at least 30% to majority Black-owned suppliers.',
      'Target Level 1 or 2 — these signal genuine transformation commitment to investors.',
    ],
    example: 'Khaya Capital achieved Level 4 B-BBEE with 25% Black ownership through a BEE transaction. Their procurement to Black-owned suppliers is 65%, above the 60% High threshold.',
    coachPrompt: 'How do I improve from B-BBEE Level 4 to Level 2? What are the biggest levers?',
    kpis: ['bbbee_rating', 'black_ownership_pct', 'black_female_ownership_pct', 'black_board_pct', 'procurement_black_owned_pct'],
    videoUrl: 'https://www.youtube.com/embed/4kBQHvzLW10',
    videoTitle: 'B-BBEE and Economic Transformation Explained',
    quiz: [
      {
        id: 'sdg10-q1',
        question: 'What does B-BBEE stand for?',
        options: [
          'Basic Black Business Economic Enablement',
          'Broad-Based Black Economic Empowerment',
          'Board-Based Black Equity Establishment',
          'Business-Based Black Empowerment Enterprise',
        ],
        correct: 1,
        explanation: 'B-BBEE stands for Broad-Based Black Economic Empowerment.',
      },
      {
        id: 'sdg10-q2',
        question: 'What B-BBEE level is considered "Excellent" and scores maximum transformation points?',
        options: ['Level 4', 'Level 3', 'Level 2', 'Level 1'],
        correct: 3,
        explanation: 'Level 1 B-BBEE is the highest achievable level and signals the strongest commitment to transformation.',
      },
      {
        id: 'sdg10-q3',
        question: 'Which B-BBEE element covers how much you spend with Black-owned suppliers?',
        options: ['Ownership', 'Management control', 'Skills development', 'Enterprise and supplier development'],
        correct: 3,
        explanation: 'The Enterprise and Supplier Development element covers procurement spend with Black-owned and Black-empowered suppliers.',
      },
    ],
  },

  {
    id: 'sdg-13', sdgId: 13,
    title: 'Climate Action', tagline: 'Measuring and reducing your carbon footprint',
    duration: '6 min read', difficulty: 'Intermediate',
    icon: '🌍', color: '#3F7E44',
    what: 'SDG 13 measures your carbon emissions and climate action commitments — primarily through Scope 1 (direct) and Scope 2 (electricity) emissions, renewable energy adoption, and recycling rates.',
    why: "South Africa is one of the world's highest per-capita carbon emitters due to its coal-heavy energy mix. The just energy transition requires every business to measure and reduce their footprint. Investors increasingly require this data.",
    how: [
      'Calculate your Scope 2 emissions: multiply your annual kWh by 0.00093 to get tonnes of CO2e.',
      'Scope 1: track fuel consumption in company vehicles and generators. Use SANS 204 emission factors.',
      'Install solar to directly reduce Scope 2 — every kWh of solar is one less kWh from Eskom coal.',
      'Implement a recycling programme and track the percentage of waste recycled.',
      'Set a year-on-year reduction target — even 5% per year demonstrates climate commitment.',
    ],
    example: 'Tshiamo Tech produces 65 tCO2e annually. By installing 12,000 kWh of solar, they displace approximately 11 tonnes of CO2e — reducing their Scope 2 footprint by 17%.',
    coachPrompt: 'How do I calculate my Scope 1 and Scope 2 emissions for the first time?',
    kpis: ['scope1_co2e', 'scope2_co2e', 'recycled_waste_pct', 'renewable_energy_utilised'],
    videoUrl: 'https://www.youtube.com/embed/G4H1N_yXBiA',
    videoTitle: 'Carbon Footprint Basics for South African SMEs',
    quiz: [
      {
        id: 'sdg13-q1',
        question: 'What are Scope 1 emissions?',
        options: [
          'Emissions from your electricity supplier',
          'Direct emissions from sources you own or control',
          'Emissions from your suppliers and customers',
          'Emissions from employee commuting',
        ],
        correct: 1,
        explanation: 'Scope 1 are direct emissions from fuel burned in company vehicles, generators, and on-site equipment.',
      },
      {
        id: 'sdg13-q2',
        question: 'What does a recycling rate of 35% mean?',
        options: [
          '35% of your products are recyclable',
          '35% of your total waste is recycled rather than going to landfill',
          '35% of your suppliers use recycled materials',
          '35% reduction in waste vs last year',
        ],
        correct: 1,
        explanation: 'Recycling rate = total waste recycled divided by total waste generated, multiplied by 100.',
      },
      {
        id: 'sdg13-q3',
        question: 'Which South African energy source produces the most CO2 emissions per kWh?',
        options: ['Natural gas', 'Nuclear', 'Coal (Eskom grid)', 'Hydropower'],
        correct: 2,
        explanation: 'South Africa\'s Eskom grid is coal-heavy, producing approximately 0.93 kgCO2e per kWh.',
      },
    ],
  },

  {
    id: 'kpi-employment',
    category: 'employment',
    title: 'Employment Data', tagline: 'How to collect and report your headcount',
    duration: '5 min read', difficulty: 'Beginner',
    icon: '👥', color: '#00B5ED',
    what: 'Employment KPIs capture who works in your business and in what capacity. They are the most commonly reported impact metrics in the Sanlam 104+ portfolio.',
    why: 'Employment data is the primary lens Sanlam uses to assess impact. Getting this data right matters more than any other section of your submission.',
    how: [
      'Use your HR system or payroll records as the source of truth.',
      'Count employees as of your financial year end date — not a monthly average.',
      'Contractors are counted separately — anyone on a fixed-term or project contract.',
      'B-BBEE population group classifications follow the EE Act: African, Coloured, Indian, White.',
      'Youth is defined as employees aged 35 and under on your reporting date.',
      'Management includes anyone who manages people or holds a senior title.',
    ],
    example: 'PCB Power Transformers reports 71 employees: 60 staff, 11 management, 0 contractors. 67 are Black, 4 are White. 15 are female. This data comes directly from their payroll system.',
    coachPrompt: 'Help me understand how to collect and report my employment data correctly.',
    kpis: ['total_employees', 'youth_employees', 'female_employees', 'black_employees', 'management_employees', 'contractor_employees'],
    videoUrl: 'https://www.youtube.com/embed/3OPbNcm1HuE',
    videoTitle: 'How to Report Employment Data',
    quiz: [
      {
        id: 'empl-q1',
        question: 'When should you count your employees for reporting purposes?',
        options: [
          'Monthly average across the year',
          'As of your financial year end date',
          'At the start of the reporting year',
          'Highest headcount during the year',
        ],
        correct: 1,
        explanation: 'Employment data should reflect your headcount as of your financial year end date.',
      },
      {
        id: 'empl-q2',
        question: 'Under B-BBEE, which groups are classified as "Black"?',
        options: [
          'African South Africans only',
          'African and Coloured South Africans',
          'African, Coloured, and Indian South African citizens',
          'All non-white South Africans regardless of citizenship',
        ],
        correct: 2,
        explanation: 'Per the B-BBEE Act, "Black" is a collective term for African, Coloured, and Indian South African citizens disadvantaged by apartheid-era policies.',
      },
      {
        id: 'empl-q3',
        question: 'Who should NOT be included in your total employee count?',
        options: ['Part-time permanent staff', 'Contractors on fixed-term projects', 'Junior staff members', 'Night shift workers'],
        correct: 1,
        explanation: 'Contractors are tracked separately. Total employees means permanent staff only, including full-time and part-time staff.',
      },
    ],
  },

  {
    id: 'kpi-environmental',
    category: 'environmental',
    title: 'Environmental Metrics', tagline: 'Measuring your environmental footprint',
    duration: '6 min read', difficulty: 'Intermediate',
    icon: '🌱', color: '#00A651',
    what: 'Environmental KPIs measure your energy use, carbon emissions, water consumption, and waste recycling. These feed directly into SDGs 6, 7, 12, 13, 14, and 15.',
    why: 'Environmental reporting is increasingly required by investors and regulators. Starting with basic measurements now positions you ahead of mandatory disclosure requirements coming into South African law.',
    how: [
      'Start with electricity: your Eskom/City Power invoice shows kWh consumed monthly. Sum the year.',
      'Scope 2 CO2e = annual kWh × 0.00093 (South African grid emission factor).',
      'Scope 1: track company vehicle fuel logs. Petrol = 2.31 kgCO2e/litre, diesel = 2.68 kgCO2e/litre.',
      'Water: read your municipal meter at financial year start and end.',
      'Recycling rate: weigh your recycled waste and total waste for a month, then extrapolate.',
      'If you have solar, your inverter app shows production in kWh — record it monthly.',
    ],
    example: 'Ziyanda Agri Co tracks electricity via their meter (22,000 kWh), has 3 vehicles (Scope 1), and runs a waste separation programme achieving 68% recycling. All data comes from existing records.',
    coachPrompt: 'I have never tracked my environmental data before. Where do I start?',
    kpis: ['scope1_co2e', 'scope2_co2e', 'electricity_consumption', 'renewable_energy_produced', 'total_water_consumption', 'recycled_waste_pct'],
    quiz: [],
  },

  {
    id: 'kpi-bbbee',
    category: 'transformation',
    title: 'B-BBEE & Transformation', tagline: 'Understanding your B-BBEE scorecard',
    duration: '8 min read', difficulty: 'Intermediate',
    icon: '🏛️', color: '#6366F1',
    what: "Transformation KPIs capture your B-BBEE status, ownership structure, board composition, and procurement practices. These are the primary inequality metrics in your SDG scorecard.",
    why: "B-BBEE is South Africa's legal framework for economic transformation. Sanlam Investments specifically targets Black-owned enterprises. Your B-BBEE level directly affects your SDG 10 score — the Reduced Inequalities goal.",
    how: [
      'Get certified: engage an accredited SANAS B-BBEE verification agency annually.',
      'Ownership: calculate Black shareholding as a percentage of total equity at par value.',
      'Board: count board members who qualify as Black under the B-BBEE Act.',
      'Procurement: pull your accounts payable and identify which suppliers have B-BBEE certificates.',
      'Level 1 B-BBEE is achievable for companies with 51%+ Black ownership even with a small team.',
      'The DTI B-BBEE Codes of Good Practice (Generic Scorecard) is the governing document.',
    ],
    example: 'Nkosi Manufacturing is 100% HDSA female owned — this automatically qualifies for Level 1 B-BBEE status and scores maximum points on ownership and management control.',
    coachPrompt: 'Explain the five pillars of B-BBEE and which ones I should focus on first.',
    kpis: ['bbbee_rating', 'black_ownership_pct', 'black_female_ownership_pct', 'black_board_pct', 'procurement_black_owned_pct', 'procurement_women_owned_pct'],
    videoUrl: 'https://www.youtube.com/embed/R7sFjAuUMvI',
    videoTitle: 'Getting Your B-BBEE Certificate',
    quiz: [
      {
        id: 'bbbee-q1',
        question: 'Which body accredits B-BBEE verification agencies in South Africa?',
        options: ['SARS', 'SANAS', 'DTI', 'FSCA'],
        correct: 1,
        explanation: 'SANAS accredits B-BBEE verification agencies. Use a SANAS-accredited agency for a valid certificate.',
      },
      {
        id: 'bbbee-q2',
        question: 'How often should a B-BBEE certificate be renewed?',
        options: ['Every 6 months', 'Annually', 'Every 2 years', 'Every 3 years'],
        correct: 1,
        explanation: 'B-BBEE certificates are valid for 12 months and must be renewed annually.',
      },
      {
        id: 'bbbee-q3',
        question: 'An EME (Exempted Micro Enterprise) has annual turnover below what threshold?',
        options: ['R500,000', 'R5 million', 'R10 million', 'R50 million'],
        correct: 2,
        explanation: 'An EME has turnover below R10 million. EMEs with 51%+ Black ownership automatically qualify for Level 1 B-BBEE.',
      },
    ],
  },

  {
    id: 'kpi-community',
    category: 'community',
    title: 'Community & Supply Chain', tagline: 'Measuring your local economic impact',
    duration: '4 min read', difficulty: 'Beginner',
    icon: '🤝', color: '#E8A020',
    what: 'Community KPIs measure your CSI spend, local supplier relationships, and SME integration into your supply chain. These feed into SDGs 1, 8, and 17.',
    why: 'Local supplier networks multiply economic impact — every rand you spend with a local SME supports jobs beyond your own business. Sanlam values this multiplier effect highly.',
    how: [
      'Track CSI spend by saving all receipts for donations, community programmes, and charity contributions.',
      'Ask your suppliers if they are South African registered — this determines local supplier count.',
      'SME suppliers are those with annual turnover under R50 million — ask your suppliers directly.',
      'You can increase your local supplier count by actively replacing international suppliers with local alternatives.',
      'Document your CSI activities with amounts and beneficiary organisations.',
    ],
    example: 'Siyanda Retail Group spends R185,000 per year on CSI (schools and welfare programmes) and works with 24 local suppliers, 18 of which are SMEs. Both are reported in the Community section.',
    coachPrompt: 'How do I increase my local supplier count and CSI spend to improve my score?',
    kpis: ['csi_spend', 'local_suppliers', 'smes_in_supply_chain'],
    quiz: [],
  },
];

export const LEARNING_COURSES: LearningCourse[] = [
  {
    id: 'course-sdg-foundations',
    title: 'SDG Foundations for South African SMEs',
    description: 'Understand what the 17 UN Sustainable Development Goals mean for your business and how Sanlam measures your contribution to each.',
    icon: '🌍',
    color: '#00B5ED',
    estimatedTime: '35 min',
    lessons: ['sdg-1', 'sdg-4', 'sdg-5', 'sdg-7', 'sdg-8', 'sdg-10', 'sdg-13'],
  },
  {
    id: 'course-data-reporting',
    title: 'How to Report Your Impact Data',
    description: 'A practical guide to collecting, calculating, and submitting the KPI data that powers your SDG scorecard.',
    icon: '📊',
    color: '#00A651',
    estimatedTime: '25 min',
    lessons: ['kpi-employment', 'kpi-environmental', 'kpi-bbbee', 'kpi-community'],
  },
];

export const getLessonById         = (id: string)       => LEARNING_LESSONS.find(l => l.id === id);
export const getLessonsBySDG       = (sdgId: number)    => LEARNING_LESSONS.filter(l => l.sdgId === sdgId);
export const getLessonsByCategory  = (category: string) => LEARNING_LESSONS.filter(l => l.category === category);
