// Remember Me - Main Entry Point
import { processData } from './dataProcessor.js';
import { initializeSVG, drawVisualization } from './chart.js';
import { setupScrollObserver, setupIntroAnimations, setupDropdownFilter, setupPortraitModal } from './interactions.js';
import * as tooltipModule from './tooltip.js';
import { applyFilter } from './filters.js';

console.log("=== Remember Me ===");

// Expose tooltip module globally for use in filters
window.tooltipModule = tooltipModule;

let width, height;

// Initialize on page load
window.addEventListener('DOMContentLoaded', init);

function init() {
  console.log("Initializing...");

  const chartFixed = document.getElementById("chart-fixed");
  const rect = chartFixed ? chartFixed.getBoundingClientRect() : null;
  width = rect ? rect.width : window.innerWidth;
  height = rect ? rect.height : window.innerHeight * 0.75;
  
  // Initialize SVG
  initializeSVG(width, height);
  
  // Setup scroll direction detection for arrows
  setupScrollDirectionArrows();
  
  // Load data
  d3.csv("data/portraits_v1.csv").then(data => {
    console.log("Data loaded:", data.length, "rows");
    const portraits = processData(data);
    drawVisualization(width, height, portraits);
    setupScrollObserver();
    setupIntroAnimations();
    setupTitleAnimation(data);
  }).catch(err => {
    console.error("Error loading data:", err);
  });
}

// Detect scroll direction and update arrow directions
function setupScrollDirectionArrows() {
  let lastScrollY = window.scrollY;
  const arrows = document.querySelectorAll('.scroll-arrow');
  
  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    const scrollingDown = currentScrollY > lastScrollY;
    
    arrows.forEach(arrow => {
      arrow.textContent = scrollingDown ? '↓' : '↑';
    });
    
    lastScrollY = currentScrollY;
  }, { passive: true });
}

// Setup animated title with portrait swapping
function setupTitleAnimation(data) {
  const title = document.getElementById('animated-title');
  const text = 'Remember Me?';
  
  // Get valid thumbnails from data
  const thumbnails = data
    .filter(d => d.thumbnail && d.thumbnail.trim())
    .map(d => d.thumbnail.trim());
  
  if (thumbnails.length === 0) {
    console.warn("No thumbnails found in data");
    return;
  }
  
  // Split text into individual letters and wrap in spans
  title.innerHTML = text.split('').map((char, index) => {
    if (char === ' ') {
      return ' ';
    }
    // Mark 'e' and 'E' letters with a special class
    const isELetter = char.toLowerCase() === 'e';
    return `<span class="letter ${isELetter ? 'swappable' : ''}" data-index="${index}" data-original="${char}" data-swappable="${isELetter}">${char}</span>`;
  }).join('');
  
  const letters = title.querySelectorAll('.letter');
  
  const beginSwapping = () => {
    const measureAndStart = () => {
      lockLetterWidths(letters);
      setTimeout(() => {
        startLetterSwapping(letters, thumbnails);
      }, 2000);
    };
    
    // Wait a frame to ensure layout (and fonts) are ready before measuring
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(measureAndStart);
    } else {
      measureAndStart();
    }
  };
  
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(beginSwapping);
  } else {
    beginSwapping();
  }
}

function startLetterSwapping(letters, thumbnails) {
  const letterNodes = Array.from(letters);
  const swappableLetters = letterNodes.filter(l => l.dataset.swappable === 'true');
  const maxImagesInTitle = swappableLetters.length; // cap at number of available letters
  let lastChangedIndex = -1; // Track which letter was last changed
  
  function canPlaceImage(letterNode) {
    if (letterNode.dataset.swappable !== 'true') {
      return false;
    }
    
    const currentImages = letterNodes.filter(l => l.classList.contains('image-mode')).length;
    if (currentImages >= maxImagesInTitle) {
      return false;
    }
    
    const index = letterNodes.indexOf(letterNode);
    if (index === -1) {
      return false;
    }
    
    const prevHasImage = index > 0 && letterNodes[index - 1].classList.contains('image-mode');
    const nextHasImage = index < letterNodes.length - 1 && letterNodes[index + 1].classList.contains('image-mode');
    
    return !(prevHasImage || nextHasImage);
  }
  
  function swapRandomLetter() {
    // Find letters that can be changed (excluding the last changed one)
    const availableToChange = [];
    
    swappableLetters.forEach((letter, idx) => {
      const letterIndex = letterNodes.indexOf(letter);
      
      if (letter.classList.contains('image-mode')) {
        // Already an image - can restore to text if not the last changed
        if (letterIndex !== lastChangedIndex) {
          availableToChange.push({letter, letterIndex, action: 'restore'});
        }
      } else if (letterIndex !== -1 && letterIndex !== lastChangedIndex && canPlaceImage(letter)) {
        // Can convert to image if not the last changed
        availableToChange.push({letter, letterIndex, action: 'convert'});
      }
    });
    
    // Make a change if possible
    if (availableToChange.length > 0) {
      const randomChoice = availableToChange[Math.floor(Math.random() * availableToChange.length)];
      
      if (randomChoice.action === 'restore') {
        randomChoice.letter.classList.remove('image-mode');
        randomChoice.letter.innerHTML = randomChoice.letter.dataset.original;
        lastChangedIndex = randomChoice.letterIndex;
      } else if (randomChoice.action === 'convert') {
        const randomThumbnail = thumbnails[Math.floor(Math.random() * thumbnails.length)];
        randomChoice.letter.classList.add('image-mode');
        randomChoice.letter.innerHTML = `<img src="${randomThumbnail}" alt="Portrait" />`;
        lastChangedIndex = randomChoice.letterIndex;
      }
    }
  }
  
  // More frequent and continuous swapping
  setInterval(() => {
    swapRandomLetter();
  }, 400 + Math.random() * 600); // Between 0.4-1 seconds
}

function lockLetterWidths(letters) {
  letters.forEach(letter => {
    const rect = letter.getBoundingClientRect();
    if (!rect.width) return;
    letter.dataset.letterWidth = rect.width;
    letter.style.display = "inline-block";
    letter.style.width = `${rect.width}px`;
  });
}
