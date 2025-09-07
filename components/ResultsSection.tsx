import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import type { Evaluation, Scores, Feedback, ViewType } from '../types';
import { PdfContent } from './PdfContent';

declare const marked: any;

interface ResultsSectionProps {
    evaluations: Evaluation[];
    onGenerateStudyPlan: () => void;
}

const COMPETENCIAS_INFO = [
    { id: 1, title: 'Língua Portuguesa', icon: '📚', desc: 'Domínio da modalidade escrita formal da língua portuguesa' },
    { id: 2, title: 'Compreensão do Tema', icon: '🎯', desc: 'Compreender a proposta e aplicar conceitos de várias áreas' },
    { id: 3, title: 'Argumentação', icon: '🧠', desc: 'Selecionar, relacionar, organizar e interpretar informações' },
    { id: 4, title: 'Coesão e Coerência', icon: '🔗', desc: 'Demonstrar conhecimento dos mecanismos linguísticos' },
    { id: 5, title: 'Proposta de Intervenção', icon: '💡', desc: 'Elaborar proposta de intervenção para o problema abordado' }
];

export const ResultsSection: React.FC<ResultsSectionProps> = ({ evaluations, onGenerateStudyPlan }) => {
    const [view, setView] = useState<ViewType>('avg');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
    const [pdfError, setPdfError] = useState<string | null>(null);


    useEffect(() => {
        // Scroll to results when component mounts
        const el = document.getElementById('results-section');
        el?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const averageResults = useMemo(() => {
        if (evaluations.length === 0) return null;
        const avgScores: Scores = {
            competencia1: Math.round(evaluations.reduce((s, e) => s + e.scores.competencia1, 0) / evaluations.length),
            competencia2: Math.round(evaluations.reduce((s, e) => s + e.scores.competencia2, 0) / evaluations.length),
            competencia3: Math.round(evaluations.reduce((s, e) => s + e.scores.competencia3, 0) / evaluations.length),
            competencia4: Math.round(evaluations.reduce((s, e) => s + e.scores.competencia4, 0) / evaluations.length),
            competencia5: Math.round(evaluations.reduce((s, e) => s + e.scores.competencia5, 0) / evaluations.length),
            total: 0
        };
        avgScores.total = Object.values(avgScores).slice(0, 5).reduce((a, b) => a + b, 0);

        const combinedFeedback: Feedback = {
            competencia1: evaluations.map(e => `**${e.corretor}:** ${e.feedback.competencia1}`).join('\n\n'),
            competencia2: evaluations.map(e => `**${e.corretor}:** ${e.feedback.competencia2}`).join('\n\n'),
            competencia3: evaluations.map(e => `**${e.corretor}:** ${e.feedback.competencia3}`).join('\n\n'),
            competencia4: evaluations.map(e => `**${e.corretor}:** ${e.feedback.competencia4}`).join('\n\n'),
            competencia5: evaluations.map(e => `**${e.corretor}:** ${e.feedback.competencia5}`).join('\n\n'),
            geral: evaluations.map(e => `**${e.corretor}:** ${e.feedback.geral}`).join('\n\n')
        };
        return { scores: avgScores, feedback: combinedFeedback, corretor: `Média de ${evaluations.length} corretores` };
    }, [evaluations]);

    const currentData = useMemo(() => {
        if (view === 'avg') return averageResults;
        return evaluations[view];
    }, [view, averageResults, evaluations]);

    const handleGeneratePdf = async () => {
        if (!averageResults) return;
        setIsGeneratingPdf(true);
        setPdfError(null);
    
        try {
            const { jsPDF } = (window as any).jspdf;
            const html2canvas = (window as any).html2canvas;
    
            if (!jsPDF || !html2canvas) {
                throw new Error('As bibliotecas para geração de PDF não foram encontradas.');
            }
    
            const pdfContainer = document.createElement('div');
            pdfContainer.style.position = 'absolute';
            pdfContainer.style.left = '-9999px';
            pdfContainer.style.width = '1024px';
            pdfContainer.style.background = '#fff';
            document.body.appendChild(pdfContainer);
    
            const root = createRoot(pdfContainer);

            // FIX: The root.render method from `react-dom/client` (used in React 18+)
            // does not accept a callback function. The render call is separated from
            // the waiting mechanism, which uses a short timeout to allow the content
            // to be painted before `html2canvas` captures it.
            root.render(<PdfContent evaluations={evaluations} averageResults={averageResults} />);
            
            await new Promise<void>(resolve => {
                setTimeout(resolve, 500);
            });
            
            const canvas = await html2canvas(pdfContainer, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'pt',
                format: 'a4',
            });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = imgWidth / pdfWidth;
            const scaledHeight = imgHeight / ratio;
            const pdfPageHeight = pdf.internal.pageSize.getHeight();
    
            let heightLeft = scaledHeight;
            let position = 0;
    
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
            heightLeft -= pdfPageHeight;
    
            while (heightLeft > 0) {
                position -= pdfPageHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
                heightLeft -= pdfPageHeight;
            }
    
            pdf.save('avaliacao-redacao.pdf');
    
            root.unmount();
            document.body.removeChild(pdfContainer);
    
        } catch (err: any) {
            setPdfError(err.message || "Ocorreu um erro desconhecido ao gerar o PDF.");
            console.error("PDF Generation Error:", err);
        } finally {
            setIsGeneratingPdf(false);
        }
    };


    if (!currentData) return null;

    const { scores, feedback, corretor } = currentData;
    
    return (
        <div id="results-section">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">👨‍🏫 Avaliações dos Corretores</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                    <button onClick={() => setView('avg')} className={`evaluator-tab px-4 py-2 rounded-lg font-medium ${view === 'avg' ? 'active' : 'bg-gray-100 dark:bg-gray-700'}`}>
                        📊 Média Final
                    </button>
                    {evaluations.map((ev, index) => (
                        <button key={index} onClick={() => setView(index)} className={`evaluator-tab px-4 py-2 rounded-lg font-medium ${view === index ? 'active' : 'bg-gray-100 dark:bg-gray-700'}`}>
                           {ev.corretor}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">🎯 <span>{view === 'avg' ? 'Pontuação Média Final' : `Avaliação - ${corretor}`}</span></h2>
                <div className="flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-5xl font-bold text-[#5D5CDE] mb-2">{scores.total}</div>
                        <div className="text-gray-600 dark:text-gray-400">de 1000 pontos</div>
                        <div className="text-sm text-gray-500 mt-2">{corretor}</div>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 mb-6">
                {COMPETENCIAS_INFO.map(c => (
                    <div key={c.id} className="competencia-card bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{c.icon} Competência {c.id} - {c.title}</h3>
                            <span className="bg-[#5D5CDE] text-white px-3 py-1 rounded-full text-sm font-medium">{scores[`competencia${c.id}` as keyof Scores]}/200</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{c.desc}</p>
                        <div 
                            className="text-gray-700 dark:text-gray-300 prose prose-sm max-w-none dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: marked.parse(feedback[`competencia${c.id}` as keyof Feedback]) }}
                        ></div>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">💬 Comentários Gerais e Sugestões</h2>
                <div 
                    className="text-gray-700 dark:text-gray-300 prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: marked.parse(feedback.geral) }}
                ></div>
            </div>

            <div className="mt-6 text-center bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Próximo passo?</h3>
                <button onClick={onGenerateStudyPlan} className="bg-blue-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center mx-auto">
                    ✨ Criar Plano de Estudo Personalizado
                </button>
            </div>
            
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-2 text-center">Exporte seus Resultados</h3>
                <button 
                    onClick={handleGeneratePdf} 
                    disabled={isGeneratingPdf}
                    className="bg-red-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center mx-auto disabled:opacity-50 disabled:cursor-wait"
                >
                    {isGeneratingPdf ? (
                        <>
                            <div className="loading-spinner mr-2 w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                            <span>Gerando PDF...</span>
                        </>
                    ) : (
                       '📄 Baixar Avaliação em PDF'
                    )}
                </button>
                {pdfError && <p className="text-red-500 text-sm mt-2 text-center">{pdfError}</p>}
            </div>
        </div>
    );
};