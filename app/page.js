"use client";
import { useState, useMemo } from "react";

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
      <div className="h-4 bg-gray-700 rounded w-5/6 mb-2"></div>
      <div className="h-4 bg-gray-700 rounded w-4/6 mb-6"></div>
      <div className="h-4 bg-gray-700 rounded w-1/4"></div>
    </div>
  );
}

function StarRating({ rating }) {
  const num = parseFloat(rating) || 0;
  const full = Math.floor(num);
  const half = num - full >= 0.5;
  return (
    <span className="flex items-center gap-1 text-sm">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={
          i <= full ? "text-yellow-400" :
          i === full + 1 && half ? "text-yellow-300 opacity-60" :
          "text-gray-600"
        }>★</span>
      ))}
      <span className="text-gray-400 ml-1">{num.toFixed(1)}</span>
    </span>
  );
}

function ResultCard({ place, index }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-gray-600 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-start gap-3">
          <span className="text-gray-600 font-bold text-lg mt-0.5">#{index + 1}</span>
          <h3 className="text-lg font-bold">{place.name}</h3>
        </div>
        <span className="text-xs bg-blue-900 text-blue-300 px-3 py-1 rounded-full whitespace-nowrap ml-2">
          {place.type}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
        <p className="text-gray-400 text-sm">📍 {place.address}</p>
        <p className="text-green-400 text-sm font-medium">💰 {place.estimatedCost}</p>
        <p className="text-gray-400 text-sm">⏱ {place.duration}</p>
        {place.distanceKm != null && (
          <p className="text-gray-400 text-sm">🗺️ ~{place.distanceKm} km (straight-line)</p>
        )}
        {place.rating != null && <StarRating rating={place.rating} />}
      </div>
      <p className="text-gray-300 text-sm mb-5 leading-relaxed">{place.whyItFits}</p>
      <a
        href={place.link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors inline-block"
      >
        Open in Maps
      </a>
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
  const [maxDistance, setMaxDistance] = useState(15);
  const [minRating, setMinRating] = useState(0);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleReset() {
    setResults([]);
    setSearched(false);
    setError("");
    setMaxDistance(15);
    setMinRating(0);
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

  const filteredResults = useMemo(() => {
    return results.filter(place => {
      const dist = parseFloat(place.distanceKm) || 0;
      const rating = parseFloat(place.rating) || 0;
      return dist <= maxDistance && rating >= minRating;
    });
  }, [results, maxDistance, minRating]);

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-12">
      <div className="max-w-2xl mx-auto">

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">Outing Planner</h1>
          <p className="text-gray-400">Find the perfect restaurants and activities for your group</p>
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
              placeholder="🍽️ Category (e.g. indoor activity + dinner)"
              value={formData.category}
              onChange={handleChange}
              className="bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              name="duration"
              placeholder="⏱️ Duration (e.g. activity: 1.5 hrs, dinner: 2 hrs)"
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
            <p className="text-center text-gray-400 text-sm mb-2">
              Finding the best places for your team...
            </p>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {error && (
          <div className="bg-red-900 text-red-300 rounded-xl p-4 mb-6">{error}</div>
        )}

        {results.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">
                {filteredResults.length} Places Found
              </h2>
              <button
                onClick={handleReset}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Search again
              </button>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4 mb-2">
              <p className="text-sm text-gray-400 font-medium">Filter results</p>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300">Max distance</span>
                  <span className="text-blue-400">{maxDistance} km</span>
                </div>
                <input
                  type="range" min="1" max="15" step="1"
                  value={maxDistance}
                  onChange={e => setMaxDistance(parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>1 km</span><span>15 km</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300">Minimum rating</span>
                  <span className="text-blue-400">{minRating === 0 ? "Any" : minRating + "+ stars"}</span>
                </div>
                <input
                  type="range" min="0" max="4.5" step="0.5"
                  value={minRating}
                  onChange={e => setMinRating(parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>Any</span><span>4.5+</span>
                </div>
              </div>
            </div>

            {filteredResults.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No places match your filters. Try adjusting the distance or rating.
              </div>
            ) : (
              filteredResults.map((place, index) => (
                <ResultCard key={index} place={place} index={index} />
              ))
            )}

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