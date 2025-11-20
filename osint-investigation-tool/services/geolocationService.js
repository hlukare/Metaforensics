const axios = require('axios');
const NodeGeocoder = require('node-geocoder');

class GeolocationService {
  constructor() {
    this.geocoder = NodeGeocoder({
      provider: 'openstreetmap'
    });

    this.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  }

  async searchPerson(name, location = '') {
    try {
      const coordinates = await this.geocodeLocation(location);
      
      const results = {
        location_data: await this.getLocationData(coordinates, location),
        nearby_places: await this.getNearbyPlaces(coordinates),
        satellite_imagery: await this.getSatelliteImagery(coordinates),
        street_view: await this.getStreetView(coordinates)
      };

      return results;
    } catch (error) {
      console.error('Geolocation Service Error:', error);
      return this.getMockData(name, location);
    }
  }

  async geocodeLocation(location) {
    try {
      const results = await this.geocoder.geocode(location);
      if (results.length > 0) {
        return {
          latitude: results[0].latitude,
          longitude: results[0].longitude
        };
      }
      return { latitude: 17.3850, longitude: 78.4867 }; // Default to Hyderabad
    } catch (error) {
      console.error('Geocoding error:', error);
      return { latitude: 17.3850, longitude: 78.4867 }; // Default to Hyderabad
    }
  }

  async getLocationData(coordinates, location) {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          format: 'json',
          lat: coordinates.latitude,
          lon: coordinates.longitude,
          zoom: 18,
          addressdetails: 1
        }
      });

      return response.data;
    } catch (error) {
      console.error('Location data error:', error);
      return this.getMockLocationData(location);
    }
  }

  async getNearbyPlaces(coordinates) {
    try {
      if (!this.googleMapsApiKey) {
        return this.getMockNearbyPlaces();
      }

      const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
        params: {
          location: `${coordinates.latitude},${coordinates.longitude}`,
          radius: 1000,
          key: this.googleMapsApiKey
        }
      });

      return response.data.results || [];
    } catch (error) {
      console.error('Nearby places error:', error);
      return this.getMockNearbyPlaces();
    }
  }

  async getSatelliteImagery(coordinates) {
    try {
      if (!this.googleMapsApiKey) {
        return this.getMockSatelliteImagery();
      }

      return {
        static_map: `https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.latitude},${coordinates.longitude}&zoom=18&size=600x400&maptype=satellite&key=${this.googleMapsApiKey}`,
        coordinates: coordinates
      };
    } catch (error) {
      console.error('Satellite imagery error:', error);
      return this.getMockSatelliteImagery();
    }
  }

  async getStreetView(coordinates) {
    try {
      if (!this.googleMapsApiKey) {
        return this.getMockStreetView();
      }

      return {
        street_view: `https://maps.googleapis.com/maps/api/streetview?location=${coordinates.latitude},${coordinates.longitude}&size=600x400&key=${this.googleMapsApiKey}`,
        coordinates: coordinates
      };
    } catch (error) {
      console.error('Street view error:', error);
      return this.getMockStreetView();
    }
  }

  getMockData(name, location) {
    const coordinates = { latitude: 17.3850, longitude: 78.4867 };
    return {
      location_data: this.getMockLocationData(location),
      nearby_places: this.getMockNearbyPlaces(),
      satellite_imagery: this.getMockSatelliteImagery(),
      street_view: this.getMockStreetView()
    };
  }

  getMockLocationData(location) {
    return {
      display_name: location,
      address: {
        city: location,
        state: "Telangana",
        country: "India",
        country_code: "in"
      }
    };
  }

  getMockNearbyPlaces() {
    return [
      {
        name: "Example Restaurant",
        types: ["restaurant", "food", "point_of_interest"],
        vicinity: "123 Main Street"
      },
      {
        name: "Example Mall",
        types: ["shopping_mall", "point_of_interest"],
        vicinity: "456 Market Road"
      }
    ];
  }

  getMockSatelliteImagery() {
    return {
      static_map: "https://maps.example.com/staticmap?center=17.3850,78.4867&zoom=18&size=600x400&maptype=satellite",
      coordinates: { latitude: 17.3850, longitude: 78.4867 }
    };
  }

  getMockStreetView() {
    return {
      street_view: "https://maps.example.com/streetview?location=17.3850,78.4867&size=600x400",
      coordinates: { latitude: 17.3850, longitude: 78.4867 }
    };
  }
}

module.exports = GeolocationService;