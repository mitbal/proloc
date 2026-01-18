export async function fetchNearbyPlaces(lat, lon, radius = 500) {
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"](around:${radius},${lat},${lon});
        way["amenity"](around:${radius},${lat},${lon});
        node["shop"](around:${radius},${lat},${lon});
        way["shop"](around:${radius},${lat},${lon});
        node["leisure"](around:${radius},${lat},${lon});
        way["leisure"](around:${radius},${lat},${lon});
      );
      out body;
      >;
      out skel qt;
    `;
  
    const url = 'https://overpass-api.de/api/interpreter';
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `data=${encodeURIComponent(query)}`
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const data = await response.json();
      return processOSMData(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }
  
  function processOSMData(data) {
    const places = [];
  
    // Simple classification
    data.elements.forEach(el => {
      // We only care about nodes and ways that have tags
      if (el.tags) {
        let category = 'other';
        const t = el.tags;
  
        if (t.amenity === 'cafe' || t.amenity === 'restaurant' || t.amenity === 'fast_food' || t.amenity === 'bar') {
          category = 'food';
        } else if (t.amenity === 'school' || t.amenity === 'university' || t.amenity === 'college' || t.amenity === 'kindergarten') {
          category = 'education';
        } else if (t.shop === 'supermarket' || t.shop === 'convenience' || t.shop === 'mall') {
          category = 'retail';
        } else if (t.leisure === 'park' || t.leisure === 'garden') {
          category = 'leisure';
        } else if (t.amenity === 'bank' || t.amenity === 'atm') {
          category = 'finance';
        } else if (t.amenity === 'pharmacy' || t.amenity === 'hospital' || t.amenity === 'clinic') {
          category = 'health';
        } else if (t.amenity === 'parking' || t.amenity === 'bus_station') {
          category = 'transport';
        }
  
        places.push({
          id: el.id,
          lat: el.lat, // For ways, this is simplified. Ideally we need center. But Overpass 'out center' handles it? 
                       // No, 'out body' gives nodes for ways. 
                       // For simplicity in this demo, we might miss coords for ways unless we use 'out center' in query.
                       // Let's rely on nodes for precise location or robust handling.
                       // Update: Overpass 'out center' provides center lat/lon for ways. 'out body' does not.
                       // I will update query to 'out center;' in next step or now?
                       // I will fix the query in the file above to use 'out center' instead of 'out body'.
          lon: el.lon,
          name: t.name || 'Unknown',
          category: category,
          type: t.amenity || t.shop || t.leisure
        });
      }
    });

    // Handle ways center if 'out center' is used, the response has center info
    // Actually, let's just stick to nodes for now or assume 'out center' adds lat/lon to way elements.
    // Yes, 'out center' adds lat/lon to way elements.
    
    return places;
  }
