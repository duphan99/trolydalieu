import type { PatientRecord, InClinicProcedure, ScarPatientRecord, AcnePatientRecord, CosmeticInfo, RejuvenationPatientRecord } from '../types';
import { addPatientRecord, getPatientHistory, addScarRecord, addAcneRecord, addRejuvenationRecord } from './dbService';

/**
 * Fetches the patient history from the local IndexedDB database.
 * @returns A promise that resolves to an array of patient records.
 */
export const fetchPatientHistory = async (): Promise<PatientRecord[]> => {
  console.log("FETCHING PATIENT HISTORY FROM INDEXEDDB...");
  // Simulate a small network delay for better UX feedback on loading states
  await new Promise(resolve => setTimeout(resolve, 500));
  try {
    const records = await getPatientHistory();
    console.log("FETCHED HISTORY SUCCESSFULLY.");
    return records;
  } catch (error) {
    console.error("Failed to fetch patient history:", error);
    throw new Error("Không thể tải lịch sử bệnh nhân từ cơ sở dữ liệu cục bộ.");
  }
};


/**
 * Saves a patient record to the local IndexedDB database.
 * @param record - The patient record object to save.
 * @returns A promise that resolves to an object containing success status and a message.
 */
export const saveRecordToDatabase = async (record: Omit<PatientRecord, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string }> => {
  console.log("SAVING TO INDEXEDDB:", record);
  try {
    await addPatientRecord(record);
    console.log("SAVED TO DATABASE SUCCESSFULLY.");
    return { success: true, message: "Hồ sơ đã được lưu thành công vào database." };
  } catch(e) {
    console.error("Error saving to database:", e);
    // Re-throw a user-friendly error message
    throw new Error("Không thể lưu dữ liệu vào database cục bộ.");
  }
};


/**
 * MOCKS: Simulates saving a record to a remote server.
 * For application consistency, this action also saves the record to the local IndexedDB.
 * @param record - The patient record object to save.
 * @returns A promise that resolves to an object containing success status and a message.
 */
export const savePatientRecord = async (record: Omit<PatientRecord, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string }> => {
  console.log("SIMULATING REMOTE SAVE & SAVING LOCALLY:", record);
  await saveRecordToDatabase(record); // Persist to local DB
  
  // Simulate remote API call latency
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log("SIMULATED REMOTE SAVE SUCCESSFUL.");
  return { success: true, message: "Hồ sơ đã được lưu thành công." };
};

/**
 * MOCKS: Simulates sending an email with the treatment plan to the patient.
 * In a real application, this would call a backend API.
 * @param record - The patient record object containing the info to be sent.
 * @returns A promise that resolves to an object containing success status and a message.
 */
export const sendEmailToPatient = async (record: Omit<PatientRecord, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string }> => {
  console.log(`SIMULATING SENDING EMAIL TO ${record.patientInfo.email}:`, record);

  // Simulate network delay for the email sending API call
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log("SIMULATED EMAIL SENT SUCCESSFULLY.");
  return { success: true, message: `Email đã được gửi thành công tới ${record.patientInfo.email}.` };
};

/**
 * MOCKS: Simulates sending a Zalo message with the treatment plan to the patient.
 * In a real application, this would call a backend API that integrates with Zalo OA API.
 * @param record - The patient record object containing the info to be sent.
 * @returns A promise that resolves to an object containing success status and a message.
 */
export const sendZaloMessage = async (record: Omit<PatientRecord, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string }> => {
  const { patientInfo, diagnosis, treatmentPlan } = record;

  const formatList = (items: string[]) => items.map(item => `- ${item}`).join('\n');

  const message = `
Chào ${patientInfo.fullName},

Phòng khám gửi bạn kết quả chẩn đoán và phác đồ điều trị da của mình:

🔬 *CHẨN ĐOÁN*
- Tình trạng: ${diagnosis.condition}
- Mức độ: ${diagnosis.severity}
- Phân tích chi tiết: ${diagnosis.analysis}

📋 *PHÁC ĐỒ ĐIỀU TRỊ*

**Buổi sáng:**
${formatList(treatmentPlan.morningRoutine)}

**Buổi tối:**
${formatList(treatmentPlan.eveningRoutine)}

**Liệu trình tại phòng khám:**
${formatList(treatmentPlan.inClinicProcedures.map(p => `${p.name} (${p.frequency}): ${p.description}`))}

---
Lưu ý: Đây là phác đồ do AI đề xuất và đã được bác sĩ xem xét. Vui lòng tuân thủ hướng dẫn và liên hệ với phòng khám nếu có bất kỳ câu hỏi nào.
`;

  console.log(`SIMULATING SENDING ZALO MESSAGE TO ${patientInfo.phoneNumber}:`, message);

  // Simulate network delay for the Zalo API call
  await new Promise(resolve => setTimeout(resolve, 1800));

  console.log("SIMULATED ZALO MESSAGE SENT SUCCESSFULLY.");
  return { success: true, message: `Tin nhắn Zalo đã được gửi thành công tới ${patientInfo.phoneNumber}.` };
};


// --- SCAR RECORD FUNCTIONS ---

export const saveScarRecordToDatabase = async (record: Omit<ScarPatientRecord, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string }> => {
  console.log("SAVING SCAR RECORD TO INDEXEDDB:", record);
  try {
    await addScarRecord(record);
    console.log("SAVED SCAR RECORD TO DATABASE SUCCESSFULLY.");
    return { success: true, message: "Hồ sơ trị sẹo đã được lưu thành công vào database." };
  } catch(e) {
    console.error("Error saving scar record to database:", e);
    throw new Error("Không thể lưu dữ liệu trị sẹo vào database cục bộ.");
  }
};

export const sendZaloMessageForScar = async (record: Omit<ScarPatientRecord, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string }> => {
  const { patientInfo, analysisResult } = record;
  const { treatmentPlan } = analysisResult;

  const formatList = (items: string[]) => items.map(item => `- ${item}`).join('\n');
  const formatProcedures = (items: InClinicProcedure[]) => items.map(p => `- ${p.name} (${p.frequency}): ${p.description}`).join('\n');

  const message = `
Chào ${patientInfo.fullName},

Phòng khám gửi bạn phác đồ điều trị sẹo của mình:

🔬 *ĐÁNH GIÁ TÌNH TRẠNG*
${analysisResult.assessment}

📋 *PHÁC ĐỒ ĐIỀU TRỊ*

**Liệu trình tại phòng khám:**
${formatProcedures(treatmentPlan.inClinicProcedures)}

**Chăm sóc tại nhà:**
${formatList(treatmentPlan.homeCareRoutine)}

**Lộ trình điều trị:** ${treatmentPlan.timeline}
**Kết quả mong đợi:** ${treatmentPlan.expectedOutcome}

---
Lưu ý: Đây là phác đồ do AI đề xuất và đã được bác sĩ xem xét. Vui lòng tuân thủ hướng dẫn và liên hệ với phòng khám nếu có bất kỳ câu hỏi nào.
`;

  console.log(`SIMULATING SENDING ZALO MESSAGE FOR SCAR TO ${patientInfo.phoneNumber}:`, message);
  await new Promise(resolve => setTimeout(resolve, 1800));
  console.log("SIMULATED ZALO MESSAGE SENT SUCCESSFULLY.");
  return { success: true, message: `Tin nhắn Zalo đã được gửi thành công tới ${patientInfo.phoneNumber}.` };
};

export const sendEmailToPatientForScar = async (record: Omit<ScarPatientRecord, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string }> => {
  console.log(`SIMULATING SENDING SCAR PLAN EMAIL TO ${record.patientInfo.email}:`, record);
  await new Promise(resolve => setTimeout(resolve, 1500));
  console.log("SIMULATED EMAIL SENT SUCCESSFULLY.");
  return { success: true, message: `Email đã được gửi thành công tới ${record.patientInfo.email}.` };
};


// --- ACNE RECORD FUNCTIONS ---

export const saveAcneRecordToDatabase = async (record: Omit<AcnePatientRecord, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string }> => {
  console.log("SAVING ACNE RECORD TO INDEXEDDB:", record);
  try {
    await addAcneRecord(record);
    console.log("SAVED ACNE RECORD TO DATABASE SUCCESSFULLY.");
    return { success: true, message: "Hồ sơ trị mụn đã được lưu thành công vào database." };
  } catch (e) {
    console.error("Error saving acne record to database:", e);
    throw new Error("Không thể lưu dữ liệu trị mụn vào database cục bộ.");
  }
};

export const sendZaloMessageForAcne = async (record: Omit<AcnePatientRecord, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string }> => {
  const { patientInfo, analysisResult } = record;
  const { treatmentPlan } = analysisResult;

  const formatList = (items: string[]) => items.map(item => `- ${item}`).join('\n');
  const formatProcedures = (items: InClinicProcedure[]) => items.map(p => `- ${p.name} (${p.frequency}): ${p.description}`).join('\n');

  const message = `
Chào ${patientInfo.fullName},

Phòng khám gửi bạn phác đồ điều trị mụn của mình:

🔬 *ĐÁNH GIÁ TÌNH TRẠNG MỤN*
${analysisResult.assessment}

📋 *PHÁC ĐỒ ĐIỀU TRỊ*

**Liệu trình tại phòng khám:**
${formatProcedures(treatmentPlan.inClinicProcedures)}

**Chăm sóc tại nhà:**
${formatList(treatmentPlan.homeCareRoutine)}

**Lời khuyên về lối sống:**
${formatList(treatmentPlan.lifestyleAdvice)}

---
Lưu ý: Đây là phác đồ do AI đề xuất và đã được bác sĩ xem xét. Vui lòng tuân thủ hướng dẫn và liên hệ với phòng khám nếu có bất kỳ câu hỏi nào.
`;

  console.log(`SIMULATING SENDING ZALO MESSAGE FOR ACNE TO ${patientInfo.phoneNumber}:`, message);
  await new Promise(resolve => setTimeout(resolve, 1800));
  console.log("SIMULATED ZALO MESSAGE SENT SUCCESSFULLY.");
  return { success: true, message: `Tin nhắn Zalo đã được gửi thành công tới ${patientInfo.phoneNumber}.` };
};

export const sendEmailToPatientForAcne = async (record: Omit<AcnePatientRecord, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string }> => {
  console.log(`SIMULATING SENDING ACNE PLAN EMAIL TO ${record.patientInfo.email}:`, record);
  await new Promise(resolve => setTimeout(resolve, 1500));
  console.log("SIMULATED EMAIL SENT SUCCESSFULLY.");
  return { success: true, message: `Email đã được gửi thành công tới ${record.patientInfo.email}.` };
};

// --- REJUVENATION RECORD FUNCTIONS ---

export const saveRejuvenationRecordToDatabase = async (record: Omit<RejuvenationPatientRecord, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string }> => {
  console.log("SAVING REJUVENATION RECORD TO INDEXEDDB:", record);
  try {
    await addRejuvenationRecord(record);
    console.log("SAVED REJUVENATION RECORD TO DATABASE SUCCESSFULLY.");
    return { success: true, message: "Hồ sơ trẻ hóa đã được lưu thành công vào database." };
  } catch (e) {
    console.error("Error saving rejuvenation record to database:", e);
    throw new Error("Không thể lưu dữ liệu trẻ hóa vào database cục bộ.");
  }
};

export const sendZaloMessageForRejuvenation = async (record: Omit<RejuvenationPatientRecord, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string }> => {
  const { patientInfo, analysisResult } = record;
  const { treatmentPlan } = analysisResult;

  const formatList = (items: string[]) => items.map(item => `- ${item}`).join('\n');
  const formatProcedures = (items: InClinicProcedure[]) => items.map(p => `- ${p.name} (${p.frequency}): ${p.description}`).join('\n');

  const message = `
Chào ${patientInfo.fullName},

Phòng khám gửi bạn phác đồ trẻ hóa da của mình:

🔬 *ĐÁNH GIÁ TÌNH TRẠNG LÃO HÓA*
${analysisResult.assessment}

📋 *PHÁC ĐỒ ĐIỀU TRỊ*

**Lịch trình điều trị:**
${formatList(treatmentPlan.treatmentSchedule)}

**Liệu trình công nghệ cao:**
${formatProcedures(treatmentPlan.highTechProcedures)}

**Liệu pháp tiêm:**
${formatProcedures(treatmentPlan.injectionTherapies)}

**Chăm sóc tại nhà:**
${formatList(treatmentPlan.homeCareRoutine)}

---
Lưu ý: Đây là phác đồ do AI đề xuất và đã được bác sĩ xem xét. Vui lòng tuân thủ hướng dẫn và liên hệ với phòng khám nếu có bất kỳ câu hỏi nào.
`;

  console.log(`SIMULATING SENDING ZALO MESSAGE FOR REJUVENATION TO ${patientInfo.phoneNumber}:`, message);
  await new Promise(resolve => setTimeout(resolve, 1800));
  console.log("SIMULATED ZALO MESSAGE SENT SUCCESSFULLY.");
  return { success: true, message: `Tin nhắn Zalo đã được gửi thành công tới ${patientInfo.phoneNumber}.` };
};

export const sendEmailToPatientForRejuvenation = async (record: Omit<RejuvenationPatientRecord, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string }> => {
  console.log(`SIMULATING SENDING REJUVENATION PLAN EMAIL TO ${record.patientInfo.email}:`, record);
  await new Promise(resolve => setTimeout(resolve, 1500));
  console.log("SIMULATED EMAIL SENT SUCCESSFULLY.");
  return { success: true, message: `Email đã được gửi thành công tới ${record.patientInfo.email}.` };
};


// FIX: Added function to fetch products from a public Google Sheet CSV URL.
export const fetchProductsFromGoogleSheet = async (url: string): Promise<CosmeticInfo[]> => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Google Sheet fetch failed with status ${response.status}`);
        }
        const csvText = await response.text();
        const rows = csvText.split(/\r?\n/).slice(1); // Split by newline, remove header

        const products: CosmeticInfo[] = rows
            .map(row => {
                // A very basic CSV parser, assumes no commas within fields
                const columns = row.split(',');
                if (columns.length < 6) return null;

                const usageValue = columns[5]?.trim().toLowerCase();
                let usage: 'morning' | 'evening' | 'both' = 'both';
                if (usageValue === 'morning' || usageValue === 'evening') {
                    usage = usageValue;
                }

                return {
                    name: columns[0]?.trim() || '',
                    brand: columns[1]?.trim() || 'N/A',
                    url: columns[2]?.trim() || '#',
                    description: columns[3]?.trim() || '',
                    keywords: columns[4]?.trim().split(';').map(k => k.trim()).filter(Boolean) || [],
                    usage: usage,
                };
            })
            .filter((p): p is CosmeticInfo => p !== null && p.name !== '');

        return products;
    } catch (error) {
        console.error("Error fetching or parsing Google Sheet CSV:", error);
        throw new Error("Không thể tải hoặc xử lý dữ liệu từ Google Sheet. Vui lòng kiểm tra lại URL, định dạng file và chắc chắn rằng sheet đã được xuất bản công khai.");
    }
};