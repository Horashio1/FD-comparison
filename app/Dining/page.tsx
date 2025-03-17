"use client"

import React, { useState, useMemo } from 'react';
import { Star, ThumbsUp, ThumbsDown, ExternalLink, Send, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type DiningPlace = {
  id: number;
  name: string;
  pricePerPerson: number;
  rating: number;
  image: string;
  thumbsUp: number;
  thumbsDown: number;
  tags: string[];
};

const diningPlaces: DiningPlace[] = [
  {
    id: 1,
    name: "Ministry of Crab",
    pricePerPerson: 15000,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=1074",
    thumbsUp: 124,
    thumbsDown: 12,
    tags: ["Fine Dining", "Open Late", "Private Area"]
  },
  {
    id: 2,
    name: "Graze Kitchen",
    pricePerPerson: 8500,
    rating: 4.3,
    image: "https://images.unsplash.com/photo-1592861956120-e524fc739696?auto=format&fit=crop&q=80&w=1170",
    thumbsUp: 89,
    thumbsDown: 15,
    tags: ["Buffet", "Large Groups", "Private Area"]
  },
  {
    id: 3,
    name: "Nuga Gama",
    pricePerPerson: 6500,
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1074",
    thumbsUp: 156,
    thumbsDown: 8,
    tags: ["Buffet", "BYOB", "Large Groups"]
  }
];

const allTags = [
  "Buffet",
  "BYOB",
  "Fine Dining",
  // "Large Groups",
  // "Open Late",
  // "Private Area",
  "Budget",
  // "Karoake"
];

const tagColors: Record<string, string> = {
  "Buffet": "bg-pink-100 text-pink-800 border-pink-200",
  "BYOB": "bg-purple-100 text-purple-800 border-purple-200",
  "Fine Dining": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Large Groups": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Open Late": "bg-orange-100 text-orange-800 border-orange-200",
  "Private Area": "bg-red-100 text-red-800 border-red-200",
  "Budget": "bg-gray-100 text-gray-800 border-gray-200",
  "Karoake": "bg-violet-100 text-violet-800 border-violet-200"
};

const tagEmojis: Record<string, string> = {
  "Buffet": "🍽️",
  "BYOB": "🍷",
  // "Fine Dining": "🍾",
  "Large Groups": "👥",
  // "Open Late": "🌙",
  // "Private Area": "🔒",
  "Budget": "💰",
  "Karoake": "🎤"
};

const regions = ["Colombo", "Nugegoda", "Mount Lavinia", "Dehiwala", "Rajagiriya"];

function App() {
  const [selectedRegion, setSelectedRegion] = useState("Colombo");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [userVotes, setUserVotes] = useState<Record<number, 'up' | 'down' | null>>({});
  const [newRestaurant, setNewRestaurant] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});

  const filteredPlaces = useMemo(() => {
    return diningPlaces.filter(place => {
      if (selectedTags.length === 0) return true;
      return selectedTags.every(tag => place.tags.includes(tag));
    });
  }, [selectedTags]);

  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleVote = (placeId: number, voteType: 'up' | 'down') => {
    setUserVotes(prev => ({
      ...prev,
      [placeId]: prev[placeId] === voteType ? null : voteType
    }));
  };

  const handleSubmitRestaurant = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRestaurant.trim()) {
      alert(`Thank you for suggesting ${newRestaurant}! We'll review it soon.`);
      setNewRestaurant("");
    }
  };

  const toggleCardExpansion = (id: number) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const resetFilters = () => {
    setSelectedTags([]);
  };

  const formatPrice = (price: number) => {
    return `Rs. ${price.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 md:px-8">
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dining Guide</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-[180px] border rounded-lg px-4 py-2">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {regions.map(region => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="sm:hidden flex items-center gap-2 px-4 py-2">
              <Filter className="h-4 w-4" />
              <span>Filters {selectedTags.length > 0 && `(${selectedTags.length})`}</span>
            </Button>
          </div>
        </div>

        {/* Tag Filters - Desktop */}
        <div className="hidden sm:block mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Select your Preferences</h2>
          <div className="flex flex-wrap gap-3">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`px-4 py-2 rounded-lg text-base font-medium transition-all border-2
                  ${selectedTags.includes(tag)
                    ? `${tagColors[tag]} border-current shadow-sm scale-105`
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
              >
                {tag} {tagEmojis[tag]}
              </button>
            ))}
          </div>
        </div>

        {/* Tag Filters - Mobile */}
        {showFilters && (
          <div className="sm:hidden fixed inset-0 bg-gray-900 bg-opacity-50 z-50">
            <div className="bg-white rounded-t-xl p-6 fixed bottom-0 left-0 right-0 max-h-[60vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Filters</h2>
                <span className="text-sm text-gray-500">{filteredPlaces.length} results</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all
                      ${selectedTags.includes(tag)
                        ? `${tagColors[tag]} shadow-sm`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {tag} {tagEmojis[tag]}
                  </button>
                ))}
              </div>
              <div className="flex justify-end items-center pt-4 border-t border-gray-200 gap-2">
                <Button variant="outline" onClick={resetFilters}>
                  Reset
                </Button>
                <Button onClick={() => setShowFilters(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {filteredPlaces.map((place) => (
            <div key={place.id} className="bg-white rounded-lg shadow overflow-hidden">
              <img
                src={place.image}
                alt={place.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-xl font-semibold text-gray-900">{place.name}</h2>
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="ml-1 text-gray-700">{place.rating}</span>
                  </div>
                </div>

                <div className="text-lg font-medium text-gray-700 mb-3">
                  {formatPrice(place.pricePerPerson)} per person
                </div>

                <div className={`transition-all duration-300 overflow-hidden ${expandedCards[place.id] ? 'max-h-96' : 'max-h-0 sm:max-h-96'}`}>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {place.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`px-2 py-1 rounded-full text-sm ${tagColors[tag]}`}
                      >
                        {tag} {tagEmojis[tag]}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleVote(place.id, 'up')}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors
                          ${userVotes[place.id] === 'up'
                            ? 'bg-green-100 text-green-700'
                            : 'hover:bg-gray-100'
                          }`}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>{place.thumbsUp}</span>
                      </button>
                      <button
                        onClick={() => handleVote(place.id, 'down')}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors
                          ${userVotes[place.id] === 'down'
                            ? 'bg-red-100 text-red-700'
                            : 'hover:bg-gray-100'
                          }`}
                      >
                        <ThumbsDown className="h-4 w-4" />
                        <span>{place.thumbsDown}</span>
                      </button>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      <span>More Info</span>
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => toggleCardExpansion(place.id)}
                  className="sm:hidden w-full mt-2 flex items-center justify-center text-gray-500"
                >
                  {expandedCards[place.id] ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Suggestion Form */}
        <div className="flex flex-col sm:flex-row items-center gap-4 py-4 border-t border-gray-200">
          <span className="text-gray-600 whitespace-nowrap">Can&apos;t find your restaurant?</span>
          <form onSubmit={handleSubmitRestaurant} className="flex-1 flex gap-2 w-full">
            <Input
              type="text"
              value={newRestaurant}
              onChange={(e) => setNewRestaurant(e.target.value)}
              placeholder="Enter restaurant name"
              maxLength={50}
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 max-w-full sm:max-w-md"
            />
            <Button type="submit" className="flex items-center gap-2 whitespace-nowrap">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Submit</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
