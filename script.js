const suits = ['♠', '♥', '♦', '♣'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function createDeck() {
  const deck = [];
  for (let suit of suits) {
    for (let value of values) {
      deck.push({ suit, value });
    }
  }
  return deck;
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function renderHand(cards) {
  const handDiv = document.getElementById('hand');
  handDiv.innerHTML = '';

  cards.forEach((card, index) => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.innerHTML = `${card.value}${card.suit}`;
    cardDiv.draggable = true;
    cardDiv.id = `card-${index}`;
    cardDiv.dataset.value = card.value;
    cardDiv.dataset.suit = card.suit;

    cardDiv.ondragstart = dragStart;
    handDiv.appendChild(cardDiv);
  });
}

function dragStart(e) {
  e.dataTransfer.setData('text', e.target.id);
}

document.querySelectorAll('.zone').forEach(zone => {
  zone.ondragover = e => e.preventDefault();
  zone.ondrop = dropCard;
});

function dropCard(e) {
  e.preventDefault();
  const cardId = e.dataTransfer.getData('text');
  const card = document.getElementById(cardId);
  if (card && !e.target.contains(card)) {
    e.target.appendChild(card);
  }
}

function startGame() {
  const deck = shuffle(createDeck());
  const allHands = [[], [], [], []];

  for (let i = 0; i < 52; i++) {
    allHands[i % 4].push(deck[i]);
  }

  window.gamePlayers = allHands.map((hand, idx) => {
    return {
      name: idx === 0 ? 'You' : `Bot ${idx}`,
      fullHand: hand,
      top: [],
      middle: [],
      bottom: []
    };
  });

  renderHand(allHands[0]);

  for (let i = 1; i < 4; i++) {
    splitBotHand(window.gamePlayers[i]);
  }
}

function splitBotHand(bot) {
  const copy = [...bot.fullHand];
  bot.top = copy.splice(0, 3);
  bot.middle = copy.splice(0, 5);
  bot.bottom = copy.splice(0, 5);
}

function validateSets() {
  const top = Array.from(document.getElementById('top').children).map(card => ({
    value: card.dataset.value,
    suit: card.dataset.suit
  }));
  const mid = Array.from(document.getElementById('middle').children).map(card => ({
    value: card.dataset.value,
    suit: card.dataset.suit
  }));
  const bot = Array.from(document.getElementById('bottom').children).map(card => ({
    value: card.dataset.value,
    suit: card.dataset.suit
  }));

  if (top.length !== 3 || mid.length !== 5 || bot.length !== 5) {
    alert("Invalid split!");
    return;
  }

  const player = window.gamePlayers[0];
  player.top = top;
  player.middle = mid;
  player.bottom = bot;

  let result = '';

  window.gamePlayers.forEach(p => {
    const special = checkSpecials(p.fullHand);
    result += `\n${p.name}:\n`;
    result += `Top: ${getHandRank(p.top)}\n`;
    result += `Mid: ${getHandRank(p.middle)}\n`;
    result += `Bot: ${getHandRank(p.bottom)}\n`;
    if (special) result += `💥 Special: ${special}\n`;
  });

  alert(result);
}

function getHandRank(cards) {
  const valuesMap = { '2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, '10':10, 'J':11, 'Q':12, 'K':13, 'A':14 };
  const counts = {};
  const suits = {};
  const values = [];

  for (let card of cards) {
    const v = valuesMap[card.value];
    counts[v] = (counts[v] || 0) + 1;
    suits[card.suit] = (suits[card.suit] || 0) + 1;
    values.push(v);
  }

  values.sort((a, b) => a - b);
  const uniqueVals = [...new Set(values)];
  const flush = Object.keys(suits).length === 1;
  const straight = uniqueVals.length === cards.length && uniqueVals[uniqueVals.length-1] - uniqueVals[0] === cards.length - 1;
  const countsSorted = Object.values(counts).sort((a, b) => b - a);

  if (flush && straight) return "Straight Flush";
  if (countsSorted[0] === 4) return "Four of a Kind";
  if (countsSorted[0] === 3 && countsSorted[1] === 2) return "Full House";
  if (flush) return "Flush";
  if (straight) return "Straight";
  if (countsSorted[0] === 3) return "Three of a Kind";
  if (countsSorted[0] === 2 && countsSorted[1] === 2) return "Two Pair";
  if (countsSorted[0] === 2) return "One Pair";

  return "High Card";
}

function checkSpecials(hand) {
  const vals = {};
  const suits = {};
  let pairs = 0;

  for (let card of hand) {
    vals[card.value] = (vals[card.value] || 0) + 1;
    suits[card.suit] = (suits[card.suit] || 0) + 1;
  }

  const valKeys = Object.keys(vals);
  const suitKeys = Object.keys(suits);

  const dragonSeq = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const handSorted = hand.map(c => c.value).sort((a,b) => dragonSeq.indexOf(a) - dragonSeq.indexOf(b)).join(',');
  if (handSorted === dragonSeq.join(',')) return "🐉 Dragon!";

  for (let v in vals) {
    if (vals[v] === 2) pairs++;
  }
  if (pairs === 6) return "💠 Six Pairs!";

  const top = hand.slice(0, 3);
  const mid = hand.slice(3, 8);
  const bot = hand.slice(8, 13);

  const flushTop = isFlush(top);
  const flushMid = isFlush(mid);
  const flushBot = isFlush(bot);
  if (flushTop && flushMid && flushBot) return "♣️ Three Flushes!";

  const strTop = isStraight(top);
  const strMid = isStraight(mid);
  const strBot = isStraight(bot);
  if (strTop && strMid && strBot) return "📏 Three Straights!";

  return null;
}

function isFlush(cards) {
  return new Set(cards.map(c => c.suit)).size === 1;
}

function isStraight(cards) {
  const valuesMap = { '2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, '10':10, 'J':11, 'Q':12, 'K':13, 'A':14 };
  const nums = cards.map(c => valuesMap[c.value]).sort((a,b) => a - b);
  for (let i = 0; i < nums.length - 1; i++) {
    if (nums[i + 1] !== nums[i] + 1) return false;
  }
  return true;
}
