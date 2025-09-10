import React from 'react';
import type { MachineInfo, CosmeticInfo } from '../types';
import { TagInput } from './TagInput';

interface SettingsProps {
    availableCosmetics: CosmeticInfo[];
    availableMachines: MachineInfo[];
    onCosmeticAdd: (newTag: string) => void;
    onCosmeticRemove: (index: number) => void;
    onCosmeticUpdate: (index: number, newTag: string) => void;
    onMachineAdd: (newTag: string) => void;
    onMachineRemove: (index: number) => void;
    onMachineUpdate: (index: number, newTag: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({
    availableCosmetics,
    availableMachines,
    onCosmeticAdd,
    onCosmeticRemove,
    onCosmeticUpdate,
    onMachineAdd,
    onMachineRemove,
    onMachineUpdate
}) => {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 animate-fade-in">
                <h2 className="text-3xl font-bold text-slate-800 border-b border-slate-200 pb-4 mb-6">
                    Cài đặt & Tài nguyên Phòng khám
                </h2>
                <div className="space-y-8">
                    <TagInput
                        label="Mỹ phẩm có sẵn (Tên sản phẩm hoặc hoạt chất)"
                        tags={availableCosmetics.map(c => c.name)}
                        onTagAdd={onCosmeticAdd}
                        onTagRemove={onCosmeticRemove}
                        onTagUpdate={onCosmeticUpdate}
                        placeholder="Nhập tên sản phẩm rồi nhấn Enter"
                    />
                    <TagInput
                        label="Máy thẩm mỹ có sẵn"
                        tags={availableMachines.map(m => m.name)}
                        onTagAdd={onMachineAdd}
                        onTagRemove={onMachineRemove}
                        onTagUpdate={onMachineUpdate}
                        placeholder="Nhập tên máy rồi nhấn Enter"
                    />
                </div>
            </div>
        </div>
    );
};