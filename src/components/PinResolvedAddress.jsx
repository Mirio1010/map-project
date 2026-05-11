import { createElement, useEffect, useState } from "react";
import {
  needsReverseGeocodeLookup,
  reverseGeocode,
  formatStoredAddressShort,
} from "../utils/geocodeUtils";

/**
 * Renders a human-readable address line; reverse-geocodes when the stored value
 * is missing or looks like coordinates. Display-only — does not write to the DB.
 */
export default function PinResolvedAddress({
  address,
  lat,
  lng,
  className,
  style,
  title,
  as: Component = "p",
}) {
  const needsLookup = needsReverseGeocodeLookup(address);
  const [resolved, setResolved] = useState(null);

  useEffect(() => {
    if (!needsLookup) {
      return undefined;
    }
    let cancelled = false;
    (async () => {
      const line = await reverseGeocode(lat, lng);
      if (!cancelled) setResolved(line);
    })();
    return () => {
      cancelled = true;
    };
  }, [needsLookup, lat, lng]);

  const display = needsLookup
    ? resolved ?? "Loading address…"
    : formatStoredAddressShort(address);
  const titleAttr = title ?? (!needsLookup ? address : display);

  return createElement(
    Component,
    { className, style, title: titleAttr },
    display,
  );
}
