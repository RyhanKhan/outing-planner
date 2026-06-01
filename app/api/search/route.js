import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Step 1: Gemini searches the web for quality venues by name
async function findQualityVenues(location, people, budget, category, duration) {
  const model = geminiClient.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: [{ googleSearch: {} }],
  });

  const prompt = `
    Search the web and find the best venues in ${location} for a corporate team outing.

    Context: This is for a senior consulting team at McKinsey & Company. They value:
    - Unique, experiential venues (not generic or budget)
    - Quality food, craft drinks, or engaging activities
    - Professional yet fun atmosphere suitable for team bonding
    - Examples of past outings they enjoyed: craft breweries, beer gardens, bowling, go-karting

    Requirements:
    - Category: ${category}
    - Number of people: ${people}
    - Budget per person: ${budget}
    - Duration: ${duration}
    - Must be currently operating in 2026

    Search for venues specifically matching this vibe. Look for:
    - Upscale restaurants, craft breweries, rooftop bars, specialty dining
    - For activities: escape rooms, go-karting, bowling alleys, sports bars, 
      axe throwing, virtual reality, golf simulators, comedy clubs
    - Avoid: cinemas, hotels, malls, generic fast food, anything that closed down

    Return ONLY a JSON array of 12 venue names to look up, no explanation, no markdown:
    ["Venue Name 1", "Venue Name 2", "Venue Name 3", ...]
  `;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().replace(/```json|```/g, "").trim();
  return JSON.parse(raw);
}

// Step 2: Geocode the input location
async function geocodeLocation(location) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${PLACES_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== "OK") throw new Error(`Geocoding failed: ${data.status}`);
  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng };
}

// Step 3: Look up each venue name in Google Places to verify it exists
async function verifyVenueOnPlaces(venueName, location) {
  const query = `${venueName} ${location}`;
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=name,place_id,formatted_address,geometry,rating,business_status,types,opening_hours&key=${PLACES_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== "OK" || !data.candidates || data.candidates.length === 0) {
    return null;
  }
  return data.candidates[0];
}

// Step 4: Calculate straight-line distance
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Step 5: Gemini writes rich descriptions using verified data
async function writeDescriptions(venues, location, people, budget, category, duration) {
  const model = geminiClient.getGenerativeModel({ model: "gemini-2.5-flash" });

  const venueList = venues.map((v, i) => `
    ${i + 1}. ${v.name}
    - Address: ${v.address}
    - Distance: ${v.distanceKm} km from ${location}
    - Rating: ${v.rating}
    - Maps URL: ${v.mapsUrl}
  `).join("\n");

  const prompt = `
    You are a corporate team outing planner for a McKinsey & Company senior consulting team.
    
    Write detailed, accurate descriptions for these verified venues for a team outing:
    - Category: ${category}
    - People: ${people}
    - Budget per person: ${budget}
    - Duration: ${duration}

    Venues (verified from Google Maps):
    ${venueList}

    For each venue write a genuine 3-4 sentence description based on what you know about it.
    Cover: what kind of place it is, atmosphere, what the team will do/eat/drink there, 
    why it suits a professional consulting team outing.
    If you are not confident about a venue, still write a description based on its name and rating.

    For each venue:
    - Copy distanceKm EXACTLY as a number
    - Copy rating EXACTLY as a number
    - Estimate total cost for ${people} people
    - Estimate duration

    Return ONLY a valid JSON array, no markdown:
    [
      {
        "name": "exact venue name",
        "type": "Craft Brewery",
        "address": "exact address",
        "estimatedCost": "INR 2000 total",
        "whyItFits": "3-4 sentence description",
        "duration": "2 hours",
        "link": "exact maps url",
        "distanceKm": 1.2,
        "rating": 4.3
      }
    ]
  `;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().replace(/```json|```/g, "").trim();
  return JSON.parse(raw);
}

export async function POST(request) {
  try {
    const { location, people, budget, category, duration } = await request.json();

    // Step 1 and 2 run in parallel — find venues and geocode location simultaneously
    const [venueNames, { lat, lng }] = await Promise.all([
      findQualityVenues(location, people, budget, category, duration),
      geocodeLocation(location),
    ]);

    console.log(`Found venue names: ${venueNames}`);
    console.log(`Geocoded to: ${lat}, ${lng}`);

    // Step 3: Verify all venues on Google Places in parallel
    const verificationResults = await Promise.all(
      venueNames.map(name => verifyVenueOnPlaces(name, location))
    );

    const excludedTypes = ["lodging", "movie_theater", "transit_station", "gas_station", "grocery_or_supermarket"];

    // Step 4: Filter, calculate distance, clean up
    const verifiedVenues = verificationResults
      .filter(p => {
        if (!p) return false;
        if (p.business_status === "CLOSED_PERMANENTLY") return false;
        if (p.types && p.types.some(t => excludedTypes.includes(t))) return false;
        if ((p.rating || 0) < 3.5) return false;
        return true;
      })
      .map(p => ({
        name: p.name,
        address: p.formatted_address,
        rating: p.rating || 4.0,
        types: p.types,
        distanceKm: calculateDistance(lat, lng, p.geometry.location.lat, p.geometry.location.lng),
        mapsUrl: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
      }))
      .filter(p => p.distanceKm <= 15)
      .sort((a, b) => b.rating - a.rating);

    console.log(`Verified ${verifiedVenues.length} venues on Google Places`);

    if (verifiedVenues.length === 0) {
      return Response.json(
        { error: "No verified places found. Try a different location or category." },
        { status: 404 }
      );
    }

    // Step 5: Write rich descriptions
    const results = await writeDescriptions(verifiedVenues, location, people, budget, category, duration);
    return Response.json({ results });

  } catch (error) {
    console.error("API error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}