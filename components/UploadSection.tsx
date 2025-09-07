import React, { useCallback, useRef } from 'react';
import { FileDropZone } from './FileDropZone';

interface UploadSectionProps {
    onFileSelect: (file: File | null) => void;
    onTextChange: (text: string) => void;
    onAnalyze: () => void;
    onGenerateTheme: () => void;
    selectedFile: File | null;
    textInput: string;
    isLoading: boolean;
    loadingMessage: string;
    isAnalyzeDisabled: boolean;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
    onFileSelect,
    onTextChange,
    onAnalyze,
    onGenerateTheme,
    selectedFile,
    textInput,
    isLoading,
    loadingMessage,
    isAnalyzeDisabled
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (file: File | null) => {
        onFileSelect(file);
        if (file) {
            onTextChange(''); // Clear text input when a file is selected
        }
    };
    
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onTextChange(e.target.value);
        if (e.target.value) {
            onFileSelect(null); // Clear file when text is typed
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">📤 Comece por aqui</h2>

            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Precisa de inspiração?</h3>
                <button
                    onClick={onGenerateTheme}
                    className="bg-green-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center text-sm w-full sm:w-auto"
                >
                    ✨ Gerar Tema de Redação
                </button>
            </div>
            
            <FileDropZone
                selectedFile={selectedFile}
                onFileChange={handleFileChange}
                fileInputRef={fileInputRef}
            />

            <div className="mb-4">
                <label htmlFor="textInput" className="block text-sm font-medium mb-2">
                    Ou cole o texto da redação:
                </label>
                <textarea
                    id="textInput"
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#5D5CDE] focus:border-transparent resize-none bg-white dark:bg-gray-700 text-base"
                    placeholder="Cole aqui o texto da sua redação..."
                    value={textInput}
                    onChange={handleTextChange}
                ></textarea>
            </div>

            <button
                id="analyzeBtn"
                onClick={onAnalyze}
                className="w-full bg-[#5D5CDE] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#4a4bc9] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-105 disabled:hover:scale-100"
                disabled={isAnalyzeDisabled || isLoading}
            >
                <span>{loadingMessage}</span>
                {isLoading && <div className="loading-spinner ml-2 w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>}
            </button>
        </div>
    );
};
