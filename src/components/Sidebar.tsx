import {
  LayoutDashboard,
  Settings2,
  CheckSquare,
  Database,
  ClipboardList,
  Users
} from 'lucide-react';
import type { ViewState } from '../App';

interface SidebarProps {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  isAdmin?: boolean;
}

export function Sidebar({ currentView, setCurrentView, isAdmin = false }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: '看板总览', icon: LayoutDashboard },
    { id: 'enterprises', label: '企业项目资源库', icon: Database },
    { id: 'rules', label: '判定规则配置', icon: Settings2 },
    { id: 'matching', label: '匹配结果展示', icon: CheckSquare },
    { id: 'logs', label: '操作日志记录', icon: ClipboardList },
  ];

  // 仅管理员可见
  const adminNavItems = [
    { id: 'users', label: '用户管理', icon: Users },
  ];

  const renderNav = (items: typeof navItems) => (
    <nav className="space-y-1">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setCurrentView(item.id as ViewState)}
          className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 ${
            currentView === item.id
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
              : 'hover:bg-slate-800 hover:text-white border border-transparent'
          }`}
        >
          <item.icon className={`w-5 h-5 mr-3 ${currentView === item.id ? 'text-blue-500' : 'text-slate-400'}`} />
          {item.label}
        </button>
      ))}
    </nav>
  );

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full shadow-xl z-20">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-bold text-white tracking-wide">火炬中心</span>
          <span className="text-sm font-medium text-slate-400">企业项目协同平台</span>
        </div>
      </div>

      <div className="p-4 flex-1">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">业务功能</div>
        {renderNav(navItems)}

        {isAdmin && (
          <>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-8 mb-4 px-2">系统管理</div>
            {renderNav(adminNavItems)}
          </>
        )}
      </div>

    </div>
  );
}
