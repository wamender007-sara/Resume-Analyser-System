/**
 * ad-slot.js — Reusable Advertisement Reservation Slot Component
 * 
 * Complies with:
 * - Fixed min-height reservation to prevent layout shift (CLS)
 * - Props: slotId, format ('banner' | 'rectangle'), className
 * - Light-mode responsive styling with light grey background and "Advertisement" label
 * - Single configuration flag (ADS_ENABLED = false) so it renders nothing until enabled
 * - Strict button-distance policy (at least 200px from any CTA button)
 * - Visible only after analysis results are loaded, never on the empty state
 */

// Single configuration flag: renders nothing until turned on
export const ADS_CONFIG = {
  ADS_ENABLED: false
};

// Global accessor for console inspection or test frameworks
if (typeof window !== 'undefined') {
  window.ADS_CONFIG = ADS_CONFIG;
  try {
    Object.defineProperty(window, 'ADS_ENABLED', {
      get: () => ADS_CONFIG.ADS_ENABLED,
      set: (val) => {
        ADS_CONFIG.ADS_ENABLED = Boolean(val);
        updateAllAdSlots();
      },
      configurable: true
    });
  } catch (e) {
    window.ADS_ENABLED = false;
  }
}

/**
 * Reusable AdSlot Component Function
 * @param {Object} props
 * @param {string} props.slotId - Unique slot identifier
 * @param {'banner'|'rectangle'} [props.format='banner'] - Format type ('banner' | 'rectangle')
 * @param {string} [props.className=''] - Additional CSS classes
 * @returns {HTMLElement|null} - AdSlot DOM element if ADS_ENABLED is true, otherwise null
 */
export function AdSlot({ slotId, format = 'banner', className = '' } = {}) {
  // If ads are disabled, render nothing
  if (!ADS_CONFIG.ADS_ENABLED) {
    return null;
  }

  const normalizedFormat = format === 'rectangle' ? 'rectangle' : 'banner';

  const container = document.createElement('div');
  if (slotId) {
    container.id = slotId;
    container.setAttribute('data-slot-id', slotId);
  }
  container.setAttribute('data-format', normalizedFormat);
  container.className = `ad-slot ad-slot-${normalizedFormat} ${className || ''}`.trim();

  // Label: "Advertisement"
  const label = document.createElement('span');
  label.className = 'ad-slot-label';
  label.textContent = 'Advertisement';

  // Inner placeholder maintaining fixed min-height
  const placeholder = document.createElement('div');
  placeholder.className = 'ad-slot-inner';
  placeholder.setAttribute('aria-label', `Reserved Ad Space: ${slotId || normalizedFormat}`);

  container.appendChild(label);
  container.appendChild(placeholder);

  return container;
}

/**
 * Predefined slot specifications for the 3 designated locations
 */
export const AD_SLOT_DEFINITIONS = [
  {
    slotId: 'ad-center-optimization-dimensions',
    format: 'banner',
    className: 'ad-slot-center-banner',
    location: 'Center column, between Interactive Resume Optimization card and 6 Core Evaluative Dimensions section'
  },
  {
    slotId: 'ad-center-bottom-breakdown',
    format: 'banner',
    className: 'ad-slot-bottom-banner',
    location: 'Bottom of the center column, after the Section Breakdown'
  },
  {
    slotId: 'ad-left-below-analyse',
    format: 'rectangle',
    className: 'ad-left-rectangle',
    location: 'Left column, below the Analyse Resume button (300x250 rectangle)'
  }
];

/**
 * Checks if analysis results are currently visible in the DOM
 * (ads must NEVER be shown on the empty "Ready to Analyse" screen)
 * @returns {boolean}
 */
export function areResultsVisible() {
  if (typeof document === 'undefined') return false;
  const resultsEl = document.getElementById('results');
  const emptyState = document.getElementById('emptyState');
  const isResultsVisible = resultsEl && !resultsEl.classList.contains('hidden');
  const isEmptyHidden = !emptyState || emptyState.classList.contains('hidden');
  return !!(isResultsVisible && isEmptyHidden);
}

/**
 * Updates all ad slots in the DOM based on ADS_ENABLED and results visibility
 */
export function updateAllAdSlots() {
  if (typeof document === 'undefined') return;

  const resultsActive = areResultsVisible();

  AD_SLOT_DEFINITIONS.forEach(def => {
    const placeholderWrap = document.querySelector(`[data-ad-placeholder="${def.slotId}"]`);
    if (!placeholderWrap) return;

    placeholderWrap.innerHTML = '';

    // Condition: Only render if ADS_ENABLED is true AND analysis results are visible
    if (ADS_CONFIG.ADS_ENABLED && resultsActive) {
      const slotElement = AdSlot(def);
      if (slotElement) {
        placeholderWrap.appendChild(slotElement);
        placeholderWrap.style.display = 'flex';
        placeholderWrap.classList.remove('hidden-ad-slot');
      }
    } else {
      placeholderWrap.style.display = 'none';
      placeholderWrap.classList.add('hidden-ad-slot');
    }
  });
}
