/** Format a finite, nonnegative integer Number as HH:MM:SS, with unbounded hours. */
export function formatDuration(seconds) {
  if (typeof seconds !== 'number') {
    throw new TypeError('seconds must be a number');
  }
  if (!Number.isInteger(seconds) || seconds < 0) {
    throw new RangeError('seconds must be a finite nonnegative integer');
  }

  // Preserve the represented integer even when it exceeds Number.MAX_SAFE_INTEGER.
  const total = BigInt(seconds);
  const hours = total / 3600n;
  const minutes = (total % 3600n) / 60n;
  const remainder = total % 60n;

  return [hours, minutes, remainder]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}
