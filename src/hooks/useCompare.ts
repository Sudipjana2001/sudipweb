import { useState, useEffect } from "react";

const COMPARE_STORAGE_KEY = "compareProducts";
const MAX_COMPARE_ITEMS = 4;

export function useCompare() {
  const [compareIds, setCompareIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(COMPARE_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareIds));
  }, [compareIds]);

  const addToCompare = (productId: string) => {
    if (compareIds.includes(productId)) return false;
    if (compareIds.length >= MAX_COMPARE_ITEMS) return false;
    
    setCompareIds([...compareIds, productId]);
    return true;
  };

  const removeFromCompare = (productId: string) => {
    setCompareIds(compareIds.filter((id) => id !== productId));
  };

  const isInCompare = (productId: string) => {
    return compareIds.includes(productId);
  };

  const clearCompare = () => {
    setCompareIds([]);
  };

  return {
    compareIds,
    compareCount: compareIds.length,
    addToCompare,
    removeFromCompare,
    isInCompare,
    clearCompare,
    canAddMore: compareIds.length < MAX_COMPARE_ITEMS,
  };
}
