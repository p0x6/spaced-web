import { v4 as uuidv4 } from 'uuid';
import { GetStoreData, SetStoreData } from '../helpers/General';

const axios = require('axios');

class API {
  constructor() {
    this.instance = axios.create({
      baseURL: 'https://maps.googleapis.com',
      timeout: 5000,
    });

    this.mapboxAPI = axios.create({
      baseURL: 'https://api.mapbox.com',
      timeout: 5000,
    });
  }

  getPlaceDetails(place_id) {
    const params = {
      place_id,
      key: process.env.REACT_APP_GOOGLE_TOKEN,
    };

    SetStoreData('SessionToken', 'null');

    return this.instance.get(`/maps/api/place/details/json`, {
      params,
    });
  }

  mapboxSearch(text, currentLocation, bbox) {
    const params = {
      autocomplete: 'true',
      proximity:
        currentLocation.longitude !== null
          ? [currentLocation.longitude, currentLocation.latitude] + ''
          : undefined,
      bbox: bbox + '',
      access_token: process.env.MAPBOX_ACCESS_TOKEN,
    };
    return this.mapboxAPI.get(`/geocoding/v5/mapbox.places/${text}.json`, {
      params,
    });
  }

  async search(text, currentLocation) {
    let autocomplete;
    const {longitude, latitude} = currentLocation;
    const cutLongitude = Number(Number(longitude).toFixed(1))
    const cutLatitude = Number(Number(latitude).toFixed(1))
    const defaultBounds = new window.google.maps.LatLngBounds(
      new window.google.maps.LatLng(cutLatitude - 0.1, cutLongitude + 0.1),
      new window.google.maps.LatLng(cutLatitude - 0.1, cutLongitude + 0.1));

    const options = {
      bounds: defaultBounds,
    };
    if (window.google) {
      autocomplete = new window.google.maps.places.Autocomplete(text, options);
    }
    debugger;
  }
}

const MapBoxAPI = new API();

export default MapBoxAPI;
