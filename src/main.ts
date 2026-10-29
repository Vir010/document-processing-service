// Composition Root — единственное место, где известны все
// конкретные классы. Здесь собирается граф зависимостей (Factory + DI).

import {
  UploadDocumentUseCase, ProcessTaskUseCase, ExportToErpUseCase,
} from './application/use-cases';
import {
  InMemoryDocumentRepository,
  InMemoryTaskRepository,
  InMemoryValidatedDataRepository,
} from './infrastructure/repositories';
import {
  StubOCRAdapter, StubMLAdapter, StubERPAdapter,
} from './infrastructure/adapters';
import {
  InnRule, AmountRule, DateRule,
} from './patterns/validation-chain';

async function main() {
  // ---- 1) Инфраструктура (низкоуровневые) ----
  const docsRepo  = new InMemoryDocumentRepository();
  const tasksRepo = new InMemoryTaskRepository();
  const dataRepo  = new InMemoryValidatedDataRepository();
  const ocr       = new StubOCRAdapter();
  const ml        = new StubMLAdapter();
  const erp       = new StubERPAdapter();
  const rules     = [new InnRule(), new AmountRule(), new DateRule()];

  // ---- 2) Use cases (зависимости через конструктор = DIP) ----
  const upload     = new UploadDocumentUseCase(docsRepo, tasksRepo);
  const process    = new ProcessTaskUseCase(
    docsRepo, tasksRepo, dataRepo, ocr, ml, rules,
  );
  const exportErp  = new ExportToErpUseCase(dataRepo, erp);

  // ---- 3) Сценарий ----
  const task = await upload.execute({
    userId: 'u1',
    s3Url: 's3://bucket/scan.pdf',
  });
  console.log('Uploaded doc →', task.docId);

  await process.execute(task.taskId);
  console.log('Processed  doc →', task.docId);

  const result = await exportErp.execute(task.docId);
  console.log('ERP export →', result);

  console.log('OK');
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
