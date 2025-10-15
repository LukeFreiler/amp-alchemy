import pdf from 'pdf-parse';
import mammoth from 'mammoth';

import { ValidationError } from '@/lib/errors';

export async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  // PDF files
  if (file.type === 'application/pdf') {
    const data = await pdf(buffer);
    return data.text;
  }

  // DOCX files
  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.endsWith('.docx')
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // Plain text files
  if (
    file.type === 'text/plain' ||
    file.type === 'text/markdown' ||
    file.type === 'text/csv' ||
    file.name.endsWith('.txt') ||
    file.name.endsWith('.md') ||
    file.name.endsWith('.csv')
  ) {
    return buffer.toString('utf-8');
  }

  throw new ValidationError(`Unsupported file type: ${file.type || 'unknown'}`);
}
