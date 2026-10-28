import {
  ValidatedData, Task,
  OCRService, DataExtractionService, ValidationRule,
  ERPIntegrationService, DocumentProcessor, Document,
} from './domain';

// OCP: чтобы добавить новый OCR — новый класс, не трогаем процессор
export class StubOcrService implements OCRService {
  async extractText(_file: Uint8Array): Promise<string> {
    return 'ИНН 7701234567 Сумма 15000 руб. Дата 01.01.2025';
  }
}

// OCP + LSP: любая ML-модель соблюдает контракт parseFields
export class StubDataExtractionService implements DataExtractionService {
  async parseFields(text: string): Promise<ValidatedData> {
    const inn = text.match(/ИНН\s+(\d{10,12})/)?.[1] ?? null;
    const amount = Number(text.match(/Сумма\s+(\d+)/)?.[1] ?? 0);
    const dateStr = text.match(/Дата\s+(\d{2}\.\d{2}\.\d{4})/)?.[1];
    return {
      dataId: crypto.randomUUID(),
      docId: '',
      inn,
      amount: amount || null,
      docDate: dateStr
        ? new Date(dateStr.split('.').reverse().join('-'))
        : null,
      isSentToErp: false,
    };
  }
}

// SRP: одно правило = одна проверка
export class InnRule implements ValidationRule {
  validate(data: ValidatedData): boolean {
    return !!data.inn && /^\d{10}$|^\d{12}$/.test(data.inn);
  }
  getError(): string { return 'Некорректный ИНН'; }
}

export class AmountRule implements ValidationRule {
  validate(data: ValidatedData): boolean {
    return data.amount !== null && data.amount >= 0;
  }
  getError(): string { return 'Некорректная сумма'; }
}

// DIP: процессор не знает про 1С, зависит от интерфейса
export class StubErpService implements ERPIntegrationService {
  async exportToErp(data: ValidatedData): Promise<boolean> {
    console.log('[ERP] exported:', data.inn, data.amount);
    return true;
  }
}

// SRP: только оркестрация пайплайна
// DIP: все зависимости — интерфейсы, внедряются через конструктор
export class DefaultDocumentProcessor extends DocumentProcessor {
  constructor(
    private ocr: OCRService,
    private ml: DataExtractionService,
    private rules: ValidationRule[],
    private erp: ERPIntegrationService,
  ) {
    super();
  }

  async normalizeImage(doc: Document): Promise<Uint8Array> {
    return new TextEncoder().encode(doc.s3Url);
  }

  validate(data: ValidatedData): boolean {
    return this.rules.every(r => r.validate(data));
  }

  async processPipeline(task: Task): Promise<void> {
    const text = await this.ocr.extractText(
      new TextEncoder().encode(task.docId),
    );
    const data = await this.ml.parseFields(text);
    data.docId = task.docId;

    if (!this.validate(data)) {
      const errors = this.rules
        .filter(r => !r.validate(data))
        .map(r => r.getError());
      throw new Error('Validation failed: ' + errors.join('; '));
    }
    await this.erp.exportToErp(data);
  }
}
