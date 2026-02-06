const stage = document.getElementById('pokemon-stage');
const addBtn = document.getElementById('add-pokemon');

const typeColors = {
    normal: '#A8A878', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
    grass: '#78C850', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
    ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
    rock: '#B8A038', ghost: '#705898', dragon: '#7038F8', dark: '#705848',
    steel: '#B8B8D0', fairy: '#EE99AC'
};

async function fetchPokemon() {
    const id = Math.floor(Math.random() * 898) + 1;
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = await res.json();
    
    const speciesRes = await fetch(data.species.url);
    const speciesData = await speciesRes.json();
    const description = speciesData.flavor_text_entries.find(e => e.language.name === 'en')?.flavor_text.replace(/\f/g, ' ') || 'A mysterious Pokemon!';
    
    return {
        name: data.name,
        image: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
        types: data.types.map(t => t.type.name),
        description,
        stats: data.stats.map(s => `${s.stat.name}: ${s.base_stat}`).join(', ')
    };
}

function createPokemonCard(pokemon) {
    const card = document.createElement('div');
    card.className = 'pokemon';
    
    const typeBadges = pokemon.types.map(type => 
        `<span class="type-badge" style="background: ${typeColors[type] || '#777'}">${type}</span>`
    ).join('');
    
    card.innerHTML = `
        <img src="${pokemon.image}" alt="${pokemon.name}" loading="lazy">
        <div class="pokemon-name">${pokemon.name}</div>
        <div class="pokemon-types">${typeBadges}</div>
        <div class="pokemon-info">
            <p><strong>Description:</strong> ${pokemon.description}</p>
            <p style="margin-top: 10px; font-size: 0.85em; opacity: 0.7;">${pokemon.stats}</p>
        </div>
    `;
    
    card.addEventListener('click', () => {
        const info = card.querySelector('.pokemon-info');
        info.classList.toggle('show');
    });
    
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--x', `${x}%`);
        card.style.setProperty('--y', `${y}%`);
    });
    
    setTimeout(() => card.style.opacity = '1', 50);
    return card;
}

addBtn.addEventListener('click', async () => {
    addBtn.disabled = true;
    const span = addBtn.querySelector('span');
    span.textContent = 'Summoning...';
    
    try {
        const pokemon = await fetchPokemon();
        const card = createPokemonCard(pokemon);
        card.style.opacity = '0';
        card.style.transform = 'scale(0.8)';
        stage.appendChild(card);
    } catch (error) {
        alert('Failed to fetch Pokemon. Try again!');
    }
    
    addBtn.disabled = false;
    span.textContent = 'Summon Pokemon';
});

(async () => {
    for (let i = 0; i < 3; i++) {
        const pokemon = await fetchPokemon();
        const card = createPokemonCard(pokemon);
        card.style.opacity = '0';
        card.style.transform = 'scale(0.8)';
        stage.appendChild(card);
        await new Promise(r => setTimeout(r, 200));
    }
})();
