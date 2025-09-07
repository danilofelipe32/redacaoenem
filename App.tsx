import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { GoogleGenAI, Type } from "@google/genai";
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { ResultsSection } from './components/ResultsSection';
import { GeminiModal } from './components/GeminiModal';
import { ErrorToast } from './components/ErrorToast';
import { StudyPlanPdfContent } from './components/StudyPlanPdfContent';
import type { Evaluation, Corrector } from './types';
import { fileToBase64, fileToText } from './utils/file';

const App: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [textInput, setTextInput] = useState<string>('');
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('🔍 Analisar com 3 Corretores');
    const [modalState, setModalState] = useState<{ isOpen: boolean; title: string; content: string }>({ isOpen: false, title: '', content: '' });
    const [error, setError] = useState<string | null>(null);
    const [isExportingPlan, setIsExportingPlan] = useState<boolean>(false);


    const navigate = useNavigate();
    const location = useLocation();

    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);

    const updateAnalyzeButtonDisabled = !selectedFile && !textInput.trim();

    useEffect(() => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    useEffect(() => {
        // Redirect to home if user is on /results without evaluations data (e.g., on page refresh)
        if (location.pathname === '/results' && evaluations.length === 0) {
            navigate('/');
        }
    }, [location.pathname, evaluations, navigate]);

    const callGeminiAPI = useCallback(async <T,>(systemPrompt: string, userPrompt: string, file: File | null = null, responseIsJson: boolean): Promise<T> => {
        const textPart = { text: userPrompt };
        let parts: any[] = [textPart];

        if (file) {
            if (file.type.startsWith("image/")) {
                const base64Data = await fileToBase64(file);
                const imagePart = { inlineData: { mimeType: file.type, data: base64Data } };
                parts.push(imagePart);
            } else if (file.type === 'text/plain') {
                const fileText = await fileToText(file);
                parts[0].text += `\n\n--- INÍCIO DA REDAÇÃO DO ARQUIVO ---\n${fileText}\n--- FIM DA REDAÇÃO DO ARQUIVO ---`;
            } else if (file.type === 'application/pdf') {
                const base64Data = await fileToBase64(file);
                const pdfPart = { inlineData: { mimeType: file.type, data: base64Data } };
                parts.push(pdfPart);
            } else {
                // Fallback for unsupported file types
                parts[0].text += `\n\n(Anexo: ${file.name}, tipo: ${file.type}. Não foi possível processar o conteúdo.)`;
            }
        }
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: parts },
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: responseIsJson ? "application/json" : "text/plain",
                temperature: 0.2,
                seed: 42,
                 ...(responseIsJson && {
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            corretor: { type: Type.STRING },
                            scores: {
                                type: Type.OBJECT,
                                properties: {
                                    competencia1: { type: Type.NUMBER },
                                    competencia2: { type: Type.NUMBER },
                                    competencia3: { type: Type.NUMBER },
                                    competencia4: { type: Type.NUMBER },
                                    competencia5: { type: Type.NUMBER },
                                    total: { type: Type.NUMBER }
                                },
                                required: ["competencia1", "competencia2", "competencia3", "competencia4", "competencia5", "total"]
                            },
                            feedback: {
                                type: Type.OBJECT,
                                properties: {
                                    competencia1: { type: Type.STRING },
                                    competencia2: { type: Type.STRING },
                                    competencia3: { type: Type.STRING },
                                    competencia4: { type: Type.STRING },
                                    competencia5: { type: Type.STRING },
                                    geral: { type: Type.STRING }
                                },
                                required: ["competencia1", "competencia2", "competencia3", "competencia4", "competencia5", "geral"]
                            }
                        },
                        required: ["corretor", "scores", "feedback"]
                    }
                })
            }
        });
        
        const text = response.text;
        return responseIsJson ? JSON.parse(text) : text;
    }, [ai]);

    const handleAnalyzeEssay = useCallback(async () => {
        if (updateAnalyzeButtonDisabled) return;

        setIsLoading(true);
        setError(null);
        setEvaluations([]);
        if (location.pathname === '/results') {
            navigate('/');
        }


        const essayText = textInput.trim();
        const basePrompt = `Você é um corretor do ENEM. Avalie a redação fornecida com base nas 5 competências oficiais do ENEM 2024. Forneça uma pontuação de 0 a 200 para cada competência (em múltiplos de 40) e um feedback detalhado, construtivo e específico para cada uma. Adicione também um feedback geral. A resposta DEVE seguir o schema JSON fornecido. Some a pontuação de cada competência para obter o total.\n\n${essayText ? 'Texto da redação:\n' + essayText : 'A redação está no arquivo anexo.'}`;

        const consistencyInstruction = "Seja consistente e objetivo em suas avaliações, seguindo estritamente as diretrizes do ENEM para garantir que a mesma redação receba uma pontuação similar em múltiplas avaliações.";

        const correctores: Corrector[] = [
            { name: 'Prof. Ana Silva', system: `Você é a Prof. Ana Silva, uma educadora rigorosa com 25 anos de experiência. Seu foco é na gramática, estrutura textual e aderência à norma culta (Competências 1 e 4). ${consistencyInstruction}` },
            { name: 'Dr. Carlos Mendes', system: `Você é o Dr. Carlos Mendes, um linguista. Sua especialidade é analisar a profundidade da argumentação e o uso de repertório sociocultural (Competências 2 e 3). ${consistencyInstruction}` },
            { name: 'Profa. Maria Santos', system: `Você é a Profa. Maria Santos, uma socióloga. Você valoriza a relevância social do conteúdo e a qualidade da proposta de intervenção (Competência 5). ${consistencyInstruction}` }
        ];

        try {
            setLoadingMessage('Analisando... (0/3)');
            const promises = correctores.map((corretor, index) => {
                const prompt = basePrompt.replace('SEU_NOME', corretor.name);
                 return callGeminiAPI<Evaluation>(corretor.system, prompt, selectedFile, true).then(result => {
                     setLoadingMessage(`Analisando... (${index + 1}/3)`);
                     return result;
                 });
            });

            const results = await Promise.all(promises);
            setEvaluations(results);
            navigate('/results');

        } catch (err: any) {
            setError("Erro ao analisar a redação: " + err.message);
        } finally {
            setIsLoading(false);
            setLoadingMessage('🔍 Analisar com 3 Corretores');
        }
    }, [textInput, selectedFile, updateAnalyzeButtonDisabled, callGeminiAPI, navigate, location]);

    const handleGenerateTheme = useCallback(async () => {
        setModalState({ isOpen: true, title: 'Gerador de Temas ✨', content: '<div class="flex justify-center items-center"><div class="loading-spinner w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>' });
        const systemPrompt = "Você é um assistente criativo especializado em criar temas para o Exame Nacional do Ensino Médio (ENEM) no Brasil.";
        const userPrompt = "Gere 5 propostas de tema para uma redação do ENEM. Os temas devem ser relevantes para a realidade brasileira atual, abrangendo áreas como sociedade, tecnologia, meio ambiente e cultura. Apresente os temas em formato de lista Markdown.";
        try {
            const themes = await callGeminiAPI<string>(systemPrompt, userPrompt, null, false);
            setModalState(s => ({ ...s, content: (window as any).marked.parse(themes) }));
        } catch (err: any) {
            setModalState(s => ({ ...s, content: `<p class="text-red-500">Ocorreu um erro ao gerar os temas: ${err.message}</p>` }));
        }
    }, [callGeminiAPI]);

    const handleGenerateStudyPlan = useCallback(async () => {
        if (evaluations.length === 0) {
            setError("É preciso analisar uma redação primeiro.");
            return;
        }
        setModalState({ isOpen: true, title: 'Plano de Estudo Personalizado ✨', content: '<div class="flex justify-center items-center"><div class="loading-spinner w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>' });

        let evaluationSummary = evaluations.map(e => `
### Corretor: ${e.corretor} (Nota Total: ${e.scores.total})
- **Competência 1 (${e.scores.competencia1}/200):** ${e.feedback.competencia1}
- **Competência 2 (${e.scores.competencia2}/200):** ${e.feedback.competencia2}
- **Competência 3 (${e.scores.competencia3}/200):** ${e.feedback.competencia3}
- **Competência 4 (${e.scores.competencia4}/200):** ${e.feedback.competencia4}
- **Competência 5 (${e.scores.competencia5}/200):** ${e.feedback.competencia5}
**Feedback Geral:** ${e.feedback.geral}
`).join('\n---\n');

        const systemPrompt = "Você é um pedagogo e tutor especializado em preparação para o ENEM. Sua tarefa é criar planos de estudo personalizados com base no desempenho dos alunos.";
        const userPrompt = `Com base na seguinte avaliação de uma redação do ENEM, crie um plano de estudos conciso e prático para o aluno. O plano deve focar nos pontos fracos identificados e sugerir ações concretas e específicas para melhoria. Formate a resposta em Markdown, usando títulos e listas.\n\n**Avaliações Recebidas:**\n${evaluationSummary}`;

        try {
            const plan = await callGeminiAPI<string>(systemPrompt, userPrompt, null, false);
            setModalState(s => ({ ...s, content: (window as any).marked.parse(plan) }));
        } catch (err: any) {
            setModalState(s => ({ ...s, content: `<p class="text-red-500">Ocorreu um erro ao gerar o plano de estudos: ${err.message}</p>` }));
        }
    }, [evaluations, callGeminiAPI]);
    
    const handleExportStudyPlan = useCallback(async () => {
        if (!modalState.content || modalState.content.includes('loading-spinner')) {
            setError("Aguarde o conteúdo do plano de estudo ser gerado antes de exportar.");
            return;
        };
    
        setIsExportingPlan(true);
        setError(null);
    
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
    
            const root = ReactDOM.createRoot(pdfContainer);
            root.render(<StudyPlanPdfContent content={modalState.content} />);
            
            await new Promise<void>(resolve => setTimeout(resolve, 500));
            
            const canvas = await html2canvas(pdfContainer, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'pt',
                format: 'a4',
            });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const scaledHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, scaledHeight);
            pdf.save('plano-de-estudo-enem.pdf');
    
            root.unmount();
            document.body.removeChild(pdfContainer);
    
        } catch (err: any) {
            setError(err.message || "Ocorreu um erro desconhecido ao exportar o plano de estudo.");
        } finally {
            setIsExportingPlan(false);
        }
    }, [modalState.content]);

    return (
        <div className="min-h-screen py-6 px-4">
            <div className="max-w-6xl mx-auto">
                <Header />
                <UploadSection
                    onFileSelect={setSelectedFile}
                    onTextChange={setTextInput}
                    onAnalyze={handleAnalyzeEssay}
                    onGenerateTheme={handleGenerateTheme}
                    selectedFile={selectedFile}
                    textInput={textInput}
                    isLoading={isLoading}
                    loadingMessage={loadingMessage}
                    isAnalyzeDisabled={updateAnalyzeButtonDisabled}
                />
                 <Routes>
                    <Route path="/results" element={
                        <ResultsSection
                            evaluations={evaluations}
                            onGenerateStudyPlan={handleGenerateStudyPlan}
                        />
                    } />
                </Routes>
            </div>
            <GeminiModal
                isOpen={modalState.isOpen}
                title={modalState.title}
                content={modalState.content}
                onClose={() => setModalState({ isOpen: false, title: '', content: '' })}
                onExport={modalState.title.includes('Plano de Estudo') ? handleExportStudyPlan : undefined}
                isExporting={isExportingPlan}
            />
            {error && <ErrorToast message={error} onClose={() => setError(null)} />}
        </div>
    );
};

export default App;