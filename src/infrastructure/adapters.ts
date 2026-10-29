// Infrastructure — Adapters к внешним системам (Port → Adapter)
// Stub-реализации: в проде TesseractAdapter, YandexVisionAdapter, OneCAdapter

import { Inn, Amount, ValidatedData } from '../domain/entities';
import { OCRPort, MLPort, ERPPort } from '../domain/ports';
import { randomUUID } from 'crypto';

export class StubOCRAdapter implements OCRPort {
  async extractText(_s3Url: string): Promise<string> {
    return 'ИНН 7701234567 Сумма 15000 руб. Дата 01.01.2025';
  }
}

export class StubMLAdapter implements MLPort {
  async parseFields(text: string, docId: string): Promise<ValidatedData> {
    const innStr  = text.match(/ИНН\s+(\d{10,12})/)?.[1] ?? null;
    const amtStr  = text.match(/Сумма\s+(\d+)/)?.[1];
    const dateStr = text.match(/Дата\s+(\d{2}\.\d{2}\.\d{4})/)?.[1];

    return new ValidatedData(
      randomUUID(),
      docId,
      Inn.create(innStr),
      Amount.create(amtStr ? Number(amtStr) : null),
      dateStr ? new Date(dateStr.split('.').reverse().join('-')) : null,
      false,
    );
  }
}

export class StubERPAdapter implements ERPPort {
  async exportToErp(data: ValidatedData): Promise<boolean> {
    console.log('[ERP] exported:',
      data.inn?.value ?? '-',
      data.amount?.value ?? '-');
    return true;
  }
}
