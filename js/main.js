// Remember Me - Main Entry Point
import { processData } from './dataProcessor.js';
import { initializeSVG, drawVisualization } from './chart.js';
import { setupScrollObserver, setupIntroAnimations, setupDropdownFilter, setupPortraitModal } from './interactions.js';
import * as tooltipModule from './tooltip.js';

console.log("=== Remember Me ===");

// Expose tooltip module globally for use in filters
window.tooltipModule = tooltipModule;

let width, height;

// Initialize on page load
window.addEventListener('DOMContentLoaded', init);

function init() {
  console.log("Initializing...");
  
  // Ensure chart is hidden on initial load
  const chartFixed = document.getElementById("chart-fixed");
  if (chartFixed) {
    chartFixed.style.display = "none";
  }
  
  // Set dimensions
  width = window.innerWidth;
  height = window.innerHeight;
  
  // Initialize SVG
  initializeSVG(width, height);
  
  // Load data
  d3.csv("data/portraits_v1.csv").then(data => {
    console.log("Data loaded:", data.length, "rows");
    const portraits = processData(data);
    drawVisualization(width, height, portraits);
    setupScrollObserver();
    setupDropdownFilter();
    setupIntroAnimations();
    setupTitleAnimation(data);
  }).catch(err => {
    console.error("Error loading data:", err);
  });
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
  
  // Start animation after a delay
  setTimeout(() => {
    startLetterSwapping(letters, thumbnails);
  }, 2000);
}

function startLetterSwapping(letters, thumbnails) {
  const maxImagesInTitle = 4; // Maximum 4 images in the title at once (all 4 e's can flicker)
  let lastChangedIndex = -1; // Track which letter was last changed
  
  function canPlaceImageAtIndex(index) {
    const letter = letters[index];
    // Only allow swapping on 'e' letters
    if (letter.dataset.swappable !== 'true') {
      return false;
    }
    
    // Check if there are already max images
    const currentImages = Array.from(letters).filter(l => l.classList.contains('image-mode')).length;
    if (currentImages >= maxImagesInTitle) {
      return false;
    }
    
    // Check if adjacent letters have images
    const prevHasImage = index > 0 && letters[index - 1].classList.contains('image-mode');
    const nextHasImage = index < letters.length - 1 && letters[index + 1].classList.contains('image-mode');
    
    if (prevHasImage || nextHasImage) {
      return false;
    }
    
    return true;
  }
  
  function swapRandomLetter() {
    // Get all 'e' letters
    const swappableLetters = Array.from(letters).filter(l => l.dataset.swappable === 'true');
    
    // Find letters that can be changed (excluding the last changed one)
    const availableToChange = [];
    
    swappableLetters.forEach((letter, idx) => {
      const letterIndex = parseInt(letter.dataset.index);
      
      if (letter.classList.contains('image-mode')) {
        // Already an image - can restore to text if not the last changed
        if (letterIndex !== lastChangedIndex) {
          availableToChange.push({letter, letterIndex, action: 'restore'});
        }
      } else if (canPlaceImageAtIndex(letterIndex) && letterIndex !== lastChangedIndex) {
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
