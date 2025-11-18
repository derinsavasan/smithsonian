// Remember Me - Filter/Category System
import { CONFIG } from './config.js';
import { g, getChartData, unhighlightDots } from './chart.js';

// Apply categorical filter
export function applyFilter(filterType) {
  const chartData = getChartData();
  if (!chartData) return;
  
  const { xScale, chartHeight, plotData, chartWidth } = chartData;
  const { dotRadius, dotSpacing } = CONFIG.timeline;
  const { transitionDuration } = CONFIG.animation;
  
  const dots = g.selectAll(".portrait-dot");
  const xAxis = g.select(".x-axis");
  
  // Remove old labels
  g.selectAll(".category-label").remove();
  g.selectAll(".divider-line").remove();
  
  if (filterType === "none") {
    // Return to timeline view
    xAxis.transition()
      .duration(transitionDuration)
      .attr("transform", `translate(0, ${chartHeight})`);
    
    // Move labels back to original position
    xAxis.selectAll("text")
      .transition()
      .duration(transitionDuration)
      .ease(d3.easeCubicInOut)
      .attr("y", 9)
      .style("opacity", 1);
    
    // Return dots to original positions
    dots.transition()
      .duration(transitionDuration)
      .ease(d3.easeCubicInOut)
      .attr("cy", d => d.yPos)
      .attr("opacity", 1)
      .attr("r", dotRadius)
      .attr("fill", "#000");
    return;
  }
  
  // When applying a categorical filter, make sure to unhighlight the 1795 year
  unhighlightDots();
  
  // Get category configuration
  const categoryConfig = CONFIG.categories[filterType];
  if (!categoryConfig) {
    console.error("Unknown filter type:", filterType);
    return;
  }
  
  const { groups: categories, getValue: getCategoryValue } = categoryConfig;
  
  // Calculate new positions
  const { newPositions, axisY } = calculateCategoricalLayout(
    plotData, xScale, chartHeight, categories, getCategoryValue
  );
  
  // Move x-axis to dynamic position
  xAxis.transition()
    .duration(transitionDuration)
    .ease(d3.easeCubicInOut)
    .attr("transform", `translate(0, ${axisY})`);
  
  // Move year labels to bottom and hide them for categorical views
  xAxis.selectAll("text")
    .transition()
    .duration(transitionDuration)
    .ease(d3.easeCubicInOut)
    .attr("y", chartHeight - axisY + 9)
    .style("opacity", 0);
  
  // Update dot positions
  const transitionedDots = dots.data(newPositions, d => d.index)
    .transition()
    .duration(transitionDuration)
    .ease(d3.easeCubicInOut)
    .attr("cy", d => d.newY)
    .attr("opacity", 1)
    .attr("r", dotRadius)
    .attr("fill", "#000");
  
  // Re-enable hover interactions after transition
  transitionedDots.end().then(() => {
    dots.on("mouseover", function(event, d) {
      d3.select(this).attr("fill", "#0000FF");
      const tooltipModule = window.tooltipModule;
      if (tooltipModule) {
        tooltipModule.showTooltip(event, d);
      }
    })
    .on("mousemove", function(event) {
      const tooltipModule = window.tooltipModule;
      if (tooltipModule) {
        tooltipModule.moveTooltip(event);
      }
    })
    .on("mouseout", function(event, d) {
      d3.select(this).attr("fill", "#000");
      const tooltipModule = window.tooltipModule;
      if (tooltipModule) {
        tooltipModule.hideTooltip();
      }
    });
  });
  
  // Add divider line
  addDividerLine(xScale, axisY, transitionDuration);
  
  // Add category labels
  addCategoryLabels(categories, axisY, transitionDuration);
}

// Calculate layout for categorical view
function calculateCategoricalLayout(plotData, xScale, chartHeight, categories, getCategoryValue) {
  const { dotSpacing } = CONFIG.timeline;
  const startOffset = 20;
  const topPadding = 180;
  
  // Group by year
  const grouped = d3.group(plotData, d => d.year);
  
  // Calculate max counts for each category
  let maxUpperCount = 0;
  let maxLowerCount = 0;
  
  grouped.forEach((yearData) => {
    const categorized = {};
    categories.forEach(cat => categorized[cat] = []);
    
    yearData.forEach(d => {
      const category = getCategoryValue(d);
      if (categorized[category]) {
        categorized[category].push(d);
      }
    });
    
    maxUpperCount = Math.max(maxUpperCount, categorized[categories[0]].length);
    maxLowerCount = Math.max(maxLowerCount, categorized[categories[1]].length);
  });
  
  // Calculate dynamic axis position
  const upperHeight = maxUpperCount * dotSpacing + startOffset;
  const lowerHeight = maxLowerCount * dotSpacing + startOffset;
  const dynamicAxisY = topPadding + upperHeight;
  const requiredBottomSpace = lowerHeight + 40;
  const minBottomSpace = Math.max(120, requiredBottomSpace);
  const maxAxisY = chartHeight - minBottomSpace;
  const axisY = Math.min(dynamicAxisY, maxAxisY);
  
  // Position dots
  const newPositions = [];
  
  grouped.forEach((yearData, year) => {
    const categorized = {};
    categories.forEach(cat => categorized[cat] = []);
    
    yearData.forEach(d => {
      const category = getCategoryValue(d);
      if (categorized[category]) {
        categorized[category].push(d);
      }
    });
    
    const xPos = xScale(year);
    
    // Upper category - above the axis
    categorized[categories[0]].forEach((d, i) => {
      newPositions.push({
        ...d,
        newY: axisY - startOffset - (i * dotSpacing),
        category: categories[0]
      });
    });
    
    // Lower category - below the axis
    categorized[categories[1]].forEach((d, i) => {
      newPositions.push({
        ...d,
        newY: axisY + startOffset + (i * dotSpacing),
        category: categories[1]
      });
    });
  });
  
  return { newPositions, axisY };
}

// Add divider line at axis position
function addDividerLine(xScale, axisY, duration) {
  const { yearRange } = CONFIG.timeline;
  
  setTimeout(() => {
    g.append("line")
      .attr("class", "divider-line")
      .attr("x1", 0)
      .attr("x2", xScale(yearRange[1]))
      .attr("y1", axisY)
      .attr("y2", axisY)
      .attr("stroke", "#ddd")
      .attr("stroke-width", 1)
      .style("opacity", 0)
      .transition()
      .duration(400)
      .style("opacity", 0.5);
  }, duration / 2);
}

// Add category labels
function addCategoryLabels(categories, axisY, duration) {
  const labelDistance = 80;
  const labelY1 = axisY - labelDistance;
  const labelY2 = axisY + labelDistance;
  
  setTimeout(() => {
    // Upper label
    g.append("text")
      .attr("class", "category-label")
      .attr("x", -30)
      .attr("y", labelY1)
      .attr("text-anchor", "middle")
      .attr("transform", `rotate(-90, -30, ${labelY1})`)
      .style("font-size", "21px")
      .style("fill", "#0000FF")
      .style("font-weight", "500")
      .style("opacity", 0)
      .text(categories[0])
      .transition()
      .duration(400)
      .style("opacity", 1);
    
    // Lower label
    g.append("text")
      .attr("class", "category-label")
      .attr("x", -30)
      .attr("y", labelY2)
      .attr("text-anchor", "middle")
      .attr("transform", `rotate(-90, -30, ${labelY2})`)
      .style("font-size", "21px")
      .style("fill", "#0000FF")
      .style("font-weight", "500")
      .style("opacity", 0)
      .text(categories[1])
      .transition()
      .duration(400)
      .style("opacity", 1);
  }, duration / 2);
}
