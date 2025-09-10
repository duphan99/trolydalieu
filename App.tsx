import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { TextInput } from './components/TextInput';
import { ResultDisplay } from './components/ResultDisplay';
import { Loader } from './components/Loader';
import { analyzeSkinCondition, analyzeScarCondition, analyzeAcneCondition, analyzeMelasmaCondition, analyzeRejuvenationNeeds } from './services/geminiService';
import { saveRecordToDatabase, sendEmailToPatient, sendZaloMessage, saveScarRecordToDatabase, sendZaloMessageForScar, sendEmailToPatientForScar, saveAcneRecordToDatabase, sendZaloMessageForAcne, sendEmailToPatientForAcne, saveRejuvenationRecordToDatabase, sendZaloMessageForRejuvenation, sendEmailToPatientForRejuvenation } from './services/apiService';
import { generatePatientReportPDF, generateScarReportPDF, generateAcneReportPDF, generateRejuvenationReportPDF } from './services/pdfService';
import type { AnalysisResult, PatientInfo, TreatmentPlan, PatientRecord, MachineInfo, CosmeticInfo, PlanType, ScarInfo, ScarAnalysisResult, ScarTreatmentPlan, AcneInfo, AcneAnalysisResult, AcneTreatmentPlan, MelasmaInfo, MelasmaAnalysisResult, MelasmaTreatmentPlan, RejuvenationInfo, RejuvenationAnalysisResult, RejuvenationTreatmentPlan, FaceImages, ScarPatientRecord, AcnePatientRecord, RejuvenationPatientRecord } from './types';
import { fileToBase64 } from './utils/file';
import { TextAreaInput } from './components/TextAreaInput';
import { PatientHistory } from './components/PatientHistory';
import { PatientDetailModal } from './components/PatientDetailModal';
import { COSMETIC_PRODUCTS } from './services/cosmeticData';
import { OSAKACO_MACHINES } from './services/machineData';
import type { AppView } from './components/Header';
import { Settings } from './components/Settings';
import { ScarResultDisplay } from './components/ScarResultDisplay';
import { AcneResultDisplay } from './components/AcneResultDisplay';
import { MelasmaResultDisplay } from './components/MelasmaResultDisplay';
import { RejuvenationResultDisplay } from './components/RejuvenationResultDisplay';


const App: React.FC = () => {
  // --- General State ---
  const [activePlan, setActivePlan] = useState<PlanType>('general');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<AppView>('main');

  // --- Patient Info State ---
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    fullName: '',
    age: '',
    address: '', // Kept for data structure compatibility, but no longer in UI
    phoneNumber: '',
    email: '',
  });

  // --- Plan-specific Input State ---
  const initialFaceImages: FaceImages = { front: null, left: null, right: null, wood: null };
  const [generalFaceImages, setGeneralFaceImages] = useState<FaceImages>(initialFaceImages);
  const [generalNotes, setGeneralNotes] = useState('');

  const [scarFaceImages, setScarFaceImages] = useState<FaceImages>(initialFaceImages);
  const [scarInfo, setScarInfo] = useState<ScarInfo>({ scarType: '', location: '', duration: '', notes: '' });

  const [acneFaceImages, setAcneFaceImages] = useState<FaceImages>(initialFaceImages);
  const [acneInfo, setAcneInfo] = useState<AcneInfo>({ acneType: '', duration: '', triggers: '', pastTreatments: '', notes: '' });
  
  const [melasmaFaceImages, setMelasmaFaceImages] = useState<FaceImages>(initialFaceImages);
  const [melasmaInfo, setMelasmaInfo] = useState<MelasmaInfo>({ melasmaType: '', location: '', duration: '', triggers: '', pastTreatments: '', notes: '' });
  
  const [rejuvenationFaceImages, setRejuvenationFaceImages] = useState<FaceImages>(initialFaceImages);
  const [rejuvenationInfo, setRejuvenationInfo] = useState<RejuvenationInfo>({ mainConcerns: '', targetArea: '', pastTreatments: '', notes: '' });


  // --- Result State ---
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | ScarAnalysisResult | AcneAnalysisResult | MelasmaAnalysisResult | RejuvenationAnalysisResult | null>(null);
  const [editablePlan, setEditablePlan] = useState<TreatmentPlan | ScarTreatmentPlan | AcneTreatmentPlan | MelasmaTreatmentPlan | RejuvenationTreatmentPlan | null>(null);
  
  // --- Clinic Resources State ---
  const [availableMachines, setAvailableMachines] = useState<MachineInfo[]>(OSAKACO_MACHINES);
  const [availableCosmetics, setAvailableCosmetics] = useState<CosmeticInfo[]>(COSMETIC_PRODUCTS);
  
  // --- UI Action State ---
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSavingToDB, setIsSavingToDB] = useState<boolean>(false);
  const [isSendingZalo, setIsSendingZalo] = useState<boolean>(false);
  
  // --- Modal State ---
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<PatientRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // --- Handlers for Inputs ---
  const handlePatientInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPatientInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleScarInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setScarInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleAcneInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAcneInfo(prev => ({ ...prev, [name]: value }));
  };
  
  const handleMelasmaInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMelasmaInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleRejuvenationInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRejuvenationInfo(prev => ({ ...prev, [name]: value }));
  };

  // --- Handlers for Clinic Resources in Settings ---
  const handleCosmeticAdd = (newTag: string) => { /* ... */ };
  const handleCosmeticRemove = (index: number) => { /* ... */ };
  const handleCosmeticUpdate = (index: number, newTag: string) => { /* ... */ };
  const handleMachineAdd = (newTag: string) => { /* ... */ };
  const handleMachineRemove = (index: number) => { /* ... */ };
  const handleMachineUpdate = (index: number, newTag: string) => { /* ... */ };

  // --- Analysis Dispatcher ---
  const handleAnalysis = useCallback(async () => {
    if (!patientInfo.fullName || !patientInfo.age) {
      setError('Vui lòng điền đầy đủ Họ tên và Tuổi của bệnh nhân.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setEditablePlan(null);

    const productNames = availableCosmetics.map(p => p.name);
    const machineNames = availableMachines.map(m => m.name);

    try {
      let result;
      let activeImages: FaceImages;

      switch (activePlan) {
        case 'general': activeImages = generalFaceImages; break;
        case 'scar': activeImages = scarFaceImages; break;
        case 'acne': activeImages = acneFaceImages; break;
        case 'melasma': activeImages = melasmaFaceImages; break;
        case 'rejuvenation': activeImages = rejuvenationFaceImages; break;
        default: throw new Error("Loại phác đồ không hợp lệ.");
      }
      
      const imageFiles = Object.values(activeImages).filter((file): file is File => file !== null);
      if (imageFiles.length === 0) throw new Error("Vui lòng tải lên ít nhất một hình ảnh.");
      if (!activeImages.front) throw new Error("Vui lòng tải lên hình ảnh chính diện bắt buộc.");
      
      const imageParts = await Promise.all(imageFiles.map(file => fileToBase64(file)));

      switch (activePlan) {
        case 'general':
          result = await analyzeSkinCondition(imageParts, { ...patientInfo, notes: generalNotes }, productNames, machineNames);
          break;
        case 'scar':
          result = await analyzeScarCondition(imageParts, scarInfo, patientInfo, productNames, machineNames);
          break;
        case 'acne':
          result = await analyzeAcneCondition(imageParts, acneInfo, patientInfo, productNames, machineNames);
          break;
        case 'melasma':
          result = await analyzeMelasmaCondition(imageParts, melasmaInfo, patientInfo, productNames, machineNames);
          break;
        case 'rejuvenation':
          result = await analyzeRejuvenationNeeds(imageParts, rejuvenationInfo, patientInfo, productNames, machineNames);
          break;
        default:
          throw new Error("Loại phác đồ không được hỗ trợ.");
      }
      setAnalysisResult(result);
      setEditablePlan(result.treatmentPlan);
    } catch (err) {
      console.error('Analysis failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.';
      setError(`Không thể phân tích. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [patientInfo, activePlan, generalFaceImages, generalNotes, scarFaceImages, scarInfo, acneFaceImages, acneInfo, melasmaFaceImages, melasmaInfo, rejuvenationFaceImages, rejuvenationInfo, availableCosmetics, availableMachines]);
  
  // --- Action Handlers (PDF, Save, Zalo, Email) ---
  const handleDownloadPdf = async () => {
    if (!analysisResult || !editablePlan) return;
    setIsGeneratingPdf(true);
    setError(null);
    try {
      switch (activePlan) {
        case 'general':
          await generatePatientReportPDF({ patientInfo, diagnosis: (analysisResult as AnalysisResult).diagnosis, treatmentPlan: editablePlan as TreatmentPlan }, analysisResult.disclaimer);
          break;
        case 'scar':
          await generateScarReportPDF({ patientInfo, scarInfo, analysisResult: analysisResult as ScarAnalysisResult });
          break;
        case 'acne':
          await generateAcneReportPDF({ patientInfo, acneInfo, analysisResult: analysisResult as AcneAnalysisResult });
          break;
        case 'rejuvenation':
          await generateRejuvenationReportPDF({ patientInfo, rejuvenationInfo, analysisResult: analysisResult as RejuvenationAnalysisResult });
          break;
      }
    } catch (err) {
      console.error("PDF Generation failed:", err);
      const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định.';
      setError(`Không thể tạo tệp PDF. ${errorMessage}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!analysisResult || !editablePlan) return;
    setIsSavingToDB(true);
    setError(null);
    try {
      let response;
      switch (activePlan) {
        case 'general':
          response = await saveRecordToDatabase({ patientInfo, diagnosis: (analysisResult as AnalysisResult).diagnosis, treatmentPlan: editablePlan as TreatmentPlan });
          break;
        case 'scar':
          response = await saveScarRecordToDatabase({ patientInfo, scarInfo, analysisResult: analysisResult as ScarAnalysisResult });
          break;
        case 'acne':
          response = await saveAcneRecordToDatabase({ patientInfo, acneInfo, analysisResult: analysisResult as AcneAnalysisResult });
          break;
        case 'rejuvenation':
          response = await saveRejuvenationRecordToDatabase({ patientInfo, rejuvenationInfo, analysisResult: analysisResult as RejuvenationAnalysisResult });
          break;
      }
      alert('Hồ sơ đã được lưu thành công vào database!');
    } catch (err) {
      console.error('Save to DB failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định.';
      setError(`Không thể lưu vào database. ${errorMessage}`);
    } finally {
      setIsSavingToDB(false);
    }
  };

  const handleSendZalo = async () => {
    if (!analysisResult || !editablePlan || !patientInfo.phoneNumber) {
      alert("Vui lòng đảm bảo có kết quả phân tích và đã nhập số điện thoại của bệnh nhân.");
      return;
    }
    setIsSendingZalo(true);
    setError(null);
    try {
      let response;
      switch (activePlan) {
        case 'general':
          response = await sendZaloMessage({ patientInfo, diagnosis: (analysisResult as AnalysisResult).diagnosis, treatmentPlan: editablePlan as TreatmentPlan });
          break;
        case 'scar':
          response = await sendZaloMessageForScar({ patientInfo, scarInfo, analysisResult: analysisResult as ScarAnalysisResult });
          break;
        case 'acne':
          response = await sendZaloMessageForAcne({ patientInfo, acneInfo, analysisResult: analysisResult as AcneAnalysisResult });
          break;
        case 'rejuvenation':
          response = await sendZaloMessageForRejuvenation({ patientInfo, rejuvenationInfo, analysisResult: analysisResult as RejuvenationAnalysisResult });
          break;
      }
      alert(`Tin nhắn Zalo đã được gửi thành công tới ${patientInfo.phoneNumber}!`);
    } catch (err) {
      console.error('Send Zalo failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định.';
      setError(`Không thể gửi tin nhắn Zalo. ${errorMessage}`);
    } finally {
      setIsSendingZalo(false);
    }
  };

  const handleSaveAndSendEmail = async () => {
    if (!analysisResult || !editablePlan || !patientInfo.email) {
      alert("Vui lòng đảm bảo có kết quả phân tích và đã nhập email của bệnh nhân.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
        let emailResponse;
        switch (activePlan) {
            case 'general':
                await saveRecordToDatabase({ patientInfo, diagnosis: (analysisResult as AnalysisResult).diagnosis, treatmentPlan: editablePlan as TreatmentPlan });
                emailResponse = await sendEmailToPatient({ patientInfo, diagnosis: (analysisResult as AnalysisResult).diagnosis, treatmentPlan: editablePlan as TreatmentPlan });
                break;
            case 'scar':
                await saveScarRecordToDatabase({ patientInfo, scarInfo, analysisResult: analysisResult as ScarAnalysisResult });
                emailResponse = await sendEmailToPatientForScar({ patientInfo, scarInfo, analysisResult: analysisResult as ScarAnalysisResult });
                break;
            case 'acne':
                await saveAcneRecordToDatabase({ patientInfo, acneInfo, analysisResult: analysisResult as AcneAnalysisResult });
                emailResponse = await sendEmailToPatientForAcne({ patientInfo, acneInfo, analysisResult: analysisResult as AcneAnalysisResult });
                break;
            case 'rejuvenation':
                await saveRejuvenationRecordToDatabase({ patientInfo, rejuvenationInfo, analysisResult: analysisResult as RejuvenationAnalysisResult });
                emailResponse = await sendEmailToPatientForRejuvenation({ patientInfo, rejuvenationInfo, analysisResult: analysisResult as RejuvenationAnalysisResult });
                break;
        }
        alert(`Hồ sơ đã được lưu và email đã được gửi thành công tới ${patientInfo.email}!`);
    } catch(err) {
        console.error('Save or Send Email failed:', err);
        const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định.';
        setError(`Không thể lưu và gửi email. ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  // --- Modal Handlers ---
  const handleShowRecordDetail = (record: PatientRecord) => { setSelectedRecordForDetail(record); setIsDetailModalOpen(true); };
  const handleCloseDetailModal = () => { setIsDetailModalOpen(false); setTimeout(() => setSelectedRecordForDetail(null), 300); };
  
  const canAnalyze = 
    patientInfo.fullName.trim().length > 0 &&
    patientInfo.age.trim().length > 0 &&
    ((activePlan === 'general' && generalFaceImages.front !== null) ||
     (activePlan === 'scar' && scarFaceImages.front !== null) ||
     (activePlan === 'acne' && acneFaceImages.front !== null) ||
     (activePlan === 'melasma' && melasmaFaceImages.front !== null) ||
     (activePlan === 'rejuvenation' && rejuvenationFaceImages.front !== null)) &&
    !isLoading;

  const TabButton: React.FC<{ label: string; plan: PlanType; }> = ({ label, plan }) => (
    <button
      onClick={() => {
        setAnalysisResult(null); // Reset result when switching tabs
        setEditablePlan(null);
        setError(null);
        setActivePlan(plan);
      }}
      className={`font-bold py-2.5 px-5 rounded-lg shadow-sm transition-all duration-300 transform hover:-translate-y-0.5 ${
        activePlan === plan
          ? 'bg-blue-600 text-white shadow-lg'
          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <Header activeView={activeView} onNavigate={setActiveView} />
      <main className="container mx-auto p-6 md:p-10">
        {activeView === 'history' && <PatientHistory onRecordSelect={handleShowRecordDetail} />}
        
        {activeView === 'settings' && (
            <Settings
                availableCosmetics={availableCosmetics}
                availableMachines={availableMachines}
                onCosmeticAdd={handleCosmeticAdd}
                onCosmeticRemove={handleCosmeticRemove}
                onCosmeticUpdate={handleCosmeticUpdate}
                onMachineAdd={handleMachineAdd}
                onMachineRemove={handleMachineRemove}
                onMachineUpdate={handleMachineUpdate}
            />
        )}

        {activeView === 'main' && (
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col gap-8">
              
              {/* Block 1: Patient Info */}
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-800 border-b border-slate-200 pb-4 mb-6">1. Thông tin Bệnh nhân</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <TextInput name="fullName" label="Họ và tên" placeholder="Nguyễn Văn A" value={patientInfo.fullName} onChange={handlePatientInfoChange} required />
                      <TextInput name="age" label="Tuổi" placeholder="25" type="number" value={patientInfo.age} onChange={handlePatientInfoChange} required />
                      <TextInput name="phoneNumber" label="Số điện thoại (Gửi Zalo)" placeholder="0901234567" type="tel" value={patientInfo.phoneNumber} onChange={handlePatientInfoChange} />
                      <TextInput name="email" label="Email Bệnh nhân" placeholder="nguyenvana@email.com" type="email" value={patientInfo.email} onChange={handlePatientInfoChange} />
                  </div>
              </div>

              {/* Block 2: Personalized Treatment Plan */}
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-800 border-b border-slate-200 pb-4 mb-6">2. Chọn phác đồ điều trị cá nhân hóa</h2>
                  
                  <div className="flex flex-wrap gap-3 border-b border-slate-200 mb-6 pb-6">
                      <TabButton label="Phác đồ Tổng quát" plan="general" />
                      <TabButton label="Phác đồ Nám" plan="melasma" />
                      <TabButton label="Phác đồ Mụn" plan="acne" />
                      <TabButton label="Phác đồ Sẹo" plan="scar" />
                      <TabButton label="Phác đồ Trẻ hóa" plan="rejuvenation" />
                  </div>
                  
                  <div className="animate-fade-in">
                      {activePlan === 'general' && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl">
                                  <ImageUploader key="general-uploader" onFilesSelect={setGeneralFaceImages} selectedFiles={generalFaceImages} />
                              </div>
                              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl">
                                  <TextAreaInput id="general-notes" name="notes" label="Ghi chú thêm (Tùy chọn)" placeholder="Ví dụ: Bệnh nhân có tiền sử dị ứng, da nhạy cảm..." value={generalNotes} onChange={(e) => setGeneralNotes(e.target.value)} rows={8} />
                              </div>
                          </div>
                      )}
                      {activePlan === 'scar' && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                              <div className="p-4 space-y-4 bg-slate-50/80 border border-slate-200 rounded-2xl">
                                <h3 className="text-lg font-semibold text-slate-700">Thông tin Sẹo</h3>
                                <TextInput name="scarType" label="Loại sẹo" placeholder="Sẹo rỗ đáy nhọn, sẹo lồi..." value={scarInfo.scarType} onChange={handleScarInfoChange} />
                                <TextInput name="location" label="Vị trí" placeholder="Hai bên má, trán..." value={scarInfo.location} onChange={handleScarInfoChange} />
                                <TextInput name="duration" label="Thời gian bị sẹo" placeholder="Khoảng 6 tháng" value={scarInfo.duration} onChange={handleScarInfoChange} />
                                <TextAreaInput id="scar-notes" name="notes" label="Ghi chú thêm" placeholder="Bệnh nhân đã từng laser, peel da..." value={scarInfo.notes || ''} onChange={handleScarInfoChange} rows={3} />
                              </div>
                              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl">
                                <ImageUploader key="scar-uploader" onFilesSelect={setScarFaceImages} selectedFiles={scarFaceImages} />
                              </div>
                          </div>
                      )}
                      {activePlan === 'acne' && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                              <div className="p-4 space-y-4 bg-slate-50/80 border border-slate-200 rounded-2xl">
                                <h3 className="text-lg font-semibold text-slate-700">Thông tin Mụn</h3>
                                <TextInput name="acneType" label="Loại mụn chủ đạo" placeholder="Mụn viêm, mụn ẩn, mụn đầu đen..." value={acneInfo.acneType} onChange={handleAcneInfoChange} />
                                <TextInput name="duration" label="Thời gian bị mụn" placeholder="Khoảng 1 năm" value={acneInfo.duration} onChange={handleAcneInfoChange} />
                                <TextInput name="triggers" label="Yếu tố khởi phát (nghi ngờ)" placeholder="Stress, thay đổi nội tiết, mỹ phẩm..." value={acneInfo.triggers} onChange={handleAcneInfoChange} />
                                <TextInput name="pastTreatments" label="Các phương pháp đã điều trị" placeholder="Đã dùng BHA, Retinol không kê đơn..." value={acneInfo.pastTreatments} onChange={handleAcneInfoChange} />
                                <TextAreaInput id="acne-notes" name="notes" label="Ghi chú thêm" placeholder="Da rất dầu, dễ bị thâm sau mụn..." value={acneInfo.notes || ''} onChange={handleAcneInfoChange} rows={2} />
                              </div>
                              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl">
                                <ImageUploader key="acne-uploader" onFilesSelect={setAcneFaceImages} selectedFiles={acneFaceImages} />
                              </div>
                          </div>
                      )}
                      {activePlan === 'melasma' && (
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                              <div className="p-4 space-y-4 bg-slate-50/80 border border-slate-200 rounded-2xl">
                                <h3 className="text-lg font-semibold text-slate-700">Thông tin Nám</h3>
                                <TextInput name="melasmaType" label="Loại nám" placeholder="Nám mảng, nám chân sâu, hỗn hợp..." value={melasmaInfo.melasmaType} onChange={handleMelasmaInfoChange} />
                                <TextInput name="location" label="Vị trí" placeholder="Hai bên gò má, trán, quanh miệng..." value={melasmaInfo.location} onChange={handleMelasmaInfoChange} />
                                <TextInput name="duration" label="Thời gian bị nám" placeholder="Khoảng 2 năm, sau khi sinh..." value={melasmaInfo.duration} onChange={handleMelasmaInfoChange} />
                                <TextInput name="triggers" label="Yếu tố khởi phát (nghi ngờ)" placeholder="Tiếp xúc nắng, thay đổi nội tiết, di truyền..." value={melasmaInfo.triggers} onChange={handleMelasmaInfoChange} />
                                <TextInput name="pastTreatments" label="Các phương pháp đã điều trị" placeholder="Đã dùng kem trị nám, laser..." value={melasmaInfo.pastTreatments} onChange={handleMelasmaInfoChange} />
                                <TextAreaInput id="melasma-notes" name="notes" label="Ghi chú thêm" placeholder="Da khô, dễ kích ứng với hydroquinone..." value={melasmaInfo.notes || ''} onChange={handleMelasmaInfoChange} rows={2} />
                              </div>
                              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl">
                                <ImageUploader key="melasma-uploader" onFilesSelect={setMelasmaFaceImages} selectedFiles={melasmaFaceImages} />
                              </div>
                          </div>
                      )}
                      {activePlan === 'rejuvenation' && (
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                              <div className="p-4 space-y-4 bg-slate-50/80 border border-slate-200 rounded-2xl">
                                <h3 className="text-lg font-semibold text-slate-700">Thông tin Trẻ hóa</h3>
                                <TextInput name="mainConcerns" label="Mối quan tâm chính" placeholder="Nếp nhăn, chảy xệ, da không đều màu..." value={rejuvenationInfo.mainConcerns} onChange={handleRejuvenationInfoChange} />
                                <TextInput name="targetArea" label="Vùng cần điều trị" placeholder="Toàn mặt, vùng mắt, cổ..." value={rejuvenationInfo.targetArea} onChange={handleRejuvenationInfoChange} />
                                <TextInput name="pastTreatments" label="Các phương pháp đã điều trị" placeholder="Đã từng tiêm botox, filler, laser..." value={rejuvenationInfo.pastTreatments} onChange={handleRejuvenationInfoChange} />
                                <TextAreaInput id="rejuvenation-notes" name="notes" label="Ghi chú thêm" placeholder="Bệnh nhân mong muốn kết quả tự nhiên, không muốn nghỉ dưỡng..." value={rejuvenationInfo.notes || ''} onChange={handleRejuvenationInfoChange} rows={3} />
                              </div>
                              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl">
                                <ImageUploader key="rejuvenation-uploader" onFilesSelect={setRejuvenationFaceImages} selectedFiles={rejuvenationFaceImages} />
                              </div>
                          </div>
                      )}
                  </div>
              </div>

              {/* Analyze Button */}
              {(activePlan === 'general' || activePlan === 'scar' || activePlan === 'acne' || activePlan === 'melasma' || activePlan === 'rejuvenation') && (
                <button
                  onClick={handleAnalysis}
                  disabled={!canAnalyze}
                  className="w-full text-lg bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-4 rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-600 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center gap-3"
                >
                   {isLoading ? 'Đang phân tích...' : 'Phân tích & Tạo phác đồ'}
                </button>
              )}

              {/* Result Section */}
               <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 min-h-[600px]">
                 <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-6 flex-wrap gap-2">
                    <h2 className="text-2xl font-bold text-slate-800">Chẩn đoán & Phác đồ cá nhân hóa</h2>
                     {analysisResult && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={handleDownloadPdf}
                            disabled={isGeneratingPdf}
                            className="bg-red-100 text-red-700 font-bold py-2 px-3 rounded-lg hover:bg-red-200 disabled:bg-slate-200 disabled:text-slate-500 transition-colors flex items-center"
                            title="Tải xuống hồ sơ dưới dạng tệp PDF"
                        >
                            {isGeneratingPdf ? 'Đang tạo...' : 'Tải PDF'}
                        </button>
                        <button
                            onClick={handleSaveToDatabase}
                            disabled={isSavingToDB}
                            className="bg-purple-100 text-purple-700 font-bold py-2 px-3 rounded-lg hover:bg-purple-200 disabled:bg-slate-200 disabled:text-slate-500 transition-colors flex items-center"
                            title="Lưu hồ sơ vào cơ sở dữ liệu cục bộ"
                        >
                            {isSavingToDB ? 'Đang lưu...' : 'Lưu trữ'}
                        </button>
                        <button
                            onClick={handleSendZalo}
                            disabled={isSendingZalo || !patientInfo.phoneNumber}
                            className="bg-blue-100 text-blue-700 font-bold py-2 px-3 rounded-lg hover:bg-blue-200 disabled:bg-slate-200 disabled:text-slate-500 transition-colors flex items-center"
                            title="Gửi kết quả qua Zalo"
                        >
                            {isSendingZalo ? 'Đang gửi...' : 'Gửi Zalo'}
                        </button>
                        <button
                            onClick={handleSaveAndSendEmail}
                            disabled={isSaving || !patientInfo.email}
                            className="bg-green-100 text-green-700 font-bold py-2 px-3 rounded-lg hover:bg-green-200 disabled:bg-slate-200 disabled:text-slate-500 transition-colors flex items-center"
                            title="Lưu và gửi kết quả qua Email"
                        >
                            {isSaving ? 'Đang gửi...' : 'Gửi Email'}
                        </button>
                    </div>
                  )}
                </div>
                {isLoading && <Loader />}
                {error && (
                  <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg" role="alert">
                    <p className="font-bold">Lỗi</p>
                    <p>{error}</p>
                  </div>
                )}
                {!isLoading && !error && !analysisResult && (
                  <div className="text-center py-12 text-slate-500">
                      <p>Kết quả sẽ xuất hiện ở đây sau khi phân tích.</p>
                  </div>
                )}
                {analysisResult && editablePlan && (
                  <>
                    {activePlan === 'general' && <ResultDisplay result={analysisResult as AnalysisResult} editablePlan={editablePlan as TreatmentPlan} onPlanChange={setEditablePlan as any} availableMachines={availableMachines} availableCosmetics={availableCosmetics} />}
                    {activePlan === 'scar' && <ScarResultDisplay result={analysisResult as ScarAnalysisResult} editablePlan={editablePlan as ScarTreatmentPlan} onPlanChange={setEditablePlan as any} availableMachines={availableMachines} availableCosmetics={availableCosmetics} />}
                    {activePlan === 'acne' && <AcneResultDisplay result={analysisResult as AcneAnalysisResult} editablePlan={editablePlan as AcneTreatmentPlan} onPlanChange={setEditablePlan as any} availableMachines={availableMachines} availableCosmetics={availableCosmetics} />}
                    {activePlan === 'melasma' && <MelasmaResultDisplay result={analysisResult as MelasmaAnalysisResult} editablePlan={editablePlan as MelasmaTreatmentPlan} onPlanChange={setEditablePlan as any} availableMachines={availableMachines} availableCosmetics={availableCosmetics} />}
                    {activePlan === 'rejuvenation' && <RejuvenationResultDisplay result={analysisResult as RejuvenationAnalysisResult} editablePlan={editablePlan as RejuvenationTreatmentPlan} onPlanChange={setEditablePlan as any} availableMachines={availableMachines} availableCosmetics={availableCosmetics} />}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      {isDetailModalOpen && <PatientDetailModal record={selectedRecordForDetail} onClose={handleCloseDetailModal} />}
    </div>
  );
};

export default App;