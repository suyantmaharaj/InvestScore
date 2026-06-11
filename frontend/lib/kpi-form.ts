export interface FormKPI {
  id:            string;
  label:         string;
  unit:          string;
  placeholder:   string;
  helpTitle:     string;
  helpText:      string;
  calculation:   string;
  required:      boolean;
  min?:          number;
  max?:          number;
  isPercentage?: boolean;
}

export interface FormCategory {
  id:          string;
  label:       string;
  description: string;
  icon:        string;
  sdgs:        number[];
  kpis:        FormKPI[];
}

export const FORM_CATEGORIES: FormCategory[] = [
  {
    id:          'employment',
    label:       'Employment Structure',
    description: 'Tell us about the people who work at your company.',
    icon:        '👥',
    sdgs:        [5, 8, 10],
    kpis: [
      {
        id: 'total_employees', label: 'Total number of employees',
        unit: 'employees', placeholder: 'e.g. 25',
        helpTitle: 'Who counts as an employee?',
        helpText: 'Count every person on your payroll - full-time and part-time permanent staff. Do not include contractors here.',
        calculation: 'Count all employees on your payroll as of your financial year end date.',
        required: true, min: 0,
      },
      {
        id: 'youth_employees', label: 'Employees aged 35 and under (Youth)',
        unit: 'employees', placeholder: 'e.g. 10',
        helpTitle: 'Who counts as youth?',
        helpText: 'Count all employees aged 35 and under as of your reporting date.',
        calculation: 'Count employees born in the last 35 years.',
        required: true, min: 0,
      },
      {
        id: 'female_employees', label: 'Female employees',
        unit: 'employees', placeholder: 'e.g. 12',
        helpTitle: 'Why does this matter?',
        helpText: 'Female representation supports SDG 5 (Gender Equality). Count all employees who identify as female.',
        calculation: 'Count all employees who identify as female across all levels.',
        required: true, min: 0,
      },
      {
        id: 'management_employees', label: 'Employees in management roles',
        unit: 'employees', placeholder: 'e.g. 4',
        helpTitle: 'What is a management role?',
        helpText: 'Anyone who manages people or holds a senior title - Manager, Director, Head of, or C-suite.',
        calculation: 'Count employees in management or supervisory roles.',
        required: false, min: 0,
      },
      {
        id: 'contractor_employees', label: 'Contract workers',
        unit: 'contractors', placeholder: 'e.g. 3',
        helpTitle: 'What is a contractor?',
        helpText: 'Workers on a fixed-term or project contract who are not permanent employees.',
        calculation: 'Count all active contractors during the reporting period.',
        required: false, min: 0,
      },
      {
        id: 'black_employees', label: 'Black employees',
        unit: 'employees', placeholder: 'e.g. 20',
        helpTitle: 'B-BBEE definition',
        helpText: 'As per B-BBEE legislation: African, Coloured, and Indian South African citizens who were disadvantaged by apartheid.',
        calculation: 'Count all employees who identify as Black (African, Coloured, or Indian) per B-BBEE definitions.',
        required: false, min: 0,
      },
    ],
  },
  {
    id:          'environmental',
    label:       'Environmental Performance',
    description: 'Tell us about your energy use, emissions, and water consumption.',
    icon:        '🌱',
    sdgs:        [7, 12, 13, 14, 15],
    kpis: [
      {
        id: 'scope1_co2e', label: 'Scope 1 emissions (direct)',
        unit: 'tCO2e', placeholder: 'e.g. 45',
        helpTitle: 'What are Scope 1 emissions?',
        helpText: 'Direct emissions from sources you own or control - fuel burned in company vehicles, generators, and on-site boilers.',
        calculation: 'Sum all direct GHG emissions in tonnes of CO2 equivalent.',
        required: false, min: 0,
      },
      {
        id: 'scope2_co2e', label: 'Scope 2 emissions (electricity)',
        unit: 'tCO2e', placeholder: 'e.g. 120',
        helpTitle: 'What are Scope 2 emissions?',
        helpText: 'Emissions from electricity you buy from the Eskom grid. Multiply your kWh usage by 0.00093 to get tCO2e.',
        calculation: 'Electricity consumed (kWh) × 0.00093',
        required: false, min: 0,
      },
      {
        id: 'electricity_consumption', label: 'Total electricity consumed (Eskom grid)',
        unit: 'kWh', placeholder: 'e.g. 28000',
        helpTitle: 'Where do I find this?',
        helpText: 'Add up your monthly electricity bills in kWh for the full year. Your Eskom or City Power invoice shows kWh consumed.',
        calculation: 'Sum of monthly electricity consumption in kWh.',
        required: false, min: 0,
      },
      {
        id: 'renewable_energy_produced', label: 'Renewable energy generated',
        unit: 'kWh', placeholder: 'e.g. 6500',
        helpTitle: 'Solar panels or generators?',
        helpText: 'If you have solar panels, a wind turbine, or any on-site renewable generation, record the total kWh produced.',
        calculation: 'Total kWh produced by your renewable energy sources.',
        required: false, min: 0,
      },
      {
        id: 'renewable_energy_utilised', label: 'Renewable energy used',
        unit: 'kWh', placeholder: 'e.g. 6000',
        helpTitle: 'What is the difference from produced?',
        helpText: 'Some renewable energy you generate may be fed back to the grid. This is only what you consumed.',
        calculation: 'Total kWh of renewable energy you actually consumed.',
        required: false, min: 0,
      },
      {
        id: 'total_water_consumption', label: 'Total water consumed',
        unit: 'kilolitres (kL)', placeholder: 'e.g. 1200',
        helpTitle: 'How to measure water?',
        helpText: 'Read your water meter at the start and end of the year. The difference is your consumption in kilolitres.',
        calculation: 'Total kilolitres consumed from all sources during the year.',
        required: false, min: 0,
      },
      {
        id: 'recycled_waste_pct', label: 'Waste recycled',
        unit: '%', placeholder: 'e.g. 35',
        helpTitle: 'How to calculate this?',
        helpText: 'If you generated 100kg of waste and recycled 35kg, your recycling rate is 35%.',
        calculation: '(Total waste recycled ÷ Total waste generated) × 100',
        required: false, min: 0, max: 100, isPercentage: true,
      },
    ],
  },
  {
    id:          'transformation',
    label:       'Enterprise & Transformation',
    description: 'Tell us about your B-BBEE status, ownership, and procurement.',
    icon:        '⚖️',
    sdgs:        [5, 8, 10, 16, 17],
    kpis: [
      {
        id: 'bbbee_rating', label: 'B-BBEE level',
        unit: 'Level 1–8', placeholder: 'e.g. 2',
        helpTitle: 'Where to find your level?',
        helpText: 'Your B-BBEE certificate from an accredited verification agency shows your level. Level 1 is best, Level 8 is lowest.',
        calculation: 'Enter your current certified B-BBEE level (1–8). Enter 9 if non-compliant.',
        required: true, min: 1, max: 9,
      },
      {
        id: 'black_ownership_pct', label: 'Black ownership',
        unit: '%', placeholder: 'e.g. 75',
        helpTitle: 'How to calculate Black ownership?',
        helpText: 'What percentage of your company shares or equity is held by Black South African citizens (African, Coloured, or Indian)?',
        calculation: '(Black-owned equity ÷ Total equity) × 100',
        required: false, min: 0, max: 100, isPercentage: true,
      },
      {
        id: 'black_female_ownership_pct', label: 'Black female ownership',
        unit: '%', placeholder: 'e.g. 35',
        helpTitle: 'Why separately reported?',
        helpText: 'Black women-owned businesses receive additional B-BBEE recognition. Report the % of total equity held by Black women.',
        calculation: '(Black female-owned equity ÷ Total equity) × 100',
        required: false, min: 0, max: 100, isPercentage: true,
      },
      {
        id: 'black_board_pct', label: 'Black board representation',
        unit: '%', placeholder: 'e.g. 80',
        helpTitle: 'Who counts?',
        helpText: 'Of your total board seats, what percentage are held by Black individuals (African, Coloured, or Indian per B-BBEE)?',
        calculation: '(Black board members ÷ Total board members) × 100',
        required: false, min: 0, max: 100, isPercentage: true,
      },
      {
        id: 'black_board_number', label: 'Number of Black board members',
        unit: 'members', placeholder: 'e.g. 3',
        helpTitle: 'Count your board',
        helpText: 'The number of Black individuals currently serving on your board of directors.',
        calculation: 'Count Black board members.',
        required: false, min: 0,
      },
      {
        id: 'procurement_black_owned_pct', label: 'Procurement spend to Black-owned suppliers',
        unit: '%', placeholder: 'e.g. 65',
        helpTitle: 'What counts as Black-owned?',
        helpText: 'Suppliers where 51% or more of ownership is held by Black individuals. Check your supplier B-BBEE certificates.',
        calculation: '(Spend with majority Black-owned suppliers ÷ Total procurement spend) × 100',
        required: false, min: 0, max: 100, isPercentage: true,
      },
      {
        id: 'procurement_women_owned_pct', label: 'Procurement spend to women-owned suppliers',
        unit: '%', placeholder: 'e.g. 30',
        helpTitle: 'What counts as women-owned?',
        helpText: 'Suppliers where women hold a controlling interest or senior leadership role.',
        calculation: '(Spend with women-owned suppliers ÷ Total procurement spend) × 100',
        required: false, min: 0, max: 100, isPercentage: true,
      },
      {
        id: 'total_annual_revenue', label: 'Total annual revenue',
        unit: 'ZAR', placeholder: 'e.g. 8500000',
        helpTitle: 'Where to find this?',
        helpText: 'Your total income before any deductions. Found on your income statement as "Revenue" or "Turnover".',
        calculation: 'Total revenue as reported on your annual financial statements in ZAR.',
        required: false, min: 0,
      },
    ],
  },
  {
    id:          'community',
    label:       'Community & Supply Chain',
    description: 'Tell us about your CSI spend and local supplier relationships.',
    icon:        '🤝',
    sdgs:        [1, 8, 17],
    kpis: [
      {
        id: 'csi_spend', label: 'Corporate Social Investment (CSI) spend',
        unit: 'ZAR', placeholder: 'e.g. 85000',
        helpTitle: 'What counts as CSI?',
        helpText: 'Total rand amount spent on community development, charity, or social programmes during the year.',
        calculation: 'Sum all CSI expenditure in ZAR during the reporting period.',
        required: false, min: 0,
      },
      {
        id: 'local_suppliers', label: 'Number of South African suppliers',
        unit: 'suppliers', placeholder: 'e.g. 9',
        helpTitle: 'Why local suppliers matter',
        helpText: 'Supporting local suppliers strengthens the South African economy and contributes to SDG 17 (Partnerships).',
        calculation: 'Count unique South African-based suppliers you used during the reporting period.',
        required: false, min: 0,
      },
      {
        id: 'smes_in_supply_chain', label: 'Number of SMEs in your supply chain',
        unit: 'SMEs', placeholder: 'e.g. 7',
        helpTitle: 'What qualifies as an SME?',
        helpText: 'Businesses with annual turnover under R50 million qualify as SMEs under South African definitions.',
        calculation: 'Count SME suppliers (annual turnover < R50 million) used during the reporting period.',
        required: false, min: 0,
      },
    ],
  },
  {
    id:          'sector_specific',
    label:       'Sector-Specific Impact',
    description: 'These questions are specific to your industry and sector.',
    icon:        '🏭',
    sdgs:        [1, 2, 4, 9, 11],
    kpis: [
      // Financial services
      {
        id: 'smes_funded', label: 'Number of SMEs funded',
        unit: 'SMEs', placeholder: 'e.g. 12',
        helpTitle: 'What counts as funded?',
        helpText: 'Any SME that received a loan, grant, equity investment, or other financial support from your company.',
        calculation: 'Count unique SMEs that received funding during the reporting period.',
        required: false, min: 0,
      },
      {
        id: 'black_smes_funded_pct', label: 'Black-owned SMEs funded',
        unit: '%', placeholder: 'e.g. 75',
        helpTitle: 'How to calculate?',
        helpText: 'Of the SMEs you funded, what percentage are majority Black-owned (51%+ Black ownership)?',
        calculation: '(Black-owned SMEs funded ÷ Total SMEs funded) × 100',
        required: false, min: 0, max: 100, isPercentage: true,
      },
      {
        id: 'women_led_smes_funded_pct', label: 'Women-led SMEs funded',
        unit: '%', placeholder: 'e.g. 40',
        helpTitle: 'What is women-led?',
        helpText: 'SMEs where a woman holds a senior leadership role (CEO, MD, Founder) or controlling ownership.',
        calculation: '(Women-led SMEs funded ÷ Total SMEs funded) × 100',
        required: false, min: 0, max: 100, isPercentage: true,
      },
      {
        id: 'capital_deployed_smes', label: 'Total capital deployed to SMEs',
        unit: 'ZAR', placeholder: 'e.g. 3200000',
        helpTitle: 'What counts as capital deployed?',
        helpText: 'Total rand value of funding, loans, or investment disbursed to SMEs during the year.',
        calculation: 'Sum all capital disbursed to SMEs in ZAR during the reporting period.',
        required: false, min: 0,
      },
      {
        id: 'jobs_supported_smes', label: 'Jobs in funded SMEs',
        unit: 'jobs', placeholder: 'e.g. 87',
        helpTitle: 'How to track this?',
        helpText: 'Ask your funded SMEs to report their total headcount. Sum across all funded companies.',
        calculation: 'Sum of total employees across all funded SMEs.',
        required: false, min: 0,
      },
      // Manufacturing
      {
        id: 'units_produced', label: 'Units produced',
        unit: 'units', placeholder: 'e.g. 850000',
        helpTitle: 'What is a unit?',
        helpText: 'Total number of finished products manufactured. Use your production records.',
        calculation: 'Count total units of finished products manufactured during the reporting period.',
        required: false, min: 0,
      },
      {
        id: 'local_raw_material_pct', label: 'Local raw material sourcing',
        unit: '%', placeholder: 'e.g. 72',
        helpTitle: 'Why local sourcing matters',
        helpText: 'Sourcing locally reduces emissions, supports local jobs, and contributes to SDGs 2, 12, and 15.',
        calculation: '(Local raw material spend ÷ Total raw material spend) × 100',
        required: false, min: 0, max: 100, isPercentage: true,
      },
      {
        id: 'apprentices_supported', label: 'Apprentices and trainees supported',
        unit: 'people', placeholder: 'e.g. 8',
        helpTitle: 'What programmes count?',
        helpText: 'Formal apprenticeships, learnerships, internships, and SETA-registered training programmes.',
        calculation: 'Count individuals in formal training or apprenticeship programmes.',
        required: false, min: 0,
      },
      // ICT
      {
        id: 'new_customers_connected', label: 'New customers connected to your service',
        unit: 'customers', placeholder: 'e.g. 3200',
        helpTitle: 'What counts as connected?',
        helpText: 'New customers who gained access to your product or service during the year.',
        calculation: 'Count new customer connections or activations during the reporting period.',
        required: false, min: 0,
      },
      {
        id: 'geographic_coverage_km2', label: 'Geographic area covered',
        unit: 'km²', placeholder: 'e.g. 450',
        helpTitle: 'How to estimate coverage?',
        helpText: 'Total square kilometres where your service, network, or product is available.',
        calculation: 'Total km² of geographic service coverage.',
        required: false, min: 0,
      },
      {
        id: 'average_cost_of_service', label: 'Average cost of service per customer',
        unit: 'ZAR/month', placeholder: 'e.g. 199',
        helpTitle: 'Why does affordability matter?',
        helpText: 'Lower service costs improve access for low-income communities and contribute to SDG 9.',
        calculation: 'Total revenue ÷ Total customers served.',
        required: false, min: 0,
      },
      // Housing
      {
        id: 'affordable_houses', label: 'Affordable housing units delivered',
        unit: 'units', placeholder: 'e.g. 42',
        helpTitle: 'What counts as affordable?',
        helpText: 'Units priced or rented below market rate for low-to-middle income households.',
        calculation: 'Count housing units completed and handed over during the reporting period.',
        required: false, min: 0,
      },
      {
        id: 'social_housing_rental_avg', label: 'Average social housing rental',
        unit: 'ZAR/month', placeholder: 'e.g. 2200',
        helpTitle: 'Why track rental price?',
        helpText: 'Lower rental prices indicate greater affordability. This contributes to SDG 11.',
        calculation: 'Total monthly rental income ÷ Number of occupied units.',
        required: false, min: 0,
      },
      {
        id: 'social_housing_units', label: 'Total social housing units in portfolio',
        unit: 'units', placeholder: 'e.g. 38',
        helpTitle: 'What counts as social housing?',
        helpText: 'Government-subsidised, council, or below-market rental units.',
        calculation: 'Count all social housing units in your portfolio.',
        required: false, min: 0,
      },
      // Retail
      {
        id: 'products_local_producers_pct', label: 'Products from local or small producers',
        unit: '%', placeholder: 'e.g. 55',
        helpTitle: 'What counts as local?',
        helpText: 'Products sourced from South African small-scale or community producers.',
        calculation: '(Products from local/small producers ÷ Total products) × 100',
        required: false, min: 0, max: 100, isPercentage: true,
      },
      {
        id: 'low_income_customers', label: 'Low-income or underserved customers served',
        unit: 'customers', placeholder: 'e.g. 8500',
        helpTitle: 'How to classify?',
        helpText: 'Customers from LSM 1–5 or communities formally classified as underserved.',
        calculation: 'Count customers from low-income or underserved segments.',
        required: false, min: 0,
      },
      {
        id: 'sustainable_products_pct', label: 'Sustainable or ethical products sold',
        unit: '%', placeholder: 'e.g. 28',
        helpTitle: 'What qualifies as sustainable?',
        helpText: 'Products carrying an environmental or ethical certification - Fair Trade, organic, recyclable, etc.',
        calculation: '(Certified sustainable products sold ÷ Total products sold) × 100',
        required: false, min: 0, max: 100, isPercentage: true,
      },
    ],
  },
];
