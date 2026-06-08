// Shared types across frontend and backend

export type UserRole = 'sme' | 'pm' | 'admin';

export interface User {
  uid:       string;
  email:     string;
  role:      UserRole;
  companyId?: string;     // only for SME users
  name:      string;
  createdAt: string;
}

export interface Company {
  id:           string;
  name:         string;
  sector:       Sector;
  industry:     string;
  location:     string;
  description:  string;
  website:      string;
  logoUrl:      string;
  reportingCurrency: string;
  fyeMonth:     number;           // 1–12
  spokespersonName:  string;
  spokespersonEmail: string;
  spokespersonTitle: string;
  createdAt:    string;
  status:       'active' | 'pending' | 'suspended';
  mandate?:     'Growth' | 'Empowerment' | 'Development';
  bbbeeLevel?:  number;
}

export type Sector =
  | 'financial_services'
  | 'infrastructure'
  | 'manufacturing'
  | 'housing'
  | 'ict'
  | 'retail'
  | 'logistics'
  | 'other';

export interface SDGScore {
  sdgId:          number;           // 1–17
  sdgName:        string;
  score:          number;           // 1.0–3.0
  classification: 'Low' | 'Medium' | 'High';
  sectorAvg:      number;
  trend:          'up' | 'down' | 'stable';
}

export interface CompanyScorecard {
  companyId:        string;
  submissionId:     string;
  overallScore:     number;
  classification:   'Low' | 'Medium' | 'High';
  sdgScores:        SDGScore[];
  calculatedAt:     string;
  submissionPeriod: string;         // e.g. "Q1 2026"
}

export interface Submission {
  id:          string;
  companyId:   string;
  period:      string;
  status:      'draft' | 'submitted' | 'scored';
  data:        Record<string, number | null>;
  submittedAt: string;
  scoredAt?:   string;
}

export interface PendingRegistration {
  id:          string;
  name:        string;
  email:       string;
  companyName: string;
  companyInfo: string;
  requestedAt: string;
  status:      'pending' | 'approved' | 'rejected';
}
