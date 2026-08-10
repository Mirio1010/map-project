import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { createPinIcon, createColoredPinIcon } from "../utils/pinCategories";
import {
  DEMO_CATEGORIES,
  DEMO_DROP_PIN,
  DEMO_FRIEND_PINS,
  DEMO_FRIENDS,
  DEMO_GUIDE_STEPS,
  DEMO_MAP_CENTER,
  DEMO_MAP_MAX_ZOOM,
  DEMO_MAP_ZOOM,
  DEMO_MY_PINS,
} from "../utils/demoPins";
import "./LandingDemoMap.css";

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function pinsSignature(pins) {
  return pins.map((p) => `${p.id}:${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join("|");
}

function formatCountdown(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function MapBridge({ mapApiRef, overviewPins, freezeView }) {
  const map = useMap();
  const sig = pinsSignature(overviewPins);
  const pinsRef = useRef(overviewPins);
  pinsRef.current = overviewPins;

  useEffect(() => {
    mapApiRef.current = map;
    const run = () => map.invalidateSize();
    const id = window.setTimeout(run, 80);
    const id2 = window.setTimeout(run, 400);
    window.addEventListener("resize", run);
    return () => {
      window.clearTimeout(id);
      window.clearTimeout(id2);
      window.removeEventListener("resize", run);
      if (mapApiRef.current === map) mapApiRef.current = null;
    };
  }, [map, mapApiRef]);

  // Only re-fit when the *set of pin positions* changes — never on countdown ticks.
  useEffect(() => {
    if (freezeView) return undefined;
    const pins = pinsRef.current;
    const run = () => {
      map.invalidateSize();
      if (!pins.length) {
        map.setView(DEMO_MAP_CENTER, DEMO_MAP_ZOOM, { animate: false });
        return;
      }
      const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, {
        paddingTopLeft: [28, 96],
        paddingBottomRight: [28, 56],
        maxZoom: DEMO_MAP_MAX_ZOOM,
        animate: !prefersReducedMotion(),
      });
    };
    const id = window.setTimeout(run, 60);
    return () => window.clearTimeout(id);
  }, [map, sig, freezeView]);

  return null;
}

function MapClickDrop({ onDrop, enabled }) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      onDrop({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function DemoMarker({
  pin,
  icon,
  openPopupId,
  onSelect,
  emphasize,
  countdownSeconds = null,
}) {
  const markerRef = useRef(null);

  useEffect(() => {
    if (openPopupId !== pin.id || !markerRef.current) return undefined;
    const delay = prefersReducedMotion() ? 40 : 400;
    const id = window.setTimeout(() => {
      markerRef.current?.openPopup?.();
    }, delay);
    return () => window.clearTimeout(id);
  }, [openPopupId, pin.id]);

  // Keep popup open while this pin is the guided focus (survives minor re-renders).
  useEffect(() => {
    if (openPopupId !== pin.id || countdownSeconds == null) return;
    if (!markerRef.current?.isPopupOpen?.()) {
      markerRef.current?.openPopup?.();
    }
  }, [openPopupId, pin.id, countdownSeconds]);

  return (
    <Marker
      ref={markerRef}
      position={[pin.lat, pin.lng]}
      icon={icon}
      opacity={emphasize === false ? 0.35 : 1}
      eventHandlers={{
        click: () => onSelect(pin),
      }}
    >
      <Popup
        autoPan
        autoPanPadding={[36, 48]}
        maxWidth={200}
        minWidth={160}
      >
        <PinPopup pin={pin} countdownSeconds={countdownSeconds} />
      </Popup>
    </Marker>
  );
}

function categoryLabel(value) {
  const hit = DEMO_CATEGORIES.find((c) => c.id === value);
  if (hit) return hit.label;
  if (value === "shopping") return "Shopping";
  if (value === "favorites") return "Favorites";
  return value;
}

function ownerLabel(pin) {
  if (pin.owner === "you") return "You";
  const friend = DEMO_FRIENDS.find((f) => f.id === pin.owner);
  return friend?.name || "Friend";
}

function PinPopup({ pin, countdownSeconds = null }) {
  const isFriend = pin.owner !== "you";
  const showTimer = typeof countdownSeconds === "number";

  return (
    <div className={`landing-demo-popup${showTimer ? " is-timed" : ""}`}>
      {isFriend ? (
        <span
          className="landing-demo-popup__friend"
          style={{
            color: pin.color,
            background: `${pin.color}22`,
            borderColor: `${pin.color}55`,
          }}
        >
          Shared by {ownerLabel(pin)}
        </span>
      ) : (
        <span className="landing-demo-popup__you">Your pin</span>
      )}
      {pin.timed && (
        <span className="landing-demo-popup__timed-badge">Timed pin</span>
      )}
      <strong className="landing-demo-popup__name">{pin.name}</strong>
      <span className="landing-demo-popup__meta">
        {categoryLabel(pin.category)}
        {pin.rating ? ` · ${pin.rating}/5` : ""}
      </span>
      <p className="landing-demo-popup__desc">{pin.description}</p>
      {showTimer && (
        <div className="landing-demo-popup__countdown" aria-live="polite">
          <span className="landing-demo-popup__countdown-label">
            Active {formatCountdown(countdownSeconds)}
          </span>
          <span className="landing-demo-popup__countdown-note">
            {countdownSeconds > 0
              ? "Hides when the timer ends."
              : "Window ended — removed."}
          </span>
        </div>
      )}
    </div>
  );
}

let userDropSeq = 0;

export default function LandingDemoMap() {
  const [guideIndex, setGuideIndex] = useState(0);
  const [guided, setGuided] = useState(() => !prefersReducedMotion());
  const [showFriends, setShowFriends] = useState(false);
  const [showDropPin, setShowDropPin] = useState(false);
  const [dropPinGone, setDropPinGone] = useState(false);
  const [category, setCategory] = useState("all");
  const [userDrop, setUserDrop] = useState(null);
  const [openPopupId, setOpenPopupId] = useState(null);
  const [highlight, setHighlight] = useState(DEMO_GUIDE_STEPS[0].highlight);
  const [countdownSeconds, setCountdownSeconds] = useState(null);
  const [status, setStatus] = useState(DEMO_GUIDE_STEPS[0]);
  const rootRef = useRef(null);
  const mapApiRef = useRef(null);
  const guideTimerRef = useRef(null);
  const countdownRef = useRef(null);
  const interactedRef = useRef(false);

  const clearGuideTimer = () => {
    if (guideTimerRef.current) {
      window.clearTimeout(guideTimerRef.current);
      guideTimerRef.current = null;
    }
  };

  const clearCountdown = () => {
    if (countdownRef.current) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const takeOver = (nextStatus) => {
    interactedRef.current = true;
    setGuided(false);
    clearGuideTimer();
    clearCountdown();
    setCountdownSeconds(null);
    setOpenPopupId(null);
    setHighlight(null);
    if (nextStatus) setStatus(nextStatus);
  };

  const startCountdown = (seconds) => {
    clearCountdown();
    setCountdownSeconds(seconds);
    countdownRef.current = window.setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev == null) return prev;
        if (prev <= 1) {
          clearCountdown();
          setDropPinGone(true);
          setOpenPopupId(null);
          setStatus({
            id: "timed-done",
            title: "Pin expired",
            body: "In Spoty, scheduled pins leave the map when their window ends, no manual cleanup.",
          });
          setHighlight("timed");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const applyGuideStep = (step) => {
    setShowFriends(step.showFriends);
    setShowDropPin(step.showDrop && !dropPinGone);
    setCategory(step.category);
    setStatus(step);
    setHighlight(step.highlight);
    setOpenPopupId(step.openPinId);
    if (step.runCountdown && !dropPinGone) {
      startCountdown(DEMO_DROP_PIN.timedSeconds);
    } else {
      clearCountdown();
      setCountdownSeconds(null);
    }
  };

  useEffect(() => {
    if (!guided) return undefined;

    if (prefersReducedMotion()) {
      setGuided(false);
      setShowFriends(true);
      setShowDropPin(true);
      setCategory("all");
      setHighlight(null);
      setStatus({
        id: "explore",
        title: "Try Spoty",
        body: "Click pins, filter categories, toggle friends, or drop one pin on the map.",
      });
      return undefined;
    }

    applyGuideStep(DEMO_GUIDE_STEPS[0]);
    let i = 0;
    const STEP_MS = {
      yours: 6500,
      drop: 7000,
      friends: 7000,
      filter: 7000,
      open: 8000,
      timed: DEMO_DROP_PIN.timedSeconds * 1000 + 4500,
    };

    const tick = () => {
      if (interactedRef.current) return;
      i += 1;
      if (i >= DEMO_GUIDE_STEPS.length) {
        setGuided(false);
        setHighlight(null);
        setOpenPopupId(null);
        clearCountdown();
        setCountdownSeconds(null);
        setStatus({
          id: "explore",
          title: "Your turn",
          body: "That’s the Spoty loop. Drop one pin, open cards, toggle friends, or filter.",
        });
        return;
      }
      setGuideIndex(i);
      applyGuideStep(DEMO_GUIDE_STEPS[i]);
      const stepId = DEMO_GUIDE_STEPS[i].id;
      guideTimerRef.current = window.setTimeout(tick, STEP_MS[stepId] || 3400);
    };

    guideTimerRef.current = window.setTimeout(
      tick,
      STEP_MS[DEMO_GUIDE_STEPS[0].id] || 3400
    );
    return () => {
      clearGuideTimer();
      clearCountdown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        window.setTimeout(() => mapApiRef.current?.invalidateSize(), 50);
        window.setTimeout(() => mapApiRef.current?.invalidateSize(), 350);
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Keep drop pin object identity stable — countdown is passed separately so the
  // map does not re-fit / remount markers every second.
  const activeDropPin = showDropPin && !dropPinGone ? DEMO_DROP_PIN : null;

  const myPins = useMemo(() => {
    const base = [...DEMO_MY_PINS];
    if (activeDropPin) base.push(activeDropPin);
    if (userDrop) base.push(userDrop);
    if (category === "all") return base;
    return base.filter((p) => p.category === category);
  }, [activeDropPin, userDrop, category]);

  const friendPins = useMemo(() => {
    if (!showFriends) return [];
    if (category === "all") return DEMO_FRIEND_PINS;
    return DEMO_FRIEND_PINS.filter((p) => p.category === category);
  }, [showFriends, category]);

  const overviewPins = useMemo(
    () => [...myPins, ...friendPins],
    [myPins, friendPins]
  );

  const visibleCount = overviewPins.length;
  const canDrop = !userDrop;

  const handleCategory = (id) => {
    takeOver({
      id: "filter",
      title: id === "all" ? "All spots" : categoryLabel(id),
      body:
        id === "all"
          ? "Showing everything on the map."
          : `Filtered to ${categoryLabel(id)}, only matching pins stay.`,
    });
    setCategory(id);
  };

  const handleFriendsToggle = () => {
    const next = !showFriends;
    takeOver({
      id: "friends",
      title: next ? "Friends on" : "Friends off",
      body: next
        ? "Friend pins show in their colors. Open one to see who shared it."
        : "Only your pins are visible.",
    });
    setShowFriends(next);
  };

  const handleMapDrop = ({ lat, lng }) => {
    if (userDrop) {
      takeOver({
        id: "drop",
        title: "One pin only",
        body: "This demo lets you place a single pin. Toggle friends or filters next.",
      });
      return;
    }
    userDropSeq += 1;
    const pin = {
      id: `demo-user-drop-${userDropSeq}`,
      name: "Your new pin",
      category: "favorites",
      lat,
      lng,
      description: "Dropped in this demo, in the app you’d add a name and tags.",
      owner: "you",
      rating: 5,
    };
    takeOver({
      id: "drop",
      title: "Pin dropped",
      body: "That’s the Spoty loop, tap the map, save the place. (One pin in this demo.)",
    });
    setShowDropPin(true);
    setUserDrop(pin);
    setCategory("all");
  };

  const handlePinSelect = (pin) => {
    takeOver({
      id: pin.owner === "you" ? "yours" : "friends",
      title: pin.name,
      body:
        pin.owner === "you"
          ? pin.description
          : `Shared by ${ownerLabel(pin)}.`,
    });
  };

  const skipGuide = () => {
    takeOver({
      id: "explore",
      title: "Explore freely",
      body: "Click pins, filter, toggle friends, or click the map to drop one pin.",
    });
    setShowFriends(true);
    setShowDropPin(true);
    setDropPinGone(false);
    setCategory("all");
  };

  const emphasizeDrop =
    highlight === "map" && status.id === "drop"
      ? "demo-drop"
      : highlight === "popup" || highlight === "timed"
        ? "demo-drop"
        : null;

  return (
    <div
      ref={rootRef}
      className="landing-demo-map"
      data-highlight={highlight || undefined}
    >
      <div className="landing-demo-map__chrome">
        <div className="landing-demo-map__chrome-left" aria-hidden="true">
          <span className="landing-demo-map__dot" />
          <span className="landing-demo-map__dot" />
          <span className="landing-demo-map__dot" />
          <span className="landing-demo-map__chrome-label">Interactive demo</span>
        </div>
        <div className="landing-demo-map__chrome-actions">
          {guided && (
            <button type="button" className="landing-demo-map__text-btn" onClick={skipGuide}>
              Skip
            </button>
          )}
          <span className="landing-demo-map__count">{visibleCount} spots</span>
        </div>
      </div>

      <div className="landing-demo-map__toolbar" role="toolbar" aria-label="Demo controls">
        <button
          type="button"
          className={`landing-demo-map__toggle${showFriends ? " is-on" : ""}${
            highlight === "friends" ? " is-spotlight" : ""
          }`}
          onClick={handleFriendsToggle}
          aria-pressed={showFriends}
        >
          Friends {showFriends ? "on" : "off"}
        </button>
        <div className="landing-demo-map__friend-dots" aria-hidden="true">
          {DEMO_FRIENDS.map((f) => (
            <span
              key={f.id}
              className={`landing-demo-map__friend-dot${showFriends ? " is-live" : ""}`}
              style={{ background: f.color }}
              title={f.name}
            />
          ))}
        </div>
        <div className="landing-demo-map__divider" aria-hidden="true" />
        <div className="landing-demo-map__chips" role="group" aria-label="Category filter">
          {DEMO_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`landing-demo-map__chip${category === c.id ? " is-active" : ""}${
                highlight === "filter" && c.id === "food-drinks" ? " is-spotlight" : ""
              }`}
              onClick={() => handleCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`landing-demo-map__stage${guided ? " is-guiding" : ""}`}>
        <MapContainer
          center={DEMO_MAP_CENTER}
          zoom={DEMO_MAP_ZOOM}
          scrollWheelZoom={false}
          className="landing-demo-map__leaflet"
        >
          <MapBridge
            mapApiRef={mapApiRef}
            overviewPins={overviewPins}
            freezeView={highlight === "timed"}
          />
          <MapClickDrop onDrop={handleMapDrop} enabled />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          />
          {myPins.map((pin) => (
            <DemoMarker
              key={pin.id}
              pin={pin}
              icon={createPinIcon(pin.category, {
                isScheduled: Boolean(pin.timed),
              })}
              openPopupId={openPopupId}
              onSelect={handlePinSelect}
              countdownSeconds={
                pin.id === "demo-drop" && countdownSeconds != null
                  ? countdownSeconds
                  : null
              }
              emphasize={
                emphasizeDrop ? pin.id === emphasizeDrop || pin.id.startsWith("demo-user") : true
              }
            />
          ))}
          {friendPins.map((pin) => (
            <DemoMarker
              key={pin.id}
              pin={pin}
              icon={createColoredPinIcon(pin.category, pin.color)}
              openPopupId={openPopupId}
              onSelect={handlePinSelect}
              emphasize={emphasizeDrop ? false : true}
            />
          ))}
        </MapContainer>

        <div className="landing-demo-map__coach" key={status.id + status.title}>
          <p className="landing-demo-map__coach-kicker">
            {guided ? `Step ${guideIndex + 1} of ${DEMO_GUIDE_STEPS.length}` : "Demo"}
          </p>
          <p className="landing-demo-map__coach-title">{status.title}</p>
          <p className="landing-demo-map__coach-body">{status.body}</p>
          {guided && (
            <div className="landing-demo-map__progress" aria-hidden="true">
              {DEMO_GUIDE_STEPS.map((step, idx) => (
                <span
                  key={step.id}
                  className={`landing-demo-map__pip${idx === guideIndex ? " is-current" : ""}${
                    idx < guideIndex ? " is-done" : ""
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <p className="landing-demo-map__hint">
          {canDrop ? "Click the map to drop a pin" : "One pin placed, try filters or friends"}
        </p>
      </div>
    </div>
  );
}
