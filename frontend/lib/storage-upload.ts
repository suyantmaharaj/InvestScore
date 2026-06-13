import {
  ref, uploadBytesResumable, getDownloadURL, UploadTaskSnapshot,
} from 'firebase/storage';
import { storage } from '@/lib/firebase';

export interface UploadResult {
  filename:     string;
  originalName: string;
  fileSize:     number;
  fileType:     string;
  storagePath:  string;
  downloadUrl:  string;
}

export type UploadProgressCallback = (pct: number) => void;

export async function uploadCompanyDocument(
  companyId:   string,
  file:        File,
  folder:      'documents' | 'bbbee',
  onProgress?: UploadProgressCallback,
): Promise<UploadResult> {

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File exceeds 10MB limit.');
  }

  const ext      = file.name.split('.').pop() || 'bin';
  const ts       = Date.now();
  const rand     = Math.random().toString(36).slice(2, 7);
  const filename = `${ts}_${rand}.${ext}`;
  const path     = `companies/${companyId}/${folder}/${filename}`;

  const storageRef = ref(storage, path);

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: { originalName: file.name, companyId },
    });

    task.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress?.(pct);
      },
      (error) => reject(error),
      async () => {
        const downloadUrl = await getDownloadURL(task.snapshot.ref);
        resolve({
          filename,
          originalName: file.name,
          fileSize:     file.size,
          fileType:     file.type,
          storagePath:  path,
          downloadUrl,
        });
      },
    );
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024)          return `${bytes} B`;
  if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf')                                   return '📄';
  if (['doc', 'docx'].includes(ext || ''))             return '📝';
  if (['xls', 'xlsx'].includes(ext || ''))             return '📊';
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return '🖼️';
  if (ext === 'pptx')                                  return '📑';
  return '📎';
}
