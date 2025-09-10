import React, { useState, useMemo } from 'react';
import type { MelasmaAnalysisResult, MelasmaTreatmentPlan, InClinicProcedure, MachineInfo, CosmeticInfo } from '../types';
import { MachineSuggestions } from './MachineSuggestions';
import { CosmeticSuggestions } from './CosmeticSuggestions';

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
    planKey: keyof MelasmaTreatmentPlan;
    onPlanChange: (newPlan: MelasmaTreatmentPlan) => void;
    currentPlan: MelasmaTreatmentPlan;
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
    onPlanChange: (newPlan: MelasmaTreatmentPlan) => void;
    currentPlan: MelasmaTreatmentPlan;
}> = ({ procedures, onPlanChange, currentPlan }) => {

    const handleProcedureChange = (index: number, field: keyof InClinicProcedure, value: string) => {
        const newProcedures = [...procedures];
        newProcedures[index] = { ...newProcedures[index], [field]: value };
        onPlanChange({ ...currentPlan, inClinicProcedures: newProcedures });
    };

    const addProcedure = () => {
        const newProcedures = [...procedures, { name: '', frequency: '', description: '' }];
        onPlanChange({ ...currentPlan, inClinicProcedures: newProcedures });
    };

    const removeProcedure = (index: number) => {
        const newProcedures = procedures.filter((_, i) => i !== index);
        onPlanChange({ ...currentPlan, inClinicProcedures: newProcedures });
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
                                placeholder="Mô tả mục đích và lợi ích của liệu trình..."
                            />
                        </div>
                        <button onClick={() => removeProcedure(index)} className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 flex-shrink-0 mt-0 sm:mt-1 opacity-50 group-hover:opacity-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
            <div className="flex justify-center pt-2">
                <button onClick={addProcedure} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1.5 bg-blue-100/70 hover:bg-blue-200/70 px-4 py-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Thêm liệu trình
                </button>
            </div>
        </div>
    );
};


interface MelasmaResultDisplayProps {
    result: MelasmaAnalysisResult;
    editablePlan: MelasmaTreatmentPlan;
    onPlanChange: (plan: MelasmaTreatmentPlan) => void;
    availableMachines: MachineInfo[];
    availableCosmetics: CosmeticInfo[];
}

export const MelasmaResultDisplay: React.FC<MelasmaResultDisplayProps> = ({ result, editablePlan, onPlanChange, availableMachines, availableCosmetics }) => {
    const { assessment, disclaimer } = result;
    const [openSection, setOpenSection] = useState<string>('inClinicProcedures');

    const toggleSection = (section: string) => {
        setOpenSection(prev => prev === section ? '' : section);
    };

     const suggestedMachines = useMemo(() => {
        if (!availableMachines || availableMachines.length === 0) return [];
        const diagnosisText = assessment.toLowerCase();
        return availableMachines.filter(machine => 
            machine.keywords.some(keyword => diagnosisText.includes(keyword.toLowerCase()))
        );
    }, [assessment, availableMachines]);

    const suggestedCosmetics = useMemo(() => {
        if (!availableCosmetics || availableCosmetics.length === 0) return [];
        const diagnosisText = assessment.toLowerCase();
        return availableCosmetics.filter(cosmetic => 
            cosmetic.keywords.some(keyword => diagnosisText.includes(keyword.toLowerCase()))
        );
    }, [assessment, availableCosmetics]);

    const showSuggestions = suggestedMachines.length > 0 || suggestedCosmetics.length > 0;


    return (
        <div className="animate-fade-in space-y-6">
            <div className="p-5 bg-white border border-slate-200 rounded-2xl">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Đánh giá của AI</h3>
                <p className="text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-200 leading-relaxed">{assessment}</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Phác đồ điều trị nám (Có thể chỉnh sửa)</h3>
                <div className="space-y-3">
                    <AccordionSection
                        title="Liệu trình tại phòng khám"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                        isOpen={openSection === 'inClinicProcedures'}
                        onToggle={() => toggleSection('inClinicProcedures')}
                    >
                        <EditableProcedures
                            procedures={editablePlan.inClinicProcedures}
                            onPlanChange={onPlanChange}
                            currentPlan={editablePlan}
                        />
                    </AccordionSection>

                    <AccordionSection
                        title="Chăm sóc tại nhà"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                        isOpen={openSection === 'homeCareRoutine'}
                        onToggle={() => toggleSection('homeCareRoutine')}
                    >
                        <EditableList
                            items={editablePlan.homeCareRoutine}
                            planKey="homeCareRoutine"
                            onPlanChange={onPlanChange}
                            currentPlan={editablePlan}
                            placeholder="Nhập sản phẩm hoặc bước chăm sóc..."
                        />
                    </AccordionSection>

                    <AccordionSection
                        title="Tư vấn chống nắng chuyên sâu"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707.707M12 21v-1m-6.364-1.636l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>}
                        isOpen={openSection === 'sunProtectionAdvice'}
                        onToggle={() => toggleSection('sunProtectionAdvice')}
                    >
                        <EditableList
                            items={editablePlan.sunProtectionAdvice}
                            planKey="sunProtectionAdvice"
                            onPlanChange={onPlanChange}
                            currentPlan={editablePlan}
                            placeholder="Nhập lời khuyên về chống nắng..."
                        />
                    </AccordionSection>
                </div>
            </div>

            {/* Suggestions Card */}
            {showSuggestions && (
                <div className="p-5 bg-white border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        <h3 className="text-xl font-bold text-slate-800">Gợi ý bổ sung</h3>
                </div>
                <div className="space-y-6 bg-slate-50/70 p-4 rounded-lg">
                        <MachineSuggestions
                            currentPlan={{ inClinicProcedures: editablePlan.inClinicProcedures } as any}
                            onPlanChange={(newPlan) => onPlanChange({ ...editablePlan, inClinicProcedures: newPlan.inClinicProcedures })}
                            suggestedMachines={suggestedMachines}
                        />
                        <CosmeticSuggestions
                            currentPlan={{ morningRoutine: editablePlan.homeCareRoutine, eveningRoutine: editablePlan.homeCareRoutine } as any}
                             onPlanChange={(newPlan) => {
                                const newHomeCare = [...new Set([...newPlan.morningRoutine, ...newPlan.eveningRoutine])];
                                onPlanChange({ ...editablePlan, homeCareRoutine: newHomeCare });
                            }}
                            suggestedCosmetics={suggestedCosmetics}
                        />
                </div>
                </div>
            )}

            <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-r-lg">
                <h4 className="font-bold">Miễn trừ trách nhiệm</h4>
                <p className="mt-1">{disclaimer}</p>
            </div>
        </div>
    );
};