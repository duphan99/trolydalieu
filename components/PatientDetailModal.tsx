import React from 'react';
import type { PatientRecord, InClinicProcedure } from '../types';

interface PatientDetailModalProps {
    record: PatientRecord | null;
    onClose: () => void;
}

const DetailSection: React.FC<{ title: string, children: React.ReactNode, icon: React.ReactNode }> = ({ title, children, icon }) => (
    <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
            <span className="text-blue-600">{icon}</span>
            <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        </div>
        <div className="pl-9 space-y-2 text-slate-700">
            {children}
        </div>
    </div>
);

const RoutineList: React.FC<{ title: string, items: string[] | InClinicProcedure[] }> = ({ title, items }) => (
    <div>
        <h4 className="font-semibold text-md text-slate-600 mb-2">{title}</h4>
        {items.length > 0 ? (
            <ul className="list-disc list-inside space-y-3 text-slate-600">
                {items.map((item, index) => {
                    if (typeof item === 'string') {
                        return <li key={index}>{item}</li>;
                    }
                    // Handle InClinicProcedure object
                    return (
                        <li key={index} className="space-y-1">
                            <div className="font-semibold text-slate-800">{item.name} <span className="font-normal text-slate-500">({item.frequency})</span></div>
                            <p className="pl-5 text-slate-600">{item.description}</p>
                        </li>
                    );
                })}
            </ul>
        ) : (
            <p className="text-sm text-slate-400 italic">Không có chỉ định.</p>
        )}
    </div>
);

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({ record, onClose }) => {
    if (!record) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Đóng"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-3xl font-bold text-blue-600 mb-2">Hồ sơ bệnh nhân</h2>
                <p className="text-slate-500 mb-6 border-b pb-4">
                    Ngày khám: {new Date(record.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>

                <div className="space-y-6">
                    {/* Patient Info */}
                    <DetailSection 
                        title="Thông tin Bệnh nhân"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                    >
                         <p><strong>Họ và tên:</strong> {record.patientInfo.fullName}</p>
                         <p><strong>Tuổi:</strong> {record.patientInfo.age}</p>
                         <p><strong>Địa chỉ:</strong> {record.patientInfo.address}</p>
                         <p><strong>SĐT:</strong> {record.patientInfo.phoneNumber || 'N/A'}</p>
                         <p><strong>Email:</strong> {record.patientInfo.email || 'N/A'}</p>
                         {record.patientInfo.notes && <p className="mt-2 pt-2 border-t"><strong>Ghi chú:</strong> {record.patientInfo.notes}</p>}
                    </DetailSection>

                    {/* Diagnosis */}
                    <DetailSection 
                        title="Chẩn đoán"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>}
                    >
                        <p><strong>Tình trạng:</strong> {record.diagnosis.condition}</p>
                        <p><strong>Mức độ:</strong> {record.diagnosis.severity}</p>
                        <blockquote className="mt-2 p-3 bg-slate-50 border-l-4 border-slate-300 text-slate-600">
                           {record.diagnosis.analysis}
                        </blockquote>
                    </DetailSection>

                    {/* Treatment Plan */}
                     <DetailSection 
                        title="Phác đồ Điều trị"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                    >
                        <div className="space-y-4">
                            <RoutineList title="Buổi sáng" items={record.treatmentPlan.morningRoutine} />
                            <RoutineList title="Buổi tối" items={record.treatmentPlan.eveningRoutine} />
                            <RoutineList title="Tại phòng khám" items={record.treatmentPlan.inClinicProcedures} />
                        </div>
                    </DetailSection>
                </div>
            </div>
        </div>
    );
};