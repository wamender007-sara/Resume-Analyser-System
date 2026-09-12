/**
 * pdf-parser.js — PDF text extraction via PDF.js
 */

// PDF.js worker is loaded from CDN in index.html
// We set the workerSrc here if needed
function ensureWorker() {
  if (window.pdfjsLib && !window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
}

/**
 * Extract all text content from a PDF File object.
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractTextFromPDF(file) {
  ensureWorker();

  if (!window.pdfjsLib) {
    throw new Error('PDF.js is not loaded. Please refresh the page.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts = [];
  const extractedUrls = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    
    // Group text items by vertical line position to preserve structural line breaks
    const lineItems = [];
    let currentLine = '';
    let lastY = null;

    for (const item of content.items) {
      const str = item.str;
      if (!str && !item.hasEOL) continue;

      const currentY = item.transform ? Math.round(item.transform[5]) : null;
      const isNewLine = (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 3) || item.hasEOL;

      if (isNewLine && currentLine.trim()) {
        lineItems.push(currentLine.trim());
        currentLine = str || '';
      } else {
        const needsSpace = currentLine.length > 0 && !currentLine.endsWith(' ') && str && !str.startsWith(' ');
        currentLine += (needsSpace ? ' ' : '') + (str || '');
      }

      if (currentY !== null) lastY = currentY;
    }
    if (currentLine.trim()) {
      lineItems.push(currentLine.trim());
    }

    const pageText = lineItems.length > 0 ? lineItems.join('\n') : content.items.map(item => item.str).join(' ');
    pageTexts.push(pageText);

    // Extract embedded link annotations (e.g. clickable LinkedIn, GitHub links)
    try {
      const annotations = await page.getAnnotations();
      if (annotations && annotations.length > 0) {
        annotations.forEach(ann => {
          const link = ann.url || ann.unsafeUrl;
          if (link && typeof link === 'string') {
            extractedUrls.push(link);
          }
        });
      }
    } catch (e) {
      // Ignore annotation extraction errors
    }
  }

  let fullText = pageTexts.join('\n\n').replace(/\s{3,}/g, '  ').trim();
  if (extractedUrls.length > 0) {
    fullText += '\n\n' + extractedUrls.join(' ');
  }
  return fullText;
}

/**
 * Extract text from a plain text or docx-like file.
 * For .txt files: direct read.
 * For .doc/.docx: attempt to read as text (basic fallback — no full docx parsing).
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractTextFromFile(file) {
  const name = file.name.toLowerCase();

  if (name.endsWith('.pdf')) {
    return extractTextFromPDF(file);
  }

  if (name.endsWith('.txt')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read text file.'));
      reader.readAsText(file, 'utf-8');
    });
  }

  if (name.endsWith('.doc') || name.endsWith('.docx')) {
    // Basic text extraction from docx (reads raw text chunks)
    // For full docx support, mammoth.js would be needed
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = extractRawTextFromDocx(e.target.result);
          resolve(text);
        } catch {
          reject(new Error('Could not extract text from DOCX. Please save as PDF or paste the text.'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read DOCX file.'));
      reader.readAsBinaryString(file);
    });
  }

  throw new Error(`Unsupported file type: ${name.split('.').pop().toUpperCase()}`);
}

/**
 * Rudimentary DOCX text extraction — reads XML text nodes from the zip.
 * Only works for simple DOCX files. For complex formatting use mammoth.js.
 */
function extractRawTextFromDocx(binaryStr) {
  // DOCX is a ZIP — find word/document.xml content
  const xmlMarker = '<w:t';
  const texts = [];
  let pos = 0;

  while (pos < binaryStr.length) {
    const start = binaryStr.indexOf(xmlMarker, pos);
    if (start === -1) break;
    const tagEnd = binaryStr.indexOf('>', start);
    if (tagEnd === -1) break;
    const closeTag = binaryStr.indexOf('</w:t>', tagEnd);
    if (closeTag === -1) break;
    const text = binaryStr.slice(tagEnd + 1, closeTag);
    if (text.trim()) texts.push(text);
    pos = closeTag + 6;
  }

  if (texts.length === 0) {
    throw new Error('No text found in DOCX.');
  }

  return texts.join(' ').replace(/\s{3,}/g, ' ').trim();
}
