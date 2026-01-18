import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Vite/Webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

let map;
let markersLayer;
let selectedLocationMarker;

export function initMap(containerId, onClickCallback) {
    // Default to Jakarta
    map = L.map(containerId).setView([-6.2088, 106.8456], 13);

    // Dark mode tiles (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);

    map.on('click', (e) => {
        const { lat, lng } = e.latlng;

        // Update selection marker
        if (selectedLocationMarker) {
            map.removeLayer(selectedLocationMarker);
        }
        selectedLocationMarker = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'custom-pin',
                html: '<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            })
        }).addTo(map);

        onClickCallback(lat, lng);
    });
}

export function showPlacesOnMap(places) {
    markersLayer.clearLayers();

    places.forEach(place => {
        if (place.lat && place.lon) {
            const color = getCategoryColor(place.category);

            const circleMarker = L.circleMarker([place.lat, place.lon], {
                radius: 6,
                fillColor: color,
                color: '#fff',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            });

            circleMarker.bindPopup(`<b>${place.name}</b><br>${place.type}`);
            markersLayer.addLayer(circleMarker);
        }
    });
}

function getCategoryColor(category) {
    const colors = {
        food: '#f59e0b',      // Amber
        retail: '#ec4899',    // Pink
        education: '#10b981', // Emerald
        leisure: '#8b5cf6',   // Violet
        health: '#ef4444',    // Red
        transport: '#6366f1', // Indigo
        finance: '#14b8a6',   // Teal
        other: '#94a3b8'      // Slate
    };
    return colors[category] || colors.other;
}
