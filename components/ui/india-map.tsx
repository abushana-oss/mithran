'use client';

import { useState } from 'react';

interface StateData {
  [key: string]: number;
}

interface IndiaMapProps {
  stateData: StateData;
  className?: string;
  showLegend?: boolean;
}

// Mapping of cities to states
const CITY_TO_STATE: { [key: string]: string } = {
  'Bengaluru': 'Karnataka',
  'Bangalore': 'Karnataka',
  'Hosur': 'Tamil Nadu',
  'Chennai': 'Tamil Nadu',
  'Rajkot': 'Gujarat',
  'Veraval': 'Gujarat',
  'Shapar': 'Gujarat',
  'Kolhapur': 'Maharashtra',
  'Pune': 'Maharashtra',
  'Mumbai': 'Maharashtra',
  'Miraj': 'Maharashtra',
  'Ambernath': 'Maharashtra',
  'Gurugram': 'Haryana',
  'Gurgaon': 'Haryana',
  'Sriperumbudur': 'Tamil Nadu',
  'Vellakinar': 'Tamil Nadu',
  'Hyderabad': 'Telangana',
  'Kolkata': 'West Bengal',
  'Delhi': 'Delhi',
  'New Delhi': 'Delhi',
  'Ahmedabad': 'Gujarat',
  'Jaipur': 'Rajasthan',
  'Lucknow': 'Uttar Pradesh',
  'Noida': 'Uttar Pradesh',
  'Ghaziabad': 'Uttar Pradesh',
  'Kanpur': 'Uttar Pradesh',
  'Nagpur': 'Maharashtra',
  'Indore': 'Madhya Pradesh',
  'Bhopal': 'Madhya Pradesh',
  'Patna': 'Bihar',
  'Ranchi': 'Jharkhand',
  'Bhubaneswar': 'Odisha',
  'Raipur': 'Chhattisgarh',
  'Thiruvananthapuram': 'Kerala',
  'Kochi': 'Kerala',
  'Visakhapatnam': 'Andhra Pradesh',
  'Vijayawada': 'Andhra Pradesh',
  'Coimbatore': 'Tamil Nadu',
  'Madurai': 'Tamil Nadu',
};

// State SVG paths (India map with major states)
const STATE_PATHS: { [key: string]: string } = {
  'Jammu and Kashmir': 'M 145,25 L 155,20 L 165,22 L 175,25 L 180,30 L 175,35 L 165,38 L 155,35 L 145,30 Z',
  'Himachal Pradesh': 'M 155,35 L 165,32 L 175,35 L 180,40 L 175,45 L 165,48 L 155,45 Z',
  'Punjab': 'M 145,40 L 155,38 L 165,40 L 170,45 L 165,50 L 155,52 L 145,48 Z',
  'Haryana': 'M 155,48 L 165,45 L 175,48 L 180,55 L 175,62 L 165,65 L 155,60 Z',
  'Delhi': 'M 165,55 L 170,52 L 175,55 L 175,60 L 170,63 L 165,60 Z',
  'Uttarakhand': 'M 175,45 L 185,42 L 195,45 L 200,52 L 195,58 L 185,60 L 175,55 Z',
  'Uttar Pradesh': 'M 165,60 L 185,58 L 205,62 L 225,65 L 230,72 L 225,85 L 205,90 L 185,88 L 165,82 L 155,75 Z',
  'Rajasthan': 'M 125,55 L 145,52 L 165,55 L 175,68 L 170,95 L 165,110 L 155,125 L 145,130 L 125,125 L 115,110 L 110,85 L 115,65 Z',
  'Gujarat': 'M 95,110 L 115,105 L 135,110 L 145,125 L 145,145 L 135,160 L 115,165 L 95,160 L 85,145 L 85,125 Z',
  'Madhya Pradesh': 'M 155,95 L 175,92 L 195,95 L 215,100 L 230,110 L 235,125 L 230,145 L 215,155 L 195,158 L 175,155 L 155,145 L 145,130 L 145,110 Z',
  'Maharashtra': 'M 135,160 L 155,155 L 175,158 L 195,165 L 210,175 L 215,195 L 205,215 L 185,225 L 165,225 L 145,218 L 125,205 L 115,185 L 115,170 Z',
  'Goa': 'M 125,205 L 135,202 L 145,205 L 145,215 L 135,218 L 125,215 Z',
  'Karnataka': 'M 145,218 L 165,215 L 185,220 L 205,230 L 215,250 L 210,275 L 195,295 L 175,305 L 155,305 L 135,295 L 125,275 L 125,250 L 135,230 Z',
  'Kerala': 'M 135,275 L 145,270 L 155,275 L 158,295 L 155,320 L 145,340 L 135,345 L 125,340 L 122,320 L 125,295 Z',
  'Tamil Nadu': 'M 155,305 L 175,302 L 195,308 L 210,320 L 215,340 L 208,355 L 195,365 L 175,368 L 155,365 L 145,355 L 145,340 L 148,320 Z',
  'Andhra Pradesh': 'M 185,225 L 205,222 L 225,228 L 245,240 L 250,260 L 245,280 L 230,295 L 210,302 L 195,302 L 185,295 L 180,280 L 180,255 Z',
  'Telangana': 'M 195,205 L 210,202 L 225,208 L 235,220 L 235,235 L 228,248 L 215,255 L 200,255 L 190,245 L 188,228 Z',
  'Chhattisgarh': 'M 215,125 L 235,122 L 255,128 L 265,142 L 265,160 L 255,175 L 238,185 L 220,185 L 210,172 L 210,145 Z',
  'Odisha': 'M 240,175 L 258,172 L 278,178 L 290,195 L 290,215 L 280,235 L 265,245 L 248,245 L 238,235 L 235,215 L 238,195 Z',
  'West Bengal': 'M 255,128 L 275,125 L 295,132 L 305,148 L 305,165 L 298,182 L 285,192 L 270,192 L 260,182 L 258,165 Z',
  'Bihar': 'M 205,75 L 225,72 L 245,78 L 260,88 L 260,105 L 250,118 L 235,122 L 215,120 L 205,108 L 202,88 Z',
  'Jharkhand': 'M 235,122 L 255,120 L 272,125 L 282,138 L 280,155 L 268,168 L 253,172 L 238,168 L 232,155 L 232,138 Z',
}

// Major cities coordinates for reference
const CITY_MARKERS: { [key: string]: { x: number; y: number; state: string } } = {
  'Bengaluru': { x: 165, y: 260, state: 'Karnataka' },
  'Bangalore': { x: 165, y: 260, state: 'Karnataka' },
  'Chennai': { x: 185, y: 340, state: 'Tamil Nadu' },
  'Mumbai': { x: 135, y: 185, state: 'Maharashtra' },
  'Pune': { x: 155, y: 195, state: 'Maharashtra' },
  'Hyderabad': { x: 210, y: 230, state: 'Telangana' },
  'Kolkata': { x: 280, y: 165, state: 'West Bengal' },
  'Ahmedabad': { x: 110, y: 135, state: 'Gujarat' },
  'Rajkot': { x: 105, y: 140, state: 'Gujarat' },
  'Veraval': { x: 95, y: 145, state: 'Gujarat' },
  'Shapar': { x: 108, y: 138, state: 'Gujarat' },
  'Delhi': { x: 168, y: 58, state: 'Delhi' },
  'Gurugram': { x: 165, y: 62, state: 'Haryana' },
  'Kolhapur': { x: 145, y: 210, state: 'Maharashtra' },
  'Miraj': { x: 150, y: 205, state: 'Maharashtra' },
  'Ambernath': { x: 140, y: 190, state: 'Maharashtra' },
  'Hosur': { x: 175, y: 308, state: 'Tamil Nadu' },
  'Sriperumbudur': { x: 180, y: 335, state: 'Tamil Nadu' },
  'Vellakinar': { x: 165, y: 318, state: 'Tamil Nadu' },
};

export function IndiaMap({ stateData, className = '', showLegend = true }: IndiaMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Convert city data to state data
  const stateSupplierCounts: StateData = {};
  Object.entries(stateData).forEach(([city, count]) => {
    const state = CITY_TO_STATE[city];
    if (state) {
      stateSupplierCounts[state] = (stateSupplierCounts[state] || 0) + count;
    }
  });

  const maxCount = Math.max(...Object.values(stateSupplierCounts), 1);

  const getStateColor = (state: string) => {
    const count = stateSupplierCounts[state] || 0;
    if (count === 0) return 'rgb(241 245 249)'; // slate-100

    const intensity = count / maxCount;
    if (intensity > 0.7) return 'rgb(37 99 235)'; // blue-600
    if (intensity > 0.5) return 'rgb(59 130 246)'; // blue-500
    if (intensity > 0.3) return 'rgb(96 165 250)'; // blue-400
    if (intensity > 0.1) return 'rgb(147 197 253)'; // blue-300
    return 'rgb(219 234 254)'; // blue-200
  };

  const getStateHoverColor = (state: string) => {
    const count = stateSupplierCounts[state] || 0;
    if (count === 0) return 'rgb(226 232 240)'; // slate-200

    const intensity = count / maxCount;
    if (intensity > 0.7) return 'rgb(29 78 216)'; // blue-700
    if (intensity > 0.5) return 'rgb(37 99 235)'; // blue-600
    if (intensity > 0.3) return 'rgb(59 130 246)'; // blue-500
    if (intensity > 0.1) return 'rgb(96 165 250)'; // blue-400
    return 'rgb(147 197 253)'; // blue-300
  };

  const handleMouseEnter = (state: string, event: React.MouseEvent) => {
    setHoveredState(state);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (hoveredState) {
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltipPos({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    }
  };

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="60 0 260 380"
        className="w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredState(null)}
      >
        {/* State paths */}
        {Object.entries(STATE_PATHS).map(([state, path]) => (
          <path
            key={state}
            d={path}
            fill={hoveredState === state ? getStateHoverColor(state) : getStateColor(state)}
            stroke="#ffffff"
            strokeWidth="1.5"
            className="transition-colors duration-200 cursor-pointer"
            onMouseEnter={(e) => handleMouseEnter(state, e)}
          />
        ))}

        {/* City markers for cities with suppliers */}
        {Object.entries(stateData).map(([city, count]) => {
          const marker = CITY_MARKERS[city];
          if (!marker || count === 0) return null;

          const radius = Math.min(4 + (count / maxCount) * 8, 12);

          return (
            <g key={city}>
              {/* Outer glow */}
              <circle
                cx={marker.x}
                cy={marker.y}
                r={radius + 2}
                fill="#dc2626"
                opacity="0.2"
              />
              {/* Main marker */}
              <circle
                cx={marker.x}
                cy={marker.y}
                r={radius}
                fill="#dc2626"
                stroke="#ffffff"
                strokeWidth="1.5"
                opacity="0.95"
              />
              {/* Count label with background */}
              <g>
                <text
                  x={marker.x}
                  y={marker.y - radius - 5}
                  fontSize="9"
                  fill="#ffffff"
                  textAnchor="middle"
                  stroke="#1f2937"
                  strokeWidth="3"
                  className="font-bold pointer-events-none"
                >
                  {count}
                </text>
                <text
                  x={marker.x}
                  y={marker.y - radius - 5}
                  fontSize="9"
                  fill="#1f2937"
                  textAnchor="middle"
                  className="font-bold pointer-events-none"
                >
                  {count}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredState && (
        <div
          className="absolute bg-gray-900 text-white text-xs rounded px-2 py-1 pointer-events-none z-10 shadow-lg"
          style={{
            left: `${tooltipPos.x + 10}px`,
            top: `${tooltipPos.y - 10}px`,
            transform: 'translateY(-100%)',
          }}
        >
          <div className="font-medium">{hoveredState}</div>
          <div className="text-gray-300">
            {stateSupplierCounts[hoveredState] || 0} suppliers
          </div>
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-center gap-3 text-xs">
            <span className="text-muted-foreground font-medium">Supplier Density</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="text-muted-foreground">Low</span>
            <div className="flex gap-0.5">
              <div className="w-8 h-3 rounded-l" style={{ backgroundColor: 'rgb(219 234 254)' }} />
              <div className="w-8 h-3" style={{ backgroundColor: 'rgb(147 197 253)' }} />
              <div className="w-8 h-3" style={{ backgroundColor: 'rgb(96 165 250)' }} />
              <div className="w-8 h-3" style={{ backgroundColor: 'rgb(59 130 246)' }} />
              <div className="w-8 h-3 rounded-r" style={{ backgroundColor: 'rgb(37 99 235)' }} />
            </div>
            <span className="text-muted-foreground">High</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-600" />
              <span className="text-muted-foreground">City markers (size by count)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
