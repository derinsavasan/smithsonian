// Remember Me - Tooltip Management
import { CONFIG } from './config.js';

let tooltipElement = null;

// Create tooltip element
export function createTooltip() {
  tooltipElement = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "12px 15px")
    .style("background", "rgba(0, 0, 0, 0.9)")
    .style("color", "#fff")
    .style("border-radius", "8px")
    .style("font-size", "1.2rem")
    .style("font-family", "'Cabin', Arial, sans-serif")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("z-index", 1000)
    .style("max-width", "320px")
    .style("line-height", "1.5")
    .style("display", "flex")
    .style("gap", "12px")
    .style("align-items", "center");
  
  return tooltipElement;
}

// Calculate tooltip position with edge detection
function calculateTooltipPosition(event, tooltipNode) {
  const tooltipWidth = tooltipNode.offsetWidth;
  const tooltipHeight = tooltipNode.offsetHeight;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const { edgePadding } = CONFIG.tooltip;
  
  // Determine if tooltip should appear on left or right
  const spaceOnRight = windowWidth - event.clientX;
  const spaceOnLeft = event.clientX;
  const shouldPlaceLeft = spaceOnRight < tooltipWidth + edgePadding && spaceOnLeft > spaceOnRight;
  
  // Position horizontally
  let left = shouldPlaceLeft 
    ? event.clientX - tooltipWidth - 15 
    : event.clientX + 15;
  
  // Use clientY for viewport-relative positioning
  let top = event.clientY - 10 + window.scrollY;
  
  // Adjust if too close to top edge (viewport relative)
  if (event.clientY - 10 < edgePadding) {
    top = edgePadding + window.scrollY;
  }
  
  // Adjust if too close to bottom edge
  if (event.clientY + tooltipHeight > windowHeight - edgePadding) {
    top = event.clientY - tooltipHeight + 10 + window.scrollY;
  }
  
  return { left, top };
}

// Build tooltip HTML content
function buildTooltipContent(d) {
  const { thumbnailSize } = CONFIG.tooltip;
  
  let content = '<div style="flex: 1; min-width: 0;">';
  content += `
    <strong style="display: block; margin-bottom: 4px; font-size: 1.38rem; line-height: 1.3;">${d.title || "Untitled"}</strong>
    <em style="display: block; margin-bottom: 2px; font-size: 1.2rem; line-height: 1.3; font-style: italic;">${d.artist || "Unknown Artist"}</em>
    <span style="display: block; margin-bottom: 2px; font-size: 1.15rem; line-height: 1.3;">${d.sitter || "Unknown Sitter"}</span>
    <span style="display: block; font-size: 1rem; line-height: 1.3; color: rgba(255, 255, 255, 0.75);">Year: ${d.year}</span>
  `;
  content += '</div>';
  
  if (d.thumbnail) {
    content += `<img src="${d.thumbnail}" 
      style="width: ${thumbnailSize}px; height: ${thumbnailSize}px; object-fit: cover; border-radius: 4px; flex-shrink: 0;" 
      onerror="this.style.display='none'"/>`;
  }
  
  return content;
}

// Show tooltip
export function showTooltip(event, d) {
  if (!tooltipElement) return;
  
  tooltipElement.transition()
    .duration(200)
    .style("opacity", 1);
  
  tooltipElement.html(buildTooltipContent(d));
  
  const tooltipNode = tooltipElement.node();
  const { left, top } = calculateTooltipPosition(event, tooltipNode);
  
  tooltipElement
    .style("left", left + "px")
    .style("top", top + "px");
}

// Move tooltip
export function moveTooltip(event) {
  if (!tooltipElement) return;
  
  const tooltipNode = tooltipElement.node();
  const { left, top } = calculateTooltipPosition(event, tooltipNode);
  
  tooltipElement
    .style("left", left + "px")
    .style("top", top + "px");
}

// Hide tooltip
export function hideTooltip() {
  if (!tooltipElement) return;
  
  tooltipElement.transition()
    .duration(200)
    .style("opacity", 0);
}

export function getTooltip() {
  return tooltipElement;
}
