// Pattern: Chain of Responsibility (валидация)
// Новое правило = новый класс, use case не меняется (OCP)

import { ValidationRule } from '../domain/ports';
import { ValidatedData } from '../domain/entities';

export class InnRule implements ValidationRule {
  validate(data: ValidatedData): boolean {
    return data.inn !== null;   // Inn.create вернул null, если формат плохой
  }
  getError(): string { return 'Некорректный ИНН'; }
}

export class AmountRule implements ValidationRule {
  validate(data: ValidatedData): boolean {
    return data.amount !== null;
  }
  getError(): string { return 'Некорректная сумма'; }
}

export class DateRule implements ValidationRule {
  validate(data: ValidatedData): boolean {
    return data.docDate !== null;
  }
  getError(): string { return 'Некорректная дата'; }
}
