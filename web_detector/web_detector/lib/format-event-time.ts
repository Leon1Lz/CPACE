export function formatEventTime(timestamp: Date) {
  // A fixed timezone prevents hydration mismatches between the server and browser.
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  }).format(timestamp);
}
