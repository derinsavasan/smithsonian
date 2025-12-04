// Global variables
let data = [];
let selected = [];
let strikes = 0;
let gameOver = false;
let hintIndex = 0;

const normalize = (str = '') => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const categoriesConfig = {
  self: {
    name: "Self-Portraits",
    isCorrect: (d) => d.is_self_portrait === 'TRUE',
    categoryHint: "Sometimes the easiest model to paint is the one who’s always available.",
    hints: [
      "When the gaze feels deliberate, almost confrontational, it usually means the painter is looking straight into a mirror.",
      "Look for sitters dressed more plainly than usual. Artists often painted themselves in simple clothes.",
      "Check for faces lit from one side. The light often comes from a studio window or mirror setup.",
      "Not all of these were studio scenes. One sits out in the open."
    ],
    revealText: 'Final Reveal<br>Correct 4 portraits<br>These are self-portraits where the artist painted themselves.'
  },
  military: {
    name: "Ranked Military",
    isCorrect: (d) => {
      const names = [
        'captain charles mcknight',
        'charles mcknight',
        'john h. seward',
        'joseph anthony',
        'robert lillibridge',
        'benjamin stephenson',
        'john cox',
        'john cadwalader',
        'giles',
        'anthony wayne'
      ];
      const fields = [d.title, d.sitter, d.artist, d.size, d.gender].map(v => (v || '').toLowerCase());
      return fields.some(f => names.some(name => f.includes(name)));
    },
    categoryHint: "Look for uniforms: these sitters wore a commission.",
    hints: [
      "Rank shows up in the shoulders. Epaulettes, straps, and brass tend to give it away.",
      "Military sitters rarely soften their posture. The stance is straight, almost drilled.",
      "Weapons aren't required, but swords and scabbards are reliable tells when they appear.",
      "Backgrounds often stay sparse. Consider black as sparse here."
    ],
    revealText: 'Final Reveal<br>Correct 4 portraits<br>These are ranked military sitters.'
  },
  elite: {
    name: "Elite daughters/heiresses",
    isCorrect: (d) => {
      const targetNames = [
        'ann elliott morris',
        'anne hume shippen',
        'elizabeth depeyster peale',
        'elizabeth grimke rutledge',
        'margaret spear smith',
        'juliana westray wood'
      ];
      const fields = [d.title, d.sitter].map(v => normalize(v || ''));
      return fields.some(f => targetNames.some(name => f.includes(name)));
    },
    categoryHint: "Old-money energy. Even on canvas.",
    hints: [
      "These women are posture-trained: straight shoulders, soft hands, chin set just enough.",
      "Jewelry is quiet but strategic: pearls, brooches, gold clasps. Nothing gaudy. Just wealth doing what wealth does.",
      "Fabrics are a dead giveaway. Silk, satin, embroidery read expensive, even in a two-inch miniature.",
      "Backgrounds stay controlled. Columns, drapery, tidy interiors are the visual shorthand for “my family owns land.”"
    ],
    revealText: 'Final Reveal<br>Correct 4 portraits<br>These are the elite daughters and heiresses.'
  }
};
let categoryOrder = [];
let nextCategoryIndex = 0;
let currentCategory = 'self';
let categoryHint = categoriesConfig.self.categoryHint;
let hints = categoriesConfig.self.hints.slice();

const startButton = d3.select('#startGame');
const playAgainButton = d3.select('#playAgain');
const overlay = d3.select('#game-overlay');
const gameShell = d3.select('#game-shell');
const statsContainer = d3.select('#stats');
const hintContainer = d3.select('#hintMessage');

function refreshCategoryOrder() {
  categoryOrder = d3.shuffle(Object.keys(categoriesConfig));
  nextCategoryIndex = 0;
}

function pickCategory() {
  if (!categoryOrder.length || nextCategoryIndex >= categoryOrder.length) {
    refreshCategoryOrder();
  }
  const cat = categoryOrder[nextCategoryIndex];
  nextCategoryIndex += 1;
  currentCategory = cat;
  categoryHint = categoriesConfig[cat].categoryHint;
  hints = categoriesConfig[cat].hints.slice();
}

// Load data and prime the UI
d3.csv("data/portraits_v1.csv").then(loadedData => {
  data = loadedData;
  d3.select('#loading').style('display', 'none');
  startButton.attr('disabled', null);
}).catch(() => {
  d3.select('#loading').text('Unable to load portraits right now.');
  startButton.attr('disabled', null);
});

// Render the 4x4 grid
function renderGrid() {
  const config = categoriesConfig[currentCategory];
  const isWestFamily = (d) => (d.title || '').toLowerCase().includes('west family');
  // Exclude West family from non-self categories entirely
  const pool = currentCategory === 'self' ? data : data.filter(d => !isWestFamily(d));

  // Build correct pool based on category
  const correctPool = pool.filter(d => config.isCorrect(d));

  let selectedCorrect = [];
  if (currentCategory === 'self') {
    const westFamily = correctPool.find(d => (d.title || '').toLowerCase().includes('west family'));
    const remainingSelf = correctPool.filter(d => d !== westFamily);
    if (westFamily) selectedCorrect.push(westFamily);
    selectedCorrect.push(...d3.shuffle(remainingSelf.slice()).slice(0, Math.max(0, 4 - selectedCorrect.length)));
  } else {
    selectedCorrect = d3.shuffle(correctPool.slice()).slice(0, 4);
  }

  // Fill remaining with incorrect
  const incorrectPool = pool.filter(d => !config.isCorrect(d) && !selectedCorrect.includes(d));
  const neededIncorrect = 16 - selectedCorrect.length;
  const selectedIncorrect = d3.shuffle(incorrectPool.slice()).slice(0, neededIncorrect);

  const gameData = d3.shuffle(selectedCorrect.concat(selectedIncorrect));

  const app = d3.select("#app");
  app.selectAll(".card").remove();

  const cards = app.selectAll(".card")
    .data(gameData)
    .enter()
    .append("div")
    .attr("class", "card")
    .attr("data-is-correct", d => config.isCorrect(d) ? 'true' : 'false')
    .on("click", handleSelect);

  cards.append("div")
    .attr("class", "front")
    .style("background-image", d => `url(${d.thumbnail})`);
  
  revealCardsSequentially(cards);
  // Fade in hint once cards are placed
  const revealDelay = Math.max(0, (cards.size() - 1) * 70 + 200);
  setTimeout(() => {
    hintContainer
      .classed('hidden', false)
      .classed('visible', true)
      .style('opacity', 1);
  }, revealDelay);
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
  const allCorrect = selected.every(card => d3.select(card).attr('data-is-correct') === 'true');

  if (allCorrect) {
    // Correct - start victory reveal
    victoryReveal();
  } else {
    // Incorrect
    strikes++;
    d3.select('#strikes').text(strikes);
    // Eliminate incorrect cards that were selected
    const incorrectSelected = selected.filter(card => d3.select(card).attr('data-is-correct') !== 'true');
    const toBlur = d3.shuffle(incorrectSelected).slice(0, 2);
    toBlur.forEach(card => {
      d3.select(card).classed('blurred', true);
    });
    // Shake and mark incorrect selection briefly
    selected.forEach(card => {
      d3.select(card).classed('incorrect', true);
      setTimeout(() => d3.select(card).classed('incorrect', false), 500);
    });
    // Show next hint if available
    if (hintIndex < hints.length) {
      hintContainer
        .text(hints[hintIndex])
        .style('display', 'block')
        .classed('hidden', false)
        .classed('visible', true)
        .style('opacity', 1);
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
      return d3.select(this).attr('data-is-correct') === 'true';
    });
    correctCards.each(function() {
      d3.select(this).classed('correct', true).classed('blurred', false);
    });
    // Also ensure other cards are blurred to emphasize correct answers
    d3.selectAll('.card').filter(function() {
      return d3.select(this).attr('data-is-correct') !== 'true';
    }).classed('blurred', true);

    const revealText = categoriesConfig[currentCategory].revealText;
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
        return d3.select(this).attr('data-is-correct') !== 'true';
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
    d3.select('#message').text('You\'ve Won!').style('display', 'block').style('color', 'green');
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
  hintContainer
    .text(categoryHint)
    .classed('hidden', true)
    .classed('visible', false)
    .style('opacity', 0)
    .style('display', 'block');
  d3.selectAll('.card').classed('blurred', false).classed('correct', false).classed('selected', false).classed('incorrect', false);
  renderGrid();
}

// Event listener for play again
playAgainButton.on('click', () => {
  pickCategory();
  resetGame();
});

function startGame() {
  d3.select('.game-intro-overlay').classed('hidden', true);
  d3.select('#game-board').classed('visible', true);
  startButton.classed('visible', false).attr('disabled', true);
  overlay.classed('hidden', true);
  gameShell.classed('game-active', true);
  statsContainer.classed('hidden', false);
  hintContainer
    .classed('hidden', true)
    .classed('visible', false)
    .style('opacity', 0)
    .style('display', 'block');
  refreshCategoryOrder();
  pickCategory();
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
