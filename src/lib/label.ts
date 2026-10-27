// Brother QL-820NWBc, 29 mm continuous roll, printed landscape 50 × 29 mm.
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function labelHtml(regnr: string, time: string, service: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Etikett ${esc(regnr)}</title>
<style>
@page { size: 50mm 29mm; margin: 0; }
html,body { margin:0; padding:0; }
body { width:50mm; height:29mm; font-family: Arial, Helvetica, sans-serif; color:#000;
  display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; overflow:hidden; }
.r { font-size:24pt; font-weight:900; letter-spacing:1px; line-height:1; white-space:nowrap; }
.t { font-size:11pt; font-weight:700; margin-top:1.5mm; }
.s { font-size:9pt; margin-top:0.5mm; }
</style></head><body>
<div class="r">${esc(regnr)}</div><div class="t">${esc(time)}</div><div class="s">${esc(service)}</div>
</body></html>`;
}

export function printLabel(regnr: string, time: string, service: string) {
  const w = window.open("", "_blank", "width=400,height=300");
  if (!w) return;
  w.document.write(labelHtml(regnr, time, service));
  w.document.close();
  w.onload = () => { w.focus(); w.print(); w.close(); };
  setTimeout(() => { if (!w.closed) { w.focus(); w.print(); w.close(); } }, 400);
}
