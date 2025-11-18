// Remember Me - Data Processing
import { CONFIG } from './config.js';

export let allPortraits = [];

// Parse year from date string
function parseYear(dateStr) {
  if (!dateStr) return null;
  let match = /\b(1[6-9]\d{2}|20\d{2})\b/.exec(dateStr);
  if (match) return +match[1];
  match = /\b(1[6-9]\d)0s\b/.exec(dateStr);
  if (match) return parseInt(match[1] + "5");
  if (/early 19th century/.test(dateStr)) return 1805;
  if (/late 18th century/.test(dateStr)) return 1785;
  return null;
}

// Process CSV data
export function processData(data) {
  allPortraits = data.map(d => ({
    year: parseYear(d.date),
    title: d.title || "",
    artist: d.artist || "",
    sitter: d.sitter || "",
    size: d.size || "Unknown",
    gender: (d["sitter gender"] || "").toLowerCase().trim(),
    thumbnail: d.thumbnail || "",
    thumbnailLowRes: d["thumbnail-low-res"] || d.thumbnail || ""
  })).filter(d => {
    const [minYear, maxYear] = CONFIG.timeline.yearRange;
    return d.year && d.year >= minYear && d.year <= maxYear;
  });
  
  console.log("Processed:", allPortraits.length, "portraits");
  return allPortraits;
}

// Prepare plot data with positions
export function prepareChartData(xScale, chartHeight) {
  const byYear = d3.group(allPortraits, d => d.year);
  const plotData = [];
  
  byYear.forEach((portraits, year) => {
    portraits.forEach((portrait, i) => {
      plotData.push({
        ...portrait,
        xPos: xScale(year),
        yPos: chartHeight - (i * CONFIG.timeline.dotSpacing) - 20,
        index: plotData.length
      });
    });
  });
  
  console.log("Plot data:", plotData.length, "points");
  return plotData;
}
