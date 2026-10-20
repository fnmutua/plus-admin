import { ElMessage } from 'element-plus'

// Stop empty (0-byte) files at the moment they are picked or dropped, on every
// upload in the app, before any upload component sees them.
//
// They come from cloud-storage placeholders: Dropbox, OneDrive and iCloud
// "online-only" files show in the file picker but have no contents on disk,
// and the browser sends them as 0 bytes. The server refuses them too
// (server/app/utils/rejectEmptyUploads.js); this catches them before the user
// has filled in a form around a file that will never upload.
//
// One capturing listener on the document runs before the listeners of any
// <input type="file"> or drop zone, Element Plus uploads included, so no
// upload screen needs to know about it.

const emptyFileNames = (files: File[]) => files.filter((file) => file.size === 0).map((file) => file.name)

/** Dropped files, leaving out folders: a dropped folder can report size 0. */
function droppedFiles(dataTransfer: DataTransfer | null): File[] {
  if (!dataTransfer) return []
  const items = Array.from(dataTransfer.items || [])
  if (!items.length) return Array.from(dataTransfer.files || [])
  return items
    .filter((item) => item.kind === 'file' && !(item as any).webkitGetAsEntry?.()?.isDirectory)
    .map((item) => item.getAsFile())
    .filter((file): file is File => Boolean(file))
}

function warn(names: string[]) {
  const which = names.length === 1 ? `“${names[0]}” is empty` : `${names.length} files are empty: ${names.join(', ')}`
  ElMessage({
    type: 'error',
    showClose: true,
    duration: 10000,
    message: `${which} (0 bytes), so nothing was added. If it is in Dropbox, OneDrive or iCloud, make it available offline, then choose it again.`
  })
}

function onFilePicked(event: Event) {
  const input = event.target
  if (!(input instanceof HTMLInputElement) || input.type !== 'file') return
  const names = emptyFileNames(Array.from(input.files || []))
  if (!names.length) return
  event.stopImmediatePropagation()
  // Clear the selection so the same file can be chosen again once it has
  // been downloaded.
  input.value = ''
  warn(names)
}

function onDrop(event: DragEvent) {
  const names = emptyFileNames(droppedFiles(event.dataTransfer))
  if (!names.length) return
  event.preventDefault()
  event.stopImmediatePropagation()
  warn(names)
}

export function installEmptyFileGuard() {
  if (typeof document === 'undefined') return
  const flag = '__emptyFileGuardInstalled'
  if ((window as any)[flag]) return
  ;(window as any)[flag] = true

  // "input" fires before "change" on file inputs; guard both.
  document.addEventListener('input', onFilePicked, true)
  document.addEventListener('change', onFilePicked, true)
  document.addEventListener('drop', onDrop, true)
}
