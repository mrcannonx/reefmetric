// Validate the actual number controls before any calculator reads them. Empty
// strings are not zero; HTML min/max alone does not stop an input event handler.
export function validateCalcInputs(selector: string, summaryId: string, clearIds: string[] = [], optionalIds: string[] = []): boolean {
  const inputs = Array.from(document.querySelectorAll<HTMLInputElement>(selector));
  if (inputs.length === 0) throw new Error(`Calculator validation found no number controls: ${selector}`);
  const invalid = inputs.find((input) => {
    const text = input.value.trim();
    if (!text && optionalIds.includes(input.id)) { input.setAttribute('aria-invalid', 'false'); return false; }
    const n = Number(text);
    const min = input.getAttribute('min');
    const max = input.getAttribute('max');
    const step = input.getAttribute('step');
    const bad = !text || !Number.isFinite(n) || Math.abs(n) > Number.MAX_SAFE_INTEGER
      || (min !== null && n < Number(min)) || (max !== null && n > Number(max))
      || (step === '1' && !Number.isInteger(n));
    input.setAttribute('aria-invalid', String(bad));
    return bad;
  });
  const summary = document.getElementById(summaryId);
  if (summary) {
    summary.setAttribute('role', 'status');
    summary.setAttribute('aria-live', 'polite');
  }
  if (!invalid) return true;
  const label = invalid.getAttribute('aria-label') || invalid.closest('label')?.textContent?.trim().replace(/\s+/g, ' ') || 'number';
  if (summary) summary.textContent = `Check ${label}: enter a number within the shown limits. Empty fields are not zero.`;
  for (const id of clearIds) {
    const out = document.getElementById(id);
    if (out) out.innerHTML = '';
  }
  return false;
}
