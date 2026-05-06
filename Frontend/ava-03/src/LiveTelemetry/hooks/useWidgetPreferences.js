import { useState } from "react";

const STORAGE_KEY = "ava-telemetry-preferences";

function getSavedPreferences(defaultLayout) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    return parsed.version === defaultLayout.version ? parsed : null;
  } catch (err) {
    console.error("Failed to load widget preferences:", err);
    return null;
  }
}

/**
 * Custom hook for managing user widget preferences with localStorage
 * @param {Object} defaultLayout - Default layout configuration
 * @returns {Object} Layout state and management functions
 */
export function useWidgetPreferences(defaultLayout) {
  // Load preferences from localStorage on mount
  const savedPreferences = getSavedPreferences(defaultLayout);
  
  const [layout, setLayout] = useState(() =>
    savedPreferences?.layout ?? defaultLayout.layout
  );

  const [isCustomized, setIsCustomized] = useState(() =>
    Boolean(savedPreferences)
  );

  // Save preferences to localStorage whenever layout changes
  const saveLayout = (newLayout) => {
    try {
      const toSave = {
        version: defaultLayout.version,
        layout: newLayout,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      setLayout(newLayout);
      setIsCustomized(true);
    } catch (err) {
      console.error("Failed to save widget preferences:", err);
    }
  };

  // Add a widget to a panel
  const addWidget = (panel, widgetConfig) => {
    const newLayout = { ...layout };
    newLayout[panel] = [...newLayout[panel], widgetConfig];
    saveLayout(newLayout);
  };

  // Remove a widget by ID
  const removeWidget = (widgetId) => {
    const newLayout = { ...layout };
    Object.keys(newLayout).forEach((panel) => {
      newLayout[panel] = newLayout[panel].filter((w) => w.id !== widgetId);
    });
    saveLayout(newLayout);
  };

  // Reset to default layout
  const resetToDefault = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setLayout(defaultLayout.layout);
      setIsCustomized(false);
    } catch (err) {
      console.error("Failed to reset widget preferences:", err);
    }
  };

  // Apply a profile layout
  const applyProfile = (profileLayout) => {
    saveLayout(profileLayout);
  };

  return {
    layout,
    addWidget,
    removeWidget,
    resetToDefault,
    applyProfile,
    isCustomized,
  };
}
