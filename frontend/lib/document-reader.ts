export async function readFileAsText(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (['txt', 'csv', 'md'].includes(ext || '')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = e => resolve((e.target?.result as string) || '');
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const base64 = (e.target?.result as string).split(',')[1];
        resolve(`[IMAGE:${file.type}:${base64}]`);
      };
      reader.onerror = () => reject(new Error('Failed to read image'));
      reader.readAsDataURL(file);
    });
  }

  if (ext === 'pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib    = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const pdf    = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const texts: string[] = [];
      for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
        const page    = await pdf.getPage(i);
        const content = await page.getTextContent();
        texts.push(content.items.map((item: any) => item.str).join(' '));
      }
      return texts.join('\n\n');
    } catch (err) {
      console.error('PDF read error:', err);
      return `[Could not extract text from PDF: ${file.name}]`;
    }
  }

  if (ext === 'docx') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const JSZip       = (await import('jszip')).default;
      const zip         = await JSZip.loadAsync(arrayBuffer);
      const xml         = await zip.file('word/document.xml')?.async('text');
      if (!xml) return `[Could not read DOCX: ${file.name}]`;
      return xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    } catch {
      return `[Could not extract text from DOCX: ${file.name}]`;
    }
  }

  if (['xlsx', 'xls'].includes(ext || '')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const XLSX        = await import('xlsx');
      const workbook    = XLSX.read(arrayBuffer, { type: 'array' });
      const texts: string[] = [];
      workbook.SheetNames.slice(0, 5).forEach((name: string) => {
        const sheet = workbook.Sheets[name];
        texts.push(`[Sheet: ${name}]\n${XLSX.utils.sheet_to_csv(sheet)}`);
      });
      return texts.join('\n\n');
    } catch {
      return `[Could not extract text from Excel: ${file.name}]`;
    }
  }

  return `[Unsupported file type: ${file.name}]`;
}

export function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf')                                             return '📄';
  if (['doc', 'docx'].includes(ext || ''))                      return '📝';
  if (['xls', 'xlsx'].includes(ext || ''))                      return '📊';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return '🖼️';
  if (ext === 'csv')                                             return '📋';
  return '📎';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024)            return `${bytes} B`;
  if (bytes < 1024 * 1024)     return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
