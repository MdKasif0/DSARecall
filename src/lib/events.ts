/**
 * Dispatch event to open edit modal from any child page.
 */
export function openEditModal(id: string) {
  window.dispatchEvent(new CustomEvent('dsarecall:edit', { detail: id }));
}

/**
 * Dispatch event to open the add modal from any child page.
 */
export function openAddModal() {
  window.dispatchEvent(new CustomEvent('dsarecall:add'));
}
