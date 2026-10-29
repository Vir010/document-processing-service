// Domain Layer — Entities и Value Objects (DDD tactical)
// Ничего не знает про БД, HTTP, OCR. Только бизнес-правила.

// ============ VALUE OBJECTS ============
// VO: immutable, валидирует сам себя при создании, без identity

export class Inn {
  private constructor(public readonly value: string) {}
  static create(raw: string | null): Inn | null {
    if (!raw) return null;
    if (!/^\d{10}$|^\d{12}$/.test(raw)) return null;
    return new Inn(raw);
  }
}

export class Amount {
  private constructor(public readonly value: number) {}
  static create(raw: number | null): Amount | null {
    if (raw === null || raw < 0) return null;
    return new Amount(raw);
  }
}

// ============ TYPES ============
export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'VALIDATED' | 'ERROR';
export type TaskType       = 'OCR' | 'ML' | 'VALIDATION';
export type TaskStatus     = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';

// ============ ENTITIES ============
// Entity: имеет identity, изменяемое состояние, инварианты в методах

export class Document {
  constructor(
    public readonly docId: string,
    public readonly userId: string,
    public readonly s3Url: string,
    public status: DocumentStatus,
    public readonly uploadedAt: Date,
  ) {}
  markProcessing() { this.status = 'PROCESSING'; }
  markValidated()  { this.status = 'VALIDATED'; }
  markError()      { this.status = 'ERROR'; }
}

export class Task {
  constructor(
    public readonly taskId: string,
    public readonly docId: string,
    public readonly taskType: TaskType,
    public status: TaskStatus,
    public workerId: string | null,
  ) {}
  assign(workerId: string) {
    if (this.status !== 'PENDING')
      throw new Error('Task is not PENDING');
    this.status = 'RUNNING';
    this.workerId = workerId;
  }
  complete() { this.status = 'DONE'; }
  fail()     { this.status = 'FAILED'; }
}

export class ValidatedData {
  constructor(
    public readonly dataId: string,
    public readonly docId: string,
    public inn: Inn | null,
    public amount: Amount | null,
    public docDate: Date | null,
    public isSentToErp: boolean,
  ) {}
  markSent() { this.isSentToErp = true; }
}
