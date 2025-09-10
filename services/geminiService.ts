import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult, PatientInfo, InClinicProcedure, ScarAnalysisResult, ScarInfo, AcneAnalysisResult, AcneInfo, MelasmaAnalysisResult, MelasmaInfo, RejuvenationAnalysisResult, RejuvenationInfo } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    diagnosis: {
      type: Type.OBJECT,
      properties: {
        condition: { type: Type.STRING, description: "Tình trạng da chính được chẩn đoán, ví dụ: 'Mụn trứng cá thông thường kèm tăng sắc tố sau viêm'." },
        severity: { type: Type.STRING, description: "Mức độ nghiêm trọng của tình trạng, ví dụ: 'Nhẹ', 'Trung bình', 'Nặng'." },
        analysis: { type: Type.STRING, description: "Một phân tích chi tiết giải thích chẩn đoán dựa trên các dấu hiệu trực quan từ hình ảnh." },
      },
      required: ["condition", "severity", "analysis"],
    },
    treatmentPlan: {
      type: Type.OBJECT,
      properties: {
        morningRoutine: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Danh sách các sản phẩm/loại sản phẩm được đề xuất cho quy trình buổi sáng. Nếu danh sách sản phẩm được cung cấp, CHỈ SỬ DỤNG từ đó. Nếu không, đề xuất các loại sản phẩm chung (ví dụ: 'Sữa rửa mặt BHA').",
        },
        eveningRoutine: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Danh sách các sản phẩm/loại sản phẩm được đề xuất cho quy trình buổi tối. Nếu danh sách sản phẩm được cung cấp, CHỈ SỬ DỤNG từ đó. Nếu không, đề xuất các loại sản phẩm chung (ví dụ: 'Retinoid 0.5%').",
        },
        inClinicProcedures: {
          type: Type.ARRAY,
          items: { 
            type: Type.OBJECT,
            description: "Một liệu trình chi tiết tại phòng khám.",
            properties: {
                name: { type: Type.STRING, description: "Tên của liệu trình, ví dụ: 'Lấy nhân mụn y khoa'."},
                frequency: { type: Type.STRING, description: "Tần suất đề xuất, ví dụ: '2-3 tuần/lần'."},
                description: { type: Type.STRING, description: "Mô tả ngắn gọn mục đích và lợi ích của liệu trình đối với tình trạng da của bệnh nhân."}
            },
            required: ["name", "frequency", "description"]
          },
          description: "Danh sách các liệu trình tại phòng khám được đề xuất. Nếu danh sách máy móc được cung cấp, CHỈ SỬ DỤNG từ đó. Nếu không, đề xuất các liệu trình phổ biến."
        },
      },
      required: ["morningRoutine", "eveningRoutine", "inClinicProcedures"],
    },
    disclaimer: {
      type: Type.STRING,
      description: "Một tuyên bố miễn trừ trách nhiệm tiêu chuẩn rằng kế hoạch do AI tạo ra cần có sự xác minh chuyên nghiệp từ bác sĩ."
    }
  },
  required: ["diagnosis", "treatmentPlan", "disclaimer"],
};


export const analyzeSkinCondition = async (
  images: { base64: string, mimeType: string }[],
  patientInfo: PatientInfo,
  availableProducts: string[],
  availableMachines: string[]
): Promise<AnalysisResult> => {
  const systemInstruction = "Bạn là một bác sĩ da liễu hàng đầu thế giới với hơn 15 năm kinh nghiệm, đóng vai trò là một trợ lý chuyên nghiệp. Phân tích của bạn phải sắc bén, chính xác và dựa trên bằng chứng trực quan. Bạn cung cấp lời khuyên chuyên nghiệp, có cấu trúc và có thể hành động. Bạn PHẢI tuân thủ nghiêm ngặt lược đồ JSON được cung cấp cho phản hồi của mình. Tất cả các câu trả lời phải bằng tiếng Việt.";

  const resourcesPrompt = (availableProducts.length > 0 || availableMachines.length > 0)
    ? `
    **Tài nguyên có sẵn tại phòng khám (SỬ DỤNG ĐỘC QUYỀN):**
    ${availableProducts.length > 0 ? `- Danh sách sản phẩm/hoạt chất có thể kê đơn: [${availableProducts.join(', ')}]` : ''}
    ${availableMachines.length > 0 ? `- Danh sách máy móc/liệu trình có thể thực hiện: [${availableMachines.join(', ')}]` : ''}

    **YÊU CẦU QUAN TRỌNG VỀ TÀI NGUYÊN:**
    - Nếu "Danh sách sản phẩm/hoạt chất" được cung cấp, bạn **CHỈ ĐƯỢỢC PHÉP** đề xuất các sản phẩm từ danh sách đó.
    - Nếu "Danh sách máy móc/liệu trình" được cung cấp, bạn **CHỈ ĐƯỢỢC PHÉP** đề xuất các liệu trình từ danh sách đó.
    - Tuyệt đối không được đề xuất bất kỳ sản phẩm hoặc liệu trình nào không có trong danh sách được cung cấp.
`
    : `
    **Tài nguyên phòng khám:**
    - Không có danh sách sản phẩm hoặc máy móc cụ thể nào được cung cấp.

    **YÊU CẦU QUAN TRỌNG VỀ TÀI NGUYÊN:**
    - Vì không có danh sách sản phẩm cụ thể, hãy đề xuất các **loại sản phẩm** hoặc **hoạt chất chính** phổ biến và hiệu quả (ví dụ: "Sữa rửa mặt chứa BHA", "Kem dưỡng ẩm chứa Hyaluronic Acid", "Retinoid không kê đơn", "Kem chống nắng phổ rộng SPF 50+"). **KHÔNG** đề xuất tên thương hiệu cụ thể.
    - Đối với liệu trình tại phòng khám, nếu cần, hãy đề xuất các **loại liệu trình** phổ biến (ví dụ: "Lấy nhân mụn y khoa", "Chemical Peel với AHA/BHA", "Liệu pháp ánh sáng LED").
`;

  const prompt = `
    Phân tích TOÀN DIỆN CÁC hình ảnh da của bệnh nhân đính kèm. Bộ ảnh có thể bao gồm tối đa 4 góc chụp: chính diện, nghiêng trái, nghiêng phải, và ảnh đèn Wood. Hãy tổng hợp thông tin từ tất cả các ảnh để có cái nhìn đầy đủ nhất.
    
    **Đặc biệt lưu ý ảnh đèn Wood (nếu có):** Đây là công cụ chẩn đoán mạnh mẽ. Hãy dùng nó để phát hiện các vấn đề tiềm ẩn như độ sâu sắc tố (nám), nhiễm nấm (phát quang), hoặc các vùng da dầu (phát quang màu cam). Tích hợp những phát hiện này vào chẩn đoán tổng thể để tăng độ chính xác. Dựa trên hình ảnh, thông tin bệnh nhân và tài nguyên phòng khám, hãy thực hiện các nhiệm vụ sau:

    **Thông tin Bệnh nhân:**
    - Họ và tên: ${patientInfo.fullName}
    - Tuổi: ${patientInfo.age}
    ${patientInfo.notes ? `- Ghi chú thêm: ${patientInfo.notes}` : ''}

    ${resourcesPrompt}

    **Nhiệm vụ:**
    1.  **Chẩn đoán tình trạng da:** Xác định các tình trạng chính và bất kỳ tình trạng phụ nào.
    2.  **Đánh giá mức độ nghiêm trọng:** Phân loại mức độ nghiêm trọng (ví dụ: Nhẹ, Trung bình, Nặng).
    3.  **Cung cấp phân tích chi tiết:** Giải thích lý do của bạn dựa trên các dấu hiệu trực quan từ CÁC hình ảnh.
    4.  **Tạo một phác đồ điều trị toàn diện:** 
        - Đề xuất quy trình chăm sóc da buổi sáng và tối.
        - Đối với liệu trình tại phòng khám, đề xuất các liệu trình phù hợp. Với MỖI liệu trình, hãy cung cấp đầy đủ:
          a) **Tên liệu trình** (name).
          b) **Tần suất** (frequency) thực hiện.
          c) **Mô tả** (description) ngắn gọn về mục đích và lợi ích chính của liệu trình đó cho tình trạng da của bệnh nhân.

    Cung cấp đầu ra ở định dạng JSON được chỉ định. Phản hồi của bạn phải là một đối tượng JSON hợp lệ duy nhất tuân thủ lược đồ.
  `;
  
  try {
    const imageParts = images.map(image => ({
        inlineData: { data: image.base64, mimeType: image.mimeType }
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          ...imageParts,
          { text: prompt },
        ]
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2,
      },
    });

    const jsonText = response.text.trim();
    // @ts-ignore
    const result: AnalysisResult = JSON.parse(jsonText);
    
    if (!result.treatmentPlan.inClinicProcedures) {
        result.treatmentPlan.inClinicProcedures = [];
    }

    return result;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Mô hình AI không thể tạo ra phản hồi hợp lệ. Vui lòng kiểm tra đầu vào hoặc thử lại sau.");
  }
};


// --- SCAR TREATMENT SERVICE ---

const scarResponseSchema = {
  type: Type.OBJECT,
  properties: {
    assessment: { 
        type: Type.STRING, 
        description: "Phân tích chi tiết về loại sẹo, đặc điểm và tình trạng dựa trên hình ảnh và thông tin được cung cấp." 
    },
    treatmentPlan: {
      type: Type.OBJECT,
      properties: {
        inClinicProcedures: {
          type: Type.ARRAY,
          items: { 
            type: Type.OBJECT,
            description: "Một liệu trình chi tiết tại phòng khám.",
            properties: {
                name: { type: Type.STRING, description: "Tên của liệu trình, ví dụ: 'Laser CO2 Fractional'."},
                frequency: { type: Type.STRING, description: "Tần suất đề xuất, ví dụ: '1 tháng/lần, liệu trình 3-5 lần'."},
                description: { type: Type.STRING, description: "Mô tả ngắn gọn mục đích và lợi ích của liệu trình đối với việc điều trị sẹo này."}
            },
            required: ["name", "frequency", "description"]
          },
          description: "Danh sách các liệu trình tại phòng khám được đề xuất để trị sẹo. CHỈ SỬ DỤNG các máy móc có trong danh sách được cung cấp."
        },
        homeCareRoutine: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Danh sách các sản phẩm/hoạt chất được đề xuất cho quy trình chăm sóc tại nhà để hỗ trợ điều trị sẹo. CHỈ SỬ DỤNG các sản phẩm/hoạt chất có trong danh sách được cung cấp.",
        },
        timeline: { 
            type: Type.STRING, 
            description: "Lộ trình thời gian dự kiến cho toàn bộ quá trình điều trị." 
        },
        expectedOutcome: { 
            type: Type.STRING, 
            description: "Kết quả mong đợi sau khi hoàn thành phác đồ điều trị." 
        },
      },
      required: ["inClinicProcedures", "homeCareRoutine", "timeline", "expectedOutcome"],
    },
    disclaimer: {
      type: Type.STRING,
      description: "Một tuyên bố miễn trừ trách nhiệm tiêu chuẩn rằng kế hoạch do AI tạo ra cần có sự xác minh chuyên nghiệp từ bác sĩ."
    }
  },
  required: ["assessment", "treatmentPlan", "disclaimer"],
};


export const analyzeScarCondition = async (
  images: { base64: string, mimeType: string }[],
  scarInfo: ScarInfo,
  patientInfo: PatientInfo,
  availableProducts: string[],
  availableMachines: string[]
): Promise<ScarAnalysisResult> => {
    const systemInstruction = "Bạn là một chuyên gia hàng đầu thế giới về điều trị sẹo da liễu với hơn 20 năm kinh nghiệm. Phân tích của bạn phải cực kỳ chi tiết, khoa học và dựa trên bằng chứng. Bạn cung cấp phác đồ điều trị chuyên sâu, an toàn và hiệu quả. Bạn PHẢI tuân thủ nghiêm ngặt lược đồ JSON được cung cấp. Tất cả các câu trả lời phải bằng tiếng Việt.";
    
    const resourcesPrompt = `
    **Tài nguyên phòng khám (SỬ DỤNG ĐỘC QUYỀN):**
    - Danh sách sản phẩm/hoạt chất: [${availableProducts.join(', ')}]
    - Danh sách máy móc/liệu trình: [${availableMachines.join(', ')}]

    **YÊU CẦU QUAN TRỌNG:**
    - Bạn **CHỈ ĐƯỢỢC PHÉP** đề xuất các sản phẩm và liệu trình từ danh sách tài nguyên được cung cấp.
    - Tuyệt đối không được đề xuất bất cứ thứ gì không có trong danh sách.
    `;

    const prompt = `
    Phân tích CÁC hình ảnh về sẹo của bệnh nhân. Bộ ảnh có thể bao gồm tối đa 4 góc chụp: chính diện, nghiêng trái 45 độ, nghiêng phải 45 độ và một ảnh từ đèn Wood.

    **YÊU CẦU PHÂN TÍCH CHUYÊN SÂU:**
    - **Phân loại sẹo rỗ (Atrophic):** Dựa vào hình ảnh, hãy xác định và mô tả các loại sẹo rỗ chiếm ưu thế: Đáy nhọn (Ice Pick), Đáy vuông (Boxcar), hoặc Lượn sóng (Rolling). Đánh giá độ sâu và mật độ của sẹo.
    - **Xác nhận/Tinh chỉnh thông tin:** So sánh phân tích hình ảnh của bạn với "Loại sẹo" do bác sĩ cung cấp. Nếu có thể, hãy tinh chỉnh nó chi tiết hơn (ví dụ: từ "Sẹo rỗ" thành "Sẹo rỗ hỗn hợp chủ yếu là đáy vuông và lượn sóng").
    - **Đánh giá các vấn đề đi kèm:** Sử dụng ảnh đèn Wood (nếu có) để phát hiện tăng sắc tố sau viêm (PIH) đi kèm với sẹo.

    Dựa trên phân tích toàn diện, thông tin lâm sàng và tài nguyên phòng khám, hãy thực hiện các nhiệm vụ sau:

    **Thông tin Bệnh nhân:**
    - Họ và tên: ${patientInfo.fullName}
    - Tuổi: ${patientInfo.age}

    **Thông tin Sẹo:**
    - Loại sẹo (do bác sĩ nhập): ${scarInfo.scarType}
    - Vị trí: ${scarInfo.location}
    - Thời gian bị sẹo: ${scarInfo.duration}
    ${scarInfo.notes ? `- Ghi chú thêm: ${scarInfo.notes}` : ''}

    ${resourcesPrompt}

    **Nhiệm vụ:**
    1.  **Đánh giá (Assessment):**
        - Bắt đầu bằng việc phân loại chi tiết các loại sẹo có trên da dựa trên hình ảnh.
        - Phân tích mức độ nghiêm trọng và ảnh hưởng của sẹo đến cấu trúc da tổng thể.
    2.  **Tạo phác đồ điều trị sẹo KẾT HỢP:**
        - **Liệu trình tại phòng khám (inClinicProcedures):** Đề xuất một phác đồ **kết hợp nhiều phương pháp** để giải quyết từng loại sẹo. Ví dụ: "Tách đáy sẹo" cho sẹo lượn sóng, "Laser CO2 Fractional" cho sẹo đáy vuông và tái tạo bề mặt, "TCA Cross" cho sẹo đáy nhọn. Giải thích lý do tại sao sự kết hợp này là tối ưu.
        - **Luôn cân nhắc các liệu pháp bổ trợ:** Đề xuất "PRP (Huyết tương giàu tiểu cầu)" hoặc "Tiêm Mesotherapy" để tăng cường quá trình lành thương và tái tạo collagen sau các liệu trình xâm lấn, ngay cả khi chúng không có trong danh sách máy móc.
        - **Chăm sóc tại nhà (homeCareRoutine):** Tập trung vào các sản phẩm hỗ trợ phục hồi, tăng sinh collagen và bảo vệ da.
        - **Lộ trình thời gian (timeline):** Phác thảo một lộ trình hợp lý, xen kẽ các liệu trình để da có thời gian phục hồi.
        - **Kết quả mong đợi (expectedOutcome):** Mô tả kết quả thực tế có thể đạt được.

    Cung cấp đầu ra ở định dạng JSON hợp lệ duy nhất tuân thủ lược đồ.
    `;
    
    try {
        const imageParts = images.map(image => ({
            inlineData: { data: image.base64, mimeType: image.mimeType }
        }));

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    ...imageParts,
                    { text: prompt },
                ]
            },
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: scarResponseSchema,
                temperature: 0.3,
            },
        });

        const jsonText = response.text.trim();
        // @ts-ignore
        const result: ScarAnalysisResult = JSON.parse(jsonText);
        
        if (!result.treatmentPlan.inClinicProcedures) {
            result.treatmentPlan.inClinicProcedures = [];
        }
        if (!result.treatmentPlan.homeCareRoutine) {
            result.treatmentPlan.homeCareRoutine = [];
        }

        return result;

    } catch (error) {
        console.error("Error calling Gemini API for scar analysis:", error);
        throw new Error("Mô hình AI không thể tạo ra phác đồ trị sẹo hợp lệ. Vui lòng kiểm tra đầu vào hoặc thử lại sau.");
    }
};

// --- ACNE TREATMENT SERVICE ---

const acneResponseSchema = {
  type: Type.OBJECT,
  properties: {
    assessment: {
      type: Type.STRING,
      description: "Phân tích chi tiết về loại mụn, mức độ viêm, sự phân bố và các yếu tố liên quan dựa trên hình ảnh và thông tin bệnh nhân."
    },
    treatmentPlan: {
      type: Type.OBJECT,
      properties: {
        inClinicProcedures: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Tên của liệu trình, ví dụ: 'Lấy nhân mụn y khoa kết hợp chiếu đèn LED'." },
              frequency: { type: Type.STRING, description: "Tần suất đề xuất, ví dụ: '2 tuần/lần'." },
              description: { type: Type.STRING, description: "Mô tả ngắn gọn mục đích của liệu trình (giảm viêm, làm sạch, v.v.)." }
            },
            required: ["name", "frequency", "description"]
          },
          description: "Danh sách các liệu trình tại phòng khám để trị mụn. CHỈ SỬ DỤNG các máy móc/liệu pháp có trong danh sách được cung cấp."
        },
        homeCareRoutine: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Danh sách các sản phẩm/hoạt chất được đề xuất cho quy trình chăm sóc tại nhà (sáng & tối). CHỈ SỬ DỤNG các sản phẩm/hoạt chất từ danh sách được cung cấp."
        },
        lifestyleAdvice: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Danh sách các lời khuyên về lối sống, chế độ ăn uống và các yếu tố khác để hỗ trợ điều trị mụn."
        }
      },
      required: ["inClinicProcedures", "homeCareRoutine", "lifestyleAdvice"]
    },
    disclaimer: {
      type: Type.STRING,
      description: "Một tuyên bố miễn trừ trách nhiệm tiêu chuẩn."
    }
  },
  required: ["assessment", "treatmentPlan", "disclaimer"],
};

export const analyzeAcneCondition = async (
  images: { base64: string; mimeType: string }[],
  acneInfo: AcneInfo,
  patientInfo: PatientInfo,
  availableProducts: string[],
  availableMachines: string[]
): Promise<AcneAnalysisResult> => {
  const systemInstruction = "Bạn là một bác sĩ da liễu chuyên về mụn trứng cá với kinh nghiệm lâm sàng dày dặn. Phân tích của bạn phải khoa học, toàn diện và tập trung vào việc tạo ra một phác đồ điều trị đa phương thức. Bạn PHẢI tuân thủ nghiêm ngặt lược đồ JSON được cung cấp. Tất cả các câu trả lời phải bằng tiếng Việt.";

  const resourcesPrompt = `
    **Tài nguyên phòng khám (SỬ DỤNG ĐỘC QUYỀN):**
    - Danh sách sản phẩm/hoạt chất: [${availableProducts.join(', ')}]
    - Danh sách máy móc/liệu trình: [${availableMachines.join(', ')}]

    **YÊU CẦU QUAN TRỌNG:**
    - Bạn **CHỈ ĐƯỢỢC PHÉP** đề xuất các sản phẩm và liệu trình từ danh sách tài nguyên được cung cấp.
    - Tuyệt đối không được đề xuất bất cứ thứ gì không có trong danh sách.
  `;

  const prompt = `
    Phân tích CÁC hình ảnh về tình trạng mụn của bệnh nhân. Bộ ảnh có thể bao gồm tối đa 4 góc chụp: chính diện, nghiêng trái 45 độ, nghiêng phải 45 độ và một ảnh từ đèn Wood.

    **YÊU CẦU PHÂN TÍCH CHUYÊN SÂU:**
    - **Với ảnh thường:** Xác định và phân loại các loại tổn thương mụn hiện có: mụn ẩn (comedones), mụn sẩn (papules), mụn mủ (pustules), mụn nang (nodules/cysts). Đánh giá mức độ viêm. Chú ý đến các vấn đề đi kèm như hồng ban sau viêm (PIE - Post-Inflammatory Erythema) và tăng sắc tố sau viêm (PIH - Post-Inflammatory Hyperpigmentation).
    - **Với ảnh đèn Wood (nếu có):** Tìm kiếm các nang lông phát quang màu cam-đỏ để xác định hoạt động của vi khuẩn P. acnes. Đánh giá các vùng tăng tiết bã nhờn.

    Dựa trên phân tích toàn diện, thông tin lâm sàng và tài nguyên phòng khám, hãy thực hiện các nhiệm vụ sau:

    **Thông tin Bệnh nhân:**
    - Họ và tên: ${patientInfo.fullName}
    - Tuổi: ${patientInfo.age}

    **Thông tin Tình trạng Mụn:**
    - Loại mụn chủ đạo: ${acneInfo.acneType}
    - Thời gian bị mụn: ${acneInfo.duration}
    - Yếu tố khởi phát nghi ngờ: ${acneInfo.triggers}
    - Các phương pháp đã điều trị: ${acneInfo.pastTreatments}
    ${acneInfo.notes ? `- Ghi chú thêm: ${acneInfo.notes}` : ''}

    ${resourcesPrompt}

    **Nhiệm vụ:**
    1.  **Đánh giá (Assessment):**
        - Cung cấp chẩn đoán chính xác về loại mụn (ví dụ: "Mụn trứng cá mức độ trung bình với tổn thương viêm và không viêm, kèm hồng ban sau viêm lan tỏa").
        - Mô tả sự phân bố của mụn (ví dụ: vùng chữ T, vùng quai hàm) và liên hệ với các nguyên nhân tiềm ẩn (nội tiết, stress...).
    2.  **Tạo phác đồ điều trị mụn toàn diện:**
        - **Liệu trình tại phòng khám (inClinicProcedures):** Đề xuất các liệu trình nhắm vào các vấn đề cụ thể: làm sạch sâu cho mụn ẩn, giảm viêm cho mụn mủ, công nghệ ánh sáng/laser cho PIE/PIH.
        - **Chăm sóc tại nhà (homeCareRoutine):** Xây dựng quy trình dựa trên loại da của bệnh nhân (tham khảo ghi chú), kết hợp các hoạt chất trị mụn (BHA, Retinoids) và phục hồi (Niacinamide, B5).
        - **Lời khuyên về lối sống (lifestyleAdvice):** Đưa ra các khuyến nghị cụ thể, có thể hành động về chế độ ăn uống và sinh hoạt.

    Cung cấp đầu ra ở định dạng JSON hợp lệ duy nhất tuân thủ lược đồ.
  `;

  try {
    const imageParts = images.map(image => ({
      inlineData: { data: image.base64, mimeType: image.mimeType }
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          ...imageParts,
          { text: prompt },
        ]
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: acneResponseSchema,
        temperature: 0.3,
      },
    });

    const jsonText = response.text.trim();
    // @ts-ignore
    const result: AcneAnalysisResult = JSON.parse(jsonText);

    if (!result.treatmentPlan.inClinicProcedures) result.treatmentPlan.inClinicProcedures = [];
    if (!result.treatmentPlan.homeCareRoutine) result.treatmentPlan.homeCareRoutine = [];
    if (!result.treatmentPlan.lifestyleAdvice) result.treatmentPlan.lifestyleAdvice = [];

    return result;

  } catch (error) {
    console.error("Error calling Gemini API for acne analysis:", error);
    throw new Error("Mô hình AI không thể tạo ra phác đồ trị mụn hợp lệ. Vui lòng kiểm tra đầu vào hoặc thử lại sau.");
  }
};


// --- MELASMA TREATMENT SERVICE ---

const melasmaResponseSchema = {
  type: Type.OBJECT,
  properties: {
    assessment: {
      type: Type.STRING,
      description: "Phân tích chi tiết về loại nám (thượng bì, trung bì, hỗn hợp), độ sâu, sự phân bố và các yếu tố liên quan dựa trên hình ảnh và thông tin bệnh nhân."
    },
    treatmentPlan: {
      type: Type.OBJECT,
      properties: {
        inClinicProcedures: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Tên của liệu trình, ví dụ: 'Laser Picotech'." },
              frequency: { type: Type.STRING, description: "Tần suất đề xuất, ví dụ: '3-4 tuần/lần'." },
              description: { type: Type.STRING, description: "Mô tả ngắn gọn mục đích của liệu trình (phá vỡ sắc tố, tái tạo da, v.v.)." }
            },
            required: ["name", "frequency", "description"]
          },
          description: "Danh sách các liệu trình tại phòng khám để trị nám. CHỈ SỬ DỤNG các máy móc/liệu pháp có trong danh sách được cung cấp."
        },
        homeCareRoutine: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Danh sách các sản phẩm/hoạt chất được đề xuất cho quy trình chăm sóc tại nhà (sáng & tối) để kiểm soát sắc tố và phục hồi da. CHỈ SỬ DỤNG các sản phẩm/hoạt chất từ danh sách được cung cấp."
        },
        sunProtectionAdvice: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Danh sách các lời khuyên CỰC KỲ QUAN TRỌNG và CHI TIẾT về việc chống nắng, bao gồm loại kem chống nắng, cách thoa lại, và các biện pháp vật lý."
        }
      },
      required: ["inClinicProcedures", "homeCareRoutine", "sunProtectionAdvice"]
    },
    disclaimer: {
      type: Type.STRING,
      description: "Một tuyên bố miễn trừ trách nhiệm tiêu chuẩn."
    }
  },
  required: ["assessment", "treatmentPlan", "disclaimer"],
};


export const analyzeMelasmaCondition = async (
  images: { base64: string; mimeType: string }[],
  melasmaInfo: MelasmaInfo,
  patientInfo: PatientInfo,
  availableProducts: string[],
  availableMachines: string[]
): Promise<MelasmaAnalysisResult> => {
  const systemInstruction = "Bạn là một bác sĩ da liễu hàng đầu thế giới về rối loạn sắc tố da, đặc biệt là nám, với hơn 20 năm kinh nghiệm. Phân tích của bạn phải cực kỳ chi tiết, khoa học và tập trung vào phác đồ điều trị kết hợp, an toàn và ngăn ngừa tái phát. Bạn PHẢI tuân thủ nghiêm ngặt lược đồ JSON được cung cấp. Tất cả các câu trả lời phải bằng tiếng Việt.";

  const resourcesPrompt = `
    **Tài nguyên phòng khám (SỬ DỤNG ĐỘC QUYỀN):**
    - Danh sách sản phẩm/hoạt chất: [${availableProducts.join(', ')}]
    - Danh sách máy móc/liệu trình: [${availableMachines.join(', ')}]

    **YÊU CẦU QUAN TRỌNG:**
    - Bạn **CHỈ ĐƯỢỢC PHÉP** đề xuất các sản phẩm và liệu trình từ danh sách tài nguyên được cung cấp.
    - Tuyệt đối không được đề xuất bất cứ thứ gì không có trong danh sách.
  `;

  const prompt = `
    Phân tích CÁC hình ảnh về tình trạng nám của bệnh nhân. Bộ ảnh có thể bao gồm tối đa 4 góc chụp: chính diện, nghiêng trái 45 độ, nghiêng phải 45 độ và một ảnh từ đèn Wood.

    **YÊU CẦU PHÂN TÍCH CHUYÊN SÂU VỚI ĐÈN WOOD:**
    - **Ưu tiên hàng đầu:** Nhiệm vụ quan trọng nhất của bạn là sử dụng ảnh đèn Wood (nếu có) để xác định chính xác độ sâu của nám. Phân tích kỹ sự tương phản của sắc tố:
        - **Nám Thượng bì:** Sắc tố sẽ trở nên rõ nét và có độ tương phản cao hơn dưới đèn Wood.
        - **Nám Trung bì:** Sắc tố sẽ mờ đi hoặc không thay đổi, ranh giới không rõ ràng.
        - **Nám Hỗn hợp:** Có cả vùng rõ nét và vùng mờ đi.
    - **Việc xác định chính xác độ sâu của nám là yếu tố then chốt quyết định sự thành công của phác đồ. Phân tích của bạn phải phản ánh rõ điều này.**

    Dựa trên phân tích toàn diện, thông tin lâm sàng và tài nguyên phòng khám, hãy thực hiện các nhiệm vụ sau:

    **Thông tin Bệnh nhân:**
    - Họ và tên: ${patientInfo.fullName}
    - Tuổi: ${patientInfo.age}
    
    **Thông tin Tình trạng Nám:**
    - Loại nám (do bác sĩ nhập): ${melasmaInfo.melasmaType}
    - Vị trí: ${melasmaInfo.location}
    - Thời gian bị nám: ${melasmaInfo.duration}
    - Yếu tố khởi phát nghi ngờ: ${melasmaInfo.triggers}
    - Các phương pháp đã điều trị: ${melasmaInfo.pastTreatments}
    ${melasmaInfo.notes ? `- Ghi chú thêm: ${melasmaInfo.notes}` : ''}

    ${resourcesPrompt}

    **Nhiệm vụ:**
    1.  **Đánh giá (Assessment):**
        - **Bắt buộc:** Bắt đầu phần đánh giá bằng kết luận về loại nám (Thượng bì, Trung bì, hay Hỗn hợp) dựa trên phân tích đèn Wood.
        - Mô tả chi tiết sự phân bố, mức độ đậm nhạt và các vấn đề đi kèm như ban đỏ hoặc giãn mạch.
    2.  **Tạo phác đồ điều trị nám đa phương thức:**
        - **Liệu trình tại phòng khám (inClinicProcedures):** Lựa chọn công nghệ phù hợp với độ sâu của nám đã xác định. Ví dụ: Laser bước sóng ngắn hơn cho nám thượng bì, laser bước sóng dài hơn (Nd:YAG) cho nám trung bì.
        - **Chăm sóc tại nhà (homeCareRoutine):** Kê đơn các hoạt chất ức chế men tyrosinase, chống oxy hóa và phục hồi hàng rào bảo vệ da.
        - **Tư vấn chống nắng (sunProtectionAdvice):** Đây là nền tảng của mọi phác đồ trị nám. Cung cấp hướng dẫn CHI TIẾT, NGHIÊM NGẶT và DỄ HIỂU về việc sử dụng kem chống nắng (phổ rộng, SPF 50+, PA++++), cách thoa lại, và các biện pháp vật lý.

    Cung cấp đầu ra ở định dạng JSON hợp lệ duy nhất tuân thủ lược đồ.
  `;

  try {
    const imageParts = images.map(image => ({
      inlineData: { data: image.base64, mimeType: image.mimeType }
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          ...imageParts,
          { text: prompt },
        ]
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: melasmaResponseSchema,
        temperature: 0.3,
      },
    });

    const jsonText = response.text.trim();
    // @ts-ignore
    const result: MelasmaAnalysisResult = JSON.parse(jsonText);

    if (!result.treatmentPlan.inClinicProcedures) result.treatmentPlan.inClinicProcedures = [];
    if (!result.treatmentPlan.homeCareRoutine) result.treatmentPlan.homeCareRoutine = [];
    if (!result.treatmentPlan.sunProtectionAdvice) result.treatmentPlan.sunProtectionAdvice = [];

    return result;

  } catch (error) {
    console.error("Error calling Gemini API for melasma analysis:", error);
    throw new Error("Mô hình AI không thể tạo ra phác đồ trị nám hợp lệ. Vui lòng kiểm tra đầu vào hoặc thử lại sau.");
  }
};

// --- REJUVENATION TREATMENT SERVICE ---

const rejuvenationResponseSchema = {
  type: Type.OBJECT,
  properties: {
    assessment: {
      type: Type.STRING,
      description: "Phân tích toàn diện về các dấu hiệu lão hóa của bệnh nhân (nếp nhăn, chảy xệ, sắc tố, kết cấu da) dựa trên hình ảnh và thông tin được cung cấp."
    },
    treatmentPlan: {
      type: Type.OBJECT,
      properties: {
        highTechProcedures: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Tên của liệu trình công nghệ cao, ví dụ: 'Nâng cơ HIFU 3D PRO-MAX'." },
              frequency: { type: Type.STRING, description: "Tần suất đề xuất, ví dụ: '1-2 lần/năm'." },
              description: { type: Type.STRING, description: "Mô tả ngắn gọn mục đích của liệu trình (săn chắc, xóa nhăn, v.v.)." }
            },
            required: ["name", "frequency", "description"]
          },
          description: "Danh sách các liệu trình CÔNG NGHỆ CAO. CHỈ SỬ DỤNG các máy móc từ danh sách được cung cấp."
        },
        injectionTherapies: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Tên của liệu pháp tiêm, ví dụ: 'Mesotherapy căng bóng', 'Tiêm BAP', 'Skin Booster'." },
              frequency: { type: Type.STRING, description: "Tần suất đề xuất, ví dụ: '3-4 tuần/lần, liệu trình 3 buổi'." },
              description: { type: Type.STRING, description: "Mô tả mục đích của liệu pháp (cấp ẩm sâu, tăng sinh collagen, v.v.)." }
            },
            required: ["name", "frequency", "description"]
          },
          description: "Danh sách các liệu pháp TIÊM. Có thể đề xuất Mesotherapy, BAP, Skin Booster, Botox, Filler nếu phù hợp."
        },
        homeCareRoutine: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Danh sách các sản phẩm/hoạt chất chăm sóc tại nhà để tối ưu hóa và duy trì kết quả. CHỈ SỬ DỤNG sản phẩm từ danh sách được cung cấp."
        },
        treatmentSchedule: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Một lịch trình điều trị gợi ý, sắp xếp và kết hợp các liệu trình trên một cách khoa học để tối ưu hóa kết quả và thời gian."
        }
      },
      required: ["highTechProcedures", "injectionTherapies", "homeCareRoutine", "treatmentSchedule"]
    },
    disclaimer: {
      type: Type.STRING,
      description: "Một tuyên bố miễn trừ trách nhiệm tiêu chuẩn."
    }
  },
  required: ["assessment", "treatmentPlan", "disclaimer"],
};

export const analyzeRejuvenationNeeds = async (
  images: { base64: string; mimeType: string }[],
  rejuvenationInfo: RejuvenationInfo,
  patientInfo: PatientInfo,
  availableProducts: string[],
  availableMachines: string[]
): Promise<RejuvenationAnalysisResult> => {
  const systemInstruction = "Bạn là một bác sĩ da liễu thẩm mỹ hàng đầu thế giới, chuyên gia về trẻ hóa da đa phương thức. Mục tiêu của bạn là tạo ra các phác đồ KẾT HỢP (combination therapy) mạnh mẽ, hiệu quả và rút ngắn thời gian điều trị. Phân tích của bạn phải khoa học, toàn diện, và tập trung vào sự cộng hưởng giữa các phương pháp. Bạn PHẢI tuân thủ nghiêm ngặt lược đồ JSON được cung cấp. Tất cả các câu trả lời phải bằng tiếng Việt.";

  const resourcesPrompt = `
    **Tài nguyên phòng khám (SỬ DỤNG ĐỘC QUYỀN):**
    - Danh sách sản phẩm/hoạt chất: [${availableProducts.join(', ')}]
    - Danh sách máy móc/liệu trình công nghệ cao: [${availableMachines.join(', ')}]

    **YÊU CẦU QUAN TRỌNG:**
    - Bạn **CHỈ ĐƯỢỢC PHÉP** đề xuất các sản phẩm và máy móc từ danh sách tài nguyên được cung cấp.
    - Đối với liệu pháp tiêm, bạn có thể tự do đề xuất các phương pháp phổ biến như Mesotherapy, Skin Booster, BAP, Botox, Filler nếu thấy cần thiết.
  `;

  const prompt = `
    Phân tích CÁC hình ảnh về tình trạng lão hóa của bệnh nhân. Bộ ảnh có thể bao gồm tối đa 4 góc chụp: chính diện, nghiêng trái 45 độ, nghiêng phải 45 độ và một ảnh từ đèn Wood.

    **YÊU CẦU PHÂN TÍCH ĐA TẦNG:**
    Phân tích và cấu trúc phần "Đánh giá" của bạn thành 4 hạng mục chính sau:
    1.  **Cấu trúc & Độ săn chắc:** Đánh giá mức độ chảy xệ, chùng nhão ở các vùng như đường viền hàm, rãnh mũi má, vùng má.
    2.  **Nếp nhăn (Rhytids):** Phân loại nếp nhăn thành:
        - **Nếp nhăn động:** Xuất hiện khi biểu cảm (ví dụ: vết chân chim, cau mày).
        - **Nếp nhăn tĩnh:** Tồn tại ngay cả khi cơ mặt thả lỏng (ví dụ: nếp nhăn trán sâu, rãnh cười).
    3.  **Bề mặt & Kết cấu da:** Đánh giá kích thước lỗ chân lông, độ mịn màng, sần sùi của da.
    4.  **Sắc tố & Tông màu da:** Đánh giá sự đồng đều màu da, sự hiện diện của các đốm nâu, tàn nhang. Sử dụng ảnh đèn Wood (nếu có) để phát hiện các tổn thương do nắng tiềm ẩn.

    Dựa trên phân tích cấu trúc trên, thông tin lâm sàng và tài nguyên phòng khám, hãy thực hiện các nhiệm vụ sau:

    **Thông tin Bệnh nhân:**
    - Họ và tên: ${patientInfo.fullName}
    - Tuổi: ${patientInfo.age}
    
    **Thông tin Trẻ hóa:**
    - Mối quan tâm chính: ${rejuvenationInfo.mainConcerns}
    - Vùng cần điều trị: ${rejuvenationInfo.targetArea}
    - Các phương pháp đã điều trị: ${rejuvenationInfo.pastTreatments}
    ${rejuvenationInfo.notes ? `- Ghi chú thêm: ${rejuvenationInfo.notes}` : ''}

    ${resourcesPrompt}

    **Nhiệm vụ:**
    1.  **Đánh giá (Assessment):** Trình bày phân tích của bạn theo đúng 4 hạng mục đã yêu cầu ở trên.
    2.  **Tạo phác đồ trẻ hóa TOÀN DIỆN và ĐA PHƯƠNG THỨC:**
        - **Liệu trình công nghệ cao (highTechProcedures):** Nhắm vào vấn đề "Cấu trúc & Độ săn chắc" (ví dụ: HIFU, RF).
        - **Liệu pháp tiêm (injectionTherapies):**
            - Đề xuất **'Botox'** cho "Nếp nhăn động".
            - Đề xuất **'Filler'** cho "Nếp nhăn tĩnh sâu" và các vùng mất thể tích.
            - Đề xuất **'Mesotherapy/Skin Booster/BAP'** để cải thiện "Bề mặt & Kết cấu da".
        - **Chăm sóc tại nhà (homeCareRoutine):** Kê đơn các hoạt chất chống lão hóa mạnh mẽ (Retinoids, Vitamin C, Peptide) và kem chống nắng.
        - **Lịch trình điều trị (treatmentSchedule):** Tạo một lịch trình kết hợp thông minh các liệu pháp trên để tối ưu hóa kết quả. Ví dụ: "Tháng 1: HIFU toàn mặt. Tháng 2: Tiêm Botox vùng cau mày & Filler rãnh cười. Tháng 3: Bắt đầu liệu trình Mesotherapy 3 buổi."

    Cung cấp đầu ra ở định dạng JSON hợp lệ duy nhất tuân thủ lược đồ.
  `;

  try {
    const imageParts = images.map(image => ({
      inlineData: { data: image.base64, mimeType: image.mimeType }
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          ...imageParts,
          { text: prompt },
        ]
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: rejuvenationResponseSchema,
        temperature: 0.4,
      },
    });

    const jsonText = response.text.trim();
    // @ts-ignore
    const result: RejuvenationAnalysisResult = JSON.parse(jsonText);

    if (!result.treatmentPlan.highTechProcedures) result.treatmentPlan.highTechProcedures = [];
    if (!result.treatmentPlan.injectionTherapies) result.treatmentPlan.injectionTherapies = [];
    if (!result.treatmentPlan.homeCareRoutine) result.treatmentPlan.homeCareRoutine = [];
    if (!result.treatmentPlan.treatmentSchedule) result.treatmentPlan.treatmentSchedule = [];

    return result;

  } catch (error) {
    console.error("Error calling Gemini API for rejuvenation analysis:", error);
    throw new Error("Mô hình AI không thể tạo ra phác đồ trẻ hóa hợp lệ. Vui lòng kiểm tra đầu vào hoặc thử lại sau.");
  }
};