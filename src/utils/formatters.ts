export function formatDate(d: any) { if (!d) return ''; try { return new Date(d).toLocaleString(); } catch { return String(d); } }


