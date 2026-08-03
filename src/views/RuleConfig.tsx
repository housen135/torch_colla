import { useState } from 'react';
import { mockTemplates } from '../data';
import type { Rule, RuleTemplate, RuleTier, ConditionClause } from '../types';
import { FIELD_CATALOG } from '../utils/ruleEngine';
import { Save, PlusCircle, Trash2, ArrowLeft, Settings2, Copy, FileCode2, ChevronDown } from 'lucide-react';

let nextId = 200;

function genId(prefix: string) {
  return `${prefix}-${nextId++}`;
}

function emptyCondition(): ConditionClause {
  return { id: genId('c'), field: 'establishedYears', operator: '>=', value: '' };
}

function emptyTier(): RuleTier {
  return {
    id: genId('t'),
    label: '',
    guardConditions: [],
    targetConditions: [emptyCondition()],
  };
}

function emptyRule(): Rule {
  return {
    id: genId('r'),
    name: '',
    description: '',
    tiers: [emptyTier()],
  };
}

const OPERATOR_OPTIONS: { value: string; label: string }[] = [
  { value: '>',  label: '大于 (>)' },
  { value: '>=', label: '大于等于 (≥)' },
  { value: '<',  label: '小于 (<)' },
  { value: '<=', label: '小于等于 (≤)' },
  { value: '==', label: '等于 (=)' },
  { value: '!=', label: '不等于 (≠)' },
  { value: 'in', label: '属于' },
];

// Group field catalog for dropdown
function useFieldGroups() {
  const groups: Record<string, typeof FIELD_CATALOG> = {};
  for (const f of FIELD_CATALOG) {
    (groups[f.category] ??= []).push(f);
  }
  return groups;
}

export function RuleConfig() {
  const [templates, setTemplates] = useState<RuleTemplate[]>(mockTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [editName, setEditName] = useState('');
  const [editRules, setEditRules] = useState<Rule[]>([]);

  const fieldGroups = useFieldGroups();

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const openEditor = (t: RuleTemplate) => {
    setEditName(t.name);
    setEditRules(t.rules.map(r => structuredClone(r)));
    setSelectedTemplateId(t.id);
    setIsCreating(false);
  };

  const startCreate = () => {
    setEditName('');
    setEditRules([]);
    setSelectedTemplateId(null);
    setIsCreating(true);
  };

  const backToList = () => {
    setSelectedTemplateId(null);
    setIsCreating(false);
    setEditName('');
    setEditRules([]);
  };

  const handleSave = () => {
    if (!editName.trim()) return;

    if (isCreating) {
      const newTemplate: RuleTemplate = {
        id: genId('tpl'),
        name: editName.trim(),
        rules: editRules,
      };
      setTemplates(prev => [newTemplate, ...prev]);
      backToList();
    } else if (selectedTemplate) {
      setTemplates(prev =>
        prev.map(t =>
          t.id === selectedTemplate.id ? { ...t, name: editName.trim(), rules: editRules } : t
        )
      );
      setSelectedTemplateId(selectedTemplate.id);
    }
  };

  // ──────── rule-level mutations ────────

  const addRule = () => {
    setEditRules(prev => [...prev, emptyRule()]);
  };

  const updateRule = (rIdx: number, patch: Partial<Rule>) => {
    setEditRules(prev => prev.map((r, i) => (i === rIdx ? { ...r, ...patch } : r)));
  };

  const removeRule = (rIdx: number) => {
    setEditRules(prev => prev.filter((_, i) => i !== rIdx));
  };

  // ──────── tier-level mutations ────────

  const addTier = (rIdx: number) => {
    setEditRules(prev =>
      prev.map((r, i) =>
        i === rIdx ? { ...r, tiers: [...r.tiers, emptyTier()] } : r
      )
    );
  };

  const updateTier = (rIdx: number, tIdx: number, patch: Partial<RuleTier>) => {
    setEditRules(prev =>
      prev.map((r, i) =>
        i === rIdx
          ? { ...r, tiers: r.tiers.map((t, j) => (j === tIdx ? { ...t, ...patch } : t)) }
          : r
      )
    );
  };

  const removeTier = (rIdx: number, tIdx: number) => {
    setEditRules(prev =>
      prev.map((r, i) =>
        i === rIdx ? { ...r, tiers: r.tiers.filter((_, j) => j !== tIdx) } : r
      )
    );
  };

  // ──────── condition-level mutations ────────

  const addGuardCondition = (rIdx: number, tIdx: number) => {
    setEditRules(prev =>
      prev.map((r, i) =>
        i === rIdx
          ? {
              ...r,
              tiers: r.tiers.map((t, j) =>
                j === tIdx ? { ...t, guardConditions: [...t.guardConditions, emptyCondition()] } : t
              ),
            }
          : r
      )
    );
  };

  const updateGuardCondition = (rIdx: number, tIdx: number, cIdx: number, patch: Partial<ConditionClause>) => {
    setEditRules(prev =>
      prev.map((r, i) =>
        i === rIdx
          ? {
              ...r,
              tiers: r.tiers.map((t, j) =>
                j === tIdx
                  ? { ...t, guardConditions: t.guardConditions.map((c, k) => (k === cIdx ? { ...c, ...patch } : c)) }
                  : t
              ),
            }
          : r
      )
    );
  };

  const removeGuardCondition = (rIdx: number, tIdx: number, cIdx: number) => {
    setEditRules(prev =>
      prev.map((r, i) =>
        i === rIdx
          ? {
              ...r,
              tiers: r.tiers.map((t, j) =>
                j === tIdx ? { ...t, guardConditions: t.guardConditions.filter((_, k) => k !== cIdx) } : t
              ),
            }
          : r
      )
    );
  };

  const addTargetCondition = (rIdx: number, tIdx: number) => {
    setEditRules(prev =>
      prev.map((r, i) =>
        i === rIdx
          ? {
              ...r,
              tiers: r.tiers.map((t, j) =>
                j === tIdx ? { ...t, targetConditions: [...t.targetConditions, emptyCondition()] } : t
              ),
            }
          : r
      )
    );
  };

  const updateTargetCondition = (rIdx: number, tIdx: number, cIdx: number, patch: Partial<ConditionClause>) => {
    setEditRules(prev =>
      prev.map((r, i) =>
        i === rIdx
          ? {
              ...r,
              tiers: r.tiers.map((t, j) =>
                j === tIdx
                  ? { ...t, targetConditions: t.targetConditions.map((c, k) => (k === cIdx ? { ...c, ...patch } : c)) }
                  : t
              ),
            }
          : r
      )
    );
  };

  const removeTargetCondition = (rIdx: number, tIdx: number, cIdx: number) => {
    setEditRules(prev =>
      prev.map((r, i) =>
        i === rIdx
          ? {
              ...r,
              tiers: r.tiers.map((t, j) =>
                j === tIdx ? { ...t, targetConditions: t.targetConditions.filter((_, k) => k !== cIdx) } : t
              ),
            }
          : r
      )
    );
  };

  // ──────── shared helpers ────────

  const renderFieldSelect = (value: string, onChange: (val: string) => void) => (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-2 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 min-w-0"
    >
      {Object.entries(fieldGroups).map(([cat, fields]) => (
        <optgroup key={cat} label={cat}>
          {fields.map(f => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );

  const renderOperatorSelect = (value: string, onChange: (val: string) => void) => (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-2 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500"
    >
      {OPERATOR_OPTIONS.map(op => (
        <option key={op.value} value={op.value}>{op.label}</option>
      ))}
    </select>
  );

  const renderConditionRow = (
    cond: ConditionClause,
    onField: (v: string) => void,
    onOp: (v: string) => void,
    onVal: (v: string) => void,
    onDelete: () => void,
    showDelete: boolean
  ) => {
    const isIn = cond.operator === 'in';
    return (
    <div className="flex items-center gap-2 text-xs">
      {renderFieldSelect(cond.field, onField)}
      {renderOperatorSelect(cond.operator, onOp)}
      <input
        type="text"
        value={cond.value}
        onChange={e => onVal(e.target.value)}
        placeholder={isIn ? '多个值用逗号分隔，如：北京,上海' : '值'}
        className={isIn
          ? 'w-44 px-2 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500'
          : 'w-20 px-2 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500'
        }
      />
      {showDelete && (
        <button onClick={onDelete} className="flex-shrink-0 text-slate-400 hover:text-red-500 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
    );
  };

  // ──────── List view ────────

  if (!selectedTemplateId && !isCreating) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">规则模板管理</h2>
            <p className="text-sm text-slate-500">创建、编辑和管理用于企业筛选和判定的业务规则模板。</p>
          </div>
          <button
            onClick={startCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            新建规则模板
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="p-6 flex-1">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                  <FileCode2 className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-2">{t.name}</h3>
                <p className="text-sm text-slate-500 mb-4">包含 {t.rules.length} 条判定规则，用于评估企业资质与指标达标情况。</p>
                <div className="flex flex-wrap gap-2">
                  {t.rules.slice(0, 3).map(r => (
                    <span key={r.id} className="inline-flex px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">
                      {r.name}
                    </span>
                  ))}
                  {t.rules.length > 3 && (
                    <span className="inline-flex px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">
                      +{t.rules.length - 3}
                    </span>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center rounded-b-xl">
                <button className="text-slate-500 hover:text-slate-700 text-sm font-medium flex items-center gap-1.5 transition-colors">
                  <Copy className="w-4 h-4" />
                  复制
                </button>
                <button
                  onClick={() => openEditor(t)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Settings2 className="w-4 h-4" />
                  查看/编辑
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ──────── Editor view ────────

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={backToList}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          返回模板列表
        </button>
        <span className="text-sm text-slate-400">
          {isCreating ? '新建模板' : '编辑模板'}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 flex justify-between items-center">
          <div className="flex-1">
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="请输入模板名称"
              className="text-xl font-bold text-white mb-2 bg-white/10 border border-slate-600 rounded-lg px-3 py-1.5 w-96 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-slate-300 text-sm">此模板包含 {editRules.length} 条用于判定企业的基础申报条件的规则。</p>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-medium shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            保存模板
          </button>
        </div>

        {/* Rules */}
        <div className="p-6 space-y-6">
          {editRules.length === 0 && (
            <div className="text-center py-16 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
              暂未添加判断规则，点击下方按钮添加第一条规则
            </div>
          )}

          {editRules.map((rule, rIdx) => (
            <div key={rule.id} className="border border-slate-200 rounded-xl overflow-hidden">
              {/* Rule header */}
              <div className="bg-slate-50 px-5 py-3 flex items-center justify-between border-b border-slate-200">
                <div className="flex items-center gap-3 flex-1">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    {rIdx + 1}
                  </span>
                  <input
                    type="text"
                    value={rule.name}
                    onChange={e => updateRule(rIdx, { name: e.target.value })}
                    placeholder="规则名称，如：研发投入强度判定"
                    className="flex-1 text-sm font-semibold bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 max-w-xs"
                  />
                  <input
                    type="text"
                    value={rule.description}
                    onChange={e => updateRule(rIdx, { description: e.target.value })}
                    placeholder="规则描述（选填）"
                    className="flex-1 text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={() => removeRule(rIdx)}
                  className="ml-3 flex-shrink-0 text-slate-400 hover:text-red-500 transition-colors p-1"
                  title="删除规则"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Tiers */}
              <div className="p-4 space-y-4">
                {rule.tiers.map((tier, tIdx) => (
                  <div key={tier.id} className="border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50/30">
                    {/* Tier header */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        档次 {tIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={tier.label}
                        onChange={e => updateTier(rIdx, tIdx, { label: e.target.value })}
                        placeholder="档次标签，如：营收 < 5000万"
                        className="flex-1 text-xs bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                      />
                      {rule.tiers.length > 1 && (
                        <button
                          onClick={() => removeTier(rIdx, tIdx)}
                          className="flex-shrink-0 text-xs text-slate-400 hover:text-red-500 transition-colors"
                        >
                          删除档次
                        </button>
                      )}
                    </div>

                    {/* Guard conditions */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          适用条件
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {tier.guardConditions.length === 0 ? '（为空则始终适用此档次）' : '（同时满足以下全部条件时，启用此档次）'}
                        </span>
                      </div>
                      <div className="space-y-2 pl-1">
                        {tier.guardConditions.map((cond, cIdx) => (
                          <div key={cond.id} className="flex items-center gap-1.5">
                            {renderConditionRow(
                              cond,
                              v => updateGuardCondition(rIdx, tIdx, cIdx, { field: v }),
                              v => updateGuardCondition(rIdx, tIdx, cIdx, { operator: v }),
                              v => updateGuardCondition(rIdx, tIdx, cIdx, { value: v }),
                              () => removeGuardCondition(rIdx, tIdx, cIdx),
                              true
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => addGuardCondition(rIdx, tIdx)}
                        className="mt-2 text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1 font-medium transition-colors"
                      >
                        <PlusCircle className="w-3 h-3" />
                        添加适用条件
                      </button>
                    </div>

                    {/* Target conditions */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          达标条件
                        </span>
                        <span className="text-[10px] text-slate-400">
                          （同时满足以下全部条件时，此档次达标）
                        </span>
                      </div>
                      <div className="space-y-2 pl-1">
                        {tier.targetConditions.map((cond, cIdx) => (
                          <div key={cond.id} className="flex items-center gap-1.5">
                            {renderConditionRow(
                              cond,
                              v => updateTargetCondition(rIdx, tIdx, cIdx, { field: v }),
                              v => updateTargetCondition(rIdx, tIdx, cIdx, { operator: v }),
                              v => updateTargetCondition(rIdx, tIdx, cIdx, { value: v }),
                              () => removeTargetCondition(rIdx, tIdx, cIdx),
                              tier.targetConditions.length > 1
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => addTargetCondition(rIdx, tIdx)}
                        className="mt-2 text-xs text-emerald-600 hover:text-emerald-800 flex items-center gap-1 font-medium transition-colors"
                      >
                        <PlusCircle className="w-3 h-3" />
                        添加达标条件
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tier actions */}
              <div className="px-5 py-2 border-t border-slate-100 bg-slate-50/50 flex justify-between">
                <button
                  onClick={() => addTier(rIdx)}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  添加档次
                </button>
                {rule.tiers.length > 1 && (
                  <span className="text-[10px] text-slate-400 self-center">
                    满足任意一个档次即判定本规则达标
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Add rule button */}
          <button
            onClick={addRule}
            className="w-full py-3.5 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-medium flex items-center justify-center gap-2 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            添加新规则
          </button>
        </div>
      </div>
    </div>
  );
}
