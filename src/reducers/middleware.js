import { GetStoreData, SetStoreData } from '../helpers/General';
import { setLogging, setMapLocation, setSearchingState } from './actions';
import LocationServices, { getCurrentPosition } from '../services/LocationService';

const router = () => {
  const middleware = store => next => action => {
    const currState = store.getState();
    const result = next(action);
    const nextState = store.getState();
    const { dispatch } = store;

    if (currState.isLogging === null || currState.isLogging === undefined) {
      getCurrentPosition(() => dispatch(setLogging(true)), () => dispatch(setLogging(false)))
    }

    if (
      currState.placeLocation.coordinates !==
      nextState.placeLocation.coordinates
    )
      dispatch(setSearchingState(false));

    // if (
    //   currState.isLogging !== nextState.isLogging &&
    //   (currState.isLogging !== null || currState.isLogging !== undefined)
    // ) {
    //   if (nextState.isLogging) {
    //     LocationServices.start(action.callback);
    //   } else {
    //     LocationServices.stop();
    //   }
    // }

    if (
      (currState.mapLocation && currState.mapLocation.length !== 2) ||
      (nextState.mapLocation && nextState.mapLocation.length !== 2)
    ) {
      console.log(currState.mapLocation, nextState.mapLocation)
      getCurrentPosition(
        location => {
          const { coords: {latitude, longitude} } = location;
          dispatch(setLogging(true));
          dispatch(setMapLocation([longitude, latitude]));
        },
        () => {
          try {
            const locationData = GetStoreData('LOCATION_DATA');
            const locationArray = JSON.parse(locationData);
            if (locationArray !== null && locationArray.length >= 1) {
              const { latitude, longitude } = locationArray.slice(-1)[0];
              dispatch(setMapLocation([longitude, latitude]));
            } else {
              // default location cannot get current location, and no past location data
              dispatch(setMapLocation([20.39, 36.56]));
            }
          } catch (error) {
            console.log('CANNOT SET MAP LOCATION ===== ', error);
          }
        },
      );
    }

    return result;
  };
  return middleware;
};

export default router;
