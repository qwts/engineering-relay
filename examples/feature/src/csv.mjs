export function toCsv(rows, columns) {
  if (!Array.isArray(rows) || !Array.isArray(columns)) throw new TypeError('rows and columns must be arrays');
  const field = value => {
    const text = value == null ? '' : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  const lines = [columns.map(field).join(',')];
  for (const row of rows) lines.push(columns.map(column => field(row[column])).join(','));
  return `${lines.join('\r\n')}\r\n`;
}
