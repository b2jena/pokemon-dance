/*
  Pokémon Dance Party
  - Fetches random Pokémon from PokéAPI
  - Displays animated cards with sprite, types, name
  - Tap/click card to toggle intro; it also speaks using Web Speech API if available
  - Buttons: Add Random Pokémon, Shuffle Dance, Clear
*/

const POKE_API_BASE = 'https://pokeapi.co/api/v2';
// Higher IDs may not have sprites. We'll cap to a known range of Gen 1-8 for safety.
const MAX_POKEMON_ID = 898; // up to Gen 8

const stage = document.getElementById('stage');
const tpl = document.getElementById('pokemon-card-template');
const btnAdd = document.getElementById('btnAdd');
const btnShuffle = document.getElementById('btnShuffle');
const btnClear = document.getElementById('btnClear');

// Utilities
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function typeEmoji(type) {
    const map = {
        normal: '⭐',
        fire: '🔥',
        water: '💧',
        grass: '🍃',
        electric: '⚡',
        ice: '❄️',
        fighting: '🥊',
        poison: '☠️',
        ground: '🌋',
        flying: '🪽',
        psychic: '🔮',
        bug: '🐛',
        rock: '🪨',
        ghost: '👻',
        dragon: '🐉',
        dark: '🌚',
        steel: '⚙️',
        fairy: '✨'
    };
    return map[type] || '🎲';
}

function randomIntro(name, types, height, weight) {
    const t = types.map(t => t.type.name);
    const tText = t.map(tt => `${typeEmoji(tt)} ${capitalize(tt)}`).join(' / ');
    const lines = [
        `${name} is feeling groovy!`,
        `${name} joined the dance floor.`,
        `Watch ${name} wiggle to the beat!`,
        `${name} brings ${tText} vibes.`,
        `${name} is ${height / 10}m tall and weighs ${weight / 10}kg.`,
        `${name} says hello with a spin!`,
        `${name} shows off a signature move!`,
    ];
    // Combine two random lines for a cute intro
    const a = lines[randInt(0, lines.length - 1)];
    let b;
    do {
        b = lines[randInt(0, lines.length - 1)];
    } while (b === a);
    return `${a} ${b}`;
}

async function fetchPokemon(id) {
    const res = await fetch(`${POKE_API_BASE}/pokemon/${id}`);
    if (!res.ok) throw new Error(`PokéAPI error: ${res.status}`);
    return res.json();
}

function getSprite(p) {
    // Prefer official artwork or front_default
    return (
        p.sprites?.other?.['official-artwork']?.front_default ||
        p.sprites?.front_default ||
        p.sprites?.other?.dream_world?.front_default ||
        ''
    );
}

function speak(text) {
    try {
        if (!('speechSynthesis' in window)) return;
        // Cancel any ongoing
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1.02;
        u.pitch = 1.08;
        u.volume = 1;
        const voices = speechSynthesis.getVoices();
        const friendly = voices.find(v => /en/i.test(v.lang) && /female|google|child|zira|samantha/i.test(v.name)) || voices[0];
        if (friendly) u.voice = friendly;
        window.speechSynthesis.speak(u);
    } catch (e) {
        // no-op
    }
}

function createCard(p) {
    const node = tpl.content.firstElementChild.cloneNode(true);
    const name = capitalize(p.name);
    const spriteUrl = getSprite(p);
    const types = p.types || [];

    const img = node.querySelector('.sprite');
    img.src = spriteUrl;
    img.alt = `${name} sprite`;

    const nameEl = node.querySelector('.name');
    nameEl.textContent = name;

    const typesEl = node.querySelector('.types');
    typesEl.textContent = types.map(t => `${typeEmoji(t.type.name)} ${capitalize(t.type.name)}`).join(' · ');

    const introEl = node.querySelector('.intro');
    const introText = randomIntro(name, types, p.height, p.weight);
    introEl.textContent = introText;

    // Start dancing by default
    node.classList.add('dancing');

    // Toggle intro + speak on click/touch or keyboard
    const toggleIntro = (speakIt = true) => {
        const isHidden = introEl.hasAttribute('hidden');
        if (isHidden) {
            introEl.removeAttribute('hidden');
            if (speakIt) speak(`${name}. ${introText}`);
        } else {
            introEl.setAttribute('hidden', '');
        }
    };

    node.addEventListener('click', () => toggleIntro(true));
    node.addEventListener('touchstart', () => toggleIntro(true), {passive: true});
    node.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleIntro(true);
        }
    });

    // Fun hover jiggle on pointer enter
    node.addEventListener('pointerenter', () => {
        node.classList.add('dancing');
    });
    node.addEventListener('pointerleave', () => {
        node.classList.remove('dancing');
    });

    return node;
}

async function addRandomPokemon() {
    // Try a few times in case some IDs have no sprite
    for (let i = 0; i < 5; i++) {
        const id = randInt(1, MAX_POKEMON_ID);
        try {
            const p = await fetchPokemon(id);
            const sprite = getSprite(p);
            if (!sprite) continue; // try again
            const card = createCard(p);
            stage.appendChild(card);
            return;
        } catch (e) {
            // try again
        }
    }
    // If all attempts fail, show error card
    const err = document.createElement('div');
    err.className = 'pokemon-card';
    err.innerHTML = '<div class="meta"><h2>Could not load Pokémon</h2><p class="types">Tap Add again</p></div>';
    stage.appendChild(err);
}

function shuffleDance() {
    // Toggle stage shuffle effect and randomize animation timings
    stage.classList.toggle('shuffle');
    const cards = stage.querySelectorAll('.pokemon-card');
    cards.forEach((card, idx) => {
        const img = card.querySelector('.sprite');
        const wrap = card.querySelector('.sprite-wrap');
        const delay = (idx % 10) * 0.1 + Math.random() * 0.3;
        img.style.animationDelay = `${delay}s`;
        wrap.style.animationDelay = `${delay / 2}s`;
        card.classList.toggle('dancing', Math.random() > 0.3);
    });
}

function clearStage() {
    stage.innerHTML = '';
    // stop any speech
    try {
        window.speechSynthesis.cancel();
    } catch {
    }
}

// Wire up buttons
btnAdd.addEventListener('click', addRandomPokemon);
btnShuffle.addEventListener('click', shuffleDance);
btnClear.addEventListener('click', clearStage);

// Load a few at start for fun
(async function bootstrap() {
    for (let i = 0; i < 6; i++) {
        await addRandomPokemon();
        // Stagger a bit for a playful entrance
        await new Promise(r => setTimeout(r, 120));
    }
})();
