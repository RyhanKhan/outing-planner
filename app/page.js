"use client";
import { useState } from "react";

function SkeletonCard() {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="h-5 bg-gray-700 rounded w-1/2"></div>
        <div className="h-5 bg-gray-700 rounded w-1/4"></div>
      </div>
      <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
      <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-700 rounded w-5/6 mb-6"></div>
      <div className="h-4 bg-gray-700 rounded w-1/4"></div>
    </div>
  );
}

function ResultCard({ place }) {
  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(place.name + " " + place.address)}`;
  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-gray-600 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-bold pr-4">{place.name}</h3>
        <span className="text-xs bg-blue-900 text-blue-300 px-3 py-1 rounded-full whitespace-nowrap">
          {place.type}
        </span>
      </div>
      <div className="flex flex-col gap-1 mb-4">
        <p className="text-gray-400 text-sm">📍 {place.address}</p>
        <p className="text-green-400 text-sm font-medium">💰 {place.estimatedCost}</p>
        <p className="text-gray-400 text-sm">⏱ {place.duration}</p>
      </div>
      <p className="text-gray-300 text-sm mb-5 leading-relaxed">{place.whyItFits}</p>
      <div className="flex gap-3">
        <a
          href={place.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          More info
        </a>
        <a
          href={mapsUrl}
    target="_blank"
          rel="noopener noreferrer"
          className="text-sm bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Open in Maps
        </a>
      </div>
      <p className="text-xs text-gray-600 mt-4">
          Verify availability before visiting — places may have changed.
        </p>
    </div>
  );
}

export default function Home() {
  const [formData, setFormData] = useState({
    location: "",
    people: "",
    budget: "",
    category: "",
    duration: "",
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleReset() {
    setResults([]);
    setSearched(false);
    setError("");
  }

  async function handleSearch() {
    setLoading(true);
    setError("");
    setResults([]);
    setSearched(true);
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResults(data.results);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-12">
      <div className="max-w-2xl mx-auto">

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">Outing Planner</h1>
          <p className="text-gray-400">
            Find the perfect restaurants and activities for your group
          </p>
        </div>

        {!searched && (
          <div className="bg-gray-900 rounded-2xl p-6 flex flex-col gap-4 mb-8 border border-gray-800">
            <input
              name="location"
              placeholder="📍 Location (e.g. Indiranagar, Bengaluru)"
              value={formData.location}
            onChange={handleChange}
              className="bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                name="people"
                placeholder="👥 No. of people"
                value={formData.people}
                onChange={handleChange}
                className="bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                name="budget"
                placeholder="💰 Budget/person"
                value={formData.budget}
                onChange={handleChange}
                className="bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <input
              name="category"
              placeholder="🍽️ Category (ner, cafe, outdoor activity)"
              value={formData.category}
              onChange={handleChange}
              className="bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              name="duration"
              placeholder="⏱️ Duration (e.g. 2 hours)"
              value={formData.duration}
              onChange={handleChange}
              className="bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl px-4 py-3 font-semibold transition-colors"
            >
              Find Places
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col gap-4">
            <div clame="text-center text-gray-400 text-sm mb-2">
              Searching the web for the best places...
            </div>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {error && (
          <div className="bg-red-900 text-red-300 rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">Results</h2>
              <button
                onClick={handleReset}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Search again
              </button>
            </div>
            {results.map((place, index) => (
              <ResultCard key={index} place={place} />
            ))}
            <button
              onClick={handleReset}
              className="mt-4 w-full bg-gray-800 hover:bg-gray-700 text-white rounded-xl px-4 py-3 font-semibold transition-colors"
            >
              Start a new search
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
