export interface Enterprise {
  id: string;
  name: string;
  creditCode: string;
  legalRep: string;
  regDate: string;
  status: string;
  regCapital: number;
  address: string;
  nature: string;
  industry: string;
  industryCode: string;
  province: string;
  city: string;
  district: string;
  techDomain: string;
  type: string;
  scale: string;
  
  // Contact information
  legalRepPhone?: string;
  legalRepEmail?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;

  // Innovation Input & Output (Simplified to last year for demo)
  rdExpenseLastYear: number;
  employeeCountLastYear: number;
  rdEmployeeCountLastYear: number;
  
  rdExpense2025?: number;
  rdExpense2024?: number;
  rdExpense2023?: number;
  personnel2025?: number;
  rdPersonnel2025?: number;
  patentsInvention2025?: number;
  patentsUtility2025?: number;
  softwareCopyrights2025?: number;
  revenue2025?: number;
  revenue2024?: number;
  revenue2023?: number;
  netAsset2025?: number;
  netAsset2024?: number;
  netAsset2023?: number;
  
  patentsInvention: number;
  patentsUtility: number;
  softwareCopyrights: number;
  
  revenueLastYear: number;
  netAssetLastYear: number;
  
  highLevelTalent: number;
  financingAmount: number;
  coreProduct: string;
  batch: string;
}

export interface ConditionClause {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface RuleTier {
  id: string;
  label: string;
  guardConditions: ConditionClause[];
  targetConditions: ConditionClause[];
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  tiers: RuleTier[];
}

export interface RuleTemplate {
  id: string;
  name: string;
  rules: Rule[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  department: string;
  action: string;
  target: string;
  details: string;
}
