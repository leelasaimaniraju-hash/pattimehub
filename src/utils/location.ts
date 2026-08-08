import { geohashForLocation, distanceBetween } from 'geofire-common';
import { UserLocation } from '../types';

/**
 * Calculates distance in kilometers between two coordinates using Haversine formula
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  try {
    const distInKm = distanceBetween([lat1, lon1], [lat2, lon2]);
    return Math.round(distInKm * 10) / 10; // Round to 1 decimal place
  } catch {
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }
}

/**
 * Generates geohash string for given latitude and longitude
 */
export function getGeohash(lat: number, lng: number): string {
  try {
    return geohashForLocation([lat, lng]);
  } catch (err) {
    console.error('Geohash generation error:', err);
    return '9q8yy'; // Fallback
  }
}

export const getGeohashForCoords = getGeohash;

/**
 * Format distance string nicely (e.g., "1.2 km away" or "800 m away")
 */
export function formatDistance(distanceKm: number | undefined): string {
  if (distanceKm === undefined || isNaN(distanceKm)) return 'Location available';
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
}

/**
 * Requests browser Geolocation coordinates
 */
export function getCurrentBrowserLocation(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const geohash = getGeohash(latitude, longitude);

        resolve({
          latitude,
          longitude,
          geohash,
          locationName: 'Current Location',
        });
      },
      (error) => {
        let msg = 'Unable to retrieve location';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission denied by user';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location information is unavailable';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Default fallback locations for cities when geolocation is denied or during manual selection
 */
export const POPULAR_CITIES = [
  { name: 'New York, NY', lat: 40.7128, lng: -74.0060 },
  { name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437 },
  { name: 'Chicago, IL', lat: 41.8781, lng: -87.6298 },
  { name: 'Houston, TX', lat: 29.7604, lng: -95.3698 },
  { name: 'Phoenix, AZ', lat: 33.4484, lng: -112.0740 },
  { name: 'Philadelphia, PA', lat: 39.9526, lng: -75.1652 },
  { name: 'San Antonio, TX', lat: 29.4241, lng: -98.4936 },
  { name: 'San Diego, CA', lat: 32.7157, lng: -117.1611 },
  { name: 'Dallas, TX', lat: 32.7767, lng: -96.7970 },
  { name: 'San Jose, CA', lat: 37.3382, lng: -121.8863 },
  { name: 'Austin, TX', lat: 30.2672, lng: -97.7431 },
  { name: 'San Francisco, CA', lat: 37.7749, lng: -122.4194 },
  { name: 'Seattle, WA', lat: 47.6062, lng: -122.3321 },
  { name: 'Boston, MA', lat: 42.3601, lng: -71.0589 },
  { name: 'Atlanta, GA', lat: 33.7490, lng: -84.3880 },
  { name: 'Miami, FL', lat: 25.7617, lng: -80.1918 }
];

export const JOB_CATEGORIES = [
  'All Categories',
  'Retail & Shopping',
  'Restaurant & Food Service',
  'Delivery & Logistics',
  'Customer Support & Sales',
  'Office & Administrative',
  'Tutoring & Education',
  'Event & Hospitality',
  'Healthcare & Caregiving',
  'IT & Software Support',
  'Creative & Freelance',
  'General Labor'
];

export const JOB_TYPES = [
  'All Types',
  'Part-time',
  'Hourly Shift',
  'Weekend Only',
  'Evening Shift',
  'Flexible Hours',
  'Temporary / Seasonal'
];
