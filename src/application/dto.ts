// Application Layer — DTO
// Отделяет контракт API от доменных сущностей

export interface UploadDocumentDto {
  userId: string;
  s3Url: string;
}

export interface ProcessTaskDto {
  taskId: string;
}

export interface ExportResultDto {
  docId: string;
  ok: boolean;
}
