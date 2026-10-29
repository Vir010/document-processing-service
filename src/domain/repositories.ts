// Domain Layer — Repository interfaces (DIP)
// Use cases зависят от этих интерфейсов, а не от Postgres/Mongo

import { Document, Task, ValidatedData } from './entities';

export interface DocumentRepository {
  save(doc: Document): Promise<void>;
  findById(docId: string): Promise<Document | null>;
}

export interface TaskRepository {
  save(task: Task): Promise<void>;
  findById(taskId: string): Promise<Task | null>;
  findPending(): Promise<Task | null>;
}

export interface ValidatedDataRepository {
  save(data: ValidatedData): Promise<void>;
  findByDocId(docId: string): Promise<ValidatedData | null>;
}
