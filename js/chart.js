// Remember Me - Chart Visualization
import { CONFIG } from './config.js';
import { prepareChartData } from './dataProcessor.js';
import { createTooltip, showTooltip, moveTooltip, hideTooltip } from './tooltip.js';
import { getSpikeHighlighted } from './interactions.js';

export let svg, g;
export let chartData = null;

// Initialize SVG
export function initializeSVG(width, height) {
  svg = d3.select("#viz")
    .attr("width", width)
    .attr("height", height);
  
  svg.append("defs");
  
  return svg;
}

// Draw the main visualization
export function drawVisualization(width, height, allPortraits) {
  const { margin } = CONFIG.dimensions;
  const { yearRange, dotRadius } = CONFIG.timeline;
  
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  g = svg.append("g")
    .attr("id", "main")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
  
  // X scale for years
  const xScale = d3.scaleLinear()
    .domain(yearRange)
    .range([0, chartWidth]);
  
  // Prepare plot data
  const plotData = prepareChartData(xScale, chartHeight);
  
  // Draw X axis (visible from start)
  const xAxis = g.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${chartHeight})`)
    .style("opacity", 1)
    .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));
  
  xAxis.selectAll("text")
     .style("font-size", "21px")
    .style("font-family", "Gill Sans, Gill Sans MT, sans-serif");
  
  // Create tooltip
  createTooltip();
  
  // Draw dots (visible from start)
  const dots = g.selectAll(".portrait-dot")
    .data(plotData)
    .enter()
    .append("circle")
    .attr("class", "portrait-dot")
    .attr("cx", d => d.xPos)
    .attr("cy", d => d.yPos)
    .attr("r", dotRadius)
    .attr("fill", "#000")
    .attr("stroke", "none")
    .style("cursor", "pointer")
    .style("opacity", 1)
    .on("mouseover", function(event, d) {
      // Change dot color to accent color on hover
      d3.select(this).attr("fill", "#0000FF");
      showTooltip(event, d);
    })
    .on("mousemove", (event) => moveTooltip(event))
    .on("mouseout", function(event, d) {
      // Restore original color on mouseout
      const spikeHighlighted = getSpikeHighlighted();
      const currentFill = (spikeHighlighted && d.year === 1795) ? "#0000FF" : "#000";
      d3.select(this).attr("fill", currentFill);
      hideTooltip();
    });
  
  // Store chart data for updates
  chartData = { xScale, chartHeight, plotData, margin, chartWidth };
  window.chartData = chartData;
  
  console.log("Visualization drawn!");
  return chartData;
}

// Mark that the chart has been initialized
export function startChartAnimation() {
  console.log("Chart already visible and ready");
}

// Highlight the 1795 spike
export function highlightYear1795() {
  const dots = g.selectAll(".portrait-dot");
  const { transitionDuration } = CONFIG.animation;
  
  dots
    .transition()
    .duration(transitionDuration)
    .attr("opacity", d => d.year === 1795 ? 1 : 0.15)
    .attr("r", d => d.year === 1795 ? 6 : 5)
    .attr("fill", d => d.year === 1795 ? "#0000FF" : "#000");
}

// Unhighlight all dots (return to normal)
export function unhighlightDots() {
  const { dotRadius } = CONFIG.timeline;
  const { transitionDuration } = CONFIG.animation;
  const dots = g.selectAll(".portrait-dot");
  
  dots
    .transition()
    .duration(transitionDuration)
    .attr("opacity", 1)
    .attr("r", dotRadius)
    .attr("fill", "#000");
}

export function getChartData() {
  return chartData;
}
