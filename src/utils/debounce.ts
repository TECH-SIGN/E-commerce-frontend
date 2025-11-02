/**
 * Enhanced debounce utility with better TypeScript support and performance optimizations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  } = {}
): T & { cancel: () => void; flush: () => void } {
  let timeout: NodeJS.Timeout | null = null;
  let lastCallTime: number | null = null;
  let lastCallArgs: any[] | null = null;
  
  const { leading = false, trailing = true, maxWait } = options;
  
  const debounced = ((...args: any[]) => {
    const now = Date.now();
    const timeSinceLastCall = lastCallTime ? now - lastCallTime : 0;
    
    // Store the latest call
    lastCallArgs = args;
    lastCallTime = now;
    
    // Clear existing timeout
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    
    // Execute immediately if leading is true and this is the first call
    if (leading && !timeout) {
      func(...args);
      return;
    }
    
    // Set up the timeout
    const execute = () => {
      if (trailing && lastCallArgs) {
        func(...lastCallArgs);
      }
      timeout = null;
      lastCallArgs = null;
    };
    
    // Calculate delay
    let delay = wait;
    if (maxWait && timeSinceLastCall >= maxWait) {
      delay = 0;
    }
    
    timeout = setTimeout(execute, delay);
  }) as T & { cancel: () => void; flush: () => void };
  
  // Cancel the debounced function
  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    lastCallArgs = null;
    lastCallTime = null;
  };
  
  // Flush the debounced function (execute immediately)
  debounced.flush = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    if (lastCallArgs) {
      func(...lastCallArgs);
      lastCallArgs = null;
    }
  };
  
  return debounced;
}

/**
 * Throttle utility for rate limiting
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;
  let lastCallTime = 0;
  
  const throttled = ((...args: any[]) => {
    const now = Date.now();
    
    if (now - lastCallTime >= wait) {
      func(...args);
      lastCallTime = now;
    } else {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        func(...args);
        lastCallTime = Date.now();
      }, wait - (now - lastCallTime));
    }
  }) as T & { cancel: () => void };
  
  throttled.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  
  return throttled;
} 