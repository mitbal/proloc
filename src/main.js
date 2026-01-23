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
    if (score >= 50) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
}

// --- CSV Upload & Visualization ---
import { renderVoronoiTreemap } from './viz/voronoi.js';

const csvUploadEl = document.getElementById('csv-upload');
const vizOverlayEl = document.getElementById('viz-overlay');
const closeVizBtn = document.getElementById('close-viz');
const regenerateVizBtn = document.getElementById('regenerate-viz');

const colorSchemeSelect = document.getElementById('color-scheme-select');
const showValuesCheckbox = document.getElementById('show-values-checkbox');


let currentVizData = null;

if (csvUploadEl) {
    csvUploadEl.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const data = parseCSV(text);
            if (data.length > 0) {
                showVisualization(data);
            } else {
                alert("Invalid or empty CSV.");
            }
        };
        reader.readAsText(file);
    });
}

if (closeVizBtn) {
    closeVizBtn.addEventListener('click', () => {
        vizOverlayEl.classList.add('hidden');
    });
}

if (regenerateVizBtn) {
    regenerateVizBtn.addEventListener('click', () => {
        if (currentVizData) {
            renderVoronoiTreemap(currentVizData, 'viz-container', colorSchemeSelect.value, showValuesCheckbox.checked);
        }
    });
}

if (colorSchemeSelect) {
    colorSchemeSelect.addEventListener('change', () => {
        if (currentVizData) {
            renderVoronoiTreemap(currentVizData, 'viz-container', colorSchemeSelect.value, showValuesCheckbox.checked);
        }
    });
}

if (showValuesCheckbox) {
    showValuesCheckbox.addEventListener('change', () => {
        if (currentVizData) {
            renderVoronoiTreemap(currentVizData, 'viz-container', colorSchemeSelect.value, showValuesCheckbox.checked);
        }
    });
}

function parseCSV(text) {
    // Simple parser for "group,name,value" or "name,value" CSV
    // Assumes header row exists
    console.log("Parsing CSV, length:", text.length);
    const lines = text.trim().split(/\r?\n/);
    console.log("Lines found:", lines.length);
    if (lines.length < 2) return [];

    const result = [];
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());

    // Find indices for 'name', 'value' and optional 'group'
    let nameIdx = headers.indexOf('name');
    let valueIdx = headers.indexOf('value');
    let groupIdx = headers.indexOf('group');
    if (groupIdx === -1) groupIdx = headers.indexOf('category');

    // Fallbacks if headers are missing or non-standard
    if (nameIdx === -1) nameIdx = 0;
    if (valueIdx === -1) valueIdx = 1;
    // If group is not found in headers, groupIdx remains -1

    // If we have 3 columns and didn't find specific headers, try to guess
    // explicit "Group, Name, Value" structure if headers are ambiguous?
    // For now, rely on headers or default 0/1 for name/value.

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',');

        if (parts.length >= 2) {
            const name = parts[nameIdx] ? parts[nameIdx].trim() : "Unknown";
            const value = parseFloat(parts[valueIdx] ? parts[valueIdx].trim() : "0");
            let group = null;

            if (groupIdx !== -1 && parts[groupIdx]) {
                group = parts[groupIdx].trim();
            }

            if (name && !isNaN(value)) {
                result.push({ name, value, group });
            }
        }
    }
    return result;
}

function showVisualization(data) {
    currentVizData = data;
    vizOverlayEl.classList.remove('hidden');
    // Allow UI to update before rendering (width/height needs to be calculated)
    setTimeout(() => {
        renderVoronoiTreemap(data, 'viz-container', colorSchemeSelect.value, showValuesCheckbox.checked);
    }, 10);
}
