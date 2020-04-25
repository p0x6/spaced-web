import { GetStoreData, SetStoreData } from '../helpers/General';
import SafePathsAPI from './API';

import { v4 as uuidv4 } from 'uuid';

import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import point from 'turf-point';
import polygon from 'turf-polygon';

let pollingInterval = null;

export function setHomeLocation(location) {
  SetStoreData('HOME_LOCATION', location);
}

export function setWorkLocation(location) {
  SetStoreData('WORK_LOCATION', location);
}

export function getHomeLocation() {
  return GetStoreData('HOME_LOCATION');
}

export function getWorkLocation() {
  return GetStoreData('WORK_LOCATION');
}

export function getCurrentPosition(success, error = () => {return}) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, error, {enableHighAccuracy: true});
  }
}


export class LocationData {
  constructor() {
    this.locationInterval = 60000 * 5; // Time (in milliseconds) between location information polls.  E.g. 60000*5 = 5 minutes
    // DEBUG: Reduce Time intervall for faster debugging
    // this.locationInterval = 5000;
    // around 55 meters
    this.degreesFromBannedLocation = 0.00025;
    this.homeLocation = null;
    this.workLocation = null;
    this.homePolygon = null;
    this.workPolygon = null;

    this.getBlacklistedLocations();
    document.addEventListener('set-HOME-location', e => {
      console.log('SETTING HOME LOCATION: ', e.coordinates);
      this.createLocationPolygon(e.coordinates, 'Home');
    })

    document.addEventListener('set-WORK-location', e => {
      console.log('SETTING WORK LOCATION: ', e.coordinates);
      this.createLocationPolygon(e.coordinates, 'Work');
    })
  }

  createLocationPolygon(location, label) {
    if (location && location.length === 2) {
      const pt = point(location);
      const lng = location[0];
      const lat = location[1];
      const poly = polygon([
        [
          [lng - 0.00025, lat + this.degreesFromBannedLocation],
          [lng - 0.00025, lat - this.degreesFromBannedLocation],
          [lng + 0.00025, lat - this.degreesFromBannedLocation],
          [lng + 0.00025, lat + this.degreesFromBannedLocation],
          [lng - 0.00025, lat + this.degreesFromBannedLocation],
        ],
      ]);

      if (label === 'Home') {
        this.homeLocation = pt;
        this.homePolygon = poly;
      } else if (label === 'Work') {
        this.workLocation = pt;
        this.workPolygon = poly;
      }
    } else {
      if (label === 'Home') {
        this.homeLocation = null;
        this.homePolygon = null;
      } else if (label === 'Work') {
        this.workLocation = null;
        this.workPolygon = null;
      }
    }
  }

  getBlacklistedLocations() {
    let location = getHomeLocation();
    let parsedLocation = JSON.parse(location);
    console.log('BLACKLIST HOME:', parsedLocation);
    if (parsedLocation && parsedLocation.length === 2) {
      this.createLocationPolygon(parsedLocation, 'Home');
    }
    location = getWorkLocation();
    parsedLocation = JSON.parse(location);
    console.log('BLACKLIST WORK:', location);
    if (parsedLocation && parsedLocation.length === 2) {
      this.createLocationPolygon(parsedLocation, 'Work');
    }
  }

  getLocationData() {
    const locationData = GetStoreData('LOCATION_DATA');

    let locationArray = [];
    if (locationData && locationData !== 'null') {
      locationArray = JSON.parse(locationData);
    }

    return locationArray;
  }

  async getPointStats() {
    const locationData = this.getLocationData();

    let lastPoint = null;
    let firstPoint = null;
    let pointCount = 0;

    if (locationData.length) {
      lastPoint = locationData.slice(-1)[0];
      firstPoint = locationData[0];
      pointCount = locationData.length;
    }

    return {
      lastPoint,
      firstPoint,
      pointCount,
    };
  }

  saveLocation(location) {
    // Persist this location data in our local storage of time/lat/lon values
    const locationArray = this.getLocationData()

      // Always work in UTC, not the local time in the locationData
      let nowUTC = new Date().toISOString();
      let unixtimeUTC = Date.parse(nowUTC);
      let unixtimeUTC_28daysAgo = unixtimeUTC - 60 * 60 * 24 * 1000 * 28;

      // Curate the list of points, only keep the last 28 days
      let curated = [];
      for (let i = 0; i < locationArray.length; i++) {
        if (locationArray[i]['time'] > unixtimeUTC_28daysAgo) {
          curated.push(locationArray[i]);
        }
      }

      // Backfill the stationary points, if available
      if (curated.length >= 1) {
        let lastLocationArray = curated[curated.length - 1];
        let lastTS = lastLocationArray['time'];
        for (
          ;
          lastTS < unixtimeUTC - this.locationInterval;
          lastTS += this.locationInterval
        ) {
          curated.push(JSON.parse(JSON.stringify(lastLocationArray)));
        }
      }

      // Save the location using the current lat-lon and the
      // calculated UTC time (maybe a few milliseconds off from
      // when the GPS data was collected, but that's unimportant
      // for what we are doing.)
      console.log('[GPS] Saving point:', locationArray.length);
      let lat_lon_time = {
        latitude: location['coords']['latitude'],
        longitude: location['coords']['longitude'],
        time: unixtimeUTC,
      };
      curated.push(lat_lon_time);
      const currentLocation = {
        latitude: location['coords']['latitude'],
        longitude: location['coords']['longitude'],
      };
      SetStoreData('LOCATION_DATA', curated);
      if (
        (this.homeLocation && this.homePolygon) ||
        (this.workLocation && this.workPolygon)
      ) {
        const currentLocationPoint = point([
          currentLocation.longitude,
          currentLocation.latitude,
        ]);
        if (this.homeLocation && this.homePolygon) {
          console.log(
            'IS CLOSE TO HOME ',
            booleanPointInPolygon(currentLocationPoint, this.homePolygon),
          );
        }
        if (this.workLocation && this.workPolygon) {
          console.log(
            'IS CLOSE TO WORK ',
            booleanPointInPolygon(currentLocationPoint, this.workPolygon),
          );
        }
        if (
          (this.homeLocation &&
            this.homePolygon &&
            booleanPointInPolygon(currentLocationPoint, this.homePolygon)) ||
          (this.workLocation &&
            this.workPolygon &&
            booleanPointInPolygon(currentLocationPoint, this.workPolygon))
        ) {
          console.log('[WARNING] TOO CLOSE BANNED AREA');
        } else {
          SafePathsAPI.saveMyLocation(currentLocation);
        }
      } else {
        SafePathsAPI.saveMyLocation(currentLocation);
      }
  }
}

export default class LocationServices {
  static start() {
    const locationData = new LocationData();
    // FOR DEBUGGING ONLY
    // window.locationData = locationData;

    const uuid = GetStoreData('uuid');
    if (!uuid || uuid === 'null') {
      SetStoreData('uuid', uuidv4());
    }

    pollingInterval = setInterval(() => {
      getCurrentPosition((position) => {
        locationData.saveLocation(position)
      })
    }, locationData.locationInterval);

  }

  static stop() {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}
