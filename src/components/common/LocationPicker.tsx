import React, { useState } from 'react';
import { MapPin, Navigation, Check, Search, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { POPULAR_CITIES, getGeohash } from '../../utils/location';

interface LocationPickerProps {
  onClose?: () => void;
  isOpen?: boolean;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ onClose, isOpen = true }) => {
  const { userLocation, requestUserLocation, setUserManualLocation } = useAuth();
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleUseGPS = async () => {
    setLoadingGeo(true);
    setErrorMsg('');
    const loc = await requestUserLocation();
    setLoadingGeo(false);
    if (loc) {
      if (onClose) onClose();
    } else {
      setErrorMsg('Location access was denied or unavailable. Please pick a city manually below.');
    }
  };

  const handleSelectCity = (city: { name: string; lat: number; lng: number }) => {
    setUserManualLocation({
      latitude: city.lat,
      longitude: city.lng,
      city: city.name,
      locationName: city.name,
      geohash: getGeohash(city.lat, city.lng),
    });
    if (onClose) onClose();
  };

  const filteredCities = POPULAR_CITIES.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Select Search Location</h3>
              <p className="text-xs text-slate-500">Discover part-time jobs near your area</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-5 space-y-4">
          {/* Active location indicator */}
          {userLocation && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium truncate">
                  Active: {userLocation.city || userLocation.locationName || 'Current GPS Location'}
                </span>
              </div>
              <span className="text-[10px] text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded font-mono">
                {userLocation.latitude.toFixed(2)}, {userLocation.longitude.toFixed(2)}
              </span>
            </div>
          )}

          {/* GPS Button */}
          <button
            onClick={handleUseGPS}
            disabled={loadingGeo}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm shadow-indigo-200 disabled:opacity-60"
          >
            <Navigation className={`w-4 h-4 ${loadingGeo ? 'animate-spin' : ''}`} />
            {loadingGeo ? 'Detecting Location...' : 'Use My Current Location (GPS)'}
          </button>

          {errorMsg && <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100">{errorMsg}</p>}

          <div className="relative flex items-center my-2">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="shrink-0 mx-3 text-xs text-slate-400 font-medium uppercase tracking-wider">
              Or Choose a City
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Filter cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Cities list */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredCities.map((city) => {
              const isSelected = userLocation?.city === city.name;
              return (
                <button
                  key={city.name}
                  onClick={() => handleSelectCity(city)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-left transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {city.name}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-400">
          Location is used solely to sort nearby job vacancies.
        </div>
      </div>
    </div>
  );
};
