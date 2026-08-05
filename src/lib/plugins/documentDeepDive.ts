import * as pdfjsLib from 'pdfjs-dist';
import { HymliPlugin, PluginContext, PluginResponse } from './types';
import { pluginRegistry } from './pluginRegistry';

// Configure pdfjs worker for client-side parsing
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export const parseDocumentContent = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str || '')
        .join(' ');
      fullText += `\n--- Page ${i} ---\n` + pageText;
    }

    return fullText;
  } catch (err: any) {
    console.error('[DocumentDeepDive] Error parsing PDF:', err);
    throw new Error(`Failed to parse PDF document: ${err?.message || 'Unknown error'}`);
  }
};

export const documentDeepDivePlugin: HymliPlugin = {
  id: 'document-deep-dive',
  name: 'Document Deep-Dive',
  category: 'productivity',
  description: 'Parse 100+ page PDF files client-side into structured context chunks for Hymli AI.',
  icon: 'FileText',
  execute: async (input: { file: File; prompt?: string }, context: PluginContext): Promise<PluginResponse> => {
    try {
      const extractedText = await parseDocumentContent(input.file);
      const pageCountMatch = extractedText.match(/--- Page \d+ ---/g);
      const pageCount = pageCountMatch ? pageCountMatch.length : 1;

      if (context.showNotice) {
        context.showNotice(`Parsed ${pageCount} pages from ${input.file.name}`);
      }

      return {
        success: true,
        data: {
          filename: input.file.name,
          pageCount,
          extractedText,
        },
        message: `Successfully analyzed ${input.file.name} (${pageCount} pages).`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Failed to process document.',
      };
    }
  },
};

// Register plugin automatically
pluginRegistry.register(documentDeepDivePlugin);
