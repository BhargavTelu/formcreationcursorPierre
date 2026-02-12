// Test script to verify label transformation
const EXPERIENCE_LABELS = {
  beach: "Beach & Coast",
  nature: "Nature & Scenic",
  safari: "Safari & Wildlife",
  city: "City & Culture",
  adventure: "Adventure & Outdoors",
  history: "History & Local Life",
};

const ACCOMMODATION_LABELS = {
  boutique: "Boutique hotels",
  lodges: "Lodges & safari camps",
  guesthouse: "Guesthouses / B&Bs",
  hotel: "Hotels with bar & pool",
};

const PACE_LABELS = {
  relaxed: "Unhurried",
  balanced: "Balanced",
  active: "Full days",
};

// Test data (IDs)
const testData = {
  experiences: ["history"],
  accommodationTypes: ["hotel"],
  pace: "relaxed",
};

// Transform
const transformed = {
  experiences: testData.experiences.map((id) => EXPERIENCE_LABELS[id] || id),
  accommodationTypes: testData.accommodationTypes.map((id) => ACCOMMODATION_LABELS[id] || id),
  pace: testData.pace ? PACE_LABELS[testData.pace] || testData.pace : "",
};

console.log("📥 INPUT (IDs):");
console.log(JSON.stringify(testData, null, 2));

console.log("\n📤 OUTPUT (Labels):");
console.log(JSON.stringify(transformed, null, 2));

console.log("\n✅ EXPECTED:");
console.log(JSON.stringify({
  experiences: ["History & Local Life"],
  accommodationTypes: ["Hotels with bar & pool"],
  pace: "Unhurried",
}, null, 2));
