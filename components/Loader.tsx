
import React from 'react';

const loadingMessages = [
    "Đang phân tích đặc điểm da...",
    "Đang đối chiếu dữ liệu da liễu...",
    "Đang xác định các dấu hiệu sinh học chính...",
    "Đang xây dựng lộ trình điều trị tối ưu...",
    "Đang hiệu chỉnh các đề xuất..."
];

export const Loader: React.FC = () => {
  const [message, setMessage] = React.useState(loadingMessages[0]);

  React.useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
        index = (index + 1) % loadingMessages.length;
        setMessage(loadingMessages[index]);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center py-12">
      <div className="flex justify-center items-center mb-4">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <p className="text-lg font-semibold text-gray-600 transition-opacity duration-500">{message}</p>
    </div>
  );
};