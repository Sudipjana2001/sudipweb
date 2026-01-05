import { useCallback, useRef } from "react";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const defaultConfig: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60000, // 1 minute
};

export function useRateLimiting(config: RateLimitConfig = defaultConfig) {
  const requestsRef = useRef<number[]>([]);

  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Remove old requests outside the window
    requestsRef.current = requestsRef.current.filter((time) => time > windowStart);

    // Check if we've exceeded the limit
    if (requestsRef.current.length >= config.maxRequests) {
      return false;
    }

    // Add the current request
    requestsRef.current.push(now);
    return true;
  }, [config.maxRequests, config.windowMs]);

  const getRemainingRequests = useCallback((): number => {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    requestsRef.current = requestsRef.current.filter((time) => time > windowStart);
    return Math.max(0, config.maxRequests - requestsRef.current.length);
  }, [config.maxRequests, config.windowMs]);

  const getResetTime = useCallback((): number => {
    if (requestsRef.current.length === 0) return 0;
    const oldestRequest = Math.min(...requestsRef.current);
    return Math.max(0, oldestRequest + config.windowMs - Date.now());
  }, [config.windowMs]);

  return {
    checkRateLimit,
    getRemainingRequests,
    getResetTime,
  };
}

// Simple in-memory rate limiter for client-side protection
class ClientRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = defaultConfig) {
    this.config = config;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    let requests = this.requests.get(identifier) || [];
    requests = requests.filter((time) => time > windowStart);

    if (requests.length >= this.config.maxRequests) {
      this.requests.set(identifier, requests);
      return false;
    }

    requests.push(now);
    this.requests.set(identifier, requests);
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    let requests = this.requests.get(identifier) || [];
    requests = requests.filter((time) => time > windowStart);
    this.requests.set(identifier, requests);

    return Math.max(0, this.config.maxRequests - requests.length);
  }
}

export const apiRateLimiter = new ClientRateLimiter({ maxRequests: 30, windowMs: 60000 });
export const authRateLimiter = new ClientRateLimiter({ maxRequests: 5, windowMs: 300000 });
export const uploadRateLimiter = new ClientRateLimiter({ maxRequests: 10, windowMs: 60000 });
