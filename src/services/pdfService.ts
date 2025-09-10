import type { PatientRecord } from '../types';

// Mở rộng interface Window để khai báo các thư viện jsPDF được tải toàn cục
declare global {
  interface Window {
    jspdf: any;
  }
}

// FIX: Changed the 'record' parameter type to Omit<PatientRecord, 'id' | 'createdAt'> to match the data structure available when the function is called, resolving a type error.
export const generatePatientReportPDF = async (record: Omit<PatientRecord, 'id' | 'createdAt'>, disclaimer: string): Promise<void> => {
    // Lấy đối tượng jsPDF và plugin autoTable từ global window
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // --- Thiết lập Font ---
    // QUAN TRỌNG: Để hiển thị tiếng Việt chính xác, bạn cần nhúng một font hỗ trợ Unicode.
    // Trong một dự án thực tế, bạn sẽ tải file font (ví dụ: .ttf) và thêm nó vào jsPDF.
    // Ví dụ:
    // doc.addFileToVFS('Roboto-Regular.ttf', fontFileAsBase64);
    // doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    // doc.setFont('Roboto');
    // Vì giới hạn của môi trường này, chúng tôi sẽ sử dụng font 'helvetica' mặc định.
    // Một số ký tự tiếng Việt có thể không hiển thị đúng.
    doc.setFont('helvetica');

    // --- Header ---
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Hồ Sơ Bệnh Nhân & Phác Đồ Điều Trị", 105, 20, { align: "center" });
    
    // --- Thông tin Bệnh nhân ---
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("1. Thông tin Bệnh nhân", 14, 40);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const patientInfoText = [
        `Họ và tên: ${record.patientInfo.fullName}`,
        `Tuổi: ${record.patientInfo.age}`,
        `Địa chỉ: ${record.patientInfo.address}`,
        `Số điện thoại: ${record.patientInfo.phoneNumber || 'Chưa cung cấp'}`,
        `Email: ${record.patientInfo.email || 'Chưa cung cấp'}`,
    ];
    doc.text(patientInfoText, 14, 50);

    let currentY = 75;

    if (record.patientInfo.notes) {
        const notesLines = doc.splitTextToSize(`Ghi chú: ${record.patientInfo.notes}`, 180);
        doc.text(notesLines, 14, currentY);
        currentY += notesLines.length * 5 + 5;
    }


    // --- Chẩn đoán ---
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("2. Chẩn đoán của AI", 14, currentY);
    currentY += 10;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Tình trạng: ${record.diagnosis.condition}`, 14, currentY);
    currentY += 7;
    doc.text(`Mức độ: ${record.diagnosis.severity}`, 14, currentY);
    currentY += 7;
    
    doc.setFont("helvetica", "normal");
    const analysisLines = doc.splitTextToSize(`Phân tích chi tiết: ${record.diagnosis.analysis}`, 180);
    doc.text(analysisLines, 14, currentY);
    currentY += analysisLines.length * 5 + 10;

    // --- Phác đồ điều trị ---
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("3. Phác đồ điều trị", 14, currentY);
    currentY += 5;

    const tableBody = [];
    if (record.treatmentPlan.morningRoutine.length > 0) {
        tableBody.push([{ content: 'Buổi sáng', rowSpan: record.treatmentPlan.morningRoutine.length, styles: { valign: 'middle', halign: 'center' } }, record.treatmentPlan.morningRoutine[0]]);
        for (let i = 1; i < record.treatmentPlan.morningRoutine.length; i++) {
            tableBody.push([record.treatmentPlan.morningRoutine[i]]);
        }
    }
    if (record.treatmentPlan.eveningRoutine.length > 0) {
        tableBody.push([{ content: 'Buổi tối', rowSpan: record.treatmentPlan.eveningRoutine.length, styles: { valign: 'middle', halign: 'center' } }, record.treatmentPlan.eveningRoutine[0]]);
        for (let i = 1; i < record.treatmentPlan.eveningRoutine.length; i++) {
            tableBody.push([record.treatmentPlan.eveningRoutine[i]]);
        }
    }
    if (record.treatmentPlan.inClinicProcedures.length > 0) {
        tableBody.push([{ content: 'Tại phòng khám', rowSpan: record.treatmentPlan.inClinicProcedures.length, styles: { valign: 'middle', halign: 'center' } }, record.treatmentPlan.inClinicProcedures[0]]);
        for (let i = 1; i < record.treatmentPlan.inClinicProcedures.length; i++) {
            tableBody.push([record.treatmentPlan.inClinicProcedures[i]]);
        }
    }

    (doc as any).autoTable({
        startY: currentY,
        head: [['Quy trình', 'Các bước/Sản phẩm']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [22, 160, 133] }, // Màu xanh mòng két
        styles: { font: 'helvetica' },
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // --- Miễn trừ trách nhiệm ---
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    const disclaimerText = doc.splitTextToSize(
      `Miễn trừ trách nhiệm: ${disclaimer || 'Phác đồ này được tạo bởi AI và cần được bác sĩ chuyên khoa xem xét và xác nhận trước khi áp dụng. Kết quả có thể khác nhau tùy thuộc vào từng cá nhân.'}`, 
      180
    );
    doc.text(disclaimerText, 14, currentY);

    // --- Lưu File ---
    const safeFullName = record.patientInfo.fullName.replace(/[^a-zA-Z0-9]/g, '_') || 'BenhNhan';
    const date = new Date().toISOString().slice(0, 10);
    doc.save(`PhacDoDieuTri_${safeFullName}_${date}.pdf`);
};
