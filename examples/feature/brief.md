# Feature request: deterministic CSV export

Add `toCsv(rows, columns)` to the existing JavaScript utility module. It returns a CSV string for an array of plain records using an explicit array of column names.

- Preserve the supplied column order and always emit a header row, including for no records.
- Separate rows with CRLF and end the output with CRLF. Quote fields containing commas, quotes, CR, or LF; double embedded quotes. Serialize null and missing values as empty fields.
- Do not mutate the records or columns. Throw a TypeError for invalid top-level arguments (rows or columns is not an array).

This is a local formatting utility change. It introduces no network endpoint, database, new deployment, or production migration. No performance target or spreadsheet formula interpretation is requested. Existing callers supply plain values. The work is complete when independent expected-output tests cover the specified behavior.
