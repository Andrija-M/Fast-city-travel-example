import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Clock, Route, Bus, AlertCircle } from 'lucide-react';

// Mock bus stop data for Niš (in a real app, this would come from an API)
const mockBusStops = [
  { id: 1, name: "Trg Kralja Milana", lat: 43.3209, lng: 21.8958, lines: ["1", "2", "3", "7", "11"] },
  { id: 2, name: "Tvrđava", lat: 43.3253, lng: 21.8969, lines: ["2", "4", "12"] },
  { id: 3, name: "Centar", lat: 43.3181, lng: 21.8945, lines: ["1", "3", "5", "8"] },
  { id: 4, name: "Železnička stanica", lat: 43.3167, lng: 21.9069, lines: ["4", "6", "9", "11"] },
  { id: 5, name: "Univerzitet", lat: 43.3142, lng: 21.8978, lines: ["5", "7", "10"] },
  { id: 6, name: "Čair", lat: 43.3319, lng: 21.9089, lines: ["6", "8", "12"] },
  { id: 7, name: "Pantelej", lat: 43.3089, lng: 21.9167, lines: ["9", "10", "13"] },
  { id: 8, name: "Dušanovac", lat: 43.3056, lng: 21.8769, lines: ["1", "13", "14"] },
  { id: 9, name: "Bubanj", lat: 43.3378, lng: 21.8856, lines: ["2", "14", "15"] },
  { id: 10, name: "Medijana", lat: 43.2989, lng: 21.9025, lines: ["15", "16", "17"] }
];

const mockRoutes = [
  { line: "2", stops: [1, 2, 3], duration: 25 },
  { line: "3", stops: [1, 3, 4], duration: 30 },
  { line: "7", stops: [1, 2, 5], duration: 35 },
  { line: "9", stops: [1, 3, 6], duration: 40 },
  { line: "14", stops: [1, 4, 7], duration: 45 },
  { line: "5", stops: [3, 6, 9], duration: 20 },
  { line: "11", stops: [4, 7, 8], duration: 35 },
  { line: "15", stops: [2, 8, 10], duration: 50 }
];

// Dijkstra's algorithm implementation
class Graph {
  constructor() {
    this.vertices = {};
  }

  addVertex(vertex) {
    if (!this.vertices[vertex]) {
      this.vertices[vertex] = {};
    }
  }

  addEdge(vertex1, vertex2, weight) {
    this.addVertex(vertex1);
    this.addVertex(vertex2);
    this.vertices[vertex1][vertex2] = weight;
    this.vertices[vertex2][vertex1] = weight;
  }

  dijkstra(start, end) {
    const distances = {};
    const previous = {};
    const visited = new Set();
    const queue = [];

    // Initialize distances
    for (let vertex in this.vertices) {
      distances[vertex] = vertex === start.toString() ? 0 : Infinity;
      queue.push(vertex);
    }

    while (queue.length > 0) {
      // Find vertex with minimum distance
      let minVertex = queue.reduce((min, vertex) =>
        distances[vertex] < distances[min] ? vertex : min
      );

      queue.splice(queue.indexOf(minVertex), 1);
      visited.add(minVertex);

      if (minVertex === end.toString()) break;

      // Update distances to neighbors
      for (let neighbor in this.vertices[minVertex]) {
        if (!visited.has(neighbor)) {
          const alt = distances[minVertex] + this.vertices[minVertex][neighbor];
          if (alt < distances[neighbor]) {
            distances[neighbor] = alt;
            previous[neighbor] = minVertex;
          }
        }
      }
    }

    // Reconstruct path
    const path = [];
    let current = end.toString();
    while (current !== undefined) {
      path.unshift(parseInt(current));
      current = previous[current];
    }

    return { distance: distances[end.toString()], path };
  }
}

export default function NisTransitFinder() {
  const [fromStop, setFromStop] = useState('');
  const [toStop, setToStop] = useState('');
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mapRef = useRef(null);

  // Build graph from mock data
  const buildGraph = () => {
    const graph = new Graph();

    mockRoutes.forEach(route => {
      for (let i = 0; i < route.stops.length - 1; i++) {
        const stop1 = route.stops[i];
        const stop2 = route.stops[i + 1];
        const weight = route.duration / (route.stops.length - 1); // Average time per segment
        graph.addEdge(stop1, stop2, weight);
      }
    });

    return graph;
  };

  const findRoute = async () => {
    if (!fromStop || !toStop) {
      setError('Please select both departure and destination stops');
      return;
    }

    if (fromStop === toStop) {
      setError('Departure and destination cannot be the same');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const graph = buildGraph();
      const result = graph.dijkstra(parseInt(fromStop), parseInt(toStop));

      if (result.distance === Infinity) {
        setError('No route found between selected stops');
        setRoute(null);
      } else {
        const routeStops = result.path.map(stopId =>
          mockBusStops.find(stop => stop.id === stopId)
        );

        setRoute({
          stops: routeStops,
          duration: Math.round(result.distance),
          transfers: routeStops.length - 2
        });
      }
    } catch (err) {
      setError('Error finding route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStopById = (id) => mockBusStops.find(stop => stop.id === parseInt(id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Bus className="text-blue-600" size={40} />
            Niš Transit Finder
          </h1>
          <p className="text-gray-600 text-lg">Find the most efficient bus route in Niš</p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* From Stop */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <MapPin className="text-green-600" size={18} />
                From
              </label>
              <select
                value={fromStop}
                onChange={(e) => setFromStop(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Select departure stop</option>
                {mockBusStops.map(stop => (
                  <option key={stop.id} value={stop.id}>
                    {stop.name}
                  </option>
                ))}
              </select>
            </div>

            {/* To Stop */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Navigation className="text-red-600" size={18} />
                To
              </label>
              <select
                value={toStop}
                onChange={(e) => setToStop(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Select destination stop</option>
                {mockBusStops.map(stop => (
                  <option key={stop.id} value={stop.id}>
                    {stop.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={findRoute}
            disabled={loading || !fromStop || !toStop}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Finding Route...
              </>
            ) : (
              <>
                <Route size={20} />
                Find Best Route
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="text-red-600" size={20} />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Route Results */}
        {route && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Route className="text-blue-600" size={24} />
              Recommended Route
            </h2>

            {/* Route Summary */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <Clock className="text-blue-600 mx-auto mb-2" size={24} />
                <div className="text-2xl font-bold text-blue-900">{route.duration}</div>
                <div className="text-sm text-blue-700">minutes</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <Bus className="text-green-600 mx-auto mb-2" size={24} />
                <div className="text-2xl font-bold text-green-900">{route.stops.length - 1}</div>
                <div className="text-sm text-green-700">stops</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <Navigation className="text-purple-600 mx-auto mb-2" size={24} />
                <div className="text-2xl font-bold text-purple-900">{route.transfers}</div>
```

Is there anything missing here which causes this not to display?
