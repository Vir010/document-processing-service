import {
  DefaultDocumentProcessor,
  StubOcrService,
  StubDataExtractionService,
  StubErpService,
  InnRule,
  AmountRule,
} from './impl';

(async () => {
  const proc = new DefaultDocumentProcessor(
    new StubOcrService(),
    new StubDataExtractionService(),
    [new InnRule(), new AmountRule()],
    new StubErpService(),
  );

  await proc.processPipeline({
    taskId: 't1',
    docId: 'd1',
    taskType: 'OCR',
    status: 'PENDING',
    workerId: null,
  });

  console.log('OK');
})();
