// Global variables
let data = [];
let selected = [];
let strikes = 0;
let gameOver = false;
let hintIndex = 0;
const categoryHint = "Sometimes the easiest model to paint is the one who’s always available.";
const hints = [
  "When the gaze feels deliberate, almost confrontational, it usually means the painter is looking straight into a mirror.",
  "Look for sitters dressed more plainly than usual. Artists often painted themselves in simple clothes.",
  "Check for faces lit from one side. The light often comes from a studio window or mirror setup.",
  "Not all of these were studio scenes. One sits out in the open."
];

const startButton = d3.select('#startGame');
const playAgainButton = d3.select('#playAgain');
const overlay = d3.select('#game-overlay');
const gameShell = d3.select('#game-shell');
const statsContainer = d3.select('#stats');
const hintContainer = d3.select('#hintMessage');

// Load data and prime the UI
d3.csv("data/portraits_v1.csv").then(loadedData => {
  data = loadedData;
  d3.select('#loading').style('display', 'none');
  startButton.attr('disabled', null);
}).catch(() => {
  d3.select('#loading').text('Unable to load portraits right now.');
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
    .style("background-image", d => `url(${d.thumbnail})`);
  
  revealCardsSequentially(cards);
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
    // Eliminate incorrect cards that were selected
    const incorrectSelected = selected.filter(card => d3.select(card).attr('data-is-self') !== 'TRUE');
    const toBlur = d3.shuffle(incorrectSelected).slice(0, 2);
    toBlur.forEach(card => {
      d3.select(card).classed('blurred', true);
    });
    // Show next hint if available
    if (hintIndex < hints.length) {
      hintContainer.text(hints[hintIndex]).style('display', 'block');
      hintIndex++;
    }
    // Deselect all remaining selected cards
    selected.forEach(card => {
      d3.select(card).classed('selected', false);
    });
    selected = []; // Clear the array
    if (strikes >= 5) {
      // Final reveal: visually mark the correct self-portraits on the board
      const correctCards = d3.selectAll('.card').filter(function() {
        return d3.select(this).attr('data-is-self') === 'TRUE';
      });
      correctCards.each(function() {
        d3.select(this).classed('correct', true).classed('blurred', false);
      });
      // Also ensure other cards are blurred to emphasize correct answers
      d3.selectAll('.card').filter(function() {
        return d3.select(this).attr('data-is-self') !== 'TRUE';
      }).classed('blurred', true);

      const revealText = 'Final Reveal<br>Correct 4 portraits<br>Explanation of the connection: These are self-portraits where the artist painted themselves.<br>Additional context for non-connected portraits: These are portraits of other individuals, not the artists themselves.';
      d3.select('#message').html(revealText).style('display', 'block').style('color', 'red');
      gameOver = true;
      showReplayOverlay();
    }
  }
}

// Victory reveal animation
function victoryReveal() {
  const allCards = d3.selectAll('.card');
  const nonSelfCards = allCards
    .filter(function() {
      return d3.select(this).attr('data-is-self') !== 'TRUE';
    })
    .nodes();
  
  const shuffledCards = d3.shuffle(nonSelfCards.slice());
  
  // Stagger blurring with a steady cadence
  const cadence = 200;
  shuffledCards.forEach((card, idx) => {
    setTimeout(() => {
      d3.select(card).classed('blurred', true);
    }, cadence * idx);
  });
  
  const totalRevealTime = 150 * shuffledCards.length + 600;
  setTimeout(() => {
    // Mark correct cards
    selected.forEach(card => {
      d3.select(card).classed('correct', true).classed('selected', false);
    });
    d3.select('#message').text('You’ve Won!').style('display', 'block').style('color', 'green');
    gameOver = true;
    showReplayOverlay();
    triggerConfetti();
  }, totalRevealTime);
}

function revealCardsSequentially(cardsSelection) {
  const nodes = d3.shuffle(cardsSelection.nodes().slice());
  cardsSelection.classed('card-hidden', true);
  nodes.forEach((node, idx) => {
    const delay = 70 * idx;
    setTimeout(() => {
      d3.select(node).classed('card-hidden', false);
    }, delay);
  });
}

// Reset game
function resetGame() {
  playAgainButton.attr('disabled', true).style('display', 'none');
  strikes = 0;
  selected = [];
  gameOver = false;
  hintIndex = 0;
  d3.select('#message').style('display', 'none');
  hintContainer.text(categoryHint).style('display', 'block');
  d3.selectAll('.card').classed('blurred', false).classed('correct', false).classed('selected', false).classed('incorrect', false);
  renderGrid();
}

// Event listener for play again
playAgainButton.on('click', resetGame);

function startGame() {
  if (!data.length) {
    return;
  }
  d3.select('.game-intro-overlay').classed('hidden', true);
  d3.select('#game-board').classed('visible', true);
  startButton.classed('visible', false).attr('disabled', true);
  overlay.classed('hidden', true);
  gameShell.classed('game-active', true);
  statsContainer.classed('hidden', false);
  hintContainer.classed('hidden', false);
  resetGame();
}

function showReplayOverlay() {
  playAgainButton.attr('disabled', null).style('display', 'inline-flex');
  hintContainer.style('display', 'none');
}

function triggerConfetti() {
  if (typeof confetti !== "function") return;
  
  const count = 200;
  const defaults = {
    origin: { y: 0.7 }
  };
  
  function fire(particleRatio, opts) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    });
  }
  
  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });
  fire(0.2, {
    spread: 60,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}

startButton.on('click', startGame);
