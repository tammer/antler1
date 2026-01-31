/**
 * Adds target="_blank" and rel="noopener noreferrer" to <a> tags in an HTML string
 * that don't already have a target attribute. Use when rendering HTML so links
 * open in a new tab safely.
 */
export function htmlWithBlankLinks(html) {
  if (!html || typeof html !== 'string') return html
  return html.replace(/<a\s+(?![^>]*\btarget\s*=)/gi, '<a target="_blank" rel="noopener noreferrer" ')
}
