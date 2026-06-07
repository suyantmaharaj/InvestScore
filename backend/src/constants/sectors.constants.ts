// Sector definitions

export const SECTORS = [
  { id: 'financial_services', label: 'Financial Services' },
  { id: 'infrastructure',     label: 'Infrastructure'     },
  { id: 'manufacturing',      label: 'Manufacturing'      },
  { id: 'housing',            label: 'Housing'            },
  { id: 'ict',                label: 'ICT'                },
  { id: 'retail',             label: 'Retail'             },
  { id: 'logistics',          label: 'Logistics'          },
  { id: 'other',              label: 'Other'              },
] as const;

export type SectorId = typeof SECTORS[number]['id'];
