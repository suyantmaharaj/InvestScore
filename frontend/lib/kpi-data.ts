export interface KPIDisplay {
  id:       string;
  label:    string;
  unit:     string;
  sdgs:     number[];
  category: string;
}

export const KPI_DISPLAY_LIST: KPIDisplay[] = [
  { id: 'total_employees', label: 'Total employees', unit: 'people', sdgs: [8], category: 'employment' },
  { id: 'youth_employees', label: 'Youth employees (<=35)', unit: 'people', sdgs: [8], category: 'employment' },
  { id: 'female_employees', label: 'Female employees', unit: 'people', sdgs: [5], category: 'employment' },
  { id: 'black_employees', label: 'Black employees', unit: 'people', sdgs: [10], category: 'employment' },
  { id: 'management_employees', label: 'Management employees', unit: 'people', sdgs: [8], category: 'employment' },
  { id: 'contractor_employees', label: 'Contract workers', unit: 'people', sdgs: [8], category: 'employment' },
  { id: 'scope1_co2e', label: 'Scope 1 emissions', unit: 'tCO2e', sdgs: [7, 13], category: 'environmental' },
  { id: 'scope2_co2e', label: 'Scope 2 emissions', unit: 'tCO2e', sdgs: [7, 13], category: 'environmental' },
  { id: 'electricity_consumption', label: 'Electricity consumed', unit: 'kWh', sdgs: [7], category: 'environmental' },
  { id: 'renewable_energy_produced', label: 'Renewable energy produced', unit: 'kWh', sdgs: [7, 13], category: 'environmental' },
  { id: 'renewable_energy_utilised', label: 'Renewable energy used', unit: 'kWh', sdgs: [7], category: 'environmental' },
  { id: 'total_water_consumption', label: 'Water consumption', unit: 'kL', sdgs: [3, 6, 14], category: 'environmental' },
  { id: 'recycled_waste_pct', label: 'Recycling rate', unit: '%', sdgs: [12, 13], category: 'environmental' },
  { id: 'bbbee_rating', label: 'B-BBEE level', unit: 'level', sdgs: [10, 16], category: 'transformation' },
  { id: 'black_ownership_pct', label: 'Black ownership', unit: '%', sdgs: [10], category: 'transformation' },
  { id: 'black_female_ownership_pct', label: 'Black female ownership', unit: '%', sdgs: [5, 10], category: 'transformation' },
  { id: 'black_board_pct', label: 'Black board representation', unit: '%', sdgs: [10, 16], category: 'transformation' },
  { id: 'procurement_black_owned_pct', label: 'Procurement to Black-owned', unit: '%', sdgs: [10, 17], category: 'transformation' },
  { id: 'procurement_women_owned_pct', label: 'Procurement to women-owned', unit: '%', sdgs: [5, 17], category: 'transformation' },
  { id: 'total_annual_revenue', label: 'Annual revenue', unit: 'ZAR', sdgs: [8], category: 'transformation' },
  { id: 'csi_spend', label: 'CSI spend', unit: 'ZAR', sdgs: [1], category: 'community' },
  { id: 'local_suppliers', label: 'Local suppliers', unit: 'count', sdgs: [17], category: 'community' },
  { id: 'smes_in_supply_chain', label: 'SMEs in supply chain', unit: 'count', sdgs: [8, 17], category: 'community' },
  { id: 'smes_funded', label: 'SMEs funded', unit: 'count', sdgs: [1], category: 'financial_services' },
  { id: 'black_smes_funded_pct', label: 'Black-owned SMEs funded', unit: '%', sdgs: [10], category: 'financial_services' },
  { id: 'women_led_smes_funded_pct', label: 'Women-led SMEs funded', unit: '%', sdgs: [5], category: 'financial_services' },
  { id: 'capital_deployed_smes', label: 'Capital deployed to SMEs', unit: 'ZAR', sdgs: [1], category: 'financial_services' },
  { id: 'jobs_supported_smes', label: 'Jobs in funded SMEs', unit: 'count', sdgs: [1], category: 'financial_services' },
  { id: 'units_produced', label: 'Units produced', unit: 'units', sdgs: [8, 9], category: 'manufacturing' },
  { id: 'local_raw_material_pct', label: 'Local raw material sourcing', unit: '%', sdgs: [2, 12, 15], category: 'manufacturing' },
  { id: 'apprentices_supported', label: 'Apprentices supported', unit: 'people', sdgs: [4], category: 'manufacturing' },
  { id: 'new_customers_connected', label: 'New customers connected', unit: 'count', sdgs: [9], category: 'ict' },
  { id: 'average_cost_of_service', label: 'Average service cost', unit: 'ZAR/mo', sdgs: [9], category: 'ict' },
  { id: 'affordable_houses', label: 'Affordable houses delivered', unit: 'units', sdgs: [11], category: 'housing' },
  { id: 'social_housing_units', label: 'Social housing units', unit: 'units', sdgs: [11], category: 'housing' },
  { id: 'products_local_producers_pct', label: 'Products from local producers', unit: '%', sdgs: [2, 12], category: 'retail' },
  { id: 'low_income_customers', label: 'Low-income customers served', unit: 'count', sdgs: [1], category: 'retail' },
  { id: 'sustainable_products_pct', label: 'Sustainable products sold', unit: '%', sdgs: [12], category: 'retail' },
  { id: 'water_loss_reduction_pct', label: 'Water loss reduction', unit: '%', sdgs: [3, 6, 14], category: 'water' },
  { id: 'water_connections', label: 'Water connections', unit: 'count', sdgs: [6], category: 'water' },
];

export const getKPIsForSDG = (sdgId: number): KPIDisplay[] =>
  KPI_DISPLAY_LIST.filter(k => k.sdgs.includes(sdgId));
