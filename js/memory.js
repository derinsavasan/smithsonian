// Global variables
let data = [];
let selected = [];
let strikes = 0;
let gameOver = false;
let hintIndex = 0;
const hints = [
  "Self-portraits are paintings where the artist depicts themselves as the subject.",
  "Look for portraits where the person is looking directly at the viewer - artists often gaze confidently in self-portraits.",
  "Self-portraits may include artistic tools like brushes or palettes in the scene.",
  "Artists in self-portraits sometimes wear simple clothing or work attire."
];

// Load data and initialize game
d3.csv("data/portraits_v1.csv").then(loadedData => {
  data = loadedData;
  renderGrid();
  // Show initial hint
  d3.select('#hintMessage').text('Hint: ' + hints[0]).style('display', 'block');
  hintIndex = 1; // Next hint available
  d3.select('#loading').style('display', 'none');
});

// Render the 4x4 grid
function renderGrid() {
  const selfPortraits = data.filter(d => d.is_self_portrait === 'TRUE');
  const nonSelfPortraits = data.filter(d => d.is_self_portrait === 'FALSE');

  // Select 4 random self-portraits out of the available ones
  const selectedSelf = d3.shuffle(selfPortraits.slice()).slice(0, 4);
  // Select 12 random non-self
  const selectedNonSelf = d3.shuffle(nonSelfPortraits.slice()).slice(0, 12);

  // Combine and shuffle
  const gameData = d3.shuffle(selectedSelf.concat(selectedNonSelf));

  const app = d3.select("#app");
  app.selectAll(".card").remove();

  const cards = app.selectAll(".card")
    .data(gameData)
    .enter()
    .append("div")
    .attr("class", "card")
    .attr("data-is-self", d => d.is_self_portrait)
    .on("click", handleSelect);

  cards.append("div")
    .attr("class", "front")
    .style("background-image", d => `url(${d.thumbnail})`)
    .append("div")
    .attr("class", "title")
    .text(d => d.title);
}

// Handle card selection
function handleSelect() {
  if (gameOver) return;

  const card = d3.select(this);
  if (card.classed('blurred')) return; // Can't select blurred cards

  const index = selected.indexOf(this);

  if (index > -1) {
    // Deselect
    selected.splice(index, 1);
    card.classed('selected', false);
  } else {
    // Select, but only if less than 4
    if (selected.length < 4) {
      selected.push(this);
      card.classed('selected', true);
    }
  }

  if (selected.length === 4) {
    setTimeout(checkMatch, 500);
  }
}

// Check if selected are all self-portraits
function checkMatch() {
  const allSelf = selected.every(card => d3.select(card).attr('data-is-self') === 'TRUE');

  if (allSelf) {
    // Correct - start victory reveal
    victoryReveal();
  } else {
    // Incorrect
    strikes++;
    d3.select('#strikes').text(strikes);
    if (strikes === 1) {
      // First wrong - just deselect
      selected.forEach(card => {
        d3.select(card).classed('selected', false);
      });
      selected = [];
    } else {
      // Strikes 2+ - blur 2 of the selected incorrect cards and show hint if available
      const toBlur = selected.sort(() => 0.5 - Math.random()).slice(0, 2);
      toBlur.forEach(card => {
        d3.select(card).classed('blurred', true);
      });
      // Show next hint if available
      if (hintIndex < hints.length) {
        d3.select('#hintMessage').text('Hint: ' + hints[hintIndex]).style('display', 'block');
        hintIndex++;
        if (hintIndex >= hints.length) {
          d3.select('#hint').property('disabled', true);
        }
      }
      selected = []; // Deselect all
    }
    if (strikes >= 5) {
      d3.select('#message').text('Game Over! Too many strikes.').style('display', 'block').style('color', 'red');
      gameOver = true;
    }
  }
}

// Victory reveal animation
function victoryReveal() {
  const nonSelfCards = d3.selectAll('.card').filter(function() {
    return d3.select(this).attr('data-is-self') !== 'TRUE';
  });
  let index = 0;
  const interval = setInterval(() => {
    for (let i = 0; i < 2 && index < nonSelfCards.size(); i++) {
      d3.select(nonSelfCards.nodes()[index]).classed('blurred', true);
      index++;
    }
    if (index >= nonSelfCards.size()) {
      clearInterval(interval);
      // Mark correct cards
      selected.forEach(card => {
        d3.select(card).classed('correct', true).classed('selected', false);
      });
      d3.select('#message').text('Correct!').style('display', 'block').style('color', 'green');
      gameOver = true;
    }
  }, 300);
}

// Reset game
function resetGame() {
  strikes = 0;
  selected = [];
  gameOver = false;
  hintIndex = 0;
  d3.select('#strikes').text(0);
  d3.select('#message').style('display', 'none');
  d3.select('#hintMessage').text('Hint: ' + hints[0]).style('display', 'block');
  hintIndex = 1;
  d3.select('#hint').property('disabled', false);
  d3.selectAll('.card').classed('blurred', false).classed('correct', false).classed('selected', false).classed('incorrect', false);
  renderGrid();
}

// Event listener for play again
d3.select('#playAgain').on('click', resetGame);

// Event listener for hint
d3.select('#hint').on('click', function() {
  if (hintIndex < hints.length) {
    d3.select('#hintMessage').text('Hint: ' + hints[hintIndex]).style('display', 'block');
    hintIndex++;
    if (hintIndex >= hints.length) {
      d3.select('#hint').property('disabled', true);
    }
  }
});