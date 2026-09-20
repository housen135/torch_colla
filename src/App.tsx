/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './views/Dashboard';
import { EnterpriseList } from './views/EnterpriseList';
import { RuleConfig } from './views/RuleConfig';
import { MatchResults } from './views/MatchResults';
import { OperationLogs } from './views/OperationLogs';
import { UserManagement } from './views/UserManagement';
import { CURRENT_USER } from './data';

export type ViewState = 'dashboard' | 'enterprises' | 'rules' | 'matching' | 'logs' | 'users';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const isAdmin = CURRENT_USER.role === 'admin';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900 selection:bg-blue-200">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} isAdmin={isAdmin} />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex-shrink-0 flex items-center px-8 justify-between z-10 shadow-sm">
          <h1 className="text-xl font-bold text-slate-800">
            {currentView === 'dashboard' && '系统总览'}
            {currentView === 'enterprises' && '企业项目资源库'}
            {currentView === 'rules' && '判定规则配置'}
            {currentView === 'matching' && '服务精准匹配结果'}
            {currentView === 'logs' && '操作日志记录'}
            {currentView === 'users' && '用户管理'}
          </h1>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm shadow-inner">
                火炬
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-tight text-slate-800">
                  {CURRENT_USER.name}
                </span>
                <span className="text-xs text-slate-500 leading-tight">{CURRENT_USER.department}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Scrollable Content area */}
        <div className="flex-1 overflow-y-auto p-8">
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'enterprises' && <EnterpriseList />}
          {currentView === 'rules' && <RuleConfig />}
          {currentView === 'matching' && <MatchResults />}
          {currentView === 'logs' && <OperationLogs />}
          {currentView === 'users' &&
            (isAdmin ? (
              <UserManagement />
            ) : (
              <div className="max-w-md mx-auto mt-24 bg-white rounded-xl border border-slate-200 p-8 text-center">
                <div className="text-slate-800 font-semibold mb-2">无权访问</div>
                <p className="text-sm text-slate-500">用户管理仅对系统管理员开放。</p>
              </div>
            ))}
        </div>
      </main>
    </div>
  );
}
