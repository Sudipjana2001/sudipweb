import { useState, useCallback, useRef } from "react";

export interface PincodeResult {
  city: string;
  state: string;
  country: string;
}

export type PincodeStatus = "idle" | "loading" | "valid" | "invalid";

interface UsePincodeLookupReturn {
  status: PincodeStatus;
  lookupError: string | null;
  fetchPincode: (pin: string) => Promise<PincodeResult | null>;
  resetStatus: () => void;
}

/**
 * Fetches city, state, and country from the free India Post PIN code API.
 * Also tracks whether the PIN was confirmed valid/invalid by the API.
 * No API key required.
 */
export function usePincodeLookup(): UsePincodeLookupReturn {
  const [status, setStatus] = useState<PincodeStatus>("idle");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const resetStatus = useCallback(() => {
    setStatus("idle");
    setLookupError(null);
  }, []);

  const fetchPincode = useCallback(async (pin: string): Promise<PincodeResult | null> => {
    if (!/^[1-9][0-9]{5}$/.test(pin)) return null;

    // Cancel any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setStatus("loading");
    setLookupError(null);

    try {
      const res = await fetch(
        `https://api.postalpincode.in/pincode/${pin}`,
        { signal: abortRef.current.signal },
      );

      if (!res.ok) throw new Error("Network error");

      const data = await res.json();
      const entry = data?.[0];

      if (entry?.Status !== "Success" || !entry.PostOffice?.length) {
        setStatus("invalid");
        setLookupError("Invalid PIN code. Please enter a valid PIN code.");
        return null;
      }

      const po = entry.PostOffice[0];
      setStatus("valid");
      return {
        city: po.District || po.Name || "",
        state: po.State || "",
        country: po.Country || "India",
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return null;
      setStatus("idle");
      setLookupError("Could not verify PIN code. Check your connection.");
      return null;
    }
  }, []);

  return { status, lookupError, fetchPincode, resetStatus };
}
