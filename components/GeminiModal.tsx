import React, { useEffect } from 'react';

interface GeminiModalProps {
    isOpen: boolean;
    title: string;
    content: string;
    onClose: () => void;
    onExport?: () => void;
    isExporting?: boolean;
}

export const GeminiModal: React.FC<GeminiModalProps> = ({ isOpen, title, content, onClose, onExport, isExporting }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-600">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button onClick={onClose} className="text-gray-500 text-3xl hover:text-gray-800 dark:hover:text-gray-200">&times;</button>
                </div>
                <div 
                    className="p-6 overflow-y-auto prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: content }}
                >
                </div>
                {onExport && (
                    <div className="flex justify-end p-4 border-t dark:border-gray-600">
                         <button 
                            onClick={onExport} 
                            disabled={isExporting}
                            className="bg-green-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-wait"
                        >
                            {isExporting ? (
                                <>
                                    <div className="loading-spinner mr-2 w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                                    <span>Exportando...</span>
                                </>
                            ) : (
                               '📄 Baixar PDF'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};