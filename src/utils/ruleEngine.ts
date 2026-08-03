import type { Enterprise, ConditionClause, RuleTier, Rule, RuleTemplate } from '../types';

// ── Field Definition ──────────────────────────────────

export interface FieldDef {
  key: string;
  label: string;
  category: string;
  valueType: 'number' | 'string' | 'date';
  compute: (ent: Enterprise) => number | string;
}

export const FIELD_CATALOG: FieldDef[] = [
  // ── 基础工商信息 ──
  { key: 'regCapital',     label: '注册资本(万)',        category: '基础工商信息', valueType: 'number', compute: e => e.regCapital },
  { key: 'nature',         label: '企业性质',            category: '基础工商信息', valueType: 'string', compute: e => e.nature },
  { key: 'industry',       label: '所属行业',            category: '基础工商信息', valueType: 'string', compute: e => e.industry },
  { key: 'techDomain',     label: '企业所属领域',        category: '基础工商信息', valueType: 'string', compute: e => e.techDomain },
  { key: 'type',           label: '企业类型',            category: '基础工商信息', valueType: 'string', compute: e => e.type },
  { key: 'scale',          label: '规模',                category: '基础工商信息', valueType: 'string', compute: e => e.scale },
  { key: 'province',       label: '省份',                category: '基础工商信息', valueType: 'string', compute: e => e.province },
  { key: 'city',           label: '城市',                category: '基础工商信息', valueType: 'string', compute: e => e.city },

  // ── 注册与年限 ──
  { key: 'regDate',        label: '注册日期',            category: '注册与年限', valueType: 'date',   compute: e => e.regDate },
  { key: 'establishedYears', label: '成立年限(年)',      category: '注册与年限', valueType: 'number', compute: e => {
    if (!e.regDate) return 0;
    const d = new Date(e.regDate);
    if (isNaN(d.getTime())) return 0;
    const now = new Date('2026-07-31');
    return Math.round(((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25)) * 100) / 100;
  }},

  // ── 人员指标 ──
  { key: 'personnel2025',           label: '2025年从业人员数',   category: '人员指标', valueType: 'number', compute: e => e.personnel2025 ?? e.employeeCountLastYear },
  { key: 'rdPersonnel2025',         label: '2025年研发人员数',   category: '人员指标', valueType: 'number', compute: e => e.rdPersonnel2025 ?? e.rdEmployeeCountLastYear },
  { key: 'employeeCountLastYear',   label: '2025年从业人员数',     category: '人员指标', valueType: 'number', compute: e => e.employeeCountLastYear },
  { key: 'rdEmployeeCountLastYear', label: '2025年研发人员数',     category: '人员指标', valueType: 'number', compute: e => e.rdEmployeeCountLastYear },
  { key: 'highLevelTalent',         label: '核心团队高层次人才数', category: '人员指标', valueType: 'number', compute: e => e.highLevelTalent },

  // ── 经营指标 ──
  { key: 'revenue2025',     label: '2025年销售收入(万)', category: '经营指标', valueType: 'number', compute: e => e.revenue2025 ?? e.revenueLastYear },
  { key: 'revenue2024',     label: '2024年销售收入(万)', category: '经营指标', valueType: 'number', compute: e => e.revenue2024 ?? 0 },
  { key: 'revenue2023',     label: '2023年销售收入(万)', category: '经营指标', valueType: 'number', compute: e => e.revenue2023 ?? 0 },
  { key: 'revenueLastYear', label: '2025年销售收入(万)', category: '经营指标', valueType: 'number', compute: e => e.revenueLastYear },
  { key: 'netAsset2025',    label: '2025年净资产(万)',   category: '经营指标', valueType: 'number', compute: e => e.netAsset2025 ?? e.netAssetLastYear },
  { key: 'netAsset2024',    label: '2024年净资产(万)',   category: '经营指标', valueType: 'number', compute: e => e.netAsset2024 ?? 0 },
  { key: 'netAsset2023',    label: '2023年净资产(万)',   category: '经营指标', valueType: 'number', compute: e => e.netAsset2023 ?? 0 },
  { key: 'netAssetLastYear',label: '2025年净资产(万)',   category: '经营指标', valueType: 'number', compute: e => e.netAssetLastYear },

  // ── 研发投入 ──
  { key: 'rdExpense2025',     label: '2025年研发费用(万)', category: '研发投入', valueType: 'number', compute: e => e.rdExpense2025 ?? e.rdExpenseLastYear },
  { key: 'rdExpense2024',     label: '2024年研发费用(万)', category: '研发投入', valueType: 'number', compute: e => e.rdExpense2024 ?? 0 },
  { key: 'rdExpense2023',     label: '2023年研发费用(万)', category: '研发投入', valueType: 'number', compute: e => e.rdExpense2023 ?? 0 },
  { key: 'rdExpenseLastYear', label: '2025年研发费用(万)', category: '研发投入', valueType: 'number', compute: e => e.rdExpenseLastYear },

  // ── 知识产权 ──
  { key: 'patentsInvention',    label: '发明专利数',       category: '知识产权', valueType: 'number', compute: e => e.patentsInvention },
  { key: 'patentsUtility',      label: '实用新型专利数',   category: '知识产权', valueType: 'number', compute: e => e.patentsUtility },
  { key: 'softwareCopyrights',  label: '软件著作权数',     category: '知识产权', valueType: 'number', compute: e => e.softwareCopyrights },
  { key: 'ipTotal',             label: '知识产权总数',     category: '知识产权', valueType: 'number', compute: e => e.patentsInvention + e.patentsUtility + e.softwareCopyrights },

  // ── 融资 ──
  { key: 'financingAmount', label: '融资金额(万)', category: '融资', valueType: 'number', compute: e => e.financingAmount },

  // ── 计算比率 ──
  { key: 'rdRatio',       label: '研发人员占比(%)',       category: '计算比率', valueType: 'number', compute: e => e.employeeCountLastYear > 0 ? Math.round((e.rdEmployeeCountLastYear / e.employeeCountLastYear) * 10000) / 100 : 0 },
  { key: 'rdIntensity',   label: '研发投入强度(%)',       category: '计算比率', valueType: 'number', compute: e => (e.revenueLastYear > 0 ? Math.round((e.rdExpenseLastYear / e.revenueLastYear) * 10000) / 100 : 0) },
  { key: 'rdExpenseCumulative3Y', label: '近三年累计研发投入(万)', category: '计算比率', valueType: 'number', compute: e => (e.rdExpense2025 ?? e.rdExpenseLastYear) + (e.rdExpense2024 ?? 0) + (e.rdExpense2023 ?? 0) },
  { key: 'revenueGrowth',  label: '营收同比增长率(%)',    category: '计算比率', valueType: 'number', compute: e => {
    const rev25 = e.revenue2025 ?? e.revenueLastYear;
    const rev24 = e.revenue2024 ?? 0;
    return rev24 > 0 ? Math.round(((rev25 - rev24) / rev24) * 10000) / 100 : 0;
  }},
  { key: 'personnelPerRevenue', label: '人均营收(万/人)', category: '计算比率', valueType: 'number', compute: e => {
    const rev = e.revenue2025 ?? e.revenueLastYear;
    const p = e.personnel2025 ?? e.employeeCountLastYear;
    return p > 0 ? Math.round((rev / p) * 100) / 100 : 0;
  }},
];

// ── Index ──────────────────────────────────────────────

export const FIELD_BY_KEY: Map<string, FieldDef> = new Map(FIELD_CATALOG.map(f => [f.key, f]));

export function getFieldLabel(key: string): string {
  return FIELD_BY_KEY.get(key)?.label ?? key;
}

// ── Evaluation Engine ─────────────────────────────────

export function evaluateCondition(clause: ConditionClause, ent: Enterprise): boolean {
  const fieldDef = FIELD_BY_KEY.get(clause.field);
  if (!fieldDef) return true; // unknown field → pass (defensive)

  const actual = fieldDef.compute(ent);

  if (fieldDef.valueType === 'string') {
    const expected = clause.value;
    switch (clause.operator) {
      case '==':   return String(actual) === expected;
      case '!=':   return String(actual) !== expected;
      case 'in': {
        const set = expected.split(',').map(s => s.trim()).filter(Boolean);
        return set.some(v => String(actual) === v);
      }
      default:     return String(actual) === expected;
    }
  }

  // number / date comparison
  const a = typeof actual === 'string' ? actual : Number(actual);
  const b = parseFloat(clause.value);

  if (isNaN(Number(a)) || isNaN(b)) {
    // If both are strings (e.g. date), compare lexicographically
    switch (clause.operator) {
      case '==': return String(a) === String(clause.value);
      case '!=': return String(a) !== String(clause.value);
      case '<':  return String(a) < String(clause.value);
      case '<=': return String(a) <= String(clause.value);
      case '>':  return String(a) > String(clause.value);
      case '>=': return String(a) >= String(clause.value);
      default:   return String(a) === String(clause.value);
    }
  }

  const numA = Number(a);

  switch (clause.operator) {
    case '>':   return numA > b;
    case '>=':  return numA >= b;
    case '<':   return numA < b;
    case '<=':  return numA <= b;
    case '==':  return numA === b;
    case '!=':  return numA !== b;
    case 'in': {
      // comma-separated set — match numeric or string
      const set = clause.value.split(',').map(s => s.trim()).filter(Boolean);
      return set.some(v => {
        if (fieldDef.valueType === 'number') return numA === Number(v);
        return String(actual) === v;
      });
    }
    default:    return numA >= b;
  }
}

export function evaluateTier(tier: RuleTier, ent: Enterprise): boolean {
  // All guards must pass (AND)
  for (const g of tier.guardConditions) {
    if (!evaluateCondition(g, ent)) return false;
  }
  // No targets → auto-pass through guards
  if (tier.targetConditions.length === 0) return true;
  // All targets must pass (AND)
  for (const t of tier.targetConditions) {
    if (!evaluateCondition(t, ent)) return false;
  }
  return true;
}

export function evaluateRule(rule: Rule, ent: Enterprise): boolean {
  if (rule.tiers.length === 0) return true;
  // At least one tier must pass (OR)
  const results = rule.tiers.map(tier => evaluateTier(tier, ent));
  return results.some(Boolean);
}

export interface EnterpriseMatchResult {
  id: string;
  name: string;
  resultsByRule: Record<string, boolean>;
  passCount: number;
  totalRules: number;
  isPerfectMatch: boolean;
}

export function evaluateTemplate(template: RuleTemplate, enterprises: Enterprise[]): EnterpriseMatchResult[] {
  return enterprises.map(ent => {
    const resultsByRule: Record<string, boolean> = {};
    let passCount = 0;
    const totalRules = template.rules.length;

    for (const rule of template.rules) {
      const passed = evaluateRule(rule, ent);
      resultsByRule[rule.id] = passed;
      if (passed) passCount++;
    }

    return {
      id: ent.id,
      name: ent.name,
      resultsByRule,
      passCount,
      totalRules,
      isPerfectMatch: passCount === totalRules,
    };
  });
}
