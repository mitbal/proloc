import { getMapService } from './map.js';

export async function fetchNearbyPlaces(lat, lon, radius = 500) {
  const service = getMapService();
  if (!service) {
    throw new Error("Map service not initialized");
  }

  const request = {
    location: { lat, lng: lon },
    radius: radius,
    type: ['establishment'] // General type to get most businesses
  };

  return new Promise((resolve, reject) => {
    service.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        resolve(processPlacesData(results));
      } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        resolve([]);
      } else {
        reject(new Error(`Places API failed: ${status}`));
      }
    });
  });
}

function processPlacesData(results) {
  return results.map(place => {
    const category = determineCategory(place.types);
    return {
      id: place.place_id,
      lat: place.geometry.location.lat(),
      lon: place.geometry.location.lng(),
      name: place.name,
      category: category,
      type: place.types ? place.types[0].replace('_', ' ') : 'unknown'
    };
  });
}

function determineCategory(types) {
  if (!types || types.length === 0) return 'other';

  if (hasType(types, ['restaurant', 'cafe', 'bakery', 'bar', 'food', 'meal_delivery', 'meal_takeaway'])) {
    return 'food';
  }
  if (hasType(types, ['store', 'clothing_store', 'convenience_store', 'department_store', 'shopping_mall', 'supermarket', 'home_goods_store'])) {
    return 'retail';
  }
  if (hasType(types, ['school', 'university', 'secondary_school', 'primary_school', 'library'])) {
    return 'education';
  }
  if (hasType(types, ['park', 'gym', 'movie_theater', 'museum', 'night_club', 'stadium', 'tourist_attraction', 'spa'])) {
    return 'leisure';
  }
  if (hasType(types, ['hospital', 'doctor', 'pharmacy', 'dentist', 'physiotherapist', 'veterinary_care'])) {
    return 'health';
  }
  if (hasType(types, ['bus_station', 'subway_station', 'train_station', 'transit_station', 'taxi_stand', 'parking'])) {
    return 'transport';
  }
  if (hasType(types, ['bank', 'atm', 'accounting', 'finance'])) {
    return 'finance';
  }

  return 'other';
}

function hasType(types, targets) {
  return types.some(t => targets.includes(t));
}
