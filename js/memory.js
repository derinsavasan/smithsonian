// Global variables
let data = [];
let selected = [];
let strikes = 0;
let gameOver = false;
let hintIndex = 0;
let currentCorrectCards = [];
let clickedCardIds = new Set();

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
    ]
  },
  military: {
    name: "Ranked Military",
    isCorrect: (d) => {
      const names = [
        'captain charles mcknight',
        'charles mcknight',
        'capt. john gassoway',
        'john gassoway',
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
    ]
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
    ]
  },
  children: {
    name: "Children",
    isCorrect: (d) => {
      const childTitles = [
        'portrait of a baby boy',
        'portrait of a boy',
        'portrait of a child',
        'the davis children (eliza cheever davis and john derby davis)'
      ];
      const fields = [d.title, d.sitter].map(v => normalize(v || ''));
      return fields.some(f => childTitles.some(title => f.includes(title)));
    },
    categoryHint: "Small bodies, big props.",
    hints: [
      "The canvas shrinks with the sitter. Smaller subject, smaller portrait.",
      "The proportions give it away. Heads slightly too large, limbs a little stiff. Cannot sit still.",
      "The clothes feel miniature but formal: pint-sized gowns, cropped jackets, little lace collars.",
      "Look for props adults never get, like flowers that say “keep them occupied.”"
    ]
  },
  presidential: {
    name: "Presidential",
    names: [
      'george washington',
      'john adams',
      'thomas jefferson',
      'james madison',
      'james monroe',
      'john quincy adams'
    ],
    isCorrect: (d) => {
      const fields = [d.title, d.sitter].map(v => normalize(v || ''));
      return fields.some(f => categoriesConfig.presidential.names.some(name => f.includes(name)));
    },
    categoryHint: "The first roster of men who ended up running the country.",
    hints: [],
    hintsByPresident: {
      'george washington': "The only one who looks like a general even when he’s standing still.",
      'john adams': "Round face, tight lips, and the posture of a man already done with this conversation.",
      'thomas jefferson': "Long cheekbones, big hair, and the soft-lit calm of a man writing the rules.",
      'james madison': "Small frame, sharp stare, and a white cravat so bright it steals the scene. He’s standing unlike the rest.",
      'james monroe': "The confident tilt and swept-back hair of someone who knows the era is his. In a triptych.",
      'john quincy adams': "The stern jaw and heavy eyelids of a man born into the job."
    }
  },
  unnamed: {
    name: "Unnamed Sitters",
    isCorrect: (d) => {
      const sitter = normalize((d.sitter || '').trim());
      if (!sitter) return true;
      const unnamedSignals = ['unknown', 'unidentified', 'unnamed', 'not recorded'];
      return unnamedSignals.some(sig => sitter.includes(sig));
    },
    categoryHint: "Portraits of people who were important enough to paint but not important enough to record.",
    hints: [
      "Many are miniatures, small oval pieces meant to be held or kept close, not displayed in grand rooms.",
      "Clothes stay modest, the kind of everyday garments that give no hint of status or family.",
      "The settings are generic, usually a flat backdrop or a bit of drapery that tells you nothing about who they were.",
      "The portraits feel practical, more like a record of a face than a statement, which is why the identity never survived."
    ]
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

function getCardId(card) {
  const parts = [card.title, card.sitter, card.artist, card.thumbnail];
  return parts.map(p => (p || '').trim()).join('|').toLowerCase();
}

function formatCardLabel(card) {
  const sitter = (card.sitter || '').trim();
  const title = (card.title || '').trim();
  if (sitter) return sitter;
  if (title) return title;
  return 'Unknown sitter';
}

function buildResultMessage(outcome) {
  const categoryName = categoriesConfig[currentCategory].name;
  const safeCategory = categoryName.toLowerCase().replace(/\//g, ' ');
  const displayCategory = safeCategory.replace(/\bportraits?\b$/,'').trim().replace(/[-\s:]+$/,'');
  const needsPortraitWord = !/\bportrait(s)?\b/.test(displayCategory);
  const noun = needsPortraitWord ? ' portraits' : '';
  const labels = currentCorrectCards.map(formatCardLabel);
  const listText = labels.join(', ');
  if (outcome === 'win') {
    return `You’ve guessed all <strong>${displayCategory}${noun}</strong> correctly! Ready for another round?`;
  }
  const unseen = currentCorrectCards
    .filter(c => !clickedCardIds.has(getCardId(c)))
    .map(formatCardLabel);
  const unseenText = unseen.length ? ` You never tried: ${unseen.join(', ')}.` : '';
  return `Missed it — these were ${categoryName}: ${listText}.${unseenText}`;
}

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
  } else if (currentCategory === 'presidential') {
    const presidentMap = {};
    correctPool.forEach(d => {
      const fields = [d.title, d.sitter].map(v => normalize(v || ''));
      const matched = categoriesConfig.presidential.names.find(name => fields.some(f => f.includes(name)));
      if (matched) {
        if (!presidentMap[matched]) presidentMap[matched] = [];
        presidentMap[matched].push(d);
      }
    });
    const availablePresidents = Object.keys(presidentMap);
    const chosenPresidents = d3.shuffle(availablePresidents).slice(0, 4);
    chosenPresidents.forEach(name => {
      const candidates = presidentMap[name];
      if (candidates && candidates.length) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        selectedCorrect.push(pick);
      }
    });
    // Order hints to match the selected presidents for this round
    const hintList = chosenPresidents
      .map(name => categoriesConfig.presidential.hintsByPresident[name])
      .filter(Boolean);
    hints = hintList;
  } else {
    selectedCorrect = d3.shuffle(correctPool.slice()).slice(0, 4);
  }
  // Hard cap correct selections to 4 across all categories
  if (selectedCorrect.length > 4) {
    selectedCorrect = selectedCorrect.slice(0, 4);
  }
  currentCorrectCards = selectedCorrect.slice();
  clickedCardIds.clear();

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
  const datum = card.datum();
  clickedCardIds.add(getCardId(datum));
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

    const revealText = buildResultMessage('lose');
    d3.select('#message').html(revealText).style('display', 'block').style('color', '#0000FF').style('background', 'transparent');
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
    d3.select('#message').html(buildResultMessage('win')).style('display', 'block').style('color', '#111').style('background', 'transparent');
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
  clickedCardIds.clear();
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
