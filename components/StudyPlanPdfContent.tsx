import React from 'react';

interface StudyPlanPdfContentProps {
    content: string;
}

export const StudyPlanPdfContent: React.FC<StudyPlanPdfContentProps> = ({ content }) => {
    return (
        <div className="font-sans text-gray-900 bg-white p-8">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    ✨ Plano de Estudo Personalizado
                </h1>
                <p className="text-gray-600">
                   Gerado pela Plataforma de Redação ENEM com IA.
                </p>
            </div>
            <div 
                className="text-gray-800 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
            />
        </div>
    );
};