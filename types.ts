export interface Scores {
    competencia1: number;
    competencia2: number;
    competencia3: number;
    competencia4: number;
    competencia5: number;
    total: number;
}

export interface Feedback {
    competencia1: string;
    competencia2: string;
    competencia3: string;
    competencia4: string;
    competencia5: string;
    geral: string;
}

export interface Evaluation {
    corretor: string;
    scores: Scores;
    feedback: Feedback;
}

export interface Corrector {
    name: string;
    system: string;
}

export type ViewType = 'avg' | number;
