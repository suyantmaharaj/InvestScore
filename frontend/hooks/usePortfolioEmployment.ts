'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PMPortfolioEntry } from './usePMData';

export interface CompanyEmploymentRow {
  companyId:           string;
  companyName:         string;
  sector:              string;
  mandate:             string;
  totalEmployees:      number | null;
  blackEmployees:      number | null;
  femaleEmployees:     number | null;
  maleEmployees:       number | null;
  youthEmployees:      number | null;
  managementEmployees: number | null;
  contractorEmployees: number | null;
  staffEmployees:      number | null;
  blackPct:            number | null;
  femalePct:           number | null;
  youthPct:            number | null;
  permPct:             number | null;
  hasData:             boolean;
}

export interface PortfolioEmploymentData {
  totalEmployees:      number;
  blackEmployees:      number;
  femaleEmployees:     number;
  maleEmployees:       number;
  youthEmployees:      number;
  managementEmployees: number;
  contractorEmployees: number;
  staffEmployees:      number;
  reportingCompanies:  number;
  totalCompanies:      number;
  byCompany:           CompanyEmploymentRow[];
}

export function usePortfolioEmployment(portfolio: PMPortfolioEntry[]) {
  const [employmentData, setEmploymentData] = useState<PortfolioEmploymentData>({
    totalEmployees: 0, blackEmployees: 0, femaleEmployees: 0, maleEmployees: 0,
    youthEmployees: 0, managementEmployees: 0, contractorEmployees: 0, staffEmployees: 0,
    reportingCompanies: 0, totalCompanies: 0, byCompany: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (portfolio.length === 0) { setLoading(false); return; }

    const load = async () => {
      try {
        const submissions = await Promise.all(
          portfolio.map(async ({ company }) => {
            const snap = await getDocs(
              query(collection(db, 'submissions'), where('companyId', '==', company.id))
            );
            const sorted = snap.docs
              .filter(d => d.data().status === 'scored')
              .map(d => d.data())
              .sort((a, b) =>
                (b.scoredAt ?? b.submittedAt ?? '').localeCompare(a.scoredAt ?? a.submittedAt ?? '')
              );
            const data = sorted.length > 0
              ? sorted[0].data as Record<string, number | null>
              : null;
            return { company, data };
          })
        );

        const totals = {
          total: 0, black: 0, female: 0, male: 0,
          youth: 0, management: 0, contractors: 0, staff: 0, reporting: 0,
        };

        const byCompany: CompanyEmploymentRow[] = submissions.map(({ company, data }) => {
          if (!data || data.total_employees == null) {
            return {
              companyId: company.id, companyName: company.name,
              sector: company.sector, mandate: company.mandate || '',
              totalEmployees: null, blackEmployees: null,
              femaleEmployees: null, maleEmployees: null, youthEmployees: null,
              managementEmployees: null, contractorEmployees: null, staffEmployees: null,
              blackPct: null, femalePct: null, youthPct: null, permPct: null,
              hasData: false,
            };
          }

          const te = data.total_employees || 0;
          // staff = total - management - contractors (derived when not directly reported)
          const mgmt  = data.management_employees ?? 0;
          const ctors = data.contractor_employees ?? 0;
          const staff = te - mgmt - ctors;

          totals.total       += te;
          totals.black       += data.black_employees      ?? 0;
          totals.female      += data.female_employees     ?? 0;
          totals.male        += te - (data.female_employees ?? 0);
          totals.youth       += data.youth_employees      ?? 0;
          totals.management  += mgmt;
          totals.contractors += ctors;
          totals.staff       += Math.max(0, staff);
          totals.reporting++;

          const bp = te > 0 ? Math.round((data.black_employees ?? 0) / te * 100) : null;
          const fp = te > 0 ? Math.round((data.female_employees ?? 0) / te * 100) : null;
          const yp = te > 0 ? Math.round((data.youth_employees ?? 0) / te * 100) : null;
          const pp = te > 0 ? Math.round((mgmt + Math.max(0, staff)) / te * 100) : null;

          return {
            companyId: company.id, companyName: company.name,
            sector: company.sector, mandate: company.mandate || '',
            totalEmployees:      te,
            blackEmployees:      data.black_employees      ?? null,
            femaleEmployees:     data.female_employees     ?? null,
            maleEmployees:       te - (data.female_employees ?? 0),
            youthEmployees:      data.youth_employees      ?? null,
            managementEmployees: mgmt  || null,
            contractorEmployees: ctors || null,
            staffEmployees:      Math.max(0, staff) || null,
            blackPct: bp, femalePct: fp, youthPct: yp, permPct: pp,
            hasData: true,
          };
        });

        setEmploymentData({
          totalEmployees:      totals.total,
          blackEmployees:      totals.black,
          femaleEmployees:     totals.female,
          maleEmployees:       totals.male,
          youthEmployees:      totals.youth,
          managementEmployees: totals.management,
          contractorEmployees: totals.contractors,
          staffEmployees:      totals.staff,
          reportingCompanies:  totals.reporting,
          totalCompanies:      portfolio.length,
          byCompany:           byCompany.sort((a, b) => (b.totalEmployees ?? 0) - (a.totalEmployees ?? 0)),
        });
      } catch (err) {
        console.error('usePortfolioEmployment error:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [portfolio]);

  return { employmentData, loading };
}
