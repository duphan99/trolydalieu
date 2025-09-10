import React, { useMemo } from 'react';
import type { Diagnosis, TreatmentPlan, CosmeticInfo } from '../types';

interface CosmeticSuggestionsProps {
    currentPlan: TreatmentPlan;
    onPlanChange: (plan: TreatmentPlan) => void;
    suggestedCosmetics: CosmeticInfo[];
}

export const CosmeticSuggestions: React.FC<CosmeticSuggestionsProps> = ({ currentPlan, onPlanChange, suggestedCosmetics }) => {
    
    const addCosmeticToPlan = (cosmetic: CosmeticInfo, routine: 'morning' | 'evening') => {
        const routineKey = routine === 'morning' ? 'morningRoutine' : 'eveningRoutine';
        const targetRoutine = currentPlan[routineKey];

        const cosmeticText = `${cosmetic.name} (${cosmetic.brand})`;

        if (targetRoutine.some(item => item.includes(cosmetic.name))) {
            alert(`${cosmetic.name} đã có trong phác đồ.`);
            return;
        }

        const newRoutine = [...targetRoutine, cosmeticText];
        onPlanChange({ ...currentPlan, [routineKey]: newRoutine });
    };

    if (suggestedCosmetics.length === 0) {
        return null;
    }

    return (
        <div>
            <div className="flex items-center gap-3 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.24a2 2 0 00-1.806.547a2 2 0 00-.547 1.806l.477 2.387a6 6 0 00.517 3.86l.158.318a6 6 0 00.517 3.86l2.387.477a2 2 0 001.806-.547a2 2 0 00.547-1.806l-.477-2.387a6 6 0 00-.517-3.86l-.158-.318a6 6 0 01-.517-3.86l-2.387-.477a2 2 0 01-.547-1.806zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h4 className="text-lg font-bold text-slate-800">Gợi ý mỹ phẩm</h4>
            </div>
            <div className="space-y-3">
                {suggestedCosmetics.map((cosmetic) => (
                    <div key={cosmetic.name} className="p-4 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row justify-between items-start gap-3">
                        <div className="flex-grow">
                            <a href={cosmetic.url} target="_blank" rel="noopener noreferrer" className="font-bold text-green-700 hover:underline">{cosmetic.name}</a>
                            <p className="text-sm text-slate-500 font-semibold">{cosmetic.brand}</p>
                            <p className="text-sm text-slate-600 mt-1 max-w-xl">{cosmetic.description}</p>
                        </div>
                        <div className="flex-shrink-0 flex sm:flex-col gap-2 w-full sm:w-auto">
                           {(cosmetic.usage === 'both' || cosmetic.usage === 'morning') && (
                               <button
                                    onClick={() => addCosmeticToPlan(cosmetic, 'morning')}
                                    className="w-full text-sm bg-yellow-100 text-yellow-800 font-semibold py-1.5 px-3 rounded-md hover:bg-yellow-200 transition-colors"
                                >
                                    + Buổi sáng
                                </button>
                           )}
                           {(cosmetic.usage === 'both' || cosmetic.usage === 'evening') && (
                               <button
                                    onClick={() => addCosmeticToPlan(cosmetic, 'evening')}
                                    className="w-full text-sm bg-indigo-100 text-indigo-800 font-semibold py-1.5 px-3 rounded-md hover:bg-indigo-200 transition-colors"
                                >
                                    + Buổi tối
                                </button>
                           )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};