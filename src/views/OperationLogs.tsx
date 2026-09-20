import { mockLogs } from '../data';
import { History, Search, Filter, Calendar } from 'lucide-react';

// 审批类操作单独配色，便于与常规数据操作区分
const ACTION_STYLES: Record<string, string> = {
  '申请联系方式': 'bg-amber-50 text-amber-700 border-amber-100',
  '审批通过': 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

export function OperationLogs() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            操作日志记录
          </h2>
          <p className="text-sm text-slate-500">追踪系统内的资料补录、批量导入、模板配置及智能判定等重要操作行为。</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="搜索操作人、操作目标..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-colors">
            <Calendar className="w-4 h-4" />
            选择时间范围
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-colors">
            <Filter className="w-4 h-4" />
            筛选操作类型
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-white border-b border-slate-200 text-slate-900">
              <tr>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">操作时间</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">操作人 / 部门</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">操作类型</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">操作目标 / 对象</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">{log.timestamp}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900">{log.user}</div>
                    <div className="text-xs text-slate-500">{log.department}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium border ${ACTION_STYLES[log.action] ?? 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{log.target}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{log.details}</div>
                  </td>
                </tr>
              ))}
              {mockLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    暂无操作记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-sm text-slate-500">
          <div>共 {mockLogs.length} 条记录</div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-slate-300 rounded-md bg-white hover:bg-slate-50 disabled:opacity-50" disabled>上一页</button>
            <button className="px-3 py-1 border border-slate-300 rounded-md bg-white hover:bg-slate-50 disabled:opacity-50" disabled>下一页</button>
          </div>
        </div>
      </div>
    </div>
  );
}
