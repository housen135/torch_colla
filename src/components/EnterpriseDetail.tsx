import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { mockEnterprises } from '../data';
import type { Enterprise } from '../types';
import { X, Building2, User, MapPin, Receipt, Briefcase, FileText, Trash2, Plus } from 'lucide-react';

interface EnterpriseDetailProps {
  enterprise: Enterprise | null;
  onClose: () => void;
  /** 联系方式脱敏展示，并提供「申请」查看按钮（匹配结果页使用） */
  maskedContacts?: boolean;
  /** 该企业是否已提交过联系方式申请（受控，用于批量申请后同步状态） */
  contactApplied?: boolean;
  onApplyContacts?: () => void;
}

const CONTACT_MASK = '**********';

export function EnterpriseDetail({
  enterprise,
  onClose,
  maskedContacts = false,
  contactApplied,
  onApplyContacts,
}: EnterpriseDetailProps) {
  const [editedData, setEditedData] = useState<Enterprise | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [otherInfoDraft, setOtherInfoDraft] = useState<string[]>([]);
  const [isComposing, setIsComposing] = useState(false);
  const [localApplied, setLocalApplied] = useState(false);
  const [toast, setToast] = useState('');

  const isContactApplied = contactApplied ?? localApplied;

  useEffect(() => {
    if (enterprise) {
      setEditedData({ ...enterprise });
      setIsEditing(false);
      setLocalApplied(false);
      setToast('');
    } else {
      setEditedData(null);
      setIsEditing(false);
      setOtherInfoDraft([]);
      setLocalApplied(false);
      setToast('');
    }
  }, [enterprise]);

  useEffect(() => {
    if (editedData) {
      setOtherInfoDraft(editedData.coreProduct ? editedData.coreProduct.split('\n') : ['']);
    } else {
      setOtherInfoDraft([]);
    }
  }, [editedData]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!enterprise || !editedData) return null;

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditedData({ ...editedData, [e.target.name]: e.target.value });
  };

  const handleNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditedData({ ...editedData, [e.target.name]: Number(e.target.value) });
  };

  const syncOtherInfoToEditedData = () => {
    setEditedData({ ...editedData, coreProduct: otherInfoDraft.filter(Boolean).join('\n') });
  };

  const handleOtherInfoChange = (index: number, value: string) => {
    const items = [...otherInfoDraft];
    items[index] = value;
    setOtherInfoDraft(items);
  };

  const handleOtherInfoCompositionEnd = (index: number, value: string) => {
    setIsComposing(false);
    const items = [...otherInfoDraft];
    items[index] = value;
    setOtherInfoDraft(items);
    syncOtherInfoToEditedData();
  };

  const addOtherInfoItem = () => {
    setOtherInfoDraft([...otherInfoDraft, '']);
    setIsComposing(false);
  };

  const removeOtherInfoItem = (index: number) => {
    const items = [...otherInfoDraft];
    items.splice(index, 1);
    if (items.length === 0) items.push('');
    setOtherInfoDraft(items);
    syncOtherInfoToEditedData();
  };

  const handleSave = () => {
    // For demo purposes, we mutate the mock array
    const idx = mockEnterprises.findIndex(e => e.id === editedData.id);
    if (idx !== -1) mockEnterprises[idx] = { ...editedData };
    setIsEditing(false);
  };

  const handleApply = () => {
    setLocalApplied(true);
    onApplyContacts?.();
    setToast('您的申请已提交');
  };

  const renderMaskedContact = () => {
    return (
      <div className="flex items-center gap-3">
        <span className="font-medium text-slate-900 tracking-[0.2em] select-none">{CONTACT_MASK}</span>
        <button
          onClick={handleApply}
          disabled={isContactApplied}
          className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
            isContactApplied
              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-white border-blue-300 text-blue-700 hover:bg-blue-50'
          }`}
        >
          {isContactApplied ? '已申请' : '申请'}
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 flex justify-end transition-opacity">
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col transform transition-transform">
        {toast && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 px-5 py-2.5 rounded-lg bg-slate-800 text-white text-sm shadow-lg">
            {toast}
          </div>
        )}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            {isEditing ? '编辑企业资料' : '企业详细档案'}
          </h2>
          <button
            onClick={onClose}
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
              {!isEditing && !maskedContacts && (
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
                ) : maskedContacts ? (
                  renderMaskedContact()
                ) : (
                  <div className="font-medium text-slate-900">{editedData.contactName || '未填写'}</div>
                )}
              </div>
              <div>
                <div className="text-slate-500 mb-1">联系人手机</div>
                {isEditing ? (
                  <input name="contactPhone" value={editedData.contactPhone || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-2 py-1" placeholder="联系人手机" />
                ) : maskedContacts ? (
                  renderMaskedContact()
                ) : (
                  <div className="font-medium text-slate-900">{editedData.contactPhone || '未填写'}</div>
                )}
              </div>
              <div>
                <div className="text-slate-500 mb-1">联系人邮箱</div>
                {isEditing ? (
                  <input name="contactEmail" value={editedData.contactEmail || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-2 py-1" placeholder="联系人邮箱" />
                ) : maskedContacts ? (
                  renderMaskedContact()
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
              {!isEditing && !maskedContacts && (
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
                          onCompositionStart={() => setIsComposing(true)}
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
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-white bg-slate-50 transition-colors"
          >
            关闭
          </button>
          {isEditing && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors"
            >
              保存修改
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
