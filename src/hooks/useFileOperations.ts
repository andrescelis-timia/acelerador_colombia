import { useState } from 'react';

export interface FileData {
  file_name: string;
  content: string;
}

export interface FileContentModal {
  name: string;
  content: string;
}

export const useFileOperations = () => {
  const [selectedFileContent, setSelectedFileContent] = useState<FileContentModal | null>(null);

  const viewFileContent = (file: FileData) => {
    setSelectedFileContent({
      name: file.file_name,
      content: file.content
    });
  };

  const downloadFile = (file: FileData) => {
    const blob = new Blob([file.content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const closeFileContent = () => {
    setSelectedFileContent(null);
  };

  return {
    selectedFileContent,
    viewFileContent,
    downloadFile,
    closeFileContent
  };
};