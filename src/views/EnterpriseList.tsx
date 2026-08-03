import { useEffect, useState, useMemo, useRef } from 'react';
import { mockEnterprises } from '../data';
import type { Enterprise } from '../types';
import { Search, Filter, Download, Plus, Upload, X, Building2, User, MapPin, Receipt, Briefcase, FileText, Trash2, RotateCcw } from 'lucide-react';
import { utils, writeFile } from 'xlsx';

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

export function EnterpriseList() {
  const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | null>(null);
  const [editedData, setEditedData] = useState<Enterprise | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMode, setImportMode] = useState<'supplement' | 'overwrite'>('supplement');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedExportIds, setSelectedExportIds] = useState<string[]>([]);
  const [otherInfoDraft, setOtherInfoDraft] = useState<string[]>([]);
  const [isComposing, setIsComposing] = useState(false);
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

  // Derived options from data
  const provinceOptions = useMemo(() => [...new Set(mockEnterprises.map(e => e.province).filter(Boolean))].sort(), []);
  const cityOptions = useMemo(() => [...new Set(mockEnterprises.map(e => e.city || e.province).filter(Boolean))].sort(), []);
  const scaleOptions = useMemo(() => [...new Set(mockEnterprises.map(e => e.scale).filter(Boolean))].sort(), []);
  const techDomainOptions = useMemo(() => [...new Set(mockEnterprises.map(e => e.techDomain).filter(Boolean))].sort(), []);
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

      return true;
    });
  }, [filterProvince, filterCity, filterScale, filterTechDomain, filterType, filterRegCapital, filterEstablishment, filterRevenue]);

  // Check if any filter is active
  const hasActiveFilters = filterProvince || filterCity || filterScale || filterTechDomain || filterType || filterRegCapital || filterEstablishment || filterRevenue;

  const resetFilters = () => {
    setFilterProvince('');
    setFilterCity('');
    setFilterScale('');
    setFilterTechDomain('');
    setFilterType('');
    setFilterRegCapital('');
    setFilterEstablishment('');
    setFilterRevenue('');
  };

  useEffect(() => {
    if (editedData) {
      setOtherInfoDraft(editedData.coreProduct ? editedData.coreProduct.split('\n') : ['']);
    } else {
      setOtherInfoDraft([]);
    }
  }, [editedData]);

  const openEnterprise = (ent: Enterprise) => {
    setSelectedEnterprise(ent);
    setEditedData({ ...ent });
    setIsEditing(false);
  };

  const closeEnterprise = () => {
    setSelectedEnterprise(null);
    setEditedData(null);
    setIsEditing(false);
    setOtherInfoDraft([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (editedData) {
      setEditedData({ ...editedData, [e.target.name]: e.target.value });
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editedData) {
      setEditedData({ ...editedData, [e.target.name]: Number(e.target.value) });
    }
  };

  const syncOtherInfoToEditedData = () => {
    if (!editedData) return;
    setEditedData({ ...editedData, coreProduct: otherInfoDraft.filter(Boolean).join('\n') });
  };

  const handleOtherInfoChange = (index: number, value: string) => {
    if (!editedData) return;
    const items = [...otherInfoDraft];
    items[index] = value;
    setOtherInfoDraft(items);
  };

  const handleOtherInfoCompositionStart = () => {
    setIsComposing(true);
  };

  const handleOtherInfoCompositionEnd = (index: number, value: string) => {
    setIsComposing(false);
    const items = [...otherInfoDraft];
    items[index] = value;
    setOtherInfoDraft(items);
    syncOtherInfoToEditedData();
  };

  const addOtherInfoItem = () => {
    if (!editedData) return;
    const items = [...otherInfoDraft, ''];
    setOtherInfoDraft(items);
    setIsComposing(false);
  };

  const removeOtherInfoItem = (index: number) => {
    if (!editedData) return;
    const items = [...otherInfoDraft];
    items.splice(index, 1);
    if (items.length === 0) items.push('');
    setOtherInfoDraft(items);
    syncOtherInfoToEditedData();
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
                    filterType, filterRegCapital, filterEstablishment, filterRevenue,
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
                      onClick={() => openEnterprise(ent)}
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

      {/* Enterprise Detail Slide-over */}
      {selectedEnterprise && editedData && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 flex justify-end transition-opacity">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col transform transition-transform">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                {isEditing ? '编辑企业资料' : '企业详细档案'}
              </h2>
              <button 
                onClick={closeEnterprise}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Basic Info */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    基本工商信息
                  </h3>
                  {!isEditing && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded"
                    >
                      编辑资料
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  <div>
                    <div className="text-slate-500 mb-1">企业名称</div>
                    {isEditing ? (
                      <input name="name" value={editedData.name} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-2 py-1" />
                    ) : (
                      <div className="font-medium text-slate-900">{editedData.name}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">统一社会信用代码</div>
                    {isEditing ? (
                      <input name="creditCode" value={editedData.creditCode} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-2 py-1" />
                    ) : (
                      <div className="font-medium text-slate-900">{editedData.creditCode}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">法定代表人</div>
                    {isEditing ? (
                      <input name="legalRep" value={editedData.legalRep} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-2 py-1" />
                    ) : (
                      <div className="font-medium text-slate-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {editedData.legalRep}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">注册资本(万)</div>
                    {isEditing ? (
                      <input type="number" name="regCapital" value={editedData.regCapital} onChange={handleNumberChange} className="w-full border border-slate-300 rounded px-2 py-1" />
                    ) : (
                      <div className="font-medium text-slate-900">{editedData.regCapital}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">成立日期</div>
                    {isEditing ? (
                      <input name="regDate" value={editedData.regDate} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-2 py-1" placeholder="YYYY/MM/DD" />
                    ) : (
                      <div className="font-medium text-slate-900">{editedData.regDate}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">企业所属领域</div>
                    {isEditing ? (
                      <input name="techDomain" value={editedData.techDomain || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-2 py-1" placeholder="所属领域" />
                    ) : (
                      <div className="font-medium text-slate-900">{editedData.techDomain || editedData.industry || '未填写'}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">企业性质</div>
                    {isEditing ? (
                      <input name="nature" value={editedData.nature || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-2 py-1" placeholder="企业性质" />
                    ) : (
                      <div className="font-medium text-slate-900">{editedData.nature || '未填写'}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">企业类型</div>
                    {isEditing ? (
                      <input name="type" value={editedData.type || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-2 py-1" placeholder="企业类型" />
                    ) : (
                      <div className="font-medium text-slate-900">{editedData.type || '未填写'}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">规模</div>
                    {isEditing ? (
                      <input name="scale" value={editedData.scale || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-2 py-1" placeholder="规模" />
                    ) : (
                      <div className="font-medium text-slate-900">{editedData.scale || '未填写'}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">法定代表人手机</div>
                    {isEditing ? (
                      <input name="legalRepPhone" value={editedData.legalRepPhone || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-2 py-1" placeholder="手机号码" />
                    ) : (
                      <div className="font-medium text-slate-900">{editedData.legalRepPhone || '未填写'}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">法定代表人邮箱</div>
                    {isEditing ? (
                      <input name="legalRepEmail" value={editedData.legalRepEmail || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-2 py-1" placeholder="邮箱" />
                    ) : (
                      <div className="font-medium text-slate-900">{editedData.legalRepEmail || '未填写'}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">联系人姓名</div>
                    {isEditing ? (
                      <input name="contactName" value={editedData.contactName || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-2 py-1" placeholder="联系人姓名" />
                    ) : (
                      <div className="font-medium text-slate-900">{editedData.contactName || '未填写'}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">联系人手机</div>
                    {isEditing ? (
                      <input name="contactPhone" value={editedData.contactPhone || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-2 py-1" placeholder="联系人手机" />
                    ) : (
                      <div className="font-medium text-slate-900">{editedData.contactPhone || '未填写'}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">联系人邮箱</div>
                    {isEditing ? (
                      <input name="contactEmail" value={editedData.contactEmail || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-2 py-1" placeholder="联系人邮箱" />
                    ) : (
                      <div className="font-medium text-slate-900">{editedData.contactEmail || '未填写'}</div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <div className="text-slate-500 mb-1">注册地址</div>
                    {isEditing ? (
                      <input name="address" value={editedData.address} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-2 py-1" />
                    ) : (
                      <div className="font-medium text-slate-900 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                        {editedData.address}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <hr className="border-slate-100" />

              {/* Innovation & Finance */}
              <section>
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-slate-500" />
                  创新投入与经营指标
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold text-slate-800 mb-3">创新投入</div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-slate-500 mb-1">2025年从业人员数量</div>
                          {isEditing ? (
                            <input type="number" name="personnel2025" value={editedData.personnel2025 ?? editedData.employeeCountLastYear} onChange={handleNumberChange} className="w-full border border-slate-300 rounded px-2 py-1" />
                          ) : (
                            <div className="font-medium text-slate-900">{editedData.personnel2025 ?? editedData.employeeCountLastYear} 人</div>
                          )}
                        </div>
                        <div>
                          <div className="text-slate-500 mb-1">2025年研发人员数量</div>
                          {isEditing ? (
                            <input type="number" name="rdPersonnel2025" value={editedData.rdPersonnel2025 ?? editedData.rdEmployeeCountLastYear} onChange={handleNumberChange} className="w-full border border-slate-300 rounded px-2 py-1" />
                          ) : (
                            <div className="font-medium text-slate-900">{editedData.rdPersonnel2025 ?? editedData.rdEmployeeCountLastYear} 人</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold text-slate-800 mb-3">创新产出</div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <div className="text-slate-500 mb-1">发明专利授权数量</div>
                          {isEditing ? (
                            <input type="number" name="patentsInvention2025" value={editedData.patentsInvention2025 ?? editedData.patentsInvention} onChange={handleNumberChange} className="w-full border border-slate-300 rounded px-2 py-1" />
                          ) : (
                            <div className="font-medium text-slate-900">{editedData.patentsInvention2025 ?? editedData.patentsInvention}</div>
                          )}
                        </div>
                        <div>
                          <div className="text-slate-500 mb-1">实用新型专利数量</div>
                          {isEditing ? (
                            <input type="number" name="patentsUtility2025" value={editedData.patentsUtility2025 ?? editedData.patentsUtility} onChange={handleNumberChange} className="w-full border border-slate-300 rounded px-2 py-1" />
                          ) : (
                            <div className="font-medium text-slate-900">{editedData.patentsUtility2025 ?? editedData.patentsUtility}</div>
                          )}
                        </div>
                        <div>
                          <div className="text-slate-500 mb-1">软件著作权数量</div>
                          {isEditing ? (
                            <input type="number" name="softwareCopyrights2025" value={editedData.softwareCopyrights2025 ?? editedData.softwareCopyrights} onChange={handleNumberChange} className="w-full border border-slate-300 rounded px-2 py-1" />
                          ) : (
                            <div className="font-medium text-slate-900">{editedData.softwareCopyrights2025 ?? editedData.softwareCopyrights}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-800 mb-3">经营与研发</div>
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-slate-600">指标</th>
                            <th className="px-3 py-2 text-center font-semibold text-slate-600">2025</th>
                            <th className="px-3 py-2 text-center font-semibold text-slate-600">2024</th>
                            <th className="px-3 py-2 text-center font-semibold text-slate-600">2023</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-slate-100">
                            <td className="px-3 py-2 text-slate-700">销售收入</td>
                            <td className="px-3 py-2 text-center font-medium text-slate-900">
                              {isEditing ? (
                                <input type="number" name="revenue2025" value={editedData.revenue2025 ?? editedData.revenueLastYear} onChange={handleNumberChange} className="w-full border border-slate-300 rounded px-2 py-1 text-center" />
                              ) : (
                                editedData.revenue2025 ?? editedData.revenueLastYear
                              )}
                            </td>
                            <td className="px-3 py-2 text-center font-medium text-slate-900">
                              {isEditing ? (
                                <input type="number" name="revenue2024" value={editedData.revenue2024 ?? ''} onChange={handleNumberChange} className="w-full border border-slate-300 rounded px-2 py-1 text-center" />
                              ) : (
                                editedData.revenue2024 ?? '-'
                              )}
                            </td>
                            <td className="px-3 py-2 text-center font-medium text-slate-900">
                              {isEditing ? (
                                <input type="number" name="revenue2023" value={editedData.revenue2023 ?? ''} onChange={handleNumberChange} className="w-full border border-slate-300 rounded px-2 py-1 text-center" />
                              ) : (
                                editedData.revenue2023 ?? '-'
                              )}
                            </td>
                          </tr>
                          <tr className="border-t border-slate-100">
                            <td className="px-3 py-2 text-slate-700">净资产</td>
                            <td className="px-3 py-2 text-center font-medium text-slate-900">
                              {isEditing ? (
                                <input type="number" name="netAsset2025" value={editedData.netAsset2025 ?? editedData.netAssetLastYear} onChange={handleNumberChange} className="w-full border border-slate-300 rounded px-2 py-1 text-center" />
                              ) : (
                                editedData.netAsset2025 ?? editedData.netAssetLastYear
                              )}
                            </td>
                            <td className="px-3 py-2 text-center font-medium text-slate-900">
                              {isEditing ? (
                                <input type="number" name="netAsset2024" value={editedData.netAsset2024 ?? ''} onChange={handleNumberChange} className="w-full border border-slate-300 rounded px-2 py-1 text-center" />
                              ) : (
                                editedData.netAsset2024 ?? '-'
                              )}
                            </td>
                            <td className="px-3 py-2 text-center font-medium text-slate-900">
                              {isEditing ? (
                                <input type="number" name="netAsset2023" value={editedData.netAsset2023 ?? ''} onChange={handleNumberChange} className="w-full border border-slate-300 rounded px-2 py-1 text-center" />
                              ) : (
                                editedData.netAsset2023 ?? '-'
                              )}
                            </td>
                          </tr>
                          <tr className="border-t border-slate-100">
                            <td className="px-3 py-2 text-slate-700">研发费用</td>
                            <td className="px-3 py-2 text-center font-medium text-slate-900">
                              {isEditing ? (
                                <input type="number" name="rdExpense2025" value={editedData.rdExpense2025 ?? editedData.rdExpenseLastYear} onChange={handleNumberChange} className="w-full border border-slate-300 rounded px-2 py-1 text-center" />
                              ) : (
                                editedData.rdExpense2025 ?? editedData.rdExpenseLastYear
                              )}
                            </td>
                            <td className="px-3 py-2 text-center font-medium text-slate-900">
                              {isEditing ? (
                                <input type="number" name="rdExpense2024" value={editedData.rdExpense2024 ?? ''} onChange={handleNumberChange} className="w-full border border-slate-300 rounded px-2 py-1 text-center" />
                              ) : (
                                editedData.rdExpense2024 ?? '-'
                              )}
                            </td>
                            <td className="px-3 py-2 text-center font-medium text-slate-900">
                              {isEditing ? (
                                <input type="number" name="rdExpense2023" value={editedData.rdExpense2023 ?? ''} onChange={handleNumberChange} className="w-full border border-slate-300 rounded px-2 py-1 text-center" />
                              ) : (
                                editedData.rdExpense2023 ?? '-'
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-slate-100" />

              {/* Other Info */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-500" />
                    其他信息
                  </h3>
                  {!isEditing && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded"
                    >
                      编辑资料
                    </button>
                  )}
                </div>
                <div className="space-y-4 text-sm">
                  <div>
                    <div className="text-slate-500 mb-2">核心产品/服务</div>
                    {isEditing ? (
                      <div className="space-y-2">
                        {otherInfoDraft.map((item, index) => (
                          <div key={`other-info-item-${index}`} className="flex items-center gap-2">
                            <input
                              value={item}
                              onChange={(e) => handleOtherInfoChange(index, e.target.value)}
                              onCompositionStart={handleOtherInfoCompositionStart}
                              onCompositionEnd={(e) => handleOtherInfoCompositionEnd(index, e.currentTarget.value)}
                              onBlur={syncOtherInfoToEditedData}
                              className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm"
                              placeholder={`核心产品/服务 ${index + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => removeOtherInfoItem(index)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addOtherInfoItem}
                          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          <Plus className="w-4 h-4" />
                          添加一项
                        </button>
                      </div>
                    ) : (
                      <div className="font-medium text-slate-900 bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                        {(editedData.coreProduct ? editedData.coreProduct.split('\n').filter(Boolean) : []).length > 0 ? (
                          editedData.coreProduct.split('\n').filter(Boolean).map((item, index) => (
                            <div key={`${item}-${index}`}>{item}</div>
                          ))
                        ) : (
                          <div>暂未填写其他信息</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">机构实缴股权融资累计金额 (万元)</div>
                    {isEditing ? (
                      <input type="number" name="financingAmount" value={editedData.financingAmount} onChange={handleNumberChange} className="w-full border border-slate-300 rounded px-2 py-1" />
                    ) : (
                      <div className="font-medium text-slate-900">{editedData.financingAmount}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">核心团队高层次人才数</div>
                    {isEditing ? (
                      <input type="number" name="highLevelTalent" value={editedData.highLevelTalent} onChange={handleNumberChange} className="w-full border border-slate-300 rounded px-2 py-1" />
                    ) : (
                      <div className="font-medium text-slate-900">{editedData.highLevelTalent} 人</div>
                    )}
                  </div>
                </div>
              </section>
            </div>
            
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={closeEnterprise}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-white bg-slate-50 transition-colors"
              >
                关闭
              </button>
              {isEditing && (
                <button 
                  onClick={() => {
                    // For demo purposes, we mutate the mock array and update local state
                    const idx = mockEnterprises.findIndex(e => e.id === editedData.id);
                    if (idx !== -1) mockEnterprises[idx] = { ...editedData };
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors"
                >
                  保存修改
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
