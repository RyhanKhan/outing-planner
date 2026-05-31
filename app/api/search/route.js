import { GoogleGenerativeAI } from "@google/generative-ai";

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { location, people, budget, category, duration } = await request.json();

    const prompt = `
      You are a helpful local guide with access to real-time web search.
      
      Today's date is ${new Date().toDateString()}.
      
      CRITICAL: Only include places you can confirm are open in 2026 via recent web search results.
      Search specifically for "[place name] closed 2025" or "[place name] closed 2026" to verify.
      If a place has ANY reports of closing, skip it and find another.
      Prioritise places with Zomato, Swiggy, or Google Maps listings active in 2026.
      
      Search the web RIGHT NOW for restaurants and activities that are CURRENTLY OPEN AND OPERATING 
      as of today. This is critical - do not suggest any place that has closed down, 
      shut permanently, or that you are not 100% sure is still actively operating today.
      
      Before including any place, you must verify through your web search that:
      1. The place is confirmed open and operating in 2025 or 2026
      2. It has recent reviews or activity (within the last 6 months)
      3. It has not been reported as closed, shutting down, or under indefinite closure
      
      If you are not confident a place is currently open, do NOT include it.
      
      Find places based on these requirements:
      - Location: ${location}
      - Number of people: ${people}
      - Budget per person: ${budget}
      - Category: ${category}
      - Duration: ${duration}
      
      For each place return:
      1. Name of the place
      2. Type (restaurant/activity/cafe etc.)
      3. Address
      4. Estimated cost for ${people} people total
      5. Why it fits the requirements
      6. Approximate duration
      7. A link to their current website, Google Maps, Zomato, or Swiggy page

      IMPORTANT: Your response must start with [ and end with ].
      Do not include any text before or after the JSON array.
      Do not include any explanation, greeting, or markdown.
      Return ONLY a valid JSON array of 5 results in this exact format:
      [
        {
          "name": "Place Name",
          "type": "Restaurant",
          "address": "Full address",
          "estimatedCost": "total cost",
          "whyItFits": "One sentence explanation",
          "duration": "1.5 hours",
          "link": "https://..."
        }
      ]
    `;

    const model = client.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: [{ googleSearch: {} }],  // This enables web search
    });

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // Clean and parse the JSON response
    const clean = rawText.replace(/```json|```/g, "").trim();
    const results = JSON.parse(clean);

    return Response.json({ results });

  } catch (error) {
    console.error("API error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}