import React, { useCallback } from 'react';
import type { FaceImages, ImageSlot } from '../types';

interface ImageUploaderProps {
  onFilesSelect: (files: FaceImages) => void;
  selectedFiles: FaceImages;
}

const ImageSlotComponent: React.FC<{
  slot: ImageSlot;
  label: string;
  file: File | null;
  onFileChange: (slot: ImageSlot, file: File | null) => void;
  isRequired?: boolean;
}> = ({ slot, label, file, onFileChange, isRequired = false }) => {
  const previewUrl = file ? URL.createObjectURL(file) : null;

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newFile = event.target.files?.[0] || null;
    if (newFile) {
        if (!newFile.type.startsWith('image/')) {
            alert('Loại tệp không hợp lệ. Vui lòng chỉ chọn hình ảnh.');
            return;
        }
        if (newFile.size > 15 * 1024 * 1024) { // 15MB limit
            alert(`Kích thước tệp ${newFile.name} quá lớn. Vui lòng chọn ảnh nhỏ hơn 15MB.`);
            return;
        }
    }
    onFileChange(slot, newFile);
     // Reset input to allow selecting the same file again after removing it
    event.target.value = '';
  }, [onFileChange, slot]);

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    onFileChange(slot, null);
  };

  const inputId = `image-input-${slot}`;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <label htmlFor={inputId} className="block text-sm font-semibold text-slate-700 mb-2">
        {label} {isRequired && <span className="text-red-500">*</span>}
      </label>
      <div className="w-full aspect-square relative flex items-center justify-center border-2 border-slate-300 border-dashed rounded-2xl bg-slate-100/50 transition-colors">
        {previewUrl ? (
          <>
            <img src={previewUrl} alt={`Xem trước ${label}`} className="w-full h-full object-cover rounded-xl" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-xl">
               <button onClick={handleRemove} type="button" className="text-white text-sm bg-red-600/80 hover:bg-red-700/80 rounded-full px-3 py-1 mb-2">Xóa</button>
               <label htmlFor={inputId} className="text-white text-sm bg-blue-600/80 hover:bg-blue-700/80 rounded-full px-3 py-1 cursor-pointer">Đổi ảnh</label>
            </div>
          </>
        ) : (
          <label htmlFor={inputId} className="w-full h-full flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 rounded-2xl transition-colors">
            <svg className="mx-auto h-10 w-10 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 4v.01M28 8L22 2m-2 6l-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M44 30v-8a4 4 0 00-4-4H12a4 4 0 00-4 4v12a4 4 0 004 4h12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="36" cy="24" r="2" fill="currentColor" />
            </svg>
            <span className="mt-2 block text-xs font-semibold text-blue-600">
              Nhấn để tải lên
            </span>
          </label>
        )}
        <input
          id={inputId}
          type="file"
          className="sr-only"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onFilesSelect, selectedFiles }) => {
  const handleFileChange = useCallback((slot: ImageSlot, file: File | null) => {
    onFilesSelect({
      ...selectedFiles,
      [slot]: file,
    });
  }, [onFilesSelect, selectedFiles]);

  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-700">
                Hình ảnh da của bệnh nhân
            </h3>
            <p className="text-xs text-slate-500">Tối đa 4 ảnh, mỗi ảnh &lt; 15MB</p>
       </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <ImageSlotComponent
          slot="front"
          label="Ảnh Chính diện"
          file={selectedFiles.front}
          onFileChange={handleFileChange}
          isRequired
        />
        <ImageSlotComponent
          slot="left"
          label="Ảnh Nghiêng Trái (45°)"
          file={selectedFiles.left}
          onFileChange={handleFileChange}
        />
        <ImageSlotComponent
          slot="right"
          label="Ảnh Nghiêng Phải (45°)"
          file={selectedFiles.right}
          onFileChange={handleFileChange}
        />
         <ImageSlotComponent
          slot="wood"
          label="Ảnh đèn Wood"
          file={selectedFiles.wood}
          onFileChange={handleFileChange}
        />
      </div>
    </div>
  );
};