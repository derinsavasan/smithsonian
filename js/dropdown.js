// Remember Me - Dropdown Component
import { applyFilter } from './filters.js';
import { CONFIG } from './config.js';
import { unhighlightDots } from './chart.js';

let isOpen = false;
let currentFilter = 'none';
let buttonText = null;
let buttonBg = null;

const dropdownData = [
  { id: 'size', label: 'Size' },
  { id: 'artist', label: 'Artist' },
  { id: 'sitter', label: 'Sitter' },
  { id: 'gender', label: "Sitter's Gender" },
  { id: 'none', label: 'Timeline View' }
];

// Get display name for category filter
function getCategoryDisplayName(filterType) {
  if (filterType === "none") return "Timeline View";
  const category = CONFIG.categories[filterType];
  return category ? category.name : filterType;
}

// Show category explanation text
function showCategoryExplanation(category) {
  const explanations = document.querySelectorAll('.filter-explanation');
  explanations.forEach(exp => exp.classList.remove('visible'));
  
  if (category !== "none") {
    const relevantExplanation = document.querySelector(`.filter-explanation[data-category="${category}"]`);
    if (relevantExplanation) {
      relevantExplanation.classList.add('visible');
    }
  }
}

export function createDropdown() {
  const container = d3.select("#d3-dropdown-container");
  
  // Create SVG - display only button height, menu overflows via CSS
  const svg = container.append("svg")
    .attr("width", 200)
    .attr("height", 44)
    .attr("viewBox", "0 0 200 44")
    .style("overflow", "visible");
  
  // Create button group
  const buttonGroup = svg.append("g")
    .attr("class", "d3-dropdown-button")
    .style("cursor", "pointer");
  
  // Button background (using path for independent corner control)
  buttonBg = buttonGroup.append("path")
    .attr("d", "M 22 0 L 178 0 Q 200 0 200 22 L 200 22 Q 200 44 178 44 L 22 44 Q 0 44 0 22 L 0 22 Q 0 0 22 0 Z")
    .attr("fill", "#000");
  
  // Add hover effect
  buttonGroup.on("mouseenter", function() {
    if (!isOpen && currentFilter === 'none') {
      buttonBg.attr("fill", "#333");
    }
    // If a category is selected (blue), don't change color on hover
  }).on("mouseleave", function() {
    if (!isOpen && currentFilter === 'none') {
      buttonBg.attr("fill", "#000");
    }
    // If a category is selected (blue), keep it blue
  });
  
  // Button text
  buttonText = buttonGroup.append("text")
    .attr("x", 90)
    .attr("y", 28)
    .attr("text-anchor", "middle")
    .attr("fill", "#fff")
    .attr("font-size", "22px")
    .attr("font-weight", "600")
    .style("pointer-events", "none")
    .text("this dropdown");
  
  // Arrow
  const arrow = buttonGroup.append("text")
    .attr("x", 175)
    .attr("y", 28)
    .attr("text-anchor", "middle")
    .attr("fill", "#fff")
    .attr("font-size", "18px")
    .attr("font-weight", "600")
    .style("pointer-events", "none")
    .text("↓");
  
  // Dropdown menu group
  const menuGroup = svg.append("g")
    .attr("class", "d3-dropdown-menu")
    .attr("transform", "translate(0, 44)")
    .style("opacity", 0)
    .style("pointer-events", "none");
  
  // Menu background
  const menuBg = menuGroup.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 200)
    .attr("height", 200)
    .attr("rx", 22)
    .attr("fill", "#f5f5f5")
    .style("filter", "drop-shadow(0 8px 25px rgba(0,0,0,0.3))");
  
  // Create menu items
  const itemHeight = 40;
  const menuItems = menuGroup.selectAll(".menu-item")
    .data(dropdownData)
    .enter()
    .append("g")
    .attr("class", "menu-item")
    .attr("transform", (d, i) => `translate(0, ${i * itemHeight})`)
    .style("cursor", "pointer");
  
  // Menu item backgrounds (for hover effect)
  const itemBgs = menuItems.append("rect")
    .attr("x", 8)
    .attr("y", 6)
    .attr("width", 184)
    .attr("height", 32)
    .attr("rx", 8)
    .attr("fill", "transparent");
  
  menuItems.on("mouseenter", function() {
    d3.select(this).select("rect")
      .attr("fill", "rgba(0, 0, 0, 0.06)");
  }).on("mouseleave", function() {
    d3.select(this).select("rect")
      .attr("fill", "transparent");
  });
  
  // Menu item text
  menuItems.append("text")
    .attr("x", 20)
    .attr("y", 26)
    .attr("fill", "#333")
    .attr("font-size", "20px")
    .attr("font-weight", "500")
    .style("pointer-events", "none")
    .text(d => d.label);
  
  // Toggle dropdown
  function toggleDropdown() {
    isOpen = !isOpen;
    
    if (isOpen) {
      // Open dropdown - square bottom corners (instant)
      buttonBg
        .attr("d", "M 22 0 L 178 0 Q 200 0 200 22 L 200 44 L 0 44 L 0 22 Q 0 0 22 0 Z");
      
      menuGroup
        .style("opacity", 1)
        .style("pointer-events", "all");
      
      arrow.attr("transform", "rotate(180) translate(-175, -28)");
      
    } else {
      // Close dropdown - all corners rounded (instant)
      buttonBg
        .attr("d", "M 22 0 L 178 0 Q 200 0 200 22 L 200 22 Q 200 44 178 44 L 22 44 Q 0 44 0 22 L 0 22 Q 0 0 22 0 Z");
      
      menuGroup
        .style("opacity", 0)
        .style("pointer-events", "none");
      
      arrow.attr("transform", "rotate(0)");
    }
  }
  
  // Button click handler
  buttonGroup.on("click", (event) => {
    event.stopPropagation();
    toggleDropdown();
  });
  
  // Menu item click handler
  menuItems.on("click", function(event, d) {
    event.stopPropagation();
    
    currentFilter = d.id;
    const categoryName = getCategoryDisplayName(d.id);
    
    // Update button text
    buttonText.text(categoryName);
    
    // Update button color based on selection
    const roundedPath = "M 22 0 L 178 0 Q 200 0 200 22 L 200 22 Q 200 44 178 44 L 22 44 Q 0 44 0 22 L 0 22 Q 0 0 22 0 Z";
    
    if (d.id === "none") {
      buttonBg
        .attr("fill", "#000")
        .attr("d", roundedPath);
    } else {
      // Category selected - use blue
      buttonBg
        .attr("fill", "#0000FF")
        .attr("d", roundedPath);
    }
    
    // Hide spike text when a category is selected
    if (d.id !== "none") {
      const spikeTextBox = document.querySelector('[data-step="spike-1795"] .text-box');
      if (spikeTextBox) {
        spikeTextBox.classList.remove("visible");
      }
      // Remove 1795 blue highlight when selecting a category
      unhighlightDots();
    }
    
    // Show explanation
    showCategoryExplanation(d.id);
    
    // Apply filter
    applyFilter(d.id);
    
    // Close dropdown
    toggleDropdown();
  });
  
  // Close on outside click
  d3.select("body").on("click.dropdown", () => {
    if (isOpen) {
      toggleDropdown();
    }
  });
  
  svg.on("click", (event) => {
    event.stopPropagation();
  });
}

// Reset dropdown to default state
export function resetDropdown() {
  if (buttonText && buttonBg) {
    currentFilter = 'none';
    buttonText.text("this dropdown");
    buttonBg
      .attr("fill", "#000")
      .attr("d", "M 22 0 L 178 0 Q 200 0 200 22 L 200 22 Q 200 44 178 44 L 22 44 Q 0 44 0 22 L 0 22 Q 0 0 22 0 Z");
  }
}
