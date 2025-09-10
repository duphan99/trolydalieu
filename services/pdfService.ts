import type { PatientRecord, InClinicProcedure, ScarPatientRecord, ScarInfo, AcnePatientRecord, RejuvenationPatientRecord } from '../types';
import { BE_VIETNAM_PRO_BOLD_BASE64, BE_VIETNAM_PRO_REGULAR_BASE64 } from './fontData';

// Mở rộng interface Window để khai báo các thư viện jsPDF được tải toàn cục
declare global {
  interface Window {
    jspdf: any;
  }
}

// --- SHARED UTILITIES ---
const PRIMARY_COLOR = [45, 55, 72];
const ACCENT_COLOR = [37, 99, 235];
const LIGHT_GRAY_BG = [241, 245, 249];
const TEXT_COLOR = [51, 65, 85];
const PAGE_MARGIN = 14;

const setupDoc = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.addFileToVFS('BeVietnamPro-Regular.ttf', BE_VIETNAM_PRO_REGULAR_BASE64);
    doc.addFont('BeVietnamPro-Regular.ttf', 'BeVietnamPro', 'normal');
    doc.addFileToVFS('BeVietnamPro-Bold.ttf', BE_VIETNAM_PRO_BOLD_BASE64);
    doc.addFont('BeVietnamPro-Bold.ttf', 'BeVietnamPro', 'bold');
    
    return doc;
}

const addHeader = (doc: any, title: string) => {
    doc.setFillColor(...PRIMARY_COLOR);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('BeVietnamPro', 'bold');
    doc.setFontSize(16);
    doc.text(title, PAGE_MARGIN, 17);
    
    doc.setDrawColor(255,255,255);
    doc.setLineWidth(0.5);
    doc.circle(190, 14, 6);
    doc.circle(190, 14, 3);
}

const addFooter = (doc: any, disclaimer: string) => {
    const pageHeight = doc.internal.pageSize.height;
    const footerY = pageHeight - 28;
    doc.setLineWidth(0.2);
    doc.setDrawColor(...PRIMARY_COLOR);
    doc.line(PAGE_MARGIN, footerY, 210 - PAGE_MARGIN, footerY);

    doc.setFont('BeVietnamPro', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(150); // Gray
    const disclaimerText = doc.splitTextToSize(
      `Miễn trừ trách nhiệm: ${disclaimer || 'Phác đồ này được tạo bởi AI và cần được bác sĩ chuyên khoa xem xét và xác nhận trước khi áp dụng. Kết quả có thể khác nhau tùy thuộc vào từng cá nhân.'}`, 
      182
    );
    doc.text(disclaimerText, PAGE_MARGIN, footerY + 7);
    
    const pageNumText = `Trang ${doc.internal.getNumberOfPages()}`;
    doc.text(pageNumText, 210 - PAGE_MARGIN, pageHeight - 10, { align: 'right' });
}

const addSectionTitle = (doc: any, title: string, y: number) => {
    doc.setFont('BeVietnamPro', 'bold');
    doc.setFontSize(14);
    doc.setFillColor(...ACCENT_COLOR);
    doc.setTextColor(255, 255, 255);
    doc.roundedRect(PAGE_MARGIN, y - 5, 182, 9, 2, 2, 'F');
    doc.text(title, PAGE_MARGIN + 4, y);
    doc.setTextColor(...TEXT_COLOR);
    return y + 12;
};


export const generatePatientReportPDF = async (record: Omit<PatientRecord, 'id' | 'createdAt'>, disclaimer: string): Promise<void> => {
    const doc = setupDoc();
    let currentY = 0;

    addHeader(doc, "PHÒNG KHÁM DA LIỄU A.I.");
    
    currentY = 42;
    doc.setTextColor(...TEXT_COLOR);

    doc.setFont('BeVietnamPro', 'bold');
    doc.setFontSize(20);
    doc.text("HỒ SƠ & PHÁC ĐỒ ĐIỀU TRỊ", 105, currentY, { align: 'center' });
    currentY += 15;

    currentY = addSectionTitle(doc, "1. Dữ liệu Bệnh nhân", currentY);
    
    doc.setFont('BeVietnamPro', 'normal');
    doc.setFontSize(11);
    
    const patientInfo = [
        { label: 'Họ và tên:', value: record.patientInfo.fullName },
        { label: 'Tuổi:', value: record.patientInfo.age },
        { label: 'Địa chỉ:', value: record.patientInfo.address },
        { label: 'Số điện thoại:', value: record.patientInfo.phoneNumber || 'Chưa cung cấp' },
        { label: 'Email:', value: record.patientInfo.email || 'Chưa cung cấp' },
    ];

    patientInfo.forEach(info => {
        doc.setFont('BeVietnamPro', 'bold');
        doc.text(info.label, PAGE_MARGIN, currentY);
        doc.setFont('BeVietnamPro', 'normal');
        doc.text(info.value, PAGE_MARGIN + 40, currentY);
        currentY += 7;
    });

    if (record.patientInfo.notes) {
        doc.setFont('BeVietnamPro', 'bold');
        doc.text("Ghi chú:", PAGE_MARGIN, currentY);
        doc.setFont('BeVietnamPro', 'normal');
        const notesLines = doc.splitTextToSize(record.patientInfo.notes, 140);
        doc.text(notesLines, PAGE_MARGIN + 40, currentY);
        currentY += notesLines.length * 5 + 3;
    }

    currentY += 5;

    currentY = addSectionTitle(doc, "2. Chẩn đoán của AI", currentY);

    doc.setFont('BeVietnamPro', 'bold');
    doc.setFontSize(11);
    doc.text("Tình trạng:", PAGE_MARGIN, currentY);
    doc.setFont('BeVietnamPro', 'normal');
    doc.text(record.diagnosis.condition, PAGE_MARGIN + 40, currentY);
    currentY += 7;

    doc.setFont('BeVietnamPro', 'bold');
    doc.text("Mức độ:", PAGE_MARGIN, currentY);
    doc.setFont('BeVietnamPro', 'normal');
    doc.text(record.diagnosis.severity, PAGE_MARGIN + 40, currentY);
    currentY += 10;
    
    doc.setFont('BeVietnamPro', 'bold');
    doc.text("Phân tích chi tiết:", PAGE_MARGIN, currentY);
    currentY += 6;
    doc.setFont('BeVietnamPro', 'normal');
    doc.setFillColor(...LIGHT_GRAY_BG);
    const analysisLines = doc.splitTextToSize(record.diagnosis.analysis, 178);
    const analysisBoxHeight = analysisLines.length * 5 + 8;
    doc.roundedRect(PAGE_MARGIN, currentY - 4, 182, analysisBoxHeight, 3, 3, 'F');
    doc.text(analysisLines, PAGE_MARGIN + 2, currentY);
    currentY += analysisBoxHeight + 5;
    
    currentY = addSectionTitle(doc, "3. Phác đồ điều trị", currentY);
    currentY -= 5;
    
    const tableBody: any[] = [];
    const addRoutineRows = (title: string, items: string[]) => {
        if (items.length > 0) {
            tableBody.push([{ content: title, rowSpan: items.length, styles: { valign: 'middle', halign: 'center', font: 'BeVietnamPro', fontStyle: 'bold' } }, items[0]]);
            for (let i = 1; i < items.length; i++) {
                tableBody.push([items[i]]);
            }
        }
    };
    
    const addProcedureRows = (title: string, items: InClinicProcedure[]) => {
      if (items.length > 0) {
        const formattedProcedures = items.map(proc => {
          return [
            { content: proc.name, styles: { font: 'BeVietnamPro', fontStyle: 'bold' } },
            { content: `Tần suất: ${proc.frequency}`, styles: { font: 'BeVietnamPro', fontStyle: 'normal' } },
            { content: `Mục đích: ${proc.description}`, styles: { font: 'BeVietnamPro', fontStyle: 'normal' } },
          ];
        });

        tableBody.push([
          { content: title, rowSpan: formattedProcedures.length, styles: { valign: 'middle', halign: 'center', font: 'BeVietnamPro', fontStyle: 'bold' } },
          // @ts-ignore
          formattedProcedures[0]
        ]);
        
        for (let i = 1; i < formattedProcedures.length; i++) {
          // @ts-ignore
          tableBody.push([formattedProcedures[i]]);
        }
      }
    };

    addRoutineRows('Buổi sáng', record.treatmentPlan.morningRoutine);
    addRoutineRows('Buổi tối', record.treatmentPlan.eveningRoutine);
    addProcedureRows('Tại phòng khám', record.treatmentPlan.inClinicProcedures);

    (doc as any).autoTable({
        startY: currentY,
        head: [['Quy trình', 'Các bước/Sản phẩm']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: PRIMARY_COLOR, textColor: 255, font: 'BeVietnamPro', fontStyle: 'bold' },
        styles: { font: 'BeVietnamPro', fontStyle: 'normal', cellPadding: 3, fontSize: 10 },
        alternateRowStyles: { fillColor: LIGHT_GRAY_BG },
        margin: { left: PAGE_MARGIN, right: PAGE_MARGIN }
    });

    addFooter(doc, disclaimer);

    const safeFullName = record.patientInfo.fullName.replace(/[^a-zA-Z0-9]/g, '_') || 'BenhNhan';
    const date = new Date().toISOString().slice(0, 10);
    doc.save(`PhacDoDieuTri_${safeFullName}_${date}.pdf`);
};

export const generateScarReportPDF = async (record: Omit<ScarPatientRecord, 'id' | 'createdAt'>): Promise<void> => {
    const doc = setupDoc();
    let currentY = 0;

    addHeader(doc, "PHÒNG KHÁM DA LIỄU A.I.");
    
    currentY = 42;
    doc.setTextColor(...TEXT_COLOR);

    doc.setFont('BeVietnamPro', 'bold');
    doc.setFontSize(20);
    doc.text("PHÁC ĐỒ ĐIỀU TRỊ SẸO", 105, currentY, { align: 'center' });
    currentY += 15;

    // --- Patient Info ---
    currentY = addSectionTitle(doc, "1. Dữ liệu Bệnh nhân", currentY);
    doc.setFont('BeVietnamPro', 'normal');
    doc.setFontSize(11);
    
    const patientInfo = [
        { label: 'Họ và tên:', value: record.patientInfo.fullName },
        { label: 'Tuổi:', value: record.patientInfo.age },
        { label: 'Số điện thoại:', value: record.patientInfo.phoneNumber || 'Chưa cung cấp' },
        { label: 'Email:', value: record.patientInfo.email || 'Chưa cung cấp' },
    ];
    patientInfo.forEach(info => {
        doc.setFont('BeVietnamPro', 'bold');
        doc.text(info.label, PAGE_MARGIN, currentY);
        doc.setFont('BeVietnamPro', 'normal');
        doc.text(info.value, PAGE_MARGIN + 40, currentY);
        currentY += 7;
    });
    currentY += 5;

    // --- Scar Info ---
    currentY = addSectionTitle(doc, "2. Thông tin Sẹo", currentY);
    const scarInfo = [
        { label: 'Loại sẹo:', value: record.scarInfo.scarType },
        { label: 'Vị trí:', value: record.scarInfo.location },
        { label: 'Thời gian bị sẹo:', value: record.scarInfo.duration },
    ];
     scarInfo.forEach(info => {
        doc.setFont('BeVietnamPro', 'bold');
        doc.text(info.label, PAGE_MARGIN, currentY);
        doc.setFont('BeVietnamPro', 'normal');
        doc.text(info.value, PAGE_MARGIN + 40, currentY);
        currentY += 7;
    });
    if (record.scarInfo.notes) {
        doc.setFont('BeVietnamPro', 'bold');
        doc.text("Ghi chú:", PAGE_MARGIN, currentY);
        doc.setFont('BeVietnamPro', 'normal');
        const notesLines = doc.splitTextToSize(record.scarInfo.notes, 140);
        doc.text(notesLines, PAGE_MARGIN + 40, currentY);
        currentY += notesLines.length * 5 + 3;
    }
    currentY += 5;

    // --- AI Assessment ---
    currentY = addSectionTitle(doc, "3. Đánh giá của AI", currentY);
    doc.setFont('BeVietnamPro', 'normal');
    doc.setFillColor(...LIGHT_GRAY_BG);
    const assessmentLines = doc.splitTextToSize(record.analysisResult.assessment, 178);
    const assessmentBoxHeight = assessmentLines.length * 5 + 8;
    doc.roundedRect(PAGE_MARGIN, currentY - 4, 182, assessmentBoxHeight, 3, 3, 'F');
    doc.text(assessmentLines, PAGE_MARGIN + 2, currentY);
    currentY += assessmentBoxHeight + 5;

    // --- Treatment Plan ---
    currentY = addSectionTitle(doc, "4. Phác đồ điều trị Sẹo", currentY);
    currentY -= 5;
    
    const tableBody: any[] = [];
    
    const { inClinicProcedures, homeCareRoutine } = record.analysisResult.treatmentPlan;

    if (inClinicProcedures.length > 0) {
        const formattedProcedures = inClinicProcedures.map(proc => [
            { content: proc.name, styles: { font: 'BeVietnamPro', fontStyle: 'bold' } },
            { content: `Tần suất: ${proc.frequency}`, styles: { font: 'BeVietnamPro', fontStyle: 'normal' } },
            { content: `Mục đích: ${proc.description}`, styles: { font: 'BeVietnamPro', fontStyle: 'normal' } },
        ]);
        tableBody.push([{ content: 'Tại phòng khám', rowSpan: formattedProcedures.length, styles: { valign: 'middle', halign: 'center', font: 'BeVietnamPro', fontStyle: 'bold' } }, formattedProcedures[0]]);
        for (let i = 1; i < formattedProcedures.length; i++) tableBody.push([formattedProcedures[i]]);
    }

    if (homeCareRoutine.length > 0) {
        tableBody.push([{ content: 'Chăm sóc tại nhà', rowSpan: homeCareRoutine.length, styles: { valign: 'middle', halign: 'center', font: 'BeVietnamPro', fontStyle: 'bold' } }, homeCareRoutine[0]]);
        for (let i = 1; i < homeCareRoutine.length; i++) tableBody.push([homeCareRoutine[i]]);
    }

    (doc as any).autoTable({
        startY: currentY,
        head: [['Quy trình', 'Chi tiết']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: PRIMARY_COLOR, textColor: 255, font: 'BeVietnamPro', fontStyle: 'bold' },
        styles: { font: 'BeVietnamPro', fontStyle: 'normal', cellPadding: 3, fontSize: 10 },
        alternateRowStyles: { fillColor: LIGHT_GRAY_BG },
        margin: { left: PAGE_MARGIN, right: PAGE_MARGIN }
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
    
    // --- Timeline & Outcome ---
    doc.setFont('BeVietnamPro', 'bold');
    doc.text("Lộ trình điều trị:", PAGE_MARGIN, currentY);
    doc.setFont('BeVietnamPro', 'normal');
    const timelineLines = doc.splitTextToSize(record.analysisResult.treatmentPlan.timeline, 150);
    doc.text(timelineLines, PAGE_MARGIN + 40, currentY);
    currentY += timelineLines.length * 5 + 5;

    doc.setFont('BeVietnamPro', 'bold');
    doc.text("Kết quả mong đợi:", PAGE_MARGIN, currentY);
    doc.setFont('BeVietnamPro', 'normal');
    const outcomeLines = doc.splitTextToSize(record.analysisResult.treatmentPlan.expectedOutcome, 150);
    doc.text(outcomeLines, PAGE_MARGIN + 40, currentY);
    currentY += outcomeLines.length * 5 + 5;
    
    addFooter(doc, record.analysisResult.disclaimer);

    const safeFullName = record.patientInfo.fullName.replace(/[^a-zA-Z0-9]/g, '_') || 'BenhNhan';
    const date = new Date().toISOString().slice(0, 10);
    doc.save(`PhacDoSeo_${safeFullName}_${date}.pdf`);
};

export const generateAcneReportPDF = async (record: Omit<AcnePatientRecord, 'id' | 'createdAt'>): Promise<void> => {
    const doc = setupDoc();
    let currentY = 0;

    addHeader(doc, "PHÒNG KHÁM DA LIỄU A.I.");
    
    currentY = 42;
    doc.setTextColor(...TEXT_COLOR);

    doc.setFont('BeVietnamPro', 'bold');
    doc.setFontSize(20);
    doc.text("PHÁC ĐỒ ĐIỀU TRỊ MỤN", 105, currentY, { align: 'center' });
    currentY += 15;

    // --- Patient Info ---
    currentY = addSectionTitle(doc, "1. Dữ liệu Bệnh nhân", currentY);
    doc.setFont('BeVietnamPro', 'normal');
    doc.setFontSize(11);
    
    const patientInfo = [
        { label: 'Họ và tên:', value: record.patientInfo.fullName },
        { label: 'Tuổi:', value: record.patientInfo.age },
        { label: 'Số điện thoại:', value: record.patientInfo.phoneNumber || 'Chưa cung cấp' },
        { label: 'Email:', value: record.patientInfo.email || 'Chưa cung cấp' },
    ];
    patientInfo.forEach(info => {
        doc.setFont('BeVietnamPro', 'bold');
        doc.text(info.label, PAGE_MARGIN, currentY);
        doc.setFont('BeVietnamPro', 'normal');
        doc.text(info.value, PAGE_MARGIN + 40, currentY);
        currentY += 7;
    });
    currentY += 5;

    // --- Acne Info ---
    currentY = addSectionTitle(doc, "2. Thông tin Tình trạng Mụn", currentY);
    const acneInfo = [
        { label: 'Loại mụn:', value: record.acneInfo.acneType },
        { label: 'Thời gian bị mụn:', value: record.acneInfo.duration },
        { label: 'Yếu tố khởi phát:', value: record.acneInfo.triggers },
        { label: 'Điều trị trước đây:', value: record.acneInfo.pastTreatments },
    ];
    acneInfo.forEach(info => {
        doc.setFont('BeVietnamPro', 'bold');
        doc.text(info.label, PAGE_MARGIN, currentY);
        doc.setFont('BeVietnamPro', 'normal');
        const valueLines = doc.splitTextToSize(info.value, 140);
        doc.text(valueLines, PAGE_MARGIN + 40, currentY);
        currentY += valueLines.length * 5 + 2;
    });
    currentY += 5;

    // --- AI Assessment ---
    currentY = addSectionTitle(doc, "3. Đánh giá của AI", currentY);
    doc.setFont('BeVietnamPro', 'normal');
    doc.setFillColor(...LIGHT_GRAY_BG);
    const assessmentLines = doc.splitTextToSize(record.analysisResult.assessment, 178);
    const assessmentBoxHeight = assessmentLines.length * 5 + 8;
    doc.roundedRect(PAGE_MARGIN, currentY - 4, 182, assessmentBoxHeight, 3, 3, 'F');
    doc.text(assessmentLines, PAGE_MARGIN + 2, currentY);
    currentY += assessmentBoxHeight + 5;

    // --- Treatment Plan ---
    currentY = addSectionTitle(doc, "4. Phác đồ điều trị Mụn", currentY);
    currentY -= 5;
    
    const tableBody: any[] = [];
    const { inClinicProcedures, homeCareRoutine, lifestyleAdvice } = record.analysisResult.treatmentPlan;

    if (inClinicProcedures.length > 0) {
        const formattedProcedures = inClinicProcedures.map(proc => [
            { content: proc.name, styles: { font: 'BeVietnamPro', fontStyle: 'bold' } },
            { content: `Tần suất: ${proc.frequency}`, styles: { font: 'BeVietnamPro', fontStyle: 'normal' } },
            { content: `Mục đích: ${proc.description}`, styles: { font: 'BeVietnamPro', fontStyle: 'normal' } },
        ]);
        tableBody.push([{ content: 'Tại phòng khám', rowSpan: formattedProcedures.length, styles: { valign: 'middle', halign: 'center', font: 'BeVietnamPro', fontStyle: 'bold' } }, formattedProcedures[0]]);
        for (let i = 1; i < formattedProcedures.length; i++) tableBody.push([formattedProcedures[i]]);
    }

    if (homeCareRoutine.length > 0) {
        tableBody.push([{ content: 'Chăm sóc tại nhà', rowSpan: homeCareRoutine.length, styles: { valign: 'middle', halign: 'center', font: 'BeVietnamPro', fontStyle: 'bold' } }, homeCareRoutine[0]]);
        for (let i = 1; i < homeCareRoutine.length; i++) tableBody.push([homeCareRoutine[i]]);
    }

     if (lifestyleAdvice.length > 0) {
        tableBody.push([{ content: 'Lời khuyên lối sống', rowSpan: lifestyleAdvice.length, styles: { valign: 'middle', halign: 'center', font: 'BeVietnamPro', fontStyle: 'bold' } }, lifestyleAdvice[0]]);
        for (let i = 1; i < lifestyleAdvice.length; i++) tableBody.push([lifestyleAdvice[i]]);
    }


    (doc as any).autoTable({
        startY: currentY,
        head: [['Quy trình', 'Chi tiết']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: PRIMARY_COLOR, textColor: 255, font: 'BeVietnamPro', fontStyle: 'bold' },
        styles: { font: 'BeVietnamPro', fontStyle: 'normal', cellPadding: 3, fontSize: 10 },
        alternateRowStyles: { fillColor: LIGHT_GRAY_BG },
        margin: { left: PAGE_MARGIN, right: PAGE_MARGIN }
    });
    
    addFooter(doc, record.analysisResult.disclaimer);

    const safeFullName = record.patientInfo.fullName.replace(/[^a-zA-Z0-9]/g, '_') || 'BenhNhan';
    const date = new Date().toISOString().slice(0, 10);
    doc.save(`PhacDoMun_${safeFullName}_${date}.pdf`);
};

export const generateRejuvenationReportPDF = async (record: Omit<RejuvenationPatientRecord, 'id' | 'createdAt'>): Promise<void> => {
    const doc = setupDoc();
    let currentY = 0;

    addHeader(doc, "PHÒNG KHÁM DA LIỄU A.I.");
    
    currentY = 42;
    doc.setTextColor(...TEXT_COLOR);

    doc.setFont('BeVietnamPro', 'bold');
    doc.setFontSize(20);
    doc.text("PHÁC ĐỒ TRẺ HÓA DA", 105, currentY, { align: 'center' });
    currentY += 15;

    // --- Patient Info ---
    currentY = addSectionTitle(doc, "1. Dữ liệu Bệnh nhân", currentY);
    doc.setFont('BeVietnamPro', 'normal');
    doc.setFontSize(11);
    
    const patientInfo = [
        { label: 'Họ và tên:', value: record.patientInfo.fullName },
        { label: 'Tuổi:', value: record.patientInfo.age },
        { label: 'Số điện thoại:', value: record.patientInfo.phoneNumber || 'Chưa cung cấp' },
        { label: 'Email:', value: record.patientInfo.email || 'Chưa cung cấp' },
    ];
    patientInfo.forEach(info => {
        doc.setFont('BeVietnamPro', 'bold');
        doc.text(info.label, PAGE_MARGIN, currentY);
        doc.setFont('BeVietnamPro', 'normal');
        doc.text(info.value, PAGE_MARGIN + 40, currentY);
        currentY += 7;
    });
    currentY += 5;

    // --- Rejuvenation Info ---
    currentY = addSectionTitle(doc, "2. Thông tin Trẻ hóa", currentY);
    const rejuvenationInfo = [
        { label: 'Mối quan tâm:', value: record.rejuvenationInfo.mainConcerns },
        { label: 'Vùng điều trị:', value: record.rejuvenationInfo.targetArea },
        { label: 'Điều trị trước đây:', value: record.rejuvenationInfo.pastTreatments },
    ];
    rejuvenationInfo.forEach(info => {
        doc.setFont('BeVietnamPro', 'bold');
        doc.text(info.label, PAGE_MARGIN, currentY);
        doc.setFont('BeVietnamPro', 'normal');
        const valueLines = doc.splitTextToSize(info.value, 140);
        doc.text(valueLines, PAGE_MARGIN + 40, currentY);
        currentY += valueLines.length * 5 + 2;
    });
    if (record.rejuvenationInfo.notes) {
        doc.setFont('BeVietnamPro', 'bold');
        doc.text("Ghi chú:", PAGE_MARGIN, currentY);
        doc.setFont('BeVietnamPro', 'normal');
        const notesLines = doc.splitTextToSize(record.rejuvenationInfo.notes, 140);
        doc.text(notesLines, PAGE_MARGIN + 40, currentY);
        currentY += notesLines.length * 5 + 3;
    }
    currentY += 5;

    // --- AI Assessment ---
    currentY = addSectionTitle(doc, "3. Đánh giá của AI", currentY);
    doc.setFont('BeVietnamPro', 'normal');
    doc.setFillColor(...LIGHT_GRAY_BG);
    const assessmentLines = doc.splitTextToSize(record.analysisResult.assessment, 178);
    const assessmentBoxHeight = assessmentLines.length * 5 + 8;
    doc.roundedRect(PAGE_MARGIN, currentY - 4, 182, assessmentBoxHeight, 3, 3, 'F');
    doc.text(assessmentLines, PAGE_MARGIN + 2, currentY);
    currentY += assessmentBoxHeight + 5;

    // --- Treatment Plan ---
    currentY = addSectionTitle(doc, "4. Phác đồ điều trị Trẻ hóa", currentY);
    currentY -= 5;
    
    const tableBody: any[] = [];
    const { highTechProcedures, injectionTherapies, homeCareRoutine, treatmentSchedule } = record.analysisResult.treatmentPlan;

    const addProcedureRows = (title: string, items: InClinicProcedure[]) => {
      if (items.length > 0) {
        const formattedProcedures = items.map(proc => [
            { content: proc.name, styles: { font: 'BeVietnamPro', fontStyle: 'bold' } },
            { content: `Tần suất: ${proc.frequency}`, styles: { font: 'BeVietnamPro', fontStyle: 'normal' } },
            { content: `Mục đích: ${proc.description}`, styles: { font: 'BeVietnamPro', fontStyle: 'normal' } },
        ]);
        tableBody.push([{ content: title, rowSpan: formattedProcedures.length, styles: { valign: 'middle', halign: 'center', font: 'BeVietnamPro', fontStyle: 'bold' } }, formattedProcedures[0]]);
        for (let i = 1; i < formattedProcedures.length; i++) tableBody.push([formattedProcedures[i]]);
      }
    };
    
    if (treatmentSchedule.length > 0) {
        tableBody.push([{ content: 'Lịch trình điều trị', rowSpan: treatmentSchedule.length, styles: { valign: 'middle', halign: 'center', font: 'BeVietnamPro', fontStyle: 'bold' } }, treatmentSchedule[0]]);
        for (let i = 1; i < treatmentSchedule.length; i++) tableBody.push([treatmentSchedule[i]]);
    }
    
    addProcedureRows('Công nghệ cao', highTechProcedures);
    addProcedureRows('Liệu pháp tiêm', injectionTherapies);

    if (homeCareRoutine.length > 0) {
        tableBody.push([{ content: 'Chăm sóc tại nhà', rowSpan: homeCareRoutine.length, styles: { valign: 'middle', halign: 'center', font: 'BeVietnamPro', fontStyle: 'bold' } }, homeCareRoutine[0]]);
        for (let i = 1; i < homeCareRoutine.length; i++) tableBody.push([homeCareRoutine[i]]);
    }

    (doc as any).autoTable({
        startY: currentY,
        head: [['Quy trình', 'Chi tiết']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: PRIMARY_COLOR, textColor: 255, font: 'BeVietnamPro', fontStyle: 'bold' },
        styles: { font: 'BeVietnamPro', fontStyle: 'normal', cellPadding: 3, fontSize: 10 },
        alternateRowStyles: { fillColor: LIGHT_GRAY_BG },
        margin: { left: PAGE_MARGIN, right: PAGE_MARGIN }
    });
    
    addFooter(doc, record.analysisResult.disclaimer);

    const safeFullName = record.patientInfo.fullName.replace(/[^a-zA-Z0-9]/g, '_') || 'BenhNhan';
    const date = new Date().toISOString().slice(0, 10);
    doc.save(`PhacDoTreHoa_${safeFullName}_${date}.pdf`);
};