"use client";

import { useEffect, useRef, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

// Text input for the restaurant name that doubles as a Google Places search:
// typing shows a dropdown of matching places, and picking one fills both the
// name and the exact map pin. Falls back to a plain text field (no dropdown)
// until the Places library has loaded.
export default function RestaurantSearchInput({ value, onChange, onPlaceSelect, className }) {
  const placesLib = useMapsLibrary("places");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const sessionTokenRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (placesLib && !sessionTokenRef.current) {
      sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
    }
  }, [placesLib]);

  useEffect(() => {
    const trimmed = value.trim();
    if (!placesLib || trimmed.length < MIN_QUERY_LENGTH) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const { suggestions: results } = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: trimmed,
          sessionToken: sessionTokenRef.current,
          includedPrimaryTypes: ["restaurant", "cafe", "bar", "meal_takeaway", "bakery"],
        });
        if (!cancelled) {
          setSuggestions(results ?? []);
          setOpen(true);
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [placesLib, value]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Derived rather than cleared inside the debounce effect (calling setState
  // synchronously in an effect body triggers a lint error and an extra
  // render) — once the query drops below the minimum length, just stop
  // showing whatever suggestions are still in state.
  const visibleSuggestions = value.trim().length < MIN_QUERY_LENGTH ? [] : suggestions;

  async function handleSelect(suggestion) {
    const prediction = suggestion.placePrediction;
    const place = prediction.toPlace();
    // formattedAddress + location alone keep this on the cheaper Places
    // Essentials SKU — displayName would bump the whole request to Pro
    // pricing, and the autocomplete prediction already has a name.
    await place.fetchFields({ fields: ["formattedAddress", "location"] });

    setOpen(false);
    setSuggestions([]);
    onChange(prediction.mainText?.text ?? prediction.text?.text ?? value);
    onPlaceSelect({
      lat: place.location.lat(),
      lng: place.location.lng(),
      address: place.formattedAddress ?? null,
      placeId: prediction.placeId,
    });

    // Selecting a place ends the autocomplete session — start a fresh token
    // for the next search (Google's billing model for session tokens).
    sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => visibleSuggestions.length > 0 && setOpen(true)}
        placeholder="Restaurant name (optional)"
        className={className}
      />
      {open && visibleSuggestions.length > 0 && (
        <ul className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          {visibleSuggestions.map((suggestion) => {
            const prediction = suggestion.placePrediction;
            return (
              <li key={prediction.placeId}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(suggestion)}
                  className="flex w-full flex-col items-start gap-0.5 px-3.5 py-2.5 text-left text-sm hover:bg-surface-hover"
                >
                  <span className="font-medium text-foreground">
                    {prediction.mainText?.text ?? prediction.text?.text}
                  </span>
                  {prediction.secondaryText?.text && (
                    <span className="text-xs text-muted">{prediction.secondaryText.text}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
