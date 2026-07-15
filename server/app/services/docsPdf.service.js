const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const {
  PDFDocument,
  StandardFonts,
  rgb,
  PDFName,
  PDFString,
  PDFNumber
} = require('pdf-lib');

const PAGE = { width: 595.28, height: 841.89, margin: 46, footer: 34 };
const LOGO_PATH = path.join(__dirname, '../../../src/assets/imgs/1logo.png');
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

// Match admin app primary theme (src/config/app.ts elColorPrimary)
const BRAND_HEX = '#684035';
const BRAND_DARK_HEX = '#523028';
const BRAND_LIGHT_HEX = '#f4ebe6';
const BRAND_BORDER_HEX = '#d4c4bb';

function hexToRgb(hex) {
  const normalized = String(hex || '').replace('#', '');
  if (normalized.length !== 6) return rgb(0, 0, 0);
  return rgb(
    parseInt(normalized.slice(0, 2), 16) / 255,
    parseInt(normalized.slice(2, 4), 16) / 255,
    parseInt(normalized.slice(4, 6), 16) / 255
  );
}

const BRAND = hexToRgb(BRAND_HEX);
const BRAND_DARK = hexToRgb(BRAND_DARK_HEX);
const BRAND_LIGHT = hexToRgb(BRAND_LIGHT_HEX);
const BRAND_BORDER = hexToRgb(BRAND_BORDER_HEX);
const RULE = hexToRgb('#e8ded8');
const HEADER_FILL = hexToRgb('#f0e6e0');
const MUTED = rgb(0.55, 0.58, 0.63);
const BODY = rgb(0.22, 0.25, 0.32);
const HEADING = rgb(0.07, 0.09, 0.14);

function decodeEntities(value) {
  const named = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    ndash: '-', mdash: '-', hellip: '...', laquo: '"', raquo: '"'
  };
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === '#') {
      const hex = entity[1].toLowerCase() === 'x';
      const code = parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return named[entity.toLowerCase()] ?? match;
  });
}

function pdfSafeText(value) {
  return decodeEntities(String(value || ''))
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u203a/g, '>')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function extractCellText($, cell) {
  const $cell = $(cell).clone();
  $cell.find('br').replaceWith('\n');
  return pdfSafeText($cell.text());
}

function normalizeTableRows(rows) {
  const maxColumns = Math.max(...rows.map((row) => row.cells.length), 0);
  if (!maxColumns) return [];
  return rows.map((row) => ({
    ...row,
    cells: [
      ...row.cells,
      ...Array(Math.max(0, maxColumns - row.cells.length)).fill('')
    ]
  }));
}

function getTableColumnWidths(columnCount, totalWidth) {
  switch (columnCount) {
    case 2:
      return [totalWidth * 0.28, totalWidth * 0.72];
    case 3:
      return [totalWidth * 0.22, totalWidth * 0.53, totalWidth * 0.25];
    case 4:
      return [totalWidth * 0.24, totalWidth * 0.16, totalWidth * 0.12, totalWidth * 0.48];
    default:
      return Array.from({ length: columnCount }, () => totalWidth / columnCount);
  }
}

function htmlToBlocks(html, pageNumber = '') {
  const cleaned = String(html || '')
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n');
  const $ = cheerio.load(`<div id="root">${cleaned}</div>`, { decodeEntities: true });
  const blocks = [];
  let h2Count = 0;
  let h3Count = 0;
  let olCounter = 0;

  const pushHeading = (level, title) => {
    const safe = pdfSafeText(title);
    if (!safe) return;
    if (level === 2) {
      h2Count += 1;
      h3Count = 0;
      olCounter = 0;
      const prefix = pageNumber ? `${pageNumber}.${h2Count}  ` : '';
      blocks.push({ type: 'h2', text: `${prefix}${safe}` });
      return;
    }
    h3Count += 1;
    olCounter = 0;
    const num = h2Count > 0
      ? `${pageNumber}.${h2Count}.${h3Count}`
      : `${pageNumber}.${h3Count}`;
    const prefix = pageNumber ? `${num}  ` : '';
    blocks.push({ type: 'h3', text: `${prefix}${safe}` });
  };

  const pushLi = (text, listType) => {
    const safe = pdfSafeText(text);
    if (!safe) return;
    if (listType === 'ol') {
      olCounter += 1;
      blocks.push({ type: 'li', text: `${olCounter}. ${safe}` });
    } else {
      blocks.push({ type: 'li', text: `- ${safe}` });
    }
  };

  const walk = (el) => {
    const tag = el.tagName?.toLowerCase?.() || el.name;
    if (!tag) return;
    const $el = $(el);

    if (tag === 'h2') return pushHeading(2, $el.text());
    if (tag === 'h3') return pushHeading(3, $el.text());
    if (tag === 'p') {
      const text = pdfSafeText($el.text());
      if (text) blocks.push({ type: 'p', text });
      return;
    }
    if (tag === 'blockquote') {
      const text = pdfSafeText($el.text());
      if (text) blocks.push({ type: 'blockquote', text });
      return;
    }
    if (tag === 'ul') {
      $el.children('li').each((_, li) => pushLi($(li).text(), 'ul'));
      return;
    }
    if (tag === 'ol') {
      olCounter = 0;
      $el.children('li').each((_, li) => pushLi($(li).text(), 'ol'));
      return;
    }
    if (tag === 'table') {
      const rows = [];
      $el.find('tr').each((_, tr) => {
        const cells = $(tr).find('th,td').map((__, cell) => extractCellText($, cell)).get();
        if (cells.some(Boolean)) {
          rows.push({
            cells,
            isHeader: $(tr).closest('thead').length > 0
              || ($(tr).find('th').length > 0 && rows.every((row) => !row.isHeader))
          });
        }
      });
      const normalized = normalizeTableRows(rows);
      if (normalized.length) blocks.push({ type: 'table', rows: normalized });
      return;
    }
    if (tag === 'img') {
      const src = $el.attr('src');
      if (src) blocks.push({ type: 'image', src: decodeEntities(src), alt: pdfSafeText($el.attr('alt')) });
      return;
    }
    $el.contents().each((_, child) => {
      if (child.type === 'tag') walk(child);
    });
  };

  $('#root').contents().each((_, child) => {
    if (child.type === 'tag') walk(child);
  });
  return blocks;
}

function wrapText(text, font, size, maxWidth) {
  const lines = [];
  for (const paragraph of String(text).split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !line) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function parseDataImage(src) {
  const match = String(src || '').match(/^data:(image\/[a-z0-9.+-]+);base64,([\s\S]+)$/i);
  if (!match) return null;
  const bytes = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) return null;
  return { bytes, contentType: match[1].toLowerCase() };
}

async function fetchHttpImage(src, baseUrl) {
  if (!src || src.startsWith('data:')) return null;
  let url;
  try {
    url = new URL(src, baseUrl);
    const allowed = new URL(baseUrl);
    if (url.origin !== allowed.origin) return null;
  } catch {
    return null;
  }

  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) return null;
  const length = Number(response.headers.get('content-length') || 0);
  if (length > MAX_IMAGE_BYTES) return null;
  const bytes = Buffer.from(await response.arrayBuffer());
  return bytes.length && bytes.length <= MAX_IMAGE_BYTES
    ? { bytes, contentType: (response.headers.get('content-type') || '').toLowerCase() }
    : null;
}

async function resolveImage(src, baseUrl, cache) {
  if (!src) return null;
  if (cache.has(src)) return cache.get(src);

  let resolved = parseDataImage(src);
  if (!resolved) {
    try {
      resolved = await fetchHttpImage(src, baseUrl);
    } catch {
      resolved = null;
    }
  }

  cache.set(src, resolved);
  return resolved;
}

async function embedImage(doc, imageData) {
  const type = imageData.contentType || '';
  if (type.includes('jpeg') || type.includes('jpg')) {
    return doc.embedJpg(imageData.bytes);
  }
  if (type.includes('png')) {
    return doc.embedPng(imageData.bytes);
  }
  if (imageData.bytes[0] === 0xff && imageData.bytes[1] === 0xd8) {
    return doc.embedJpg(imageData.bytes);
  }
  return doc.embedPng(imageData.bytes);
}

function loadLogoBytes() {
  try {
    if (fs.existsSync(LOGO_PATH)) return fs.readFileSync(LOGO_PATH);
  } catch {
    // Logo is optional.
  }
  return null;
}

function groupSectionsByChapter(sections) {
  const chapters = [];
  const indexByGroup = new Map();

  for (const section of sections) {
    const key = section.groupId || section.groupLabel || 'docs';
    if (!indexByGroup.has(key)) {
      indexByGroup.set(key, chapters.length);
      chapters.push({
        id: key,
        label: section.groupLabel || 'Documentation',
        sections: []
      });
    }
    chapters[indexByGroup.get(key)].sections.push(section);
  }
  return chapters;
}

function makeOutlineDest(context, page) {
  return context.obj([
    page.ref,
    PDFName.of('FitH'),
    PDFNumber.of(page.getHeight() - PAGE.margin)
  ]);
}

function linkOutlineSiblings(context, refs) {
  for (let i = 0; i < refs.length; i += 1) {
    const dict = context.lookup(refs[i]);
    if (i > 0) dict.set(PDFName.of('Prev'), refs[i - 1]);
    if (i < refs.length - 1) dict.set(PDFName.of('Next'), refs[i + 1]);
  }
}

function buildOutlineItems(context, pages, nodes, parentRef) {
  const refs = [];
  for (const node of nodes) {
    const page = pages[node.pageIndex];
    if (!page) continue;

    const item = context.obj({
      Title: PDFString.of(pdfSafeText(node.title)),
      Parent: parentRef,
      Dest: makeOutlineDest(context, page)
    });
    const itemRef = context.register(item);
    refs.push(itemRef);

    if (node.children?.length) {
      const childRefs = buildOutlineItems(context, pages, node.children, itemRef);
      if (childRefs.length) {
        linkOutlineSiblings(context, childRefs);
        item.set(PDFName.of('First'), childRefs[0]);
        item.set(PDFName.of('Last'), childRefs[childRefs.length - 1]);
        item.set(PDFName.of('Count'), PDFNumber.of(-childRefs.length));
      }
    }
  }
  linkOutlineSiblings(context, refs);
  return refs;
}

function attachOutline(doc, outlineRoots) {
  if (!outlineRoots.length) return;

  const context = doc.context;
  const pages = doc.getPages();
  const outlinesDict = context.obj({ Type: PDFName.of('Outlines') });
  const outlinesRef = context.register(outlinesDict);

  const topRefs = buildOutlineItems(context, pages, outlineRoots, outlinesRef);
  if (!topRefs.length) return;

  outlinesDict.set(PDFName.of('First'), topRefs[0]);
  outlinesDict.set(PDFName.of('Last'), topRefs[topRefs.length - 1]);
  outlinesDict.set(PDFName.of('Count'), PDFNumber.of(topRefs.length));
  doc.catalog.set(PDFName.of('Outlines'), outlinesRef);
}

function createRenderer(doc, fonts, assetBaseUrl) {
  const imageCache = new Map();
  const pageMeta = [];
  const outlineRoots = [];
  let page = null;
  let y = 0;
  let pageIndex = -1;

  const bottomLimit = () => PAGE.margin + PAGE.footer;

  const addPage = (meta = {}) => {
    page = doc.addPage([PAGE.width, PAGE.height]);
    pageIndex += 1;
    y = PAGE.height - PAGE.margin;
    pageMeta.push({ ...meta, pageIndex });
    return pageIndex;
  };

  const ensureSpace = (height) => {
    if (!page || y - height < bottomLimit()) addPage();
  };

  const drawLine = (x1, y1, x2, y2, color, thickness = 1) => {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });
  };

  const drawText = (text, options = {}) => {
    const font = options.bold ? fonts.bold : fonts.regular;
    const size = options.size || 10;
    const lineHeight = options.lineHeight || size * 1.45;
    const indent = options.indent || 0;
    const lines = wrapText(pdfSafeText(text), font, size, PAGE.width - PAGE.margin * 2 - indent);
    for (const line of lines) {
      ensureSpace(lineHeight);
      const x = options.center
        ? (PAGE.width - font.widthOfTextAtSize(line, size)) / 2
        : PAGE.margin + indent;
      page.drawText(line, {
        x,
        y: y - size,
        size,
        font,
        color: options.color || BODY
      });
      y -= lineHeight;
    }
    y -= options.after ?? 4;
  };

  const drawSectionRule = () => {
    ensureSpace(16);
    drawLine(PAGE.margin, y - 4, PAGE.width - PAGE.margin, y - 4, RULE, 1);
    y -= 14;
  };

  const drawTable = (rows) => {
    if (!rows?.length) return;

    const width = PAGE.width - PAGE.margin * 2;
    const maxColumns = Math.max(...rows.map((row) => row.cells.length));
    const colWidths = getTableColumnWidths(maxColumns, width);
    const paddingX = 6;
    const paddingY = 5;
    const size = 8;
    const lineHeight = 10.5;
    const borderColor = BRAND_BORDER;
    const headerFill = HEADER_FILL;
    const headerRows = rows.filter((row) => row.isHeader);

    const measureRow = (row) => {
      const cellLines = colWidths.map((colWidth, i) => {
        const font = row.isHeader || (i === 0 && !row.isHeader)
          ? fonts.bold
          : fonts.regular;
        return wrapText(row.cells[i] || '', font, size, colWidth - paddingX * 2);
      });
      return Math.max(
        20,
        ...cellLines.map((lines) => lines.length * lineHeight + paddingY * 2)
      );
    };

    const drawRow = (row) => {
      const cellLines = colWidths.map((colWidth, i) => {
        const font = row.isHeader || (i === 0 && !row.isHeader)
          ? fonts.bold
          : fonts.regular;
        return wrapText(row.cells[i] || '', font, size, colWidth - paddingX * 2);
      });
      const rowHeight = Math.max(
        20,
        ...cellLines.map((lines) => lines.length * lineHeight + paddingY * 2)
      );

      const topY = y;
      let x = PAGE.margin;

      for (let i = 0; i < colWidths.length; i += 1) {
        const colWidth = colWidths[i];
        const font = row.isHeader || (i === 0 && !row.isHeader)
          ? fonts.bold
          : fonts.regular;
        page.drawRectangle({
          x,
          y: topY - rowHeight,
          width: colWidth,
          height: rowHeight,
          color: row.isHeader ? headerFill : undefined,
          borderColor,
          borderWidth: 0.75
        });

        let textY = topY - paddingY - size;
        for (const line of cellLines[i]) {
          page.drawText(line, {
            x: x + paddingX,
            y: textY,
            size,
            font,
            color: row.isHeader ? HEADING : BODY
          });
          textY -= lineHeight;
        }
        x += colWidth;
      }
      y -= rowHeight;
    };

    y -= 4;
    for (const row of rows) {
      const rowHeight = measureRow(row);
      if (y - rowHeight < bottomLimit()) {
        addPage();
        if (headerRows.length && !row.isHeader) {
          for (const headerRow of headerRows) {
            const headerHeight = measureRow(headerRow);
            if (y - headerHeight < bottomLimit()) addPage();
            drawRow(headerRow);
          }
        }
      }
      drawRow(row);
    }
    y -= 10;
  };

  const renderBlocks = async (content, pageNumber = '') => {
    for (const block of htmlToBlocks(content, pageNumber)) {
      if (block.type === 'image') {
        try {
          const imageData = await resolveImage(block.src, assetBaseUrl, imageCache);
          if (!imageData) {
            if (block.alt) {
              drawText(`[Screenshot: ${block.alt}]`, { size: 8, color: MUTED, after: 8 });
            }
            continue;
          }
          const image = await embedImage(doc, imageData);
          const maxWidth = PAGE.width - PAGE.margin * 2;
          const maxHeight = 340;
          const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
          const width = image.width * scale;
          const height = image.height * scale;
          ensureSpace(height + 18);
          const imageX = PAGE.margin;
          const imageY = y - height;
          page.drawRectangle({
            x: imageX,
            y: imageY,
            width,
            height,
            borderColor: BRAND_BORDER,
            borderWidth: 0.75
          });
          page.drawImage(image, { x: imageX, y: imageY, width, height });
          y -= height + 12;
        } catch {
          if (block.alt) {
            drawText(`[Screenshot unavailable: ${block.alt}]`, { size: 8, color: MUTED, after: 8 });
          }
        }
        continue;
      }

      if (block.type === 'h2') {
        ensureSpace(30);
        drawText(block.text, { bold: true, size: 14, lineHeight: 19, color: HEADING, after: 7 });
      } else if (block.type === 'h3') {
        ensureSpace(25);
        drawText(block.text, { bold: true, size: 11, lineHeight: 16, color: HEADING, after: 5 });
      } else if (block.type === 'table') {
        drawTable(block.rows);
      } else if (block.type === 'blockquote') {
        drawText(block.text, { size: 9, indent: 12, after: 8 });
      } else {
        drawText(block.text, { size: 10, indent: block.type === 'li' ? 8 : 0 });
      }
    }
  };

  const drawCover = async ({ logoImage }) => {
    const idx = addPage({ kind: 'cover' });
    outlineRoots.push({ title: 'KeSMIS Documentation', pageIndex: idx, children: [] });

    const centerX = PAGE.width / 2;
    const pageBg = rgb(0.99, 0.985, 0.98);
    const white = rgb(1, 1, 1);

    page.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE.width,
      height: PAGE.height,
      color: pageBg
    });
    page.drawRectangle({
      x: 0,
      y: 0,
      width: 10,
      height: PAGE.height,
      color: BRAND
    });
    page.drawRectangle({
      x: 0,
      y: PAGE.height - 220,
      width: PAGE.width,
      height: 220,
      color: BRAND
    });
    page.drawRectangle({
      x: 0,
      y: PAGE.height - 226,
      width: PAGE.width,
      height: 6,
      color: BRAND_DARK
    });
    page.drawRectangle({
      x: PAGE.margin,
      y: PAGE.height - 248,
      width: PAGE.width - PAGE.margin * 2,
      height: 1,
      color: rgb(1, 1, 1)
    });

    const drawCentered = (text, { y, size = 11, bold = false, color = HEADING, opacity = 1 }) => {
      const font = bold ? fonts.bold : fonts.regular;
      const safe = pdfSafeText(text);
      const textWidth = font.widthOfTextAtSize(safe, size);
      page.drawText(safe, {
        x: centerX - textWidth / 2,
        y,
        size,
        font,
        color,
        opacity
      });
    };

    if (logoImage) {
      const logoMaxW = 96;
      const scale = Math.min(logoMaxW / logoImage.width, 1);
      const w = logoImage.width * scale;
      const h = logoImage.height * scale;
      const boxW = w + 28;
      const boxH = h + 28;
      const boxX = centerX - boxW / 2;
      const boxY = PAGE.height - 188 - boxH / 2;
      page.drawRectangle({
        x: boxX,
        y: boxY,
        width: boxW,
        height: boxH,
        color: white,
        borderColor: BRAND_BORDER,
        borderWidth: 1
      });
      page.drawImage(logoImage, {
        x: boxX + 14,
        y: boxY + 14,
        width: w,
        height: h
      });
    }

    let contentY = PAGE.height - 300;
    drawCentered('USER GUIDE', { y: contentY, size: 10, color: BRAND });
    contentY -= 38;
    drawCentered('KeSMIS', { y: contentY, size: 40, bold: true, color: HEADING });
    contentY -= 34;
    drawCentered('Documentation', { y: contentY, size: 22, bold: true, color: BRAND_DARK });
    contentY -= 28;
    drawCentered('Kenya Slum Management Information System', {
      y: contentY,
      size: 12,
      color: MUTED
    });

    contentY -= 34;
    page.drawLine({
      start: { x: centerX - 42, y: contentY },
      end: { x: centerX + 42, y: contentY },
      thickness: 2.5,
      color: BRAND
    });
    contentY -= 28;

    page.drawRectangle({
      x: PAGE.margin + 24,
      y: contentY - 72,
      width: PAGE.width - (PAGE.margin + 24) * 2,
      height: 72,
      color: BRAND_LIGHT,
      borderColor: BRAND_BORDER,
      borderWidth: 0.75
    });
    drawCentered('Kenya Informal Settlements Improvement Project (KISIP)', {
      y: contentY - 18,
      size: 10,
      bold: true,
      color: BRAND_DARK
    });
    drawCentered('National digital platform for slums and informal settlements', {
      y: contentY - 36,
      size: 9.5,
      color: MUTED
    });
    drawCentered('Settlement data · Dashboards · GRM · M&E · Climate assessment · Field mapping', {
      y: contentY - 54,
      size: 8.5,
      color: MUTED
    });

    const monthYear = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
    page.drawLine({
      start: { x: PAGE.margin + 40, y: 68 },
      end: { x: PAGE.width - PAGE.margin - 40, y: 68 },
      thickness: 0.75,
      color: rgb(0.86, 0.88, 0.92)
    });
    drawCentered(monthYear, { y: 44, size: 11, color: MUTED });
    drawCentered('kesmis.go.ke', { y: 28, size: 8.5, color: rgb(0.68, 0.71, 0.76) });

    y = PAGE.margin;
  };

  const drawChapterPage = (chapterNum, chapter) => {
    const idx = addPage({ kind: 'chapter', chapter: chapter.label });
    const chapterNode = {
      title: `Chapter ${chapterNum}: ${chapter.label}`,
      pageIndex: idx,
      children: []
    };
    outlineRoots.push(chapterNode);

    page.drawRectangle({
      x: PAGE.margin,
      y: PAGE.height - PAGE.margin - 8,
      width: 56,
      height: 4,
      color: BRAND
    });

    y = PAGE.height - PAGE.margin - 36;
    drawText(`CHAPTER ${chapterNum}`, { size: 10, color: BRAND, after: 8 });
    drawText(chapter.label, { bold: true, size: 26, lineHeight: 32, color: HEADING, after: 0 });
    y -= 30;

    return chapterNode;
  };

  const drawSectionHeader = ({
    chapterNode,
    pageNumber,
    section,
    subgroupHeader,
    subgroupNodeById,
    isNewBlock
  }) => {
    let parentNode = chapterNode;

    if (isNewBlock) {
      ensureSpace(34);
      y -= 14;
    }

    if (subgroupHeader) {
      const subKey = section.subgroupId || section.subgroupLabel;
      if (!subgroupNodeById.has(subKey)) {
        subgroupNodeById.set(subKey, {
          title: `${subgroupHeader.number}  ${subgroupHeader.label}`,
          pageIndex: pageIndex,
          children: []
        });
        chapterNode.children.push(subgroupNodeById.get(subKey));
        ensureSpace(30);
        drawText(`${subgroupHeader.number}  ${subgroupHeader.label}`, {
          bold: true,
          size: 14,
          lineHeight: 18,
          color: BRAND,
          after: 8
        });
      }
      parentNode = subgroupNodeById.get(subKey);
    }

    ensureSpace(32);
    drawText(`${pageNumber}  ${section.label}`, {
      bold: true,
      size: pageNumber.split('.').length === 3 ? 15 : 17,
      lineHeight: pageNumber.split('.').length === 3 ? 20 : 22,
      color: HEADING,
      after: 6
    });
    drawSectionRule();
    y -= 14;

    parentNode.children.push({
      title: `${pageNumber} ${section.label}`,
      pageIndex: pageIndex
    });
  };

  const addFooters = () => {
    const pages = doc.getPages();
    const total = pages.length;
    pages.forEach((pg, i) => {
      const meta = pageMeta[i];
      if (meta?.kind === 'cover') return;

      const label = meta?.footer || meta?.chapter || 'KeSMIS Documentation';
      const footerY = 22;
      drawLine(PAGE.margin, 38, PAGE.width - PAGE.margin, 38, RULE, 0.75);

      pg.drawText(pdfSafeText(label), {
        x: PAGE.margin,
        y: footerY,
        size: 8,
        font: fonts.regular,
        color: MUTED
      });
      pg.drawText(`Page ${i + 1} of ${total}`, {
        x: PAGE.width / 2 - 28,
        y: footerY,
        size: 8,
        font: fonts.regular,
        color: MUTED
      });
      pg.drawText('KeSMIS Docs', {
        x: PAGE.width - PAGE.margin - 52,
        y: footerY,
        size: 8,
        font: fonts.regular,
        color: MUTED
      });
    });
  };

  return {
    addPage,
    drawCover,
    drawChapterPage,
    drawSectionHeader,
    renderBlocks,
    addFooters,
    outlineRoots,
    setPageFooter(meta) {
      if (pageMeta[pageIndex]) {
        pageMeta[pageIndex].footer = meta;
      }
    }
  };
}

async function generateDocsPdf({ sections, scope, assetBaseUrl }) {
  const doc = await PDFDocument.create();
  doc.setTitle('KeSMIS Documentation');
  doc.setAuthor('KeSMIS');
  doc.setSubject('Role-gated user documentation');
  doc.setCreator('KeSMIS Docs PDF Export');

  const fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold)
  };

  const logoBytes = loadLogoBytes();
  const logoImage = logoBytes ? await doc.embedPng(logoBytes) : null;

  const renderer = createRenderer(doc, fonts, assetBaseUrl);
  const chapters = groupSectionsByChapter(sections);

  if (scope === 'all') {
    await renderer.drawCover({ logoImage });
  }

  let chapterNum = 0;
  for (const chapter of chapters) {
    chapterNum += 1;
    let chapterNode = null;
    let level2Num = 0;
    let blockIndex = 0;
    const subgroupNodeById = new Map();
    const subgroupCounters = new Map();

    if (scope === 'all' && chapters.length > 1) {
      chapterNode = renderer.drawChapterPage(chapterNum, chapter);
    } else if (scope === 'all') {
      chapterNode = {
        title: `Chapter ${chapterNum}: ${chapter.label}`,
        pageIndex: -1,
        children: []
      };
      renderer.outlineRoots[0].children.push(chapterNode);
    } else {
      chapterNode = { title: chapter.label, pageIndex: doc.getPageCount(), children: [] };
      renderer.outlineRoots.push(chapterNode);
      renderer.addPage({ kind: 'content', chapter: chapter.label });
    }

    for (const section of chapter.sections) {
      blockIndex += 1;
      let pageNumber;
      let subgroupHeader = null;

      if (section.subgroupLabel) {
        const subKey = section.subgroupId || section.subgroupLabel;
        if (!subgroupCounters.has(subKey)) {
          level2Num += 1;
          subgroupCounters.set(subKey, { level2Num, subsectionNum: 0 });
        }
        const sub = subgroupCounters.get(subKey);
        sub.subsectionNum += 1;
        pageNumber = `${chapterNum}.${sub.level2Num}.${sub.subsectionNum}`;
        subgroupHeader = {
          number: `${chapterNum}.${sub.level2Num}`,
          label: section.subgroupLabel
        };
      } else {
        level2Num += 1;
        pageNumber = `${chapterNum}.${level2Num}`;
      }

      if (scope === 'all' && chapterNode.pageIndex === -1) {
        renderer.addPage({ kind: 'content', chapter: chapter.label });
        chapterNode.pageIndex = doc.getPageCount() - 1;
      }

      renderer.drawSectionHeader({
        chapterNode,
        pageNumber,
        section,
        subgroupHeader,
        subgroupNodeById,
        isNewBlock: blockIndex > 1
      });
      renderer.setPageFooter(
        [chapter.label, section.subgroupLabel, section.label].filter(Boolean).join(' › ')
      );
      await renderer.renderBlocks(section.content, pageNumber);
    }
  }

  renderer.addFooters();
  attachOutline(doc, renderer.outlineRoots);

  return Buffer.from(await doc.save());
}

module.exports = { generateDocsPdf };
