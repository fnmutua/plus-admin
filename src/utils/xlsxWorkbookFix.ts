import JSZip from 'jszip'

/** Escape characters that must not appear literally in XML attribute values. */
function escapeXmlAttribute(value: string): string {
  return value
    .replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * write-excel-file does not escape sheet names in workbook.xml. Names like
 * "COAST & N.EASTERN" produce invalid XML and Excel shows a recovery prompt.
 */
export async function fixXlsxWorkbookSheetNames(blob: Blob): Promise<Blob> {
  const zip = await JSZip.loadAsync(blob)
  const entry = zip.file('xl/workbook.xml')
  if (!entry) return blob

  const xml = await entry.async('string')
  const fixed = xml.replace(/<sheet name="([^"]*)"/g, (match, name: string) => {
    const escaped = escapeXmlAttribute(name)
    return escaped === name ? match : `<sheet name="${escaped}"`
  })

  if (fixed === xml) return blob

  zip.file('xl/workbook.xml', fixed)
  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}
