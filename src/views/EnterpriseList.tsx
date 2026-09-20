import { useEffect, useState, useMemo, useRef } from 'react';
import { mockEnterprises } from '../data';
import type { Enterprise } from '../types';
import { Search, Filter, Download, Plus, Upload, X, RotateCcw } from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import { EnterpriseDetail } from '../components/EnterpriseDetail';

const REG_CAPITAL_RANGES = [
  { label: '100万以下', min: 0, max: 100 },
  { label: '100-500万', min: 100, max: 500 },
  { label: '500-1000万', min: 500, max: 1000 },
  { label: '1000-2000万', min: 1000, max: 2000 },
  { label: '2000-5000万', min: 2000, max: 5000 },
  { label: '5000万以上', min: 5000, max: Infinity },
];

const ESTABLISHMENT_RANGES = [
  { label: '1年以内', min: 0, max: 1 },
  { label: '1-3年', min: 1, max: 3 },
  { label: '3-5年', min: 3, max: 5 },
  { label: '5-10年', min: 5, max: 10 },
  { label: '10年以上', min: 10, max: Infinity },
];

const REVENUE_RANGES = [
  { label: '100万以下', min: 0, max: 100 },
  { label: '100-500万', min: 100, max: 500 },
  { label: '500-1000万', min: 500, max: 1000 },
  { label: '1000-2000万', min: 1000, max: 2000 },
  { label: '2000-5000万', min: 2000, max: 5000 },
  { label: '5000万-1亿', min: 5000, max: 10000 },
  { label: '1亿以上', min: 10000, max: Infinity },
];

interface MissingFieldOption {
  label: string;
  key: string;
  isMissing: (ent: Enterprise) => boolean;
}

const MISSING_FIELD_OPTIONS: MissingFieldOption[] = [
  { label: '联系人', key: 'contact', isMissing: (ent) => !ent.contactName && !ent.legalRepPhone },
  { label: '创新投入', key: 'rdExpense', isMissing: (ent) => !ent.rdExpenseLastYear && !ent.rdExpense2025 },
  { label: '创新产出', key: 'patents', isMissing: (ent) => !ent.patentsInvention && !ent.patentsUtility && !ent.softwareCopyrights },
  { label: '创新发展', key: 'techDomain', isMissing: (ent) => !ent.techDomain },
  { label: '核心产品名称', key: 'coreProduct', isMissing: (ent) => !ent.coreProduct },
  { label: '机构实缴股权融资累计金额', key: 'financingAmount', isMissing: (ent) => !ent.financingAmount },
  { label: '核心团队杭州市D类及以上高层次人才', key: 'highLevelTalent', isMissing: (ent) => !ent.highLevelTalent },
];

export function EnterpriseList() {
  const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMode, setImportMode] = useState<'supplement' | 'overwrite'>('supplement');
  const [importBatch, setImportBatch] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedExportIds, setSelectedExportIds] = useState<string[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [filterProvince, setFilterProvince] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterScale, setFilterScale] = useState('');
  const [filterTechDomain, setFilterTechDomain] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterRegCapital, setFilterRegCapital] = useState('');
  const [filterEstablishment, setFilterEstablishment] = useState('');
  const [filterRevenue, setFilterRevenue] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterMissingFields, setFilterMissingFields] = useState<string[]>([]);

  // Derived options from data
  const provinceOptions = useMemo(() => [...new Set(mockEnterprises.map(e => e.province).filter(Boolean))].sort(), []);
  const cityOptions = useMemo(() => [...new Set(mockEnterprises.map(e => e.city || e.province).filter(Boolean))].sort(), []);
  const scaleOptions = useMemo(() => [...new Set(mockEnterprises.map(e => e.scale).filter(Boolean))].sort(), []);
  const techDomainOptions = useMemo(() => [...new Set(mockEnterprises.map(e => e.techDomain).filter(Boolean))].sort(), []);
  const batchOptions = useMemo(() => [...new Set(mockEnterprises.map(e => e.batch).filter(Boolean))].sort(), []);
  const typeOptions = useMemo(() => [...new Set(mockEnterprises.map(e => e.type).filter(Boolean))].sort(), []);

  // Close filter panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterPanel(false);
      }
    };
    if (showFilterPanel) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFilterPanel]);

  // Compute years since establishment
  const getEstablishedYears = (regDate: string) => {
    if (!regDate) return -1;
    const d = new Date(regDate);
    if (isNaN(d.getTime())) return -1;
    const now = new Date('2026-07-31');
    return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  };

  // Filter enterprises
  const filteredEnterprises = useMemo(() => {
    return mockEnterprises.filter(ent => {
      if (filterProvince && ent.province !== filterProvince) return false;
      if (filterCity && (ent.city || ent.province) !== filterCity) return false;
      if (filterScale && ent.scale !== filterScale) return false;
      if (filterTechDomain && ent.techDomain !== filterTechDomain) return false;
      if (filterType && ent.type !== filterType) return false;

      if (filterRegCapital) {
        const range = REG_CAPITAL_RANGES.find(r => r.label === filterRegCapital);
        if (range) {
          if (ent.regCapital < range.min) return false;
          if (range.max !== Infinity && ent.regCapital >= range.max) return false;
        }
      }

      if (filterEstablishment) {
        const range = ESTABLISHMENT_RANGES.find(r => r.label === filterEstablishment);
        if (range) {
          const years = getEstablishedYears(ent.regDate);
          if (years < range.min) return false;
          if (range.max !== Infinity && years >= range.max) return false;
        }
      }

      if (filterRevenue) {
        const range = REVENUE_RANGES.find(r => r.label === filterRevenue);
        const rev = ent.revenue2025 ?? ent.revenueLastYear;
        if (range) {
          if (rev < range.min) return false;
          if (range.max !== Infinity && rev >= range.max) return false;
        }
      }

      if (filterBatch && ent.batch !== filterBatch) return false;

      if (filterMissingFields.length > 0) {
        const hasMissing = filterMissingFields.some(fieldKey => {
          const option = MISSING_FIELD_OPTIONS.find(o => o.key === fieldKey);
          return option ? option.isMissing(ent) : false;
        });
        if (!hasMissing) return false;
      }

      return true;
    });
  }, [filterProvince, filterCity, filterScale, filterTechDomain, filterType, filterRegCapital, filterEstablishment, filterRevenue, filterBatch, filterMissingFields]);

  // Check if any filter is active
  const hasActiveFilters = filterProvince || filterCity || filterScale || filterTechDomain || filterType || filterRegCapital || filterEstablishment || filterRevenue || filterBatch || filterMissingFields.length > 0;

  const resetFilters = () => {
    setFilterProvince('');
    setFilterCity('');
    setFilterScale('');
    setFilterTechDomain('');
    setFilterType('');
    setFilterRegCapital('');
    setFilterEstablishment('');
    setFilterRevenue('');
    setFilterBatch('');
    setFilterMissingFields([]);
  };

  const toggleExportSelection = (id: string) => {
    setSelectedExportIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportClick = () => {
    if (!isExporting) {
      setIsExporting(true);
      setSelectedExportIds([]);
      return;
    }

    if (selectedExportIds.length === 0) {
      window.alert('请选择至少一家企业进行导出');
      return;
    }

    const exportRows = filteredEnterprises
      .filter((ent) => selectedExportIds.includes(ent.id))
      .map((ent) => ({
        企业名称: ent.name,
        统一社会信用代码: ent.creditCode,
        法定代表人: ent.legalRep,
        城市: ent.city || ent.province || '-',
        规模: ent.scale,
        企业类型: ent.type,
        产业领域: ent.techDomain || '未分类',
        核心产品: ent.coreProduct || '-',
        上年度营收: ent.revenueLastYear,
      }));

    const worksheet = utils.json_to_sheet(exportRows);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, '企业列表');
    writeFile(workbook, '企业列表.xlsx');

    setIsExporting(false);
    setSelectedExportIds([]);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 relative">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex gap-4 items-center flex-1">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="搜索企业名称 / 统一社会信用代码" 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
          </div>
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilterPanel(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                hasActiveFilters
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              高级筛选
              {hasActiveFilters && (
                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
                  {[
                    filterProvince, filterCity, filterScale, filterTechDomain,
                    filterType, filterRegCapital, filterEstablishment, filterRevenue, filterBatch,
                    ...filterMissingFields,
                  ].filter(Boolean).length}
                </span>
              )}
            </button>

            {showFilterPanel && (
              <div className="absolute top-full left-0 mt-2 w-[680px] bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-slate-900">高级筛选</h4>
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    重置筛选
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-x-5 gap-y-4">
                  {/* 省份 */}
                  <div>
                    <div className="text-xs text-slate-500 mb-1.5">省份</div>
                    <select
                      value={filterProvince}
                      onChange={e => setFilterProvince(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      <option value="">不限</option>
                      {provinceOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  {/* 城市 */}
                  <div>
                    <div className="text-xs text-slate-500 mb-1.5">城市</div>
                    <select
                      value={filterCity}
                      onChange={e => setFilterCity(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      <option value="">不限</option>
                      {cityOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  {/* 规模 */}
                  <div>
                    <div className="text-xs text-slate-500 mb-1.5">规模</div>
                    <select
                      value={filterScale}
                      onChange={e => setFilterScale(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      <option value="">不限</option>
                      {scaleOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  {/* 企业所属领域 */}
                  <div>
                    <div className="text-xs text-slate-500 mb-1.5">企业所属领域</div>
                    <select
                      value={filterTechDomain}
                      onChange={e => setFilterTechDomain(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      <option value="">不限</option>
                      {techDomainOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  {/* 企业类型 */}
                  <div>
                    <div className="text-xs text-slate-500 mb-1.5">企业类型</div>
                    <select
                      value={filterType}
                      onChange={e => setFilterType(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      <option value="">不限</option>
                      {typeOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  {/* 注册资本金 */}
                  <div>
                    <div className="text-xs text-slate-500 mb-1.5">注册资本金</div>
                    <select
                      value={filterRegCapital}
                      onChange={e => setFilterRegCapital(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      <option value="">不限</option>
                      {REG_CAPITAL_RANGES.map(r => <option key={r.label} value={r.label}>{r.label}</option>)}
                    </select>
                  </div>

                  {/* 成立年限 */}
                  <div>
                    <div className="text-xs text-slate-500 mb-1.5">成立年限</div>
                    <select
                      value={filterEstablishment}
                      onChange={e => setFilterEstablishment(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      <option value="">不限</option>
                      {ESTABLISHMENT_RANGES.map(r => <option key={r.label} value={r.label}>{r.label}</option>)}
                    </select>
                  </div>

                  {/* 营业收入 */}
                  <div>
                    <div className="text-xs text-slate-500 mb-1.5">营业收入</div>
                    <select
                      value={filterRevenue}
                      onChange={e => setFilterRevenue(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      <option value="">不限</option>
                      {REVENUE_RANGES.map(r => <option key={r.label} value={r.label}>{r.label}</option>)}
                    </select>
                  </div>

                  {/* 批次 */}
                  <div>
                    <div className="text-xs text-slate-500 mb-1.5">批次</div>
                    <select
                      value={filterBatch}
                      onChange={e => setFilterBatch(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      <option value="">不限</option>
                      {batchOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  {/* 缺失字段 */}
                  <div className="col-span-3">
                    <div className="text-xs text-slate-500 mb-2">缺失项筛选</div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {MISSING_FIELD_OPTIONS.map(opt => (
                        <label key={opt.key} className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer hover:text-slate-900">
                          <input
                            type="checkbox"
                            checked={filterMissingFields.includes(opt.key)}
                            onChange={() => {
                              setFilterMissingFields(prev =>
                                prev.includes(opt.key)
                                  ? prev.filter(k => k !== opt.key)
                                  : [...prev, opt.key]
                              );
                            }}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setShowFilterPanel(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors"
                  >
                    确认筛选
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleExportClick}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? '导出已选' : '导出数据'}
          </button>
          {isExporting && (
            <button
              onClick={() => {
                setIsExporting(false);
                setSelectedExportIds([]);
              }}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              取消
            </button>
          )}
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Upload className="w-4 h-4" />
            批量导入
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 shadow-sm">
            <Plus className="w-4 h-4" />
            单笔录入
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isExporting && (
          <div className="flex items-center justify-between border-b border-slate-200 bg-blue-50 px-4 py-3 text-sm text-slate-700">
            <div>请选择当前页面中的企业，随后下载 Excel</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedExportIds(filteredEnterprises.map((ent) => ent.id))}
                className="px-3 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50"
              >
                全选当前页
              </button>
              <button
                onClick={() => setSelectedExportIds([])}
                className="px-3 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50"
              >
                清空
              </button>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-900">
              <tr>
                {isExporting && <th className="px-4 py-4 font-semibold w-10"></th>}
                <th className="px-6 py-4 font-semibold">企业名称</th>
                <th className="px-6 py-4 font-semibold">统一社会信用代码</th>
                <th className="px-6 py-4 font-semibold">法定代表人</th>
                <th className="px-6 py-4 font-semibold">城市</th>
                <th className="px-6 py-4 font-semibold">规模</th>
                <th className="px-6 py-4 font-semibold text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEnterprises.map((ent) => (
                <tr key={ent.id} className="hover:bg-slate-50/50 transition-colors">
                  {isExporting && (
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedExportIds.includes(ent.id)}
                        onChange={() => toggleExportSelection(ent.id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{ent.name}</div>
                    <div className="text-xs text-slate-400 mt-1">{ent.techDomain || '未分类'}</div>
                  </td>
                  <td className="px-6 py-4">{ent.creditCode}</td>
                  <td className="px-6 py-4">{ent.legalRep}</td>
                  <td className="px-6 py-4">{ent.city || ent.province || '-'}</td>
                  <td className="px-6 py-4">{ent.scale}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setSelectedEnterprise(ent)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-sm text-slate-500">
          <div>共 {filteredEnterprises.length} 条存量数据</div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-white disabled:opacity-50" disabled>上一页</button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">1</button>
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-white disabled:opacity-50" disabled>下一页</button>
          </div>
        </div>
      </div>

      <EnterpriseDetail
        enterprise={selectedEnterprise}
        onClose={() => setSelectedEnterprise(null)}
      />

      {/* Batch Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">批量导入企业项目</h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 hover:border-blue-400 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-blue-500 mb-3" />
                <p className="text-sm font-medium text-slate-900 mb-1">点击或拖拽文件到此处</p>
                <p className="text-xs text-slate-500">支持 Excel 或 CSV 格式，最大 10MB</p>
              </div>
              <div className="flex justify-between items-center text-sm">
                <a href="#" className="text-blue-600 hover:underline">下载导入数据模板</a>
                <span className="text-slate-500">已有 5 条记录</span>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-700">批次 <span className="text-red-500">*</span></p>
                <input
                  type="text"
                  value={importBatch}
                  onChange={e => setImportBatch(e.target.value)}
                  placeholder="请输入批次，如：2026年8月批次"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <p className="text-xs font-semibold text-slate-700">导入模式 <span className="text-red-500">*</span></p>
                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-slate-50"
                  style={{ borderColor: importMode === 'supplement' ? '#2563eb' : '#d1d5db', backgroundColor: importMode === 'supplement' ? '#eff6ff' : 'transparent' }}>
                  <input
                    type="radio"
                    name="importMode"
                    value="supplement"
                    checked={importMode === 'supplement'}
                    onChange={() => setImportMode('supplement')}
                    className="w-4 h-4 text-blue-600 accent-blue-600"
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-900">补充模式</div>
                    <div className="text-xs text-slate-500">导入数据仅更新库中已有企业的缺失字段，不影响已有数据</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-slate-50"
                  style={{ borderColor: importMode === 'overwrite' ? '#2563eb' : '#d1d5db', backgroundColor: importMode === 'overwrite' ? '#eff6ff' : 'transparent' }}>
                  <input
                    type="radio"
                    name="importMode"
                    value="overwrite"
                    checked={importMode === 'overwrite'}
                    onChange={() => setImportMode('overwrite')}
                    className="w-4 h-4 text-blue-600 accent-blue-600"
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-900">更新模式</div>
                    <div className="text-xs text-slate-500">导入数据会覆盖库中已有企业的对应字段</div>
                  </div>
                </label>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
                取消
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors">
                开始导入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
