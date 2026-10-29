// Application Layer — Use Cases (оркестрация, SRP)
// Здесь НЕТ бизнес-правил — они в entities. Здесь только координация.

import { Document, Task, ValidatedData } from '../domain/entities';
import {
  DocumentRepository, TaskRepository, ValidatedDataRepository,
} from '../domain/repositories';
import { OCRPort, MLPort, ERPPort, ValidationRule } from '../domain/ports';
import { UploadDocumentDto, ExportResultDto } from './dto';
import { randomUUID } from 'crypto';

// ============ USE CASE 1: загрузка документа ============
export class UploadDocumentUseCase {
  constructor(
    private docs: DocumentRepository,
    private tasks: TaskRepository,
  ) {}

  async execute(dto: UploadDocumentDto): Promise<Task> {
    const doc = new Document(
      randomUUID(), dto.userId, dto.s3Url,
      'UPLOADED', new Date(),
    );
    await this.docs.save(doc);

    const task = new Task(
      randomUUID(), doc.docId, 'OCR', 'PENDING', null,
    );
    await this.tasks.save(task);
    return task;
  }
}

// ============ USE CASE 2: обработка задачи ============
export class ProcessTaskUseCase {
  constructor(
    private docs: DocumentRepository,
    private tasks: TaskRepository,
    private data: ValidatedDataRepository,
    private ocr: OCRPort,
    private ml: MLPort,
    private rules: ValidationRule[],
  ) {}

  async execute(taskId: string): Promise<void> {
    // 1) взять задачу и назначить воркера
    const task = await this.tasks.findById(taskId);
    if (!task) throw new Error('Task not found');
    task.assign('worker-1');
    await this.tasks.save(task);

    // 2) перевести документ в PROCESSING
    const doc = await this.docs.findById(task.docId);
    if (!doc) throw new Error('Doc not found');
    doc.markProcessing();
    await this.docs.save(doc);

    // 3) OCR → ML
    const text = await this.ocr.extractText(doc.s3Url);
    const extracted = await this.ml.parseFields(text, doc.docId);

    // 4) валидация (Strategy + Chain)
    const errors = this.rules
      .filter(r => !r.validate(extracted))
      .map(r => r.getError());

    if (errors.length) {
      task.fail();
      doc.markError();
      await this.tasks.save(task);
      await this.docs.save(doc);
      throw new Error('Validation: ' + errors.join('; '));
    }

    // 5) сохранить, обновить статусы
    await this.data.save(extracted);
    task.complete();
    doc.markValidated();
    await this.tasks.save(task);
    await this.docs.save(doc);
  }
}

// ============ USE CASE 3: экспорт в ERP ============
export class ExportToErpUseCase {
  constructor(
    private data: ValidatedDataRepository,
    private erp: ERPPort,
  ) {}

  async execute(docId: string): Promise<ExportResultDto> {
    const d = await this.data.findByDocId(docId);
    if (!d) return { docId, ok: false };

    const ok = await this.erp.exportToErp(d);
    if (ok) {
      d.markSent();
      await this.data.save(d);
    }
    return { docId, ok };
  }
}
