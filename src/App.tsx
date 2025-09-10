import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { TextInput } from './components/TextInput';
import { ResultDisplay } from './components/ResultDisplay';
import { Loader } from './components/Loader';
import { analyzeSkinCondition } from './services/geminiService';
import { savePatientRecord, sendEmailToPatient, sendZaloMessage, saveRecordToDatabase, fetchProductsFromGoogleSheet } from './services/apiService';
import { generatePatientReportPDF } from './services/pdfService';
import type { AnalysisResult, PatientInfo, TreatmentPlan, PatientRecord, MachineInfo, CosmeticInfo } from './types';
import { fileToBase64 } from './utils/file';
import { TextAreaInput } from './components/TextAreaInput';
import { PatientHistory } from './components/PatientHistory';
import { PatientDetailModal } from './components/PatientDetailModal';
import { COSMETIC_PRODUCTS } from './services/cosmeticData';
import { OSAKACO_MACHINES } from './services/machineData';
import { ScarTreatmentPlan } from './components/ScarTreatmentPlan';
import type { AppView } from './components/Header';
import { TagInput } from './components/TagInput';


const App: React.FC = () => {
  const [patientImageFiles, setPatientImageFiles] = useState<File[]>([]);
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    fullName: '',
    age: '',
    address: '',
    phoneNumber: '',
    email: '',
    notes: '',
  });

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [editablePlan, setEditablePlan] = useState<TreatmentPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSavingToDB, setIsSavingToDB] = useState<boolean>(false);
  const [isSendingZalo, setIsSendingZalo] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [availableMachines, setAvailableMachines] = useState<MachineInfo[]>(OSAKACO_MACHINES);
  const [availableCosmetics, setAvailableCosmetics] = useState<CosmeticInfo[]>(COSMETIC_PRODUCTS);
  const [activeView, setActiveView] = useState<AppView>('main');
  
  // State for clinic resources
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>('');
  const [isFetchingProducts, setIsFetchingProducts] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);


  // State for patient detail modal
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<PatientRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleShowRecordDetail = (record: PatientRecord) => {
    setSelectedRecordForDetail(record);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    // Delay clearing the record to allow for closing animation
    setTimeout(() => setSelectedRecordForDetail(null), 300);
  };

  const handlePatientInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPatientInfo(prev => ({ ...prev, [name]: value }));
  };
  
    const validateGoogleSheetUrl = (url: string): string | null => {
      if (!url.trim()) {
          return null; // No error if empty, let the fetch handler show the message
      }
      try {
          const parsedUrl = new URL(url);
          const isGoogleSpreadsheet = parsedUrl.hostname === 'docs.google.com' && parsedUrl.pathname.includes('/spreadsheets/');
          const isCsvExport = parsedUrl.pathname.endsWith('/export') && new URLSearchParams(parsedUrl.search).get('format') === 'csv';

          if (!isGoogleSpreadsheet) {
              return "URL không hợp lệ. Vui lòng kiểm tra lại, URL phải là từ 'docs.google.com/spreadsheets/...'.";
          }
          if (!isCsvExport) {
              return "URL phải là link xuất bản dưới dạng CSV (chứa '/export?format=csv').";
          }
      } catch (error) {
          return "Định dạng URL không hợp lệ.";
      }
      return null; // URL is valid
  };

  const handleGoogleSheetUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newUrl = e.target.value;
      setGoogleSheetUrl(newUrl);
      if (newUrl) {
          setFetchError(validateGoogleSheetUrl(newUrl));
      } else {
          setFetchError(null);
      }
  };

  const handleFetchProducts = async () => {
    if (!googleSheetUrl) {
      setFetchError("Vui lòng nhập URL của Google Sheet.");
      return;
    }
    const validationError = validateGoogleSheetUrl(googleSheetUrl);
    if (validationError) {
        setFetchError(validationError);
        return;
    }

    setIsFetchingProducts(true);
    setFetchError(null);
    try {
      const products = await fetchProductsFromGoogleSheet(googleSheetUrl);
      // Combine with existing manual products, removing duplicates
      const newProductNames = products.map(p => p.name);
      const existingProductNames = availableCosmetics.map(p => p.name);
      
      const combinedProducts = [...availableCosmetics];
      products.forEach(newProduct => {
        if (!existingProductNames.includes(newProduct.name)) {
            combinedProducts.push(newProduct);
        }
      });

      setAvailableCosmetics(combinedProducts);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định.';
      setFetchError(`Không thể tải sản phẩm: ${errorMessage}`);
    } finally {
      setIsFetchingProducts(false);
    }
  };


  const handleAnalysis = useCallback(async () => {
    if (patientImageFiles.length === 0 || !patientInfo.fullName || !patientInfo.age || !patientInfo.address) {
      setError('Vui lòng điền đầy đủ tất cả thông tin bệnh nhân bắt buộc và tải lên ít nhất một hình ảnh.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setEditablePlan(null);

    try {
      const imagePromises = patientImageFiles.map(file => fileToBase64(file));
      const imageParts = await Promise.all(imagePromises);
      const productNames = availableCosmetics.map(p => p.name);
      const machineNames = availableMachines.map(m => m.name);
      const result = await analyzeSkinCondition(imageParts, patientInfo, productNames, machineNames);
      setAnalysisResult(result);
      setEditablePlan(result.treatmentPlan);
    } catch (err) {
      console.error('Analysis failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định trong quá trình phân tích.';
      setError(`Không thể phân tích. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [patientImageFiles, patientInfo, availableCosmetics, availableMachines]);

  const handleDownloadPdf = async () => {
    if (!analysisResult || !editablePlan) {
      alert("Không có dữ liệu hợp lệ để tạo PDF.");
      return;
    }

    setIsGeneratingPdf(true);
    setError(null);
    
    const recordForPdf: Omit<PatientRecord, 'id' | 'createdAt'> = {
        patientInfo,
        diagnosis: analysisResult.diagnosis,
        treatmentPlan: editablePlan
    }

    try {
      await generatePatientReportPDF(recordForPdf, analysisResult.disclaimer);
    } catch (err) {
        console.error("PDF Generation failed:", err);
        const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định.';
        setError(`Không thể tạo tệp PDF. ${errorMessage}`);
        alert(`Đã xảy ra lỗi khi tạo tệp PDF: ${errorMessage}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };


  const handleDownloadJson = () => {
    if (!analysisResult || !editablePlan) {
      alert("Không có dữ liệu hợp lệ để lưu.");
      return;
    }

    const patientRecord: Omit<PatientRecord, 'id' | 'createdAt'> = {
      patientInfo,
      diagnosis: analysisResult.diagnosis,
      treatmentPlan: editablePlan,
    };

    const dataStr = JSON.stringify(patientRecord, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    
    const safeFullName = patientInfo.fullName.replace(/[^a-zA-Z0-9]/g, '_') || 'BenhNhan';
    const date = new Date().toISOString().slice(0, 10);
    link.download = `HoSo_${safeFullName}_${date}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveToDatabase = async () => {
    if (!analysisResult || !editablePlan) {
      alert("Không có dữ liệu hợp lệ để lưu.");
      return;
    }
    
    setIsSavingToDB(true);
    setError(null);

    const patientRecord: Omit<PatientRecord, 'id' | 'createdAt'> = {
      patientInfo,
      diagnosis: analysisResult.diagnosis,
      treatmentPlan: editablePlan,
    };

    try {
      // @ts-ignore
      const response = await saveRecordToDatabase(patientRecord);
      console.log(response.message);
      alert('Hồ sơ bệnh nhân đã được lưu thành công vào database!');
    } catch (err) {
      console.error('Save to DB failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định.';
      setError(`Không thể lưu vào database. ${errorMessage}`);
      alert(`Đã xảy ra lỗi khi lưu vào database: ${errorMessage}`);
    } finally {
      setIsSavingToDB(false);
    }
  };

  const handleSaveAndSendEmail = async () => {
    if (!analysisResult || !editablePlan || !patientInfo.email) {
      alert("Vui lòng đảm bảo có kết quả phân tích và đã nhập email của bệnh nhân.");
      return;
    }
    
    setIsSaving(true);
    setError(null);

    const patientRecord: Omit<PatientRecord, 'id' | 'createdAt'> = {
      patientInfo,
      diagnosis: analysisResult.diagnosis,
      treatmentPlan: editablePlan,
    };

    try {
       // @ts-ignore
      const saveResponse = await savePatientRecord(patientRecord);
      console.log(saveResponse.message); 

       // @ts-ignore
      const emailResponse = await sendEmailToPatient(patientRecord);
      console.log(emailResponse.message); 

      alert(`Hồ sơ đã được lưu và email đã được gửi thành công tới ${patientInfo.email}!`);
    } catch (err) {
      console.error('Save or Send Email failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định.';
      setError(`Không thể lưu và gửi email. ${errorMessage}`);
      alert(`Đã xảy ra lỗi: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendZalo = async () => {
    if (!analysisResult || !editablePlan || !patientInfo.phoneNumber) {
      alert("Vui lòng đảm bảo có kết quả phân tích và đã nhập số điện thoại của bệnh nhân.");
      return;
    }
    
    setIsSendingZalo(true);
    setError(null);

    const patientRecord: Omit<PatientRecord, 'id' | 'createdAt'> = {
      patientInfo,
      diagnosis: analysisResult.diagnosis,
      treatmentPlan: editablePlan,
    };

    try {
       // @ts-ignore
      const zaloResponse = await sendZaloMessage(patientRecord);
      console.log(zaloResponse.message);
      alert(`Tin nhắn Zalo đã được gửi thành công tới ${patientInfo.phoneNumber}!`);
    } catch (err) {
      console.error('Send Zalo failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định.';
      setError(`Không thể gửi tin nhắn Zalo. ${errorMessage}`);
      alert(`Đã xảy ra lỗi khi gửi Zalo: ${errorMessage}`);
    } finally {
      setIsSendingZalo(false);
    }
  };

  const canAnalyze = 
    patientImageFiles.length > 0 && 
    patientInfo.fullName.trim().length > 0 &&
    patientInfo.age.trim().length > 0 &&
    patientInfo.address.trim().length > 0 &&
    !isLoading;

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <Header activeView={activeView} onNavigate={setActiveView} />
      <main className="container mx-auto p-6 md:p-10">
         {activeView === 'history' && (
          <PatientHistory onRecordSelect={handleShowRecordDetail} />
        )}

        {activeView === 'scar' && (
            <ScarTreatmentPlan
              availableMachines={availableMachines}
              availableCosmetics={availableCosmetics}
            />
        )}
        
        {activeView === 'main' && (
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col gap-8">
              
              {/* Top Section: Inputs */}
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 flex flex-col gap-6">
                <h2 className="text-2xl font-bold text-slate-800 border-b border-slate-200 pb-4">Dữ liệu Bệnh nhân & Tài nguyên</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4 p-4 bg-slate-50/80 border border-slate-200 rounded-2xl">
                        <h3 className="text-lg font-semibold text-slate-700">Thông tin Bệnh nhân</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TextInput
                            name="fullName"
                            label="Họ và tên"
                            placeholder="Nguyễn Văn A"
                            value={patientInfo.fullName}
                            onChange={handlePatientInfoChange}
                            required
                            />
                            <TextInput
                            name="age"
                            label="Tuổi"
                            placeholder="25"
                            type="number"
                            value={patientInfo.age}
                            onChange={handlePatientInfoChange}
                            required
                            />
                        </div>
                        <TextInput
                            name="address"
                            label="Địa chỉ"
                            placeholder="123 Đường ABC, Quận 1, TP. HCM"
                            value={patientInfo.address}
                            onChange={handlePatientInfoChange}
                            required
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TextInput
                            name="phoneNumber"
                            label="Số điện thoại (Gửi Zalo)"
                            placeholder="0901234567"
                            type="tel"
                            value={patientInfo.phoneNumber}
                            onChange={handlePatientInfoChange}
                            />
                            <TextInput
                            name="email"
                            label="Email Bệnh nhân"
                            placeholder="nguyenvana@email.com"
                            type="email"
                            value={patientInfo.email}
                            onChange={handlePatientInfoChange}
                            />
                        </div>
                        <TextAreaInput
                            id="notes"
                            name="notes"
                            label="Ghi chú thêm (Tùy chọn)"
                            placeholder="Ví dụ: Bệnh nhân có tiền sử dị ứng với aspirin, da nhạy cảm..."
                            value={patientInfo.notes || ''}
                            onChange={handlePatientInfoChange}
                            rows={3}
                        />
                    </div>

                    <ImageUploader onFilesSelect={setPatientImageFiles} selectedFiles={patientImageFiles} />
                </div>
                 {/* Clinic Resources Section */}
                <div className="space-y-4 p-4 border border-gray-200 rounded-2xl bg-slate-50/80">
                  <h3 className="text-lg font-semibold text-gray-700">Tài nguyên Phòng khám</h3>
                  
                  {/* Google Sheet Loader */}
                  <div className="space-y-2">
                    <label htmlFor="google-sheet-url" className="block text-sm font-medium text-gray-700">
                      Tải sản phẩm từ Google Sheet (URL đã xuất bản dưới dạng CSV)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        id="google-sheet-url"
                        placeholder="Dán URL Google Sheet CSV vào đây"
                        value={googleSheetUrl}
                        onChange={handleGoogleSheetUrlChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 transition"
                      />
                      <button
                        onClick={handleFetchProducts}
                        disabled={isFetchingProducts}
                        className="bg-teal-600 text-white font-bold py-2 px-3 rounded-lg shadow-md hover:bg-teal-700 disabled:bg-gray-400 transition-colors flex-shrink-0"
                      >
                        {isFetchingProducts ? 'Đang tải...' : 'Tải'}
                      </button>
                    </div>
                    {fetchError && <p className="mt-2 text-sm text-red-600">{fetchError}</p>}
                  </div>

                   <TagInput 
                    label="Mỹ phẩm có sẵn (Tên sản phẩm hoặc hoạt chất)"
                    tags={availableCosmetics.map(c => c.name)}
                    onTagsChange={(newTags) => {
                      const newCosmetics = newTags.map(tagName => {
                        const existing = availableCosmetics.find(c => c.name === tagName);
                        if (existing) return existing;
                        // Add new tag as a basic cosmetic item
                        return { name: tagName, brand: 'N/A', url: '#', description: 'Sản phẩm được thêm thủ công', keywords: [], usage: 'both' };
                      });
                      setAvailableCosmetics(newCosmetics);
                    }}
                    placeholder="Nhập tên sản phẩm rồi nhấn Enter"
                  />

                  <TagInput 
                    label="Máy thẩm mỹ có sẵn"
                    tags={availableMachines.map(m => m.name)}
                    onTagsChange={(newTags) => {
                       const newMachines = newTags.map(tagName => {
                        const existing = availableMachines.find(m => m.name === tagName);
                        if (existing) return existing;
                        // Add new tag as a basic machine item
                        return { name: tagName, url: '#', description: 'Máy được thêm thủ công', keywords: [] };
                      });
                      setAvailableMachines(newMachines);
                    }}
                    placeholder="Nhập tên máy rồi nhấn Enter"
                  />
                </div>
                
                <button
                  onClick={handleAnalysis}
                  disabled={!canAnalyze}
                  className="w-full text-lg bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-4 rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-600 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Đang phân tích...</span>
                    </>
                  ) : (
                    <>
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span>Phân tích & Tạo phác đồ</span>
                    </>
                  )}
                </button>
              </div>

              {/* Bottom Section: Results */}
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
                          {isGeneratingPdf ? (
                               <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                          ) : (
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                          )}
                          <span>{isGeneratingPdf ? 'Đang tạo...' : 'PDF'}</span>
                        </button>
                         <button
                          onClick={handleSaveToDatabase}
                          disabled={isSavingToDB}
                          className="bg-purple-100 text-purple-700 font-bold py-2 px-3 rounded-lg hover:bg-purple-200 disabled:bg-slate-200 disabled:text-slate-500 transition-colors flex items-center"
                          title="Lưu hồ sơ vào cơ sở dữ liệu"
                        >
                          {isSavingToDB ? (
                              <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          ) : (
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7l8-4 8 4m0 10c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                              </svg>
                          )}
                          <span>{isSavingToDB ? 'Lưu...' : 'Lưu trữ'}</span>
                        </button>
                         <button
                            onClick={handleSendZalo}
                            disabled={isSendingZalo || !patientInfo.phoneNumber}
                            className="bg-blue-100 text-blue-700 font-bold py-2 px-3 rounded-lg hover:bg-blue-200 disabled:bg-slate-200 disabled:text-slate-500 transition-colors flex items-center"
                            title="Gửi kết quả qua Zalo"
                        >
                            {isSendingZalo ? (
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            )}
                            <span>{isSendingZalo ? 'Gửi...' : 'Gửi Zalo'}</span>
                        </button>
                         <button
                          onClick={handleSaveAndSendEmail}
                          disabled={isSaving || !patientInfo.email}
                           className="bg-green-100 text-green-700 font-bold py-2 px-3 rounded-lg hover:bg-green-200 disabled:bg-slate-200 disabled:text-slate-500 transition-colors flex items-center"
                        >
                          {isSaving ? (
                               <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          ) : (
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                          )}
                          <span>{isSaving ? 'Gửi...' : 'Gửi Email'}</span>
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
                  <div className="text-center py-12 text-slate-500 flex flex-col items-center justify-center h-full">
                      <div className="bg-slate-100 p-6 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="mt-6 text-lg font-semibold">Báo cáo đang chờ phân tích</p>
                      <p className="mt-1 max-w-sm">Kết quả chẩn đoán và phác đồ điều trị sẽ xuất hiện ở đây sau khi bạn cung cấp đủ thông tin và bắt đầu quá trình.</p>
                  </div>
                )}
                {analysisResult && editablePlan && (
                  <ResultDisplay 
                    result={analysisResult} 
                    editablePlan={editablePlan}
                    onPlanChange={setEditablePlan}
                    availableMachines={availableMachines}
                    availableCosmetics={availableCosmetics}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      {isDetailModalOpen && (
        <PatientDetailModal 
            record={selectedRecordForDetail} 
            onClose={handleCloseDetailModal} 
        />
      )}
    </div>
  );
};

export default App;