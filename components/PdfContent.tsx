import React from 'react';
import type { Evaluation, Feedback, Scores } from '../types';

declare const marked: any;

interface PdfContentProps {
    evaluations: Evaluation[];
    averageResults: {
        scores: Scores;
        feedback: Feedback;
        corretor: string;
    } | null;
}

const COMPETENCIAS_INFO = [
    { id: 1, title: 'Língua Portuguesa' },
    { id: 2, title: 'Compreensão do Tema' },
    { id: 3, title: 'Argumentação' },
    { id: 4, title: 'Coesão e Coerência' },
    { id: 5, title: 'Proposta de Intervenção' }
];

export const PdfContent: React.FC<PdfContentProps> = ({ evaluations, averageResults }) => {
    
    const renderEvaluation = (evaluation: Evaluation | { scores: Scores, feedback: Feedback, corretor: string }, isAverage: boolean) => (
        <div className="p-4 mb-6 border border-gray-200 rounded-lg" style={{ breakInside: 'avoid' }}>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{isAverage ? "📊 Média Final" : `👨‍🏫 Avaliação: ${evaluation.corretor}`}</h2>
            <div className="text-center bg-gray-100 p-4 rounded-lg mb-4">
                 <p className="text-4xl font-bold text-[#5D5CDE]">{evaluation.scores.total}</p>
                 <p className="text-gray-600">de 1000 pontos</p>
                 <p className="text-sm text-gray-500 mt-1">{evaluation.corretor}</p>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-700 mt-6 mb-3 border-b pb-2">Análise por Competência</h3>
            {COMPETENCIAS_INFO.map(c => (
                <div key={c.id} className="mb-4" style={{ breakInside: 'avoid' }}>
                    <div className="flex justify-between items-center mb-1">
                        <h4 className="text-lg font-semibold text-gray-800">Competência {c.id} - {c.title}</h4>
                        <span className="font-bold text-gray-700 bg-gray-200 px-2 py-1 text-sm rounded">{evaluation.scores[`competencia${c.id}` as keyof Scores]}/200</span>
                    </div>
                    <div className="text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(evaluation.feedback[`competencia${c.id}` as keyof Feedback]) }}></div>
                </div>
            ))}
            
            <h3 className="text-xl font-semibold text-gray-700 mt-6 mb-3 border-b pb-2">💬 Comentários Gerais</h3>
            <div className="text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(evaluation.feedback.geral) }}></div>
        </div>
    );

    return (
        <div className="font-sans text-gray-900 bg-white p-6">
            <div className="text-center mb-8">
                 <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    📝 Relatório de Avaliação da Redação
                </h1>
                <p className="text-gray-600">
                   Análise detalhada gerada pela Plataforma de Redação ENEM com IA.
                </p>
            </div>

            {averageResults && renderEvaluation(averageResults, true)}
            
            <div className="my-6 border-t-2 border-dashed border-gray-300"></div>

            {evaluations.map((evaluation, index) => (
                <React.Fragment key={index}>
                    {renderEvaluation(evaluation, false)}
                </React.Fragment>
            ))}
        </div>
    );
};