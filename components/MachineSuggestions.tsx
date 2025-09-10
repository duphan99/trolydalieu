import React, { useMemo } from 'react';
import type { Diagnosis, TreatmentPlan, InClinicProcedure, MachineInfo } from '../types';

interface MachineSuggestionsProps {
    currentPlan: TreatmentPlan;
    onPlanChange: (plan: TreatmentPlan) => void;
    suggestedMachines: MachineInfo[];
}

export const MachineSuggestions: React.FC<MachineSuggestionsProps> = ({ currentPlan, onPlanChange, suggestedMachines }) => {

    const addMachineToPlan = (machine: MachineInfo) => {
        // Check if the machine is already in the plan
        const isAlreadyAdded = currentPlan.inClinicProcedures.some(proc => proc.name.includes(machine.name));
        if (isAlreadyAdded) {
            alert(`${machine.name} đã có trong phác đồ.`);
            return;
        }

        const newProcedure: InClinicProcedure = {
            name: machine.name,
            frequency: 'Theo chỉ định của bác sĩ',
            description: machine.description,
        };

        const newProcedures = [...currentPlan.inClinicProcedures, newProcedure];
        onPlanChange({ ...currentPlan, inClinicProcedures: newProcedures });
    };

    if (suggestedMachines.length === 0) {
        return null;
    }

    return (
        <div>
            <div className="flex items-center gap-3 mb-4">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h4 className="text-lg font-bold text-slate-800">Gợi ý thiết bị công nghệ cao</h4>
            </div>
            <div className="space-y-3">
                {suggestedMachines.map((machine) => (
                    <div key={machine.name} className="p-4 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                            <a href={machine.url} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-700 hover:underline">{machine.name}</a>
                            <p className="text-sm text-slate-600 mt-1 max-w-xl">{machine.description}</p>
                        </div>
                        <button
                            onClick={() => addMachineToPlan(machine)}
                            className="bg-blue-100 text-blue-700 font-semibold py-2 px-3 rounded-lg hover:bg-blue-200 transition-colors text-sm flex-shrink-0 w-full sm:w-auto"
                        >
                            + Thêm vào phác đồ
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};