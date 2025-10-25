
import React, { useCallback, useState } from 'react';
import { FileData } from '../../types';
import { fileToGenerativePart } from '../../utils/fileUtils';
import { UploadCloudIcon, XIcon, FileIcon } from './Icon';

interface FileUploadProps {
  onFileUpload: (fileData: FileData | null) => void;
  accept: string;
  label: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, accept, label }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (selectedFile: File | null) => {
    if (selectedFile) {
      setFile(selectedFile);
      const fileData = await fileToGenerativePart(selectedFile);
      onFileUpload(fileData);
    } else {
      setFile(null);
      onFileUpload(null);
    }
  };

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const onClearFile = () => {
    setFile(null);
    onFileUpload(null);
    // Reset file input value
    const fileInput = document.getElementById(`file-input-${label}`) as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };
  
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      {!file ? (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          className={`flex justify-center items-center w-full px-6 py-8 border-2 border-dashed rounded-lg transition-colors
            ${isDragging ? 'border-blue-500 bg-gray-700' : 'border-gray-600 hover:border-gray-500 bg-gray-800'}`}
        >
          <div className="text-center">
            <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-400">
              <label htmlFor={`file-input-${label}`} className="font-medium text-blue-400 hover:text-blue-300 cursor-pointer">
                Click to upload
              </label> or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              {accept.split(',').map(type => type.split('/')[1].toUpperCase()).join(', ')}
            </p>
            <input
              id={`file-input-${label}`}
              type="file"
              className="sr-only"
              accept={accept}
              onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-3">
             <FileIcon className="h-6 w-6 text-gray-400" />
            <span className="text-sm text-gray-200 truncate">{file.name}</span>
          </div>
          <button
            onClick={onClearFile}
            className="p-1 text-gray-400 rounded-full hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-700 focus:ring-blue-500"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
