// Remember Me - Interaction Management (no scrollytelling)
import { applyFilter } from './filters.js';
import { createDropdown, resetDropdown } from './dropdown.js';

// Spike highlight is unused in the static layout but kept for compatibility
export function getSpikeHighlighted() {
  return false;
}

// Set up the page without scroll-driven triggers
export function setupScrollObserver() {
  const chartFixed = document.getElementById("chart-fixed");
  if (chartFixed) {
    chartFixed.style.display = "block";
  }
  // Initialize dropdown and default timeline view
  createDropdown();
  applyFilter("none");
  resetDropdown();
  const dropdownContainer = document.querySelector('#d3-dropdown-container');
  if (dropdownContainer) {
    dropdownContainer.classList.add("visible");
  }
}

// Intro text fades in once
export function setupIntroAnimations() {
  const introText = document.querySelector(".intro-text");
  if (introText) {
    introText.classList.add("visible");
  }
}

// Placeholder kept for backward compatibility
export function setupPortraitModal() {
  return;
}

// Set up dropdown filter (direct call kept for existing imports)
export function setupDropdownFilter() {
  createDropdown();
  const dropdownContainer = document.querySelector('#d3-dropdown-container');
  if (dropdownContainer) {
    dropdownContainer.classList.add("visible");
  }
}
