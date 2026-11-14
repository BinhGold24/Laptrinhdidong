/**
 * Fetch kèm timeout thực sự bằng AbortController (tránh treo request nền khi mạng chậm)
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = 6500) {
  const hasAbort = typeof AbortController !== 'undefined';
  const controller = hasAbort ? new AbortController() : null;
  let timerId = null;

  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      if (controller) {
        try {
          controller.abort();
        } catch (e) {}
      }
      reject(new Error(`Request timeout (${timeoutMs}ms)`));
    }, timeoutMs);
  });

  try {
    const fetchOptions = controller ? { ...options, signal: controller.signal } : options;
    return await Promise.race([fetch(url, fetchOptions), timeoutPromise]);
  } finally {
    if (timerId) clearTimeout(timerId);
  }
}
