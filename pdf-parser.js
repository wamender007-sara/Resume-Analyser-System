/**
 * pdf-parser.js — PDF text extraction via PDF.js
 */

// PDF.js worker is loaded from CDN in index.html
// We set the workerSrc here if needed
function ensureWorker() {
  if (typeof window !== 'undefined' && window.pdfjsLib && !window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
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

  if (typeof window === 'undefined' || !window.pdfjsLib) {
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
    return extractTextFromWord(file);
  }

  throw new Error(`Unsupported file type: ${name.split('.').pop().toUpperCase()}`);
}

/**
 * Multi-tier Word Document (.docx / .doc) Extractor.
 * Tier 1: Mammoth.js browser library (if loaded)
 * Tier 2: JSZip browser library (if loaded)
 * Tier 3: Zero-dependency Native Browser ZIP + DecompressionStream ('deflate-raw')
 * Tier 4: Legacy binary Word 97-2003 (.doc) byte scanner
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractTextFromWord(file) {
  const arrayBuffer = await file.arrayBuffer();

  // Tier 1: Mammoth.js
  if (typeof window !== 'undefined' && window.mammoth && typeof window.mammoth.extractRawText === 'function') {
    try {
      const result = await window.mammoth.extractRawText({ arrayBuffer });
      if (result && result.value && result.value.trim().length >= 20) {
        return result.value.trim();
      }
    } catch (mErr) {
      console.warn('Mammoth.js extraction failed, falling back to secondary parser:', mErr);
    }
  }

  // Tier 2: JSZip
  if (typeof window !== 'undefined' && window.JSZip && typeof window.JSZip.loadAsync === 'function') {
    try {
      const zip = await window.JSZip.loadAsync(arrayBuffer);
      const docEntry = zip.file('word/document.xml');
      if (docEntry) {
        const xml = await docEntry.async('string');
        const text = parseDocxXml(xml);
        if (text && text.trim().length >= 20) {
          return text.trim();
        }
      }
    } catch (zErr) {
      console.warn('JSZip extraction failed, falling back to native parser:', zErr);
    }
  }

  // Tier 3: Native Browser ZIP + DecompressionStream
  try {
    const entry = findZipEntry(arrayBuffer, 'word/document.xml');
    if (entry) {
      if (entry.compMethod === 0) {
        const uncompressedBytes = new Uint8Array(arrayBuffer, entry.dataOffset, entry.uncompSize);
        const xml = new TextDecoder('utf-8').decode(uncompressedBytes);
        const text = parseDocxXml(xml);
        if (text && text.trim().length >= 20) return text.trim();
      } else if (entry.compMethod === 8 && typeof DecompressionStream !== 'undefined') {
        const compressedBytes = new Uint8Array(arrayBuffer, entry.dataOffset, entry.compSize);
        const xml = await decompressDeflateRaw(compressedBytes);
        const text = parseDocxXml(xml);
        if (text && text.trim().length >= 20) return text.trim();
      }
    }
  } catch (nErr) {
    console.warn('Native DOCX extraction failed:', nErr);
  }

  // Tier 4: Legacy Word (.doc) binary scanner
  try {
    const text = extractTextFromLegacyDoc(arrayBuffer);
    if (text && text.trim().length >= 20) {
      return text.trim();
    }
  } catch (dErr) {
    console.warn('Legacy DOC extraction failed:', dErr);
  }

  throw new Error('Could not extract text from Word document. Please ensure the file is not corrupted or password-protected, or save as PDF.');
}

/**
 * Scan ZIP central directory / local headers to find an uncompressed or deflated entry
 */
export function findZipEntry(buffer, targetName) {
  const view = new DataView(buffer);
  let offset = 0;
  const maxLen = buffer.byteLength - 30;
  while (offset < maxLen) {
    // 0x04034b50 is PK\x03\x04 (Local file header)
    if (view.getUint32(offset, true) === 0x04034b50) {
      const compMethod = view.getUint16(offset + 8, true);
      const compSize = view.getUint32(offset + 18, true);
      const uncompSize = view.getUint32(offset + 22, true);
      const nameLen = view.getUint16(offset + 26, true);
      const extraLen = view.getUint16(offset + 28, true);
      if (offset + 30 + nameLen <= buffer.byteLength) {
        const nameBytes = new Uint8Array(buffer, offset + 30, nameLen);
        const name = new TextDecoder('utf-8').decode(nameBytes);
        const dataOffset = offset + 30 + nameLen + extraLen;
        if (name === targetName) {
          return { compMethod, compSize, uncompSize, dataOffset };
        }
      }
      offset += 30 + nameLen + extraLen + compSize;
    } else {
      offset++;
    }
  }
  return null;
}

/**
 * Decompress raw deflate stream using browser standard DecompressionStream API
 */
export async function decompressDeflateRaw(compressedUint8Array) {
  if (typeof DecompressionStream !== 'undefined') {
    const ds = new DecompressionStream('deflate-raw');
    const writer = ds.writable.getWriter();
    writer.write(compressedUint8Array);
    writer.close();
    const decomp = await new Response(ds.readable).arrayBuffer();
    return new TextDecoder('utf-8').decode(decomp);
  }
  throw new Error('DecompressionStream not supported in this environment');
}

/**
 * Parse Word OpenXML document.xml into structural plain text
 */
export function parseDocxXml(xml) {
  if (!xml) return '';
  // Convert paragraph closures, breaks, and tabs into layout separators
  const withLineBreaks = xml
    .replace(/<\/w:p>/gi, '\n')
    .replace(/<w:br[^>]*>/gi, '\n')
    .replace(/<w:tab[^>]*>/gi, '\t');

  const paragraphs = withLineBreaks.split('\n');
  const resultLines = [];
  const regex = /<w:t(?:[\s>][^>]*>|>)([\s\S]*?)<\/w:t>/gi;

  for (const para of paragraphs) {
    const paraTokens = [];
    let match;
    while ((match = regex.exec(para)) !== null) {
      // Decode basic XML entities
      const text = match[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
      paraTokens.push(text);
    }
    const line = paraTokens.join('').trim();
    if (line) {
      resultLines.push(line);
    }
  }

  return resultLines.join('\n');
}

/**
 * Extract text from legacy binary Word 97-2003 (.doc) files
 */
export function extractTextFromLegacyDoc(buffer) {
  const bytes = new Uint8Array(buffer);
  const textChunks = [];

  // 1. Scan UTF-16LE text sequences
  let utf16Str = '';
  for (let i = 0; i < bytes.length - 1; i += 2) {
    const code = bytes[i] | (bytes[i + 1] << 8);
    if ((code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9) {
      utf16Str += String.fromCharCode(code);
    } else {
      if (utf16Str.trim().length >= 8) {
        textChunks.push(utf16Str.trim());
      }
      utf16Str = '';
    }
  }
  if (utf16Str.trim().length >= 8) {
    textChunks.push(utf16Str.trim());
  }

  // 2. Scan ASCII text sequences
  let asciiStr = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if ((b >= 32 && b <= 126) || b === 10 || b === 13 || b === 9) {
      asciiStr += String.fromCharCode(b);
    } else {
      if (asciiStr.trim().length >= 10) {
        textChunks.push(asciiStr.trim());
      }
      asciiStr = '';
    }
  }
  if (asciiStr.trim().length >= 10) {
    textChunks.push(asciiStr.trim());
  }

  const lines = [];
  const seen = new Set();
  for (const chunk of textChunks) {
    const subLines = chunk.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
    for (const line of subLines) {
      if (line.length >= 3 && !seen.has(line)) {
        seen.add(line);
        lines.push(line);
      }
    }
  }

  return lines.join('\n');
}
