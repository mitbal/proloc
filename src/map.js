let map;
let markers = [];
let selectedLocationMarker;
let mapService;

export function initMap(containerId, onClickCallback) {
    const defaultLocation = { lat: -6.2088, lng: 106.8456 }; // Jakarta

    map = new google.maps.Map(document.getElementById(containerId), {
        center: defaultLocation,
        zoom: 13,
        styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
                featureType: "administrative.locality",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
            },
            {
                featureType: "poi",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
            },
            {
                featureType: "poi.park",
                elementType: "geometry",
                stylers: [{ color: "#263c3f" }],
            },
            {
                featureType: "poi.park",
                elementType: "labels.text.fill",
                stylers: [{ color: "#6b9a76" }],
            },
            {
                featureType: "road",
                elementType: "geometry",
                stylers: [{ color: "#38414e" }],
            },
            {
                featureType: "road",
                elementType: "geometry.stroke",
                stylers: [{ color: "#212a37" }],
            },
            {
                featureType: "road",
                elementType: "labels.text.fill",
                stylers: [{ color: "#9ca5b3" }],
            },
            {
                featureType: "road.highway",
                elementType: "geometry",
                stylers: [{ color: "#746855" }],
            },
            {
                featureType: "road.highway",
                elementType: "geometry.stroke",
                stylers: [{ color: "#1f2835" }],
            },
            {
                featureType: "road.highway",
                elementType: "labels.text.fill",
                stylers: [{ color: "#f3d19c" }],
            },
            {
                featureType: "transit",
                elementType: "geometry",
                stylers: [{ color: "#2f3948" }],
            },
            {
                featureType: "transit.station",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
            },
            {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#17263c" }],
            },
            {
                featureType: "water",
                elementType: "labels.text.fill",
                stylers: [{ color: "#515c6d" }],
            },
            {
                featureType: "water",
                elementType: "labels.text.stroke",
                stylers: [{ color: "#17263c" }],
            },
        ],
        disableDefaultUI: true, // Clean look
    });

    mapService = new google.maps.places.PlacesService(map);

    map.addListener("click", (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        // Update selection marker
        if (selectedLocationMarker) {
            selectedLocationMarker.setMap(null);
        }

        selectedLocationMarker = new google.maps.Marker({
            position: { lat, lng },
            map: map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 7,
                fillColor: "#3b82f6",
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "white",
            },
        });

        onClickCallback(lat, lng);
    });
}

export function getMapService() {
    return mapService;
}

export function showPlacesOnMap(places) {
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    places.forEach(place => {
        if (place.lat && place.lon) {
            const color = getCategoryColor(place.category);

            const marker = new google.maps.Marker({
                position: { lat: place.lat, lng: place.lon },
                map: map,
                title: place.name,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 5,
                    fillColor: color,
                    fillOpacity: 0.8,
                    strokeWeight: 1,
                    strokeColor: "white",
                }
            });

            // Add info window on click (optional, but good for UX)
            const infoWindow = new google.maps.InfoWindow({
                content: `<b>${place.name}</b><br>${place.type}`
            });

            marker.addListener("click", () => {
                infoWindow.open(map, marker);
            });

            markers.push(marker);
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
