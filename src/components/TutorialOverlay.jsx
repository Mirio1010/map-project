import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./TutorialOverlay.css";
import {
  buildExploreFollowBodyText,
  addDevAccountFriend,
} from "../utils/devAccounts";

const TOTAL_VISIBLE_STEPS = 6;

/**
 * Flatten logical tour groups into sequential segments each screen can render.
 *
 * Each segment knows which selector to spotlight, optional hooks when entering, and optional work right before advancing.
 */
function buildTutorialSegments(actions) {
  const { prepareHomeSidebar } = actions;
  const exploreFollowBody = buildExploreFollowBodyText();

  /** @type {Array<{displayStep:number;targetSelector:string;title:string;body:string;onEnter?:Function;onAfterNext?:Function;showSpotyTeamAdd?:boolean}>} */
  const raw = [];

  let displayStep = 1;

  // Step 1 — Add Spot (sidebar primary action)
  raw.push({
    displayStep,
    targetSelector: '[data-tutorial="add-spot"]',
    title: "Save your favorite spots",
    body:
      'Tap here to save a place you love. Drop a pin anywhere on the map with “+ Add Spot”.',
    onEnter: prepareHomeSidebar,
  });
  displayStep += 1;

  // Step 2 — Category filter lives inside the filter drawer
  raw.push({
    displayStep,
    targetSelector: '[data-tutorial="category-filter"]',
    title: "Filter by category",
    body: "Filter your spots by type — food, parks, cafés, and more.",
    onEnter: prepareHomeSidebar,
  });
  displayStep += 1;

  // Step 3 — Sort controls + optional Top Ten shortcut
  raw.push({
    displayStep,
    targetSelector: '[data-tutorial="rating-sort-filters"]',
    title: "Sort and spotlight your best picks",
    body: 'Sort by rating or switch on “Show Top 10” to highlight only your best spots.',
    onEnter: prepareHomeSidebar,
  });
  displayStep += 1;

  // Step 4 — Friends overlay toggle on the sidebar
  raw.push({
    displayStep,
    targetSelector: '[data-tutorial="friends-filter-toggle"]',
    title: "Layer your friends onto the map",
    body:
      "Toggle friends on to see their pins sprinkled across the map in their own colour.",
    onEnter: prepareHomeSidebar,
  });
  displayStep += 1;

  // Step 5a — Navigate to Explore tab (still counts as logical step 5)
  raw.push({
    displayStep,
    targetSelector: '[data-tutorial="explore-tab"]',
    title: "Discover nearby ideas",
    body: 'Head over to Explore whenever you want to discover new pins and spot people worth following.',
    onEnter: prepareHomeSidebar,
    onAfterNext: actions.switchToExploreTab,
  });

  // Step 5b — Explore area context once the Explore tab renders
  raw.push({
    displayStep,
    targetSelector: '[data-tutorial="explore-page"]',
    title: "Make Explore feel lively",
    body: exploreFollowBody,
    // Ensure we never leave Explore while explaining this pane
    onEnter: actions.ensureExploreTab,
    showSpotyTeamAdd: true,
  });
  displayStep += 1;

  // Step 6a — Profile tab callout inside the sticky header chrome
  raw.push({
    displayStep,
    targetSelector: '[data-tutorial="profile-tab"]',
    title: "Your public profile hub",
    body: "This is your profile.",
    // Allow user to browse other tabs beforehand; snapping back prepares the header highlight again
    onEnter: prepareHomeSidebar,
    onAfterNext: actions.switchToProfileTab,
  });

  // Step 6b — Avatar picker once the Profile screen is mounted
  raw.push({
    displayStep,
    targetSelector: '[data-tutorial="profile-avatar"]',
    title: "Personalise your avatar",
    body: 'Tap your photo to upload a new picture and make the profile unmistakably yours.',
    // Guard so the avatar target exists once the Profile tab renders
    onEnter: actions.ensureProfileTab,
  });

  return raw;
}

/**
 * Converts a spotlight rectangle plus viewport size into four dimmer panels that carve a translucent hole from the viewport.
 */
function rectsForDimmerPieces(rect, viewportW, viewportH) {
  const top = rect.top;
  const left = rect.left;
  const right = rect.right;
  const bottom = rect.bottom;
  /** @type {Array<{top:number;left:number;width:number;height:number}>} */
  const pieces = [];
  // Top band across the viewport
  pieces.push({ top: 0, left: 0, width: viewportW, height: Math.max(0, top) });
  // Bottom band
  pieces.push({
    top: bottom,
    left: 0,
    width: viewportW,
    height: Math.max(0, viewportH - bottom),
  });
  // Left column between top and bottom of the spotlight
  pieces.push({
    top,
    left: 0,
    width: Math.max(0, left),
    height: Math.max(0, bottom - top),
  });
  // Right column
  pieces.push({
    top,
    left: right,
    width: Math.max(0, viewportW - right),
    height: Math.max(0, bottom - top),
  });
  return pieces;
}

/**
 * Positions the floating tooltip card relative to an element rectangle so it avoids leaving the viewport.
 */
function calculateTooltipPlacement(domRectLike, estimatedCardHeight, viewportPadding) {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

  const anchorW =
    typeof domRectLike.width === "number"
      ? domRectLike.width
      : Math.max(domRectLike.right - domRectLike.left, 0);

  let cardW = Math.min(360, vw - viewportPadding * 2);
  const cardH = estimatedCardHeight;

  let left = Math.round(domRectLike.left + anchorW / 2 - cardW / 2);

  let top;
  const midY =
    typeof domRectLike.height === "number"
      ? domRectLike.top + domRectLike.height / 2
      : (domRectLike.top + domRectLike.bottom) / 2;
  const anchorBottom =
    typeof domRectLike.bottom === "number"
      ? domRectLike.bottom
      : domRectLike.top + (domRectLike.height || 0);
  const isLowerHalf =
    midY > vh / 2 || anchorBottom + cardH > vh;

  // Prefer hovering above cramped bottom targets; otherwise tuck it below with breathing room.
  if (isLowerHalf) {
    top = Math.round(Math.max(viewportPadding, domRectLike.top - cardH - 16));
    if (top + cardH > domRectLike.top && anchorBottom + 16 + cardH <= vh - viewportPadding) {
      top = Math.round(anchorBottom + 16);
    }
  } else {
    top = Math.round(anchorBottom + 16);
    if (top + cardH > vh - viewportPadding) {
      top = Math.round(Math.max(viewportPadding, domRectLike.top - cardH - 16));
    }
  }

  left = Math.min(Math.max(left, viewportPadding), vw - cardW - viewportPadding);
  top = Math.min(Math.max(top, viewportPadding), vh - cardH - viewportPadding);

  return { top, left, width: cardW };
}

/**
 * Full-screen onboarding rail that dims the chrome, punches a translucent hole, and narrates grouped tips.
 *
 * Controlled by {@link TutorialOverlayProps} handlers from `App.jsx` so replay + auto launch stay coordinated.
 */

/**
 * @typedef TutorialOverlayProps
 * @prop {boolean} isOpen — when false, nothing is painted but the instance stays mounted (stable across tab changes).
 * @prop {string|null} userId
 * @prop {() => void} onClose
 * @prop {(tab:string)=>void} setActiveTab
 * @prop {() => void} prepareHomeTutorialView
 * @prop {string} activeTab
 * @prop {() => void} [onSpotyTeamFriendAdded] — optional; notifies App to reload friends after a tutorial add
 */

function TutorialOverlay({
  isOpen,
  userId,
  activeTab,
  onClose,
  setActiveTab,
  prepareHomeTutorialView,
  onSpotyTeamFriendAdded,
}) {
  const prepareHomeSidebar = useCallback(() => {
    prepareHomeTutorialView();
  }, [prepareHomeTutorialView]);

  const switchToExploreTab = useCallback(() => {
    setActiveTab("explore");
  }, [setActiveTab]);

  const ensureExploreTab = useCallback(() => {
    setActiveTab("explore");
  }, [setActiveTab]);

  const switchToProfileTab = useCallback(() => {
    setActiveTab("profile");
  }, [setActiveTab]);

  const ensureProfileTab = useCallback(() => {
    setActiveTab("profile");
  }, [setActiveTab]);

  const segments = useMemo(
    () =>
      buildTutorialSegments({
        prepareHomeSidebar,
        switchToExploreTab,
        ensureExploreTab,
        switchToProfileTab,
        ensureProfileTab,
      }),
    [
      ensureExploreTab,
      ensureProfileTab,
      prepareHomeSidebar,
      switchToExploreTab,
      switchToProfileTab,
    ],
  );

  const [segmentIndex, setSegmentIndex] = useState(0);
  /** Bump this when the viewport resizes so we re-query element geometry without extra effects. */
  const [viewportRevision, setViewportRevision] = useState(0);
  /**
   * Bumped on a short delay after tab/step changes so Explore/Profile targets exist before we measure
   * (those roots mount after setActiveTab commits).
   */
  const [measureEpoch, setMeasureEpoch] = useState(0);
  const pulseElRef = useRef(null);
  /** Tracks the last isOpen value so we only reset the step index when the tour opens, not on every render. */
  const wasOpenRef = useRef(false);
  /** Confirmation line after “Add Spoty Team” succeeds or duplicate friend row is ignored */
  const [spotyTeamLine, setSpotyTeamLine] = useState(null);
  /** True while the tutorial fires the friends insert for the dev account */
  const [spotyTeamBusy, setSpotyTeamBusy] = useState(false);

  const currentSegment =
    segments[Math.min(segmentIndex, segments.length - 1)] || segments[0];

  /** Clear the Spoty-team CTA message whenever we leave that step or close the tour */
  useEffect(() => {
    if (!isOpen || !currentSegment?.showSpotyTeamAdd) {
      setSpotyTeamLine(null);
      setSpotyTeamBusy(false);
    }
  }, [isOpen, currentSegment, segmentIndex]);

  /**
   * Inserts the curated team friend row; duplicate key is treated like success (silent, no throw).
   */
  const handleAddSpotyTeam = async () => {
    if (!userId) return;
    setSpotyTeamBusy(true);
    try {
      const result = await addDevAccountFriend(userId);
      if (result.ok) {
        setSpotyTeamLine(
          result.duplicate
            ? "You already follow Spoty Team ✓"
            : "Added! Their spots will now appear on your map.",
        );
        onSpotyTeamFriendAdded?.();
        return;
      }
    } finally {
      setSpotyTeamBusy(false);
    }
  };

  /** When the sheet opens (including replay), rewind to step 1 without remounting the component. */
  useEffect(() => {
    const justOpened = isOpen && !wasOpenRef.current;
    wasOpenRef.current = isOpen;
    if (!justOpened) return undefined;
    const frameId = requestAnimationFrame(() => {
      setSegmentIndex(0);
      setMeasureEpoch((epoch) => epoch + 1);
    });
    return () => cancelAnimationFrame(frameId);
  }, [isOpen]);

  /** Listening to resize keeps the punched spotlight aligned without synchronous state inside layout effects */
  useEffect(() => {
    const handleResize = () => setViewportRevision((value) => value + 1);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /**
   * After switching tabs the new step’s anchor may not exist for a frame — schedule light re-measures.
   * (We intentionally do NOT put `activeTab` on the spotlight effect below, because home-prep would fight Explore/Profile.)
   */
  useEffect(() => {
    if (!isOpen) return undefined;
    const timeouts = [0, 300, 600].map((delay) =>
      window.setTimeout(() => setMeasureEpoch((epoch) => epoch + 1), delay),
    );
    return () => timeouts.forEach((id) => window.clearTimeout(id));
  }, [isOpen, segmentIndex, currentSegment?.targetSelector, activeTab]);

  /** Applies the halo class plus each segment prerequisite before paint so measurements match what the member sees */
  useLayoutEffect(() => {
    if (!isOpen || !currentSegment) return undefined;

    currentSegment.onEnter?.();

    const target = document.querySelector(currentSegment.targetSelector);

    pulseElRef.current?.classList.remove("spoty-tutorial-target-pulse");
    pulseElRef.current = target instanceof HTMLElement ? target : null;

    if (target instanceof HTMLElement) {
      target.classList.add("spoty-tutorial-target-pulse");
      pulseElRef.current = target;
      window.requestAnimationFrame(() => {
        target.scrollIntoView({ block: "center", behavior: "smooth", inline: "nearest" });
      });
    }

    return () => {
      pulseElRef.current?.classList.remove("spoty-tutorial-target-pulse");
    };
  }, [isOpen, currentSegment, segmentIndex, viewportRevision, measureEpoch]);

  /** Persist the completion flag keyed per logged-in Supabase identity. */
  const markTutorialComplete = () => {
    if (userId) {
      const key = `tutorial_done_${userId}`;
      console.log("[tutorial] storage write", { key, value: "true" });
      window.localStorage.setItem(key, "true");
    }
  };

  /** Skip immediately flags completion so autostart does not replay next session unless manual replay is chosen. */
  const handleSkip = () => {
    markTutorialComplete();
    onClose();
  };

  /** Advance to next segment or finish if we already spotlighted every stop. */
  const handlePrimaryAdvance = () => {
    const lastIndex = segments.length - 1;
    if (segmentIndex >= lastIndex) {
      markTutorialComplete();
      onClose();
      return;
    }

    // Tab switches (e.g. Explore / Profile) are batched with the step bump in the same React update.
    currentSegment.onAfterNext?.();
    setSegmentIndex((idx) => idx + 1);
    setMeasureEpoch((epoch) => epoch + 1);
  };

  const targetEl =
    typeof document !== "undefined"
      ? document.querySelector(currentSegment.targetSelector)
      : null;
  /** @type {DOMRect|null} */
  let targetRect =
    targetEl instanceof HTMLElement ? targetEl.getBoundingClientRect() : null;

  /** If selectors have not hydrated yet fall back to a centered portal so narration still shows. */
  if (!targetRect || targetRect.width === 0) {
    const vw = typeof window !== "undefined" ? window.innerWidth : 960;
    const vh = typeof window !== "undefined" ? window.innerHeight : 640;
    const size = Math.min(vw, vh) * 0.5;
    targetRect = new DOMRect(vw / 2 - size / 2, vh / 2 - size / 2, size, Math.max(220, size * 0.4));
  }

  /** Small breathing room prevents the punched hole from kissing icons edge-to-edge. */
  const padding = 12;
  const holeRect = {
    top: targetRect.top - padding,
    left: targetRect.left - padding,
    right: targetRect.right + padding,
    bottom: targetRect.bottom + padding,
  };

  const viewportW =
    typeof window !== "undefined" ? window.document.documentElement.clientWidth : targetRect.right;
  const viewportH =
    typeof window !== "undefined" ? window.document.documentElement.clientHeight : targetRect.bottom;

  const dimPieces =
    rectsForDimmerPieces(
      holeRect,
      viewportW || window.innerWidth,
      viewportH || window.innerHeight,
    ) ?? [];

  const holeWidth = Math.max(holeRect.right - holeRect.left, 32);
  const holeHeight = Math.max(holeRect.bottom - holeRect.top, 32);
  const anchorRectLike = {
    top: holeRect.top,
    left: holeRect.left,
    right: holeRect.right,
    bottom: holeRect.bottom,
    width: holeWidth,
    height: holeHeight,
  };

  const tooltipStyle = calculateTooltipPlacement(anchorRectLike, 150, 12);

  /** Hide the portal entirely when the tour is closed — hooks above stay active so tab switches never unmount us. */
  if (!isOpen) {
    return null;
  }

  return (
    <div className="spoty-tutorial-overlay" aria-live="polite">
      {/* Four translucent sheets recreate a cheap “inverse mask” that leaves the hotspot readable. */}
      {dimPieces.map((piece) => (
        <div
          key={`shade-${Math.round(piece.top)}-${Math.round(piece.left)}-${Math.round(piece.width)}-${Math.round(piece.height)}`}
          className="spoty-tutorial-dim-piece"
          style={piece}
        />
      ))}

      <div
        className="spoty-tutorial-spot-hole"
        style={{
          top: holeRect.top,
          left: holeRect.left,
          width: holeWidth,
          height: holeHeight,
        }}
      />

      <div
        className="spoty-tutorial-card"
        style={{ top: tooltipStyle.top, left: tooltipStyle.left, width: tooltipStyle.width }}
      >
        <div className="spoty-tutorial-counter">
          Step {currentSegment.displayStep} of {TOTAL_VISIBLE_STEPS}
        </div>
        <p className="spoty-tutorial-title">{currentSegment.title}</p>
        <p className="spoty-tutorial-body">{currentSegment.body}</p>
        {currentSegment.showSpotyTeamAdd && userId && (
          <div className="spoty-tutorial-team-add">
            <button
              type="button"
              className="spoty-tutorial-add-team-btn"
              onClick={handleAddSpotyTeam}
              disabled={spotyTeamBusy}
            >
              {spotyTeamBusy ? "Adding…" : "Add Spoty Team"}
            </button>
            {spotyTeamLine && (
              <p className="spoty-tutorial-team-confirm" role="status">
                {spotyTeamLine}
              </p>
            )}
          </div>
        )}
        <div className="spoty-tutorial-actions">
          <button type="button" className="spoty-tutorial-skip" onClick={handleSkip}>
            Skip tutorial
          </button>
          <button type="button" className="spoty-tutorial-next" onClick={handlePrimaryAdvance}>
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

export default TutorialOverlay;
