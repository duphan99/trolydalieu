import React, { useState } from 'react';
import type { RejuvenationAnalysisResult, RejuvenationTreatmentPlan, InClinicProcedure, MachineInfo, CosmeticInfo } from '../types';

// Helper component to create a textarea that automatically adjusts its height.
const AutoSizingTextarea: React.FC<React.ComponentProps<'textarea'>> = (props) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
        if (textareaRef.current) {
            const textarea = textareaRef.current;
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [props.value]);

    return <textarea ref={textareaRef} {...props} />;
};

const AccordionSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}> = ({ title, icon, isOpen, onToggle, children }) => {
    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden transition-all duration-300">
            <button
                onClick={onToggle}
                className={`w-full flex justify-between items-center p-4 transition-colors duration-200 ${isOpen ? 'bg-blue-50' : 'bg-slate-50 hover:bg-slate-100'}`}
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3">
                    <span className="text-blue-600">{icon}</span>
                    <h4 className="font-semibold text-md text-slate-800">{title}</h4>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div
                className={`transition-all duration-500 ease-in-out grid ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
                <div className="overflow-hidden">
                    <div className="p-4 bg-white">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
};

const EditableList: React.FC<{
    items: string[];
    planKey: keyof RejuvenationTreatmentPlan;
    onPlanChange: (newPlan: RejuvenationTreatmentPlan) => void;
    currentPlan: RejuvenationTreatmentPlan;
    placeholder: string;
}> = ({ items, planKey, onPlanChange, currentPlan, placeholder }) => {
    const handleItemChange = (index: number, value: string) => {
        const newItems = [...items];
        newItems[index] = value;
        onPlanChange({ ...currentPlan, [planKey]: newItems });
    };

    const addItem = () => {
        const newItems = [...items, ''];
        onPlanChange({ ...currentPlan, [planKey]: newItems });
    };

    const removeItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        onPlanChange({ ...currentPlan, [planKey]: newItems });
    };

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                {items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                        <AutoSizingTextarea
                            value={item}
                            onChange={(e) => handleItemChange(index, e.target.value)}
                            rows={1}
                            className="flex-grow block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 transition resize-none"
                            placeholder={placeholder}
                        />
                        <button onClick={() => removeItem(index)} className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
            <div className="flex justify-center pt-2">
                <button onClick={addItem} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1.5 bg-blue-100/70 hover:bg-blue-200/70 px-4 py-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Thêm mục
                </button>
            </div>
        </div>
    );
};

const EditableProcedures: React.FC<{
    procedures: InClinicProcedure[];
    planKey: 'highTechProcedures' | 'injectionTherapies';
    onPlanChange: (newPlan: RejuvenationTreatmentPlan) => void;
    currentPlan: RejuvenationTreatmentPlan;
}> = ({ procedures, planKey, onPlanChange, currentPlan }) => {
    const handleProcedureChange = (index: number, field: keyof InClinicProcedure, value: string) => {
        const newProcedures = [...procedures];
        newProcedures[index] = { ...newProcedures[index], [field]: value };
        onPlanChange({ ...currentPlan, [planKey]: newProcedures });
    };

    const addProcedure = () => {
        const newProcedures = [...procedures, { name: '', frequency: '', description: '' }];
        onPlanChange({ ...currentPlan, [planKey]: newProcedures });
    };

    const removeProcedure = (index: number) => {
        const newProcedures = procedures.filter((_, i) => i !== index);
        onPlanChange({ ...currentPlan, [planKey]: newProcedures });
    };

    return (
        <div className="space-y-4">
            {procedures.map((proc, index) => (
                <div key={index} className="relative group p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3 shadow-sm">
                    <div className="flex justify-between items-start gap-2">
                        <div className="flex-grow space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <AutoSizingTextarea
                                    value={proc.name}
                                    onChange={(e) => handleProcedureChange(index, 'name', e.target.value)}
                                    rows={1}
                                    className="flex-grow block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-semibold text-slate-800 sm:text-base p-2 transition resize-none"
                                    placeholder="Tên liệu trình..."
                                />
                                <AutoSizingTextarea
                                    value={proc.frequency}
                                    onChange={(e) => handleProcedureChange(index, 'frequency', e.target.value)}
                                    rows={1}
                                    className="flex-shrink-0 block w-full sm:w-48 rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 transition resize-none"
                                    placeholder="Tần suất..."
                                />
                            </div>
                            <AutoSizingTextarea
                                value={proc.description}
                                onChange={(e) => handleProcedureChange(index, 'description', e.target.value)}
                                rows={2}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 transition resize-none"
                                placeholder="Mô tả mục đích và lợi ích..."
                            />
                        </div>
                        <button onClick={() => removeProcedure(index)} className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 flex-shrink-0 mt-0 sm:mt-1 opacity-50 group-hover:opacity-100">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>
            ))}
            <div className="flex justify-center pt-2">
                <button onClick={addProcedure} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1.5 bg-blue-100/70 hover:bg-blue-200/70 px-4 py-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Thêm liệu trình
                </button>
            </div>
        </div>
    );
};

interface RejuvenationResultDisplayProps {
    result: RejuvenationAnalysisResult;
    editablePlan: RejuvenationTreatmentPlan;
    onPlanChange: (plan: RejuvenationTreatmentPlan) => void;
    availableMachines: MachineInfo[];
    availableCosmetics: CosmeticInfo[];
}

export const RejuvenationResultDisplay: React.FC<RejuvenationResultDisplayProps> = ({ result, editablePlan, onPlanChange }) => {
    const { assessment, disclaimer } = result;
    const [openSection, setOpenSection] = useState<string>('schedule');

    const toggleSection = (section: string) => {
        setOpenSection(prev => prev === section ? '' : section);
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="p-5 bg-white border border-slate-200 rounded-2xl">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Đánh giá của AI</h3>
                <p className="text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-200 leading-relaxed">{assessment}</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Phác đồ trẻ hóa kết hợp (Có thể chỉnh sửa)</h3>
                <div className="space-y-3">
                    <AccordionSection
                        title="Lịch trình điều trị gợi ý"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                        isOpen={openSection === 'schedule'}
                        onToggle={() => toggleSection('schedule')}
                    >
                        <EditableList
                            items={editablePlan.treatmentSchedule}
                            planKey="treatmentSchedule"
                            onPlanChange={onPlanChange}
                            currentPlan={editablePlan}
                            placeholder="Nhập mốc thời gian và liệu trình..."
                        />
                    </AccordionSection>
                    
                    <AccordionSection
                        title="Liệu trình Công nghệ cao"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
                        isOpen={openSection === 'highTech'}
                        onToggle={() => toggleSection('highTech')}
                    >
                        <EditableProcedures
                            procedures={editablePlan.highTechProcedures}
                            planKey="highTechProcedures"
                            onPlanChange={onPlanChange}
                            currentPlan={editablePlan}
                        />
                    </AccordionSection>

                    <AccordionSection
                        title="Liệu pháp Tiêm (Botox, Filler, Meso...)"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 001.414 0l2.414-2.414a1 1 0 01.707-.293H19" /></svg>}
                        isOpen={openSection === 'injection'}
                        onToggle={() => toggleSection('injection')}
                    >
                        <EditableProcedures
                            procedures={editablePlan.injectionTherapies}
                            planKey="injectionTherapies"
                            onPlanChange={onPlanChange}
                            currentPlan={editablePlan}
                        />
                    </AccordionSection>

                    <AccordionSection
                        title="Chăm sóc tại nhà"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                        isOpen={openSection === 'homeCare'}
                        onToggle={() => toggleSection('homeCare')}
                    >
                        <EditableList
                            items={editablePlan.homeCareRoutine}
                            planKey="homeCareRoutine"
                            onPlanChange={onPlanChange}
                            currentPlan={editablePlan}
                            placeholder="Nhập sản phẩm hoặc bước chăm sóc..."
                        />
                    </AccordionSection>
                </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-r-lg">
                <h4 className="font-bold">Miễn trừ trách nhiệm</h4>
                <p className="mt-1">{disclaimer}</p>
            </div>
        </div>
    );
};