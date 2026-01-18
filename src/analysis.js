export function calculateScore(places) {
    let score = 50; // Base score
    const breakdown = {
        food: 0,
        retail: 0,
        education: 0,
        leisure: 0,
        health: 0,
        transport: 0,
        finance: 0,
        other: 0
    };

    // Analysis Weights (Hypothetical for "General Business Potential")
    // High traffic areas (food, retail, transport) are generally good.
    const weights = {
        food: 2,
        retail: 3,
        education: 2,
        leisure: 2,
        health: 1,
        transport: 2,
        finance: 1,
        other: 0.5
    };

    places.forEach(place => {
        if (breakdown[place.category] !== undefined) {
            breakdown[place.category]++;
            score += weights[place.category];
        } else {
            breakdown.other++;
            score += weights.other;
        }
    });

    // Normalize/Clamp score
    score = Math.min(100, Math.max(0, score));

    return {
        score: Math.round(score),
        breakdown
    };
}
