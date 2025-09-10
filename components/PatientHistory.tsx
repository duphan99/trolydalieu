import React, { useState, useEffect, useMemo } from 'react';
import type { PatientRecord } from '../types';
import { fetchPatientHistory } from '../services/apiService';

type SortKey = keyof PatientRecord['patientInfo'] | 'condition' | 'createdAt';
type SortOrder = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortOrder;
}

interface PatientHistoryProps {
    onRecordSelect: (record: PatientRecord) => void;
}


const SortableHeader: React.FC<{
  label: string;
  sortKey: SortKey;
  sortConfig: SortConfig | null;
  onSort: (key: SortKey) => void;
}> = ({ label, sortKey, sortConfig, onSort }) => {
  const isSorted = sortConfig?.key === sortKey;
  const icon = isSorted ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕';
  
  return (
    <th
      scope="col"
      className="px-6 py-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider cursor-pointer"
      onClick={() => onSort(sortKey)}
    >
      <span className="flex items-center">
        {label}
        <span className="ml-2 text-slate-400">{icon}</span>
      </span>
    </th>
  );
};


export const PatientHistory: React.FC<PatientHistoryProps> = ({ onRecordSelect }) => {
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'createdAt', direction: 'desc' });

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchPatientHistory();
        setRecords(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định.';
        setError(`Không thể tải lịch sử bệnh nhân: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, []);

  const sortedAndFilteredRecords = useMemo(() => {
    let filtered = records.filter(record =>
      record.patientInfo.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.diagnosis.condition.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        if (sortConfig.key === 'condition') {
            aValue = a.diagnosis.condition;
            bValue = b.diagnosis.condition;
        } else if (sortConfig.key === 'createdAt') {
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
        } else {
            aValue = a.patientInfo[sortConfig.key as keyof PatientRecord['patientInfo']];
            bValue = b.patientInfo[sortConfig.key as keyof PatientRecord['patientInfo']];
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return filtered;
  }, [records, searchTerm, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: SortOrder = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  if (isLoading) {
    return (
        <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Đang tải lịch sử bệnh nhân...</p>
        </div>
    );
  }

  if (error) {
    return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg" role="alert">{error}</div>;
  }

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 animate-fade-in">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
             <h2 className="text-3xl font-bold text-slate-800">Lịch sử Bệnh nhân</h2>
             <div className="relative">
                <input
                    type="text"
                    placeholder="Tìm kiếm theo tên hoặc chẩn đoán..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-72"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>
        </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <SortableHeader label="Họ và tên" sortKey="fullName" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Tuổi" sortKey="age" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Chẩn đoán" sortKey="condition" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Ngày khám" sortKey="createdAt" sortConfig={sortConfig} onSort={requestSort} />
              <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {sortedAndFilteredRecords.length > 0 ? (
                sortedAndFilteredRecords.map((record) => (
                    <tr 
                      key={record.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => onRecordSelect(record)}
                    >
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{record.patientInfo.fullName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">{record.patientInfo.age}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">{record.diagnosis.condition}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">{new Date(record.createdAt).toLocaleDateString('vi-VN')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                           <span className="text-indigo-600 font-semibold">Xem chi tiết</span>
                        </td>
                    </tr>
                ))
            ) : (
                <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        {searchTerm 
                            ? 'Không tìm thấy hồ sơ nào khớp với tìm kiếm của bạn.'
                            : 'Chưa có hồ sơ bệnh nhân nào được lưu. Hãy tạo một hồ sơ mới!'}
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};