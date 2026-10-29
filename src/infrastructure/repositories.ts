// Infrastructure — In-Memory реализации репозиториев
// В проде заменяются на PostgresRepository/MongoRepository
// без правки use cases (DIP)

import { Document, Task, ValidatedData } from '../domain/entities';
import {
  DocumentRepository, TaskRepository, ValidatedDataRepository,
} from '../domain/repositories';

export class InMemoryDocumentRepository implements DocumentRepository {
  private store = new Map<string, Document>();
  async save(doc: Document) { this.store.set(doc.docId, doc); }
  async findById(id: string) { return this.store.get(id) ?? null; }
}

export class InMemoryTaskRepository implements TaskRepository {
  private store = new Map<string, Task>();
  async save(t: Task) { this.store.set(t.taskId, t); }
  async findById(id: string) { return this.store.get(id) ?? null; }
  async findPending(): Promise<Task | null> {
    for (const t of this.store.values())
      if (t.status === 'PENDING') return t;
    return null;
  }
}

export class InMemoryValidatedDataRepository implements ValidatedDataRepository {
  private store = new Map<string, ValidatedData>();
  async save(d: ValidatedData) { this.store.set(d.docId, d); }
  async findByDocId(docId: string) { return this.store.get(docId) ?? null; }
}
