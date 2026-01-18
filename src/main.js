import { initMap, showPlacesOnMap } from './map.js';
import { fetchNearbyPlaces } from './data.js';
import { calculateScore } from './analysis.js';

// DOM Elements
const loadingEl = document.getElementById('loading');
const resultsEl = document.getElementById('results');
const scoreValueEl = document.getElementById('score-value');
const detailsListEl = document.getElementById('details-list');
const franchiseFilterEl = document.getElementById('franchise-filter');

let currentPlaces = [];

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    initMap('map', handleLocationSelect);

    // Filter Event Listener
    franchiseFilterEl.addEventListener('input', (e) => {
        const filterText = e.target.value.toLowerCase();
        filterPlaces(filterText);
    });
});

async function handleLocationSelect(lat, lon) {
    // UI State: Loading
    showLoading(true);
    resultsEl.classList.add('hidden');

    // Reset Filter
    franchiseFilterEl.value = '';

    try {
        // 1. Fetch Data
        currentPlaces = await fetchNearbyPlaces(lat, lon, 500); // 500m radius

        // 2. Perform Analysis
        const { score, breakdown } = calculateScore(currentPlaces);

        // 3. Update Map
        showPlacesOnMap(currentPlaces);

        // 4. Update UI
        renderResults(score, breakdown);

    } catch (error) {
        console.error("Analysis failed:", error);
        alert("Failed to fetch data. Please try again.");
    } finally {
        showLoading(false);
    }
}

function filterPlaces(filterText) {
    if (!currentPlaces.length) return;

    const filteredPlaces = currentPlaces.filter(place =>
        place.name.toLowerCase().includes(filterText) ||
        place.type.toLowerCase().includes(filterText)
    );

    showPlacesOnMap(filteredPlaces);
}

function showLoading(show) {
    if (show) {
        loadingEl.classList.remove('hidden');
    } else {
        loadingEl.classList.add('hidden');
    }
}

function renderResults(score, breakdown) {
    resultsEl.classList.remove('hidden');

    // Animate Score
    scoreValueEl.textContent = score;
    scoreValueEl.style.background = `conic-gradient(${getScoreColor(score)} ${score}%, rgba(255,255,255,0.1) ${score}% 100%)`;

    // Render Details
    detailsListEl.innerHTML = '';

    Object.entries(breakdown).forEach(([category, count]) => {
        if (count > 0) {
            const li = document.createElement('li');
            li.innerHTML = `
                <span style="text-transform: capitalize">${category}</span>
                <span class="badge">${count}</span>
            `;
            detailsListEl.appendChild(li);
        }
    });

    if (Object.values(breakdown).reduce((a, b) => a + b, 0) === 0) {
        const li = document.createElement('li');
        li.textContent = "No significant places found nearby.";
        li.style.color = "var(--color-text-muted)";
        li.style.justifyContent = "center";
        detailsListEl.appendChild(li);
    }
}

function getScoreColor(score) {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 50) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
}
