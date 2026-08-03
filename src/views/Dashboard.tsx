import { useState } from 'react';
import { mockEnterprises } from '../data';
import type { Enterprise } from '../types';
import { Building2, Users, FileCheck, Zap, X, FileText, User, MapPin, Receipt } from 'lucide-react';

export function Dashboard() {
  const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | null>(null);

  const stats = [
    { label: '入库项目总数', value: mockEnterprises.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: '模板数量', value: mockEnterprises.filter(e => e.type === '高新技术').length, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: '本月补充数据', value: '12', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: '智能匹配次数', value: '1,284', icon: FileCheck, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 border border-slate-200 shadow-[0_8px_24px_rgba(15,23,42,0.06)] flex items-center justify-between hover:-translate-y-0.5 transition-transform duration-200">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-2 tracking-wide">{stat.label}</p>
              <h3 className="text-4xl font-bold text-slate-900">{stat.value}</h3>
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${stat.bg}`}>
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">最新入库企业</h3>
          <div className="space-y-4">
            {mockEnterprises.slice(0, 4).map((ent) => (
              <button
                key={ent.id}
                type="button"
                onClick={() => setSelectedEnterprise(ent)}
                className="w-full flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors text-left"
              >
                <div>
                  <p className="font-medium text-slate-900">{ent.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{ent.creditCode} · {ent.techDomain || '未分类'}</p>
                </div>
                <span className="px-3 py-1 bg-white text-slate-600 text-xs font-medium rounded-full border border-slate-200 shadow-sm">
                  {ent.scale}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">系统业务动态</h3>
          <div className="relative border-l border-slate-200 ml-3 space-y-6">
            <div className="pl-6 relative">
              <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[6.5px] top-1.5 shadow-[0_0_0_4px_rgba(59,130,246,0.2)]"></div>
              <p className="text-sm font-medium text-slate-900">执行智能匹配</p>
              <p className="text-sm text-slate-500 mt-1">「高新技术企业判定」模板完成311家企业的匹配</p>
              <p className="text-xs text-slate-400 mt-2">10 分钟前</p>
            </div>
            <div className="pl-6 relative">
              <div className="absolute w-3 h-3 bg-slate-300 rounded-full -left-[6.5px] top-1.5"></div>
              <p className="text-sm font-medium text-slate-900">数据补充录入</p>
              <p className="text-sm text-slate-500 mt-1">咨询事业部张XX完成了 15 家企业的数据补充</p>
              <p className="text-xs text-slate-400 mt-2">2 小时前</p>
            </div>
            <div className="pl-6 relative">
              <div className="absolute w-3 h-3 bg-slate-300 rounded-full -left-[6.5px] top-1.5"></div>
              <p className="text-sm font-medium text-slate-900">规则模板更新</p>
              <p className="text-sm text-slate-500 mt-1">新增规则模板「2025省科技型中小企业申报判定」</p>
              <p className="text-xs text-slate-400 mt-2">昨天</p>
            </div>
          </div>
        </div>
      </div>

      {selectedEnterprise && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-500">企业详情</p>
                <h3 className="text-lg font-semibold text-slate-900">{selectedEnterprise.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEnterprise(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <section>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
                  <FileText className="w-4 h-4 text-slate-500" />
                  基本信息
                </div>
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>法定代表人：{selectedEnterprise.legalRep}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-slate-400" />
                    <span>统一社会信用代码：{selectedEnterprise.creditCode}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{selectedEnterprise.address}</span>
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  产业与经营情况
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 space-y-2 text-sm text-slate-600">
                  <p>企业类型：{selectedEnterprise.type}</p>
                  <p>规模：{selectedEnterprise.scale}</p>
                  <p>产业领域：{selectedEnterprise.techDomain || '未分类'}</p>
                  <p>核心产品：{selectedEnterprise.coreProduct || '未填写'}</p>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
                  <Receipt className="w-4 h-4 text-slate-500" />
                  近年经营指标
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 space-y-2 text-sm text-slate-600">
                  <p>上年度营收：{selectedEnterprise.revenueLastYear} 万元</p>
                  <p>研发支出：{selectedEnterprise.rdExpenseLastYear} 万元</p>
                  <p>研发人员数量：{selectedEnterprise.rdEmployeeCountLastYear} 人</p>
                  <p>知识产权数量：发明专利 {selectedEnterprise.patentsInvention}，实用新型 {selectedEnterprise.patentsUtility}</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
