// Domain Layer — Ports (интерфейсы к внешнему миру, Hexagonal)
// Стратегии (Strategy): любая реализация подставляется без правки use cases

import { ValidatedData } from './entities';

export interface OCRPort {
  extractText(s3Url: string): Promise<string>;
}

export interface MLPort {
  parseFields(text: string, docId: string): Promise<ValidatedData>;
}

export interface ERPPort {
  exportToErp(data: ValidatedData): Promise<boolean>;
}

// Strategy: одно правило = одна стратегия
export interface ValidationRule {
  validate(data: ValidatedData): boolean;
  getError(): string;
}
