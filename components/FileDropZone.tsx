import React, { useState, useCallback } from 'react';

interface FileDropZoneProps {
    selectedFile: File | null;
    onFileChange: (file: File | null) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({ selectedFile, onFileChange, fileInputRef }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFileChange(e.dataTransfer.files[0]);
        }
    }, [onFileChange]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileChange(e.target.files[0]);
        }
    };
    
    const handleRemoveFile = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        onFileChange(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`file-drop-zone rounded-lg p-8 text-center mb-4 cursor-pointer ${isDragOver ? 'drag-over' : ''}`}
        >
            <input
                type="file"
                ref={fileInputRef}
                accept=".txt,.pdf,image/*"
                className="hidden"
                onChange={handleFileSelect}
            />
            {selectedFile ? (
                <>
                    <div className="flex items-center justify-center pointer-events-none">
                        <svg className="w-8 h-8 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span className="text-green-600 dark:text-green-400 font-medium">{selectedFile.name}</span>
                    </div>
                    <button onClick={handleRemoveFile} className="mt-2 text-sm text-red-500 hover:text-red-700 hover:underline">Remover</button>
                </>
            ) : (
                <div className="flex flex-col items-center pointer-events-none">
                    <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Arraste um arquivo aqui ou <span className="text-[#5D5CDE] font-semibold hover:underline">clique para selecionar</span>
                    </p>
                    <p className="text-xs text-gray-500">
                        Suporte para Imagens (JPG, PNG), PDF ou TXT
                    </p>
                </div>
            )}
        </div>
    );
};
