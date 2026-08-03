import { useState, useMemo } from 'react';
import { mockEnterprises, mockTemplates } from '../data';
import { evaluateTemplate } from '../utils/ruleEngine';
import { PlayCircle, CheckCircle2, XCircle, Download, ListFilter } from 'lucide-react';

export function MatchResults() {
  const [templates] = useState(mockTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState(mockTemplates[0].id);
  const [hasRun, setHasRun] = useState(false);

  const template = templates.find(t => t.id === selectedTemplateId) || templates[0];

  const matchResults = useMemo(() => {
    if (!hasRun) return [];
    return evaluateTemplate(template, mockEnterprises);
  }, [hasRun, template]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">执行系统研判</h2>
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
            onClick={() => setHasRun(true)}
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
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Download className="w-4 h-4" />
            导出合格企业
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-900">
              <tr>
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
              {matchResults.map((result) => (
                <tr key={result.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800 whitespace-nowrap">{result.name}</td>
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
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        完全达标
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                        部分缺失
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
