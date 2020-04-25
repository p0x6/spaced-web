import { GetStoreData, SetStoreData } from '../helpers/General';
import { v4 as uuidv4 } from 'uuid';

const axios = require('axios');

class API {
  constructor() {
    this.instance = axios.create({
      baseURL: process.env.REACT_APP_BACKEND_URL,
      timeout: 10000,
    });
    this.isReady = false;
    this.uuid = null;
    this.getUUID();
  }

  getUUID() {
    try {
      const myUUID = GetStoreData('uuid');
      if (!myUUID || myUUID === 'null') {
        const uuid = uuidv4();
        this.uuid = uuid;
        this.isReady = true;
        SetStoreData('uuid', uuid);
        return;
      }
      this.isReady = true;
      this.uuid = myUUID;
    } catch (e) {
      console.log(e, 'did not get UUID');
    }
  }

  getPositions(searchLocation) {
    if (this.isReady && this.uuid) {
      return this.instance.get('/get-user-positions', {
        params: {
          radius: 100,
          latitude: searchLocation.latitude,
          longitude: searchLocation.longitude,
          uuid: this.uuid,
        },
      });
    }
    this.getUUID();
  }

  getIntersections() {
    if (this.isReady && this.uuid) {
      return this.instance.get('/get-intersection', {
        params: {
          uuid: this.uuid,
        },
      });
    }
    this.getUUID();
  }

  saveMyLocation(location) {
    if (this.isReady && this.uuid) {
      const body = {
        uuid: this.uuid,
        coordinates: {
          longitude: location.longitude,
          latitude: location.latitude,
        },
      };
      console.log('UPLOADING LOCATION', body);
      this.instance.post('/save-my-location', body);
    } else {
      this.getUUID();
    }
  }

  getPathToDestination(start, destination) {
    console.log(start, destination);
    return this.instance.get('/get-route', {
      params: {
        startLongitude: start[0],
        startLatitude: start[1],
        endLongitude: destination[0],
        endLatitude: destination[1],
      },
    });
  }

  getLocationInfo(placeId) {
    return this.instance.get(`/busy-times`, {
      params: {
        placeId,
      },
    });
  }
}

const SafePathsAPI = new API();

export default SafePathsAPI;
