import { useState, useMemo, useEffect } from 'react';
import { mockEnterprises, mockTemplates } from '../data';
import { evaluateTemplate } from '../utils/ruleEngine';
import type { Enterprise } from '../types';
import { EnterpriseDetail } from '../components/EnterpriseDetail';
import { PlayCircle, CheckCircle2, XCircle, Download, ListFilter, AlertTriangle, RotateCcw, Send } from 'lucide-react';

export function MatchResults() {
  const [templates] = useState(mockTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState(mockTemplates[0].id);
  const [hasRun, setHasRun] = useState(false);
  const [passFilter, setPassFilter] = useState('');
  const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | null>(null);

  // 批量申请联系方式
  const [isApplying, setIsApplying] = useState(false);
  const [selectedApplyIds, setSelectedApplyIds] = useState<string[]>([]);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [toast, setToast] = useState('');

  const template = templates.find(t => t.id === selectedTemplateId) || templates[0];
  const enterpriseById = useMemo(() => new Map(mockEnterprises.map(e => [e.id, e])), []);

  const matchResults = useMemo(() => {
    if (!hasRun) return [];
    return evaluateTemplate(template, mockEnterprises);
  }, [hasRun, template]);

  // 达标个数分布，用于筛选下拉
  const passDistribution = useMemo(() => {
    const counts = new Map<number, number>();
    for (const r of matchResults) {
      counts.set(r.passCount, (counts.get(r.passCount) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[0] - a[0]);
  }, [matchResults]);

  const filteredResults = useMemo(() => {
    if (passFilter === '') return matchResults;
    return matchResults.filter(r => String(r.passCount) === passFilter);
  }, [matchResults, passFilter]);

  const perfectCount = matchResults.filter(r => r.isPerfectMatch).length;

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleRun = () => {
    setHasRun(true);
    setPassFilter('');
    setIsApplying(false);
    setSelectedApplyIds([]);
  };

  const toggleApplySelection = (id: string) => {
    setSelectedApplyIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleApplyClick = () => {
    if (!isApplying) {
      setIsApplying(true);
      setSelectedApplyIds([]);
      return;
    }

    if (selectedApplyIds.length === 0) {
      window.alert('请选择至少一家企业进行申请');
      return;
    }

    setAppliedIds(prev => [...new Set([...prev, ...selectedApplyIds])]);
    setToast('您的申请已提交');
    setIsApplying(false);
    setSelectedApplyIds([]);
  };

  const markApplied = (id: string) => {
    setAppliedIds(prev => (prev.includes(id) ? prev : [...prev, id]));
  };

  const columnCount = template.rules.length + 3 + (isApplying ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">执行智能研判</h2>
          <p className="text-sm text-slate-500">选择规则模板并对项目库企业进行批量自动匹配分析。</p>
        </div>
        <div className="flex gap-4 items-center">
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            {templates.map(t => (
              <option key={t.id} value={t.id}>模板：{t.name}</option>
            ))}
          </select>
          <button
            onClick={handleRun}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md transition-all"
          >
            <PlayCircle className="w-5 h-5" />
            开始全库匹配
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-slate-500" />
            匹配结果汇总
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 whitespace-nowrap">达标个数</span>
              <select
                value={passFilter}
                disabled={!hasRun}
                onChange={(e) => setPassFilter(e.target.value)}
                className={`px-3 py-1.5 border rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400 ${
                  passFilter ? 'border-blue-300 text-blue-700 font-medium' : 'border-slate-200 text-slate-700'
                }`}
              >
                <option value="">不限</option>
                {passDistribution.map(([count, num]) => (
                  <option key={count} value={String(count)}>
                    达标 {count} 项（{num} 家）
                  </option>
                ))}
              </select>
            </div>
            {passFilter !== '' && (
              <button
                onClick={() => setPassFilter('')}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                重置筛选
              </button>
            )}
            <button
              onClick={handleApplyClick}
              disabled={!hasRun}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 ${
                isApplying
                  ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Send className="w-4 h-4" />
              {isApplying
                ? `提交申请${selectedApplyIds.length > 0 ? `（${selectedApplyIds.length}）` : ''}`
                : '批量申请'}
            </button>
            {isApplying && (
              <button
                onClick={() => {
                  setIsApplying(false);
                  setSelectedApplyIds([]);
                }}
                className="text-sm font-medium text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded"
              >
                取消
              </button>
            )}
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Download className="w-4 h-4" />
              导出合格企业
            </button>
          </div>
        </div>

        {isApplying && (
          <div className="flex items-center justify-between border-b border-slate-200 bg-blue-50 px-6 py-3 text-sm text-slate-700">
            <div>勾选需要申请联系方式的企业，提交后即可查看联系人信息</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedApplyIds(filteredResults.map(r => r.id))}
                className="px-3 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50"
              >
                全选当前页
              </button>
              <button
                onClick={() => setSelectedApplyIds([])}
                className="px-3 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50"
              >
                清空
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-900">
              <tr>
                {isApplying && <th className="px-4 py-4 w-10"></th>}
                <th className="px-6 py-4 font-semibold whitespace-nowrap">企业名称</th>
                <th className="px-6 py-4 font-semibold text-center whitespace-nowrap">达标项/总项</th>
                {template.rules.map((rule, idx) => (
                  <th key={rule.id} className="px-6 py-4 font-semibold text-center whitespace-nowrap">
                    <div className="flex flex-col items-center">
                      <span>规则{idx + 1}: {rule.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal mt-0.5">{rule.description}</span>
                    </div>
                  </th>
                ))}
                <th className="px-6 py-4 font-semibold text-center whitespace-nowrap">综合判定结论</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResults.map((result) => (
                <tr
                  key={result.id}
                  onClick={() => {
                    if (isApplying) {
                      toggleApplySelection(result.id);
                      return;
                    }
                    const ent = enterpriseById.get(result.id);
                    if (ent) setSelectedEnterprise(ent);
                  }}
                  className={`even:bg-slate-50/60 transition-colors cursor-pointer ${
                    isApplying && selectedApplyIds.includes(result.id) ? 'bg-blue-50/70' : 'hover:bg-blue-50/50'
                  }`}
                >
                  {isApplying && (
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedApplyIds.includes(result.id)}
                        onChange={() => toggleApplySelection(result.id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 font-medium text-slate-800 whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isApplying) {
                          toggleApplySelection(result.id);
                          return;
                        }
                        const ent = enterpriseById.get(result.id);
                        if (ent) setSelectedEnterprise(ent);
                      }}
                      className="font-medium text-slate-800 hover:text-blue-700 hover:underline underline-offset-4"
                    >
                      {result.name}
                    </button>
                    {appliedIds.includes(result.id) && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500">
                        已申请
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center font-medium whitespace-nowrap">
                    <span className={result.isPerfectMatch ? 'text-emerald-600' : 'text-slate-600'}>
                      {result.passCount} / {result.totalRules}
                    </span>
                  </td>
                  {template.rules.map(rule => (
                    <td key={rule.id} className="px-6 py-4 text-center whitespace-nowrap">
                      {result.resultsByRule[rule.id] ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-500 mx-auto" />
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    {result.isPerfectMatch ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        完全达标
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        部分缺失
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {hasRun && filteredResults.length === 0 && (
                <tr>
                  <td colSpan={columnCount} className="px-6 py-16 text-center text-slate-500">
                    当前筛选条件下没有匹配的企业
                  </td>
                </tr>
              )}
              {!hasRun && (
                <tr>
                  <td colSpan={columnCount} className="px-6 py-16 text-center text-slate-500">
                    尚未执行匹配，请选择模板后点击「开始全库匹配」
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-sm text-slate-500">
          <div>
            共 {matchResults.length} 家企业，其中完全达标 {perfectCount} 家
            {passFilter !== '' && `；当前筛选显示 ${filteredResults.length} 家`}
            {appliedIds.length > 0 && `；已申请联系方式 ${appliedIds.length} 家`}
          </div>
          <div className="text-xs text-slate-400">点击企业名称可查看企业详细档案</div>
        </div>
      </div>

      <EnterpriseDetail
        enterprise={selectedEnterprise}
        onClose={() => setSelectedEnterprise(null)}
        maskedContacts
        contactApplied={selectedEnterprise ? appliedIds.includes(selectedEnterprise.id) : false}
        onApplyContacts={() => {
          if (selectedEnterprise) markApplied(selectedEnterprise.id);
        }}
      />

      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[60] px-5 py-2.5 rounded-lg bg-slate-800 text-white text-sm shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
