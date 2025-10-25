
import { useState, useEffect, useCallback } from 'react';
// FIX: To resolve conflicting type declarations, AIStudio is imported from a shared types file.
import { AIStudio } from '../types';

// Assume window.aistudio is available globally.
// We declare it to satisfy TypeScript.
// The AIStudio interface is now defined in the shared types.ts file.
// FIX: Removed global declaration from this file. It is now in types.ts


export const useVeoApiKey = () => {
  const [hasKey, setHasKey] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkKey = useCallback(async () => {
    if (!window.aistudio) {
      console.warn("aistudio helper not available. Assuming key is set via env.");
      setHasKey(true);
      setIsChecking(false);
      return;
    }
    setIsChecking(true);
    try {
      const keySelected = await window.aistudio.hasSelectedApiKey();
      setHasKey(keySelected);
    } catch (error) {
      console.error("Error checking for API key:", error);
      setHasKey(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkKey();
  }, [checkKey]);

  const selectKey = async () => {
    if (!window.aistudio) {
        alert("API key selection is not available in this environment.");
        return;
    }
    try {
        await window.aistudio.openSelectKey();
        // Assume success after opening dialog to handle race conditions
        setHasKey(true); 
    } catch (error) {
        console.error("Error opening API key selection:", error);
        setHasKey(false);
    }
  };
  
  const handleApiError = () => {
    // This can be called if an API call fails with a "not found" error,
    // indicating the key might be invalid.
    setHasKey(false);
  };

  return { hasKey, isChecking, selectKey, checkKey, handleApiError };
};
