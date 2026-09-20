import { useMemo, useState } from 'react';
import { mockContactRequests } from '../data';
import type { ContactRequest, ContactRequestStatus } from '../types';
import { ShieldCheck, Clock, CheckCircle2, XCircle } from 'lucide-react';

const STATUS_META: Record<ContactRequestStatus, { label: string; icon: typeof Clock; cls: string }> = {
  pending:  { label: '待审批',  icon: Clock,         cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: '已通过',  icon: CheckCircle2,  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: '未通过',  icon: XCircle,       cls: 'bg-slate-100 text-slate-500 border-slate-200' },
};

const FILTERS: { key: ContactRequestStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待审批' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '未通过' },
];

export function UserManagement() {
  const [requests, setRequests] = useState<ContactRequest[]>(mockContactRequests);
  const [statusFilter, setStatusFilter] = useState<ContactRequestStatus | 'all'>('all');

  const counts = useMemo(() => ({
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  }), [requests]);

  const visibleRequests = useMemo(
    () => (statusFilter === 'all' ? requests : requests.filter(r => r.status === statusFilter)),
    [requests, statusFilter]
  );

  const handleReview = (id: string, status: ContactRequestStatus) => {
    setRequests(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 pt-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              用户管理
            </h2>
            <p className="text-sm text-slate-500">
              审批各业务部门提交的联系人查看申请，通过后申请人即可查看对应企业的联系人与联系方式。
            </p>
          </div>
        </div>

        {/* 审批概况：待审批为强调项 */}
        <div className="flex items-end gap-12 px-6 pt-6 pb-5">
          <div>
            <div className="text-4xl font-bold text-amber-600 leading-none">{counts.pending}</div>
            <div className="text-xs text-slate-500 mt-2">待审批</div>
          </div>
          <div className="pl-12 border-l border-slate-200">
            <div className="text-xl font-semibold text-slate-700 leading-none">{counts.approved}</div>
            <div className="text-xs text-slate-500 mt-2">已通过</div>
          </div>
          <div className="pl-12 border-l border-slate-200">
            <div className="text-xl font-semibold text-slate-700 leading-none">{counts.rejected}</div>
            <div className="text-xs text-slate-500 mt-2">未通过</div>
          </div>
        </div>

        <div className="px-6 pb-4 flex gap-1 border-b border-slate-200">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                statusFilter === f.key
                  ? 'bg-slate-900 text-white font-medium'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
              <span className={`ml-1.5 text-xs ${statusFilter === f.key ? 'text-slate-300' : 'text-slate-400'}`}>
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-900">
              <tr>
                <th className="px-6 py-4 font-semibold">公司名称</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">申请时间</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">申请人</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">状态</th>
                <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRequests.map(req => {
                const meta = STATUS_META[req.status];
                const StatusIcon = meta.icon;
                return (
                  <tr key={req.id} className="even:bg-slate-50/60 hover:bg-blue-50/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{req.company}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">{req.appliedAt}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-slate-900">{req.applicant}</span>
                      <span className="text-xs text-slate-400 ml-2">{req.department}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${meta.cls}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {req.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleReview(req.id, 'approved')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            通过
                          </button>
                          <button
                            onClick={() => handleReview(req.id, 'rejected')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-rose-200 text-rose-700 bg-white hover:bg-rose-50 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            不通过
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">已处理</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {visibleRequests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                    当前状态下暂无申请记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 text-sm text-slate-500">
          共 {visibleRequests.length} 条申请记录
          {statusFilter !== 'all' && `（已按「${FILTERS.find(f => f.key === statusFilter)?.label}」筛选）`}
        </div>
      </div>
    </div>
  );
}
