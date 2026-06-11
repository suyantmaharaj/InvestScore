export interface PortfolioStory {
  id:          string;
  sdgId:       number;
  sdgIds:      number[];
  sector:      string;
  title:       string;
  company:     string;
  location:    string;
  challenge:   string;
  action:      string;
  outcome:     string;
  timeframe:   string;
  metric:      string;
  metricLabel: string;
  color:       string;
}

export const PORTFOLIO_STORIES: PortfolioStory[] = [
  {
    id:          'story-gender-manufacturing',
    sdgId:       5,
    sdgIds:      [5, 8, 10],
    sector:      'Manufacturing',
    title:       'How a transformer manufacturer built gender equity in a male-dominated sector',
    company:     'A Black woman-owned electrical equipment manufacturer, Gauteng',
    location:    'Gauteng',
    challenge:   'Operating in industrial manufacturing - a historically male sector - with only 15% female staff and no structured plan to change it.',
    action:      'Introduced dedicated recruitment pathways for women in technical and quality control roles. Partnered with a local TVET college to create a female-focused apprenticeship intake.',
    outcome:     'Female workforce grew to 21% within two financial years, with 3 women in management roles. B-BBEE score improved alongside the gender metrics.',
    timeframe:   'Two financial years',
    metric:      '21%',
    metricLabel: 'female workforce',
    color:       '#FF3A21',
  },
  {
    id:          'story-youth-cleanenergy',
    sdgId:       8,
    sdgIds:      [7, 8, 13],
    sector:      'Clean Energy',
    title:       "Building a youth-led workforce in South Africa's solar sector",
    company:     'A Johannesburg-based solar PV and battery storage company',
    location:    'Johannesburg, Gauteng',
    challenge:   'Rapid scale-up required a large workforce quickly. The solar sector had no established talent pipeline for young South Africans.',
    action:      'Hired directly from Soweto and Johannesburg South communities. Developed internal training programmes - no prior solar experience required. Created a contractor-to-permanent conversion pathway.',
    outcome:     'Over 70% of the 72-person workforce is under 35. 10 contractors converted to permanent roles in a single year. Youth employment score moved to High Impact.',
    timeframe:   'Eighteen months',
    metric:      '70%+',
    metricLabel: 'youth employees',
    color:       '#A21942',
  },
  {
    id:          'story-bbbee-finance',
    sdgId:       10,
    sdgIds:      [1, 5, 9, 10],
    sector:      'Financial Services',
    title:       'How a fintech SME achieved a B-BBEE transformation milestone',
    company:     'A revenue-based finance provider, Johannesburg',
    location:    'Johannesburg, Gauteng',
    challenge:   'Started with limited Black ownership and no formal B-BBEE certification. International investors were supportive but transformation credentials needed strengthening for SA mandate alignment.',
    action:      'Structured a B-BBEE transaction through a certified BEE holding and trust, resulting in 25% Black ownership. Initiated board diversity changes in parallel.',
    outcome:     'Achieved Level 4 B-BBEE certification. Procurement to Black-owned suppliers reached 60%. SDG 10 score moved from Low to Medium Impact.',
    timeframe:   'One financial year',
    metric:      'Level 4',
    metricLabel: 'B-BBEE achieved',
    color:       '#DD1367',
  },
  {
    id:          'story-solar-manufacturing',
    sdgId:       7,
    sdgIds:      [7, 9, 13],
    sector:      'Food Manufacturing',
    title:       'Reducing Eskom dependence with rooftop solar at a food production facility',
    company:     'A food manufacturing company, Eastern Cape',
    location:    'East London, Eastern Cape',
    challenge:   'High electricity costs and load shedding were disrupting production and increasing Scope 2 emissions. No renewable energy strategy in place.',
    action:      'Installed a rooftop solar PV system at the main manufacturing plant. Added a generator backup to ensure zero production downtime during outages.',
    outcome:     'Generated 28,000 kWh of renewable energy in the first year. Scope 2 emissions reduced by approximately 26 tCO2e. SDG 7 score moved from Low to Medium. Energy costs reduced by 18%.',
    timeframe:   'First operational year',
    metric:      '28,000 kWh',
    metricLabel: 'renewable energy produced',
    color:       '#FCC30B',
  },
  {
    id:          'story-homeownership-fintech',
    sdgId:       11,
    sdgIds:      [1, 4, 10, 11],
    sector:      'Housing Finance',
    title:       'Expanding mortgage access into township communities through digital tools',
    company:     'A Black-owned digital mortgage origination platform, Johannesburg',
    location:    'Johannesburg, Gauteng',
    challenge:   'First-time homebuyers in Soweto and surrounding areas had no access to mortgage comparisons or pre-approval tools. Traditional banks were not reaching these communities.',
    action:      'Built a digital-first platform that enables real-time credit checks and mortgage comparisons with no broker fees. Partnered with local property developers to offer buyer education content.',
    outcome:     'Facilitated 385 mortgage originations in underserved areas. 68% of staff are female. SDG 11 score reached High Impact. Over 80% of procurement goes to Black-owned businesses.',
    timeframe:   'First reporting period',
    metric:      '385',
    metricLabel: 'homebuyers assisted',
    color:       '#FD6925',
  },
  {
    id:          'story-procurement-retail',
    sdgId:       17,
    sdgIds:      [1, 8, 10, 17],
    sector:      'Food Retail',
    title:       'Building a Black-owned supplier network from scratch',
    company:     'A food manufacturing and retail business under new Black ownership, Eastern Cape',
    location:    'Eastern Cape',
    challenge:   'Following a Black ownership acquisition, the existing supplier network was predominantly white-owned with no procurement transformation strategy.',
    action:      'Conducted a full supplier audit. Replaced non-critical suppliers with Black-owned and women-owned alternatives over 18 months. Introduced a formal supplier development programme.',
    outcome:     'Local supplier count grew to 24 companies, of which 18 are SMEs. Procurement to Black-owned suppliers reached 55%. SDG 17 score improved from Low to Medium.',
    timeframe:   'Eighteen months',
    metric:      '24',
    metricLabel: 'local suppliers onboarded',
    color:       '#19486A',
  },
];

export const getStoriesForSDG = (sdgId: number): PortfolioStory[] =>
  PORTFOLIO_STORIES.filter(s => s.sdgIds.includes(sdgId));

export const getStoryById = (id: string): PortfolioStory | undefined =>
  PORTFOLIO_STORIES.find(s => s.id === id);
