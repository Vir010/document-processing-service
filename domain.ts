// ============================================================
// Контракты (из диаграммы классов). Только интерфейсы и
// один абстрактный класс. Никаких реализаций здесь нет.
// ============================================================

export interface Document {
  docId: string;
  userId: string;
  s3Url: string;
  status: 'UPLOADED' | 'PROCESSING' | 'VALIDATED' | 'ERROR';
  uploadedAt: Date;
}

export interface ValidatedData {
  dataId: string;
  docId: string;
  inn: string | null;
  amount: number | null;
  docDate: Date | null;
  isSentToErp: boolean;
}

export interface Task {
  taskId: string;
  docId: string;
  taskType: 'OCR' | 'ML' | 'VALIDATION';
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';
  workerId: string | null;
}

export interface OCRService {
  extractText(file: Uint8Array): Promise<string>;
}

export interface DataExtractionService {
  parseFields(text: string): Promise<ValidatedData>;
}

export interface ValidationRule {
  validate(data: ValidatedData): boolean;
  getError(): string;
}

export interface ERPIntegrationService {
  exportToErp(data: ValidatedData): Promise<boolean>;
}

export abstract class DocumentProcessor {
  abstract processPipeline(task: Task): Promise<void>;
  abstract normalizeImage(doc: Document): Promise<Uint8Array>;
  abstract validate(data: ValidatedData): boolean;
}
