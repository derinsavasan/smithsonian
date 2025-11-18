// Remember Me - Scroll & Interaction Management
import { startChartAnimation, highlightYear1795, unhighlightDots, getChartData } from './chart.js';
import { applyFilter } from './filters.js';
import { CONFIG } from './config.js';
import { createDropdown, resetDropdown } from './dropdown.js';

// Track which sections have been loaded
const loadedSections = {
  timeline: false,
  spike: false,
  filter: false
};

// Track current state
let spikeHighlighted = false;

// Export spike highlighted state
export function getSpikeHighlighted() {
  return spikeHighlighted;
}

// Track current active step
let currentActiveStep = null;

// Set up scroll observer for main sections
export function setupScrollObserver() {
  const steps = document.querySelectorAll(".step");
  const landing = document.getElementById("landing");
  const intro = document.getElementById("intro");
  const memoryGame = document.getElementById("memory-game-section");
  const chartFixed = document.getElementById("chart-fixed");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const step = entry.target.dataset ? entry.target.dataset.step : null;

      if (entry.isIntersecting) {
        if (step) {
          // Entering a scrollytelling section
          console.log("Active step:", step);
          currentActiveStep = step;
          updateVisualization(step);
          if (chartFixed) chartFixed.style.display = "block";
        } else if (entry.target === landing || entry.target === intro || entry.target === memoryGame) {
          // Entering landing, intro, or memory game: hide overlays and chart
          hideAllOverlayElements();
          if (chartFixed) chartFixed.style.display = "none";
        }
      } else {
        if (step && currentActiveStep === step) {
          // Leaving a scrollytelling section
          console.log("Leaving step:", step);
          handleSectionExit(step);
          currentActiveStep = null;
        }
      }
    });
  }, {
    threshold: 0.3,
    rootMargin: "0px 0px -20% 0px"
  });

  steps.forEach(step => observer.observe(step));
  if (landing) observer.observe(landing);
  if (intro) observer.observe(intro);
  if (memoryGame) observer.observe(memoryGame);
  console.log("Scroll observer set up for", steps.length, "steps");
}

// Set up intro animations
export function setupIntroAnimations() {
  const chartFixed = document.getElementById("chart-fixed");
  chartFixed.style.display = "none";
  chartFixed.style.opacity = "1"; // Make chart fully visible once shown
  
  // Show chart when scrolling past intro and keep it visible
  const introSection = document.getElementById("intro");
  const chartVisibilityObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
        chartFixed.style.display = "block";
      } else if (entry.isIntersecting) {
        chartFixed.style.display = "none";
      }
    });
  }, { threshold: 0.1 });
  
  chartVisibilityObserver.observe(introSection);
  
  // Hide chart when scrolling to memory game section
  const memoryGameSection = document.getElementById("memory-game-section");
  if (memoryGameSection) {
    const memoryGameObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Memory game is in view - hide chart
          chartFixed.style.display = "none";
        }
        // Don't automatically show chart here - let the intro observer handle it
      });
    }, { threshold: 0.2 });
    
    memoryGameObserver.observe(memoryGameSection);
  }
  
  // Animate intro text paragraph by paragraph
  const introText = document.querySelector(".intro-text");
  if (introText) {
    const introTextObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Add visible class to trigger staggered animation
          introText.classList.add("visible");
          introTextObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    
    introTextObserver.observe(introText);
  }
}

// Hide all overlay elements (text boxes, explanations, dropdown, portrait)
function hideAllOverlayElements() {
  const spikeTextBox = document.querySelector('[data-step="spike-1795"] .text-box');
  const filterTextBox = document.querySelector('[data-step="filter"] .text-box');
  const categoryExplanations = document.querySelectorAll('.filter-explanation');
  const dropdownContainer = document.querySelector('#d3-dropdown-container');
  const washingtonPortrait = document.querySelector('#washington-portrait');

  if (spikeTextBox) spikeTextBox.classList.remove("visible");
  if (filterTextBox) filterTextBox.classList.remove("visible");
  categoryExplanations.forEach(exp => exp.classList.remove("visible"));
  if (dropdownContainer) dropdownContainer.classList.remove("visible");
  if (washingtonPortrait) washingtonPortrait.classList.remove("visible");
}

// Set up dropdown filter
export function setupDropdownFilter() {
  // Create dropdown
  createDropdown();
}

// Set up portrait modal
export function setupPortraitModal() {
  const portrait = document.querySelector('#washington-portrait img');
  const modal = document.querySelector('#portrait-modal');
  const modalClose = document.querySelector('#modal-close');
  const modalOverlay = document.querySelector('.modal-overlay');
  
  if (portrait && modal) {
    // Open modal when portrait is clicked
    portrait.addEventListener('click', () => {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    });
    
    // Close modal functions
    const closeModal = () => {
      modal.classList.remove('active');
      document.body.style.overflow = ''; // Restore scroll
    };
    
    // Close on X button click
    if (modalClose) {
      modalClose.addEventListener('click', closeModal);
    }
    
    // Close on overlay click
    if (modalOverlay) {
      modalOverlay.addEventListener('click', closeModal);
    }
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
  }
}

// Handle section exit
function handleSectionExit(step) {
  switch(step) {
    case "explanations":
      // When leaving explanations, reset to timeline default view
      console.log("Resetting to timeline view from explanations");
      if (getChartData()) {
        applyFilter("none");
        resetDropdown();
      }
      if (spikeHighlighted) {
        unhighlightDots();
        spikeHighlighted = false;
      }
      break;
  }
}

// Handle section entering viewport - progressive loading
function updateVisualization(step) {
  const spikeTextBox = document.querySelector('[data-step="spike-1795"] .text-box');
  const filterTextBox = document.querySelector('[data-step="filter"] .text-box');
  const categoryExplanations = document.querySelectorAll('.filter-explanation');
  const dropdownContainer = document.querySelector('#d3-dropdown-container');
  const washingtonPortrait = document.querySelector('#washington-portrait');
  
  // Hide all text boxes first
  if (spikeTextBox) spikeTextBox.classList.remove("visible");
  if (filterTextBox) filterTextBox.classList.remove("visible");
  // Hide all category explanations
  categoryExplanations.forEach(exp => exp.classList.remove("visible"));
  // Hide dropdown by default
  if (dropdownContainer) dropdownContainer.classList.remove("visible");
  
  // Handle Washington portrait visibility (only remove if not going to spike section)
  if (washingtonPortrait && step !== "spike-1795") {
    washingtonPortrait.classList.remove("visible");
  }
  
  switch(step) {
    case "timeline":
      if (!loadedSections.timeline) {
        // First time loading timeline - chart is already visible
        startChartAnimation();
        loadedSections.timeline = true;
      }
      
      // Always ensure timeline state: no highlights, reset dropdown
      if (getChartData()) {
        applyFilter("none");
        resetDropdown();
      }
      
      // Remove spike highlight if present
      if (spikeHighlighted) {
        unhighlightDots();
        spikeHighlighted = false;
      }
      
      // Chart stays visible, no text shown in timeline section
      break;
      
    case "spike-1795":
      // Reset to timeline view first if in categorical
      if (getChartData()) {
        applyFilter("none");
        resetDropdown();
      }
      
      // Always highlight 1795 when in spike section
      if (!spikeHighlighted) {
        highlightYear1795();
        spikeHighlighted = true;
      }
      
      if (!loadedSections.spike) {
        loadedSections.spike = true;
      }
      
      // Show spike text - this co-occurs with blue highlighting
      if (spikeTextBox) spikeTextBox.classList.add("visible");
      // Show Washington portrait during spike sequence
      if (washingtonPortrait) washingtonPortrait.classList.add("visible");
      // Chart stays visible with 1795 highlighted
      break;
      
    case "filter":
      // Remove spike highlighting when entering filter section
      if (spikeHighlighted) {
        unhighlightDots();
        spikeHighlighted = false;
      }
      
      if (!loadedSections.filter) {
        // First time loading filter section
        loadedSections.filter = true;
      }
      
      // Check if user had selected a category by checking dropdown button text
      const dropdownButton = document.querySelector('.d3-dropdown-button text');
      const hadSelectedCategory = dropdownButton && dropdownButton.textContent !== 'this dropdown' && dropdownButton.textContent !== 'Timeline View';
      
      if (hadSelectedCategory) {
        // User is scrolling up from explanations after selecting a category
        // Reset to idle state: dropdown showing "this dropdown", timeline view, no highlight
        applyFilter("none");
        resetDropdown();
      }
      
      // Show filter text and dropdown - this is parallax behavior
      if (filterTextBox) {
        filterTextBox.classList.add("visible");
      }
      // Show dropdown in filter section
      if (dropdownContainer) {
        dropdownContainer.classList.add("visible");
      }
      // Maintain idle state: dropdown visible, 1795 NOT highlighted
      break;
      
    case "explanations":
      // Keep showing category explanations based on current filter
      // Dropdown stays visible
      if (dropdownContainer) {
        dropdownContainer.classList.add("visible");
      }
      // Keep showing the explanation for the selected category
      const currentDropdownText = document.querySelector('.d3-dropdown-button text');
      if (currentDropdownText) {
        const buttonText = currentDropdownText.textContent;
        // Find which category is selected and ensure its explanation is visible
        if (buttonText !== 'this dropdown' && buttonText !== 'Timeline View') {
          // A category is selected, keep its explanation visible
          const categoryMap = {
            'Size': 'size',
            'Artist': 'artist',
            'Sitter': 'sitter',
            "Sitter's Gender": 'gender'
          };
          const categoryId = categoryMap[buttonText];
          if (categoryId) {
            const explanation = document.querySelector(`.filter-explanation[data-category="${categoryId}"]`);
            if (explanation) {
              explanation.classList.add('visible');
            }
          }
        }
      }
      break;
      
    case "end":
      // End spacer - keep current state
      break;
  }
}
