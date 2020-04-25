import React, { useState, useEffect, memo, useRef, useCallback } from 'react';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  setMapLocation,
  setSearchingState,
  setPlaceLocation,
} from './reducers/actions';

import { GetStoreData } from './helpers/General';
import MapView from './components/MapView';
import SearchAddress from './components/SearchAddress';
import { debounce } from 'debounce';
import MapBoxAPI from './services/MapBoxAPI';
import SafePathsAPI from './services/API';
import _ from 'lodash';
// import BottomPanel from './components/BottomPanel';
// import BottomPanelLocationDetails from './components/BottomPanelLocationDetails';
// import BlacklistModal from './components/modals/BlacklistModal';
// import ActivityLog from './components/modals/ActivityLog';
// import AppInfo from './components/modals/AppInfo';
import {getCurrentPosition} from "./services/LocationService";

const createGeoJSON = item => {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [item.coordinates.longitude, item.coordinates.latitude],
    },
    properties: item,
  };
};

const App = ({
                      isLogging,
                      setMapLocation,
                      region,
                      place,
                      isSearching,
                      setSearchingState,
                      setPlaceLocation,
                    }) => {
  const [userMarkers, setUserMarkers] = useState(null);
  const [searchedResult, setSearchedResult] = useState([]);
  const [modal, setModal] = useState(null);

  const sliderRef = useRef(null);
  const textInputRef = useRef(null);

  useEffect(
    useCallback(() => {
      populateMarkers();
    }, [region]),
    [region],
  );

  const search = (text, currentLocation, bounds) => {
    let verifiedBounds = [];
    let verifiedLocation = { longitude: null, latitude: null };
    if (bounds && bounds.length === 4) {
      verifiedBounds = bounds[1].concat(bounds[0]);
    }
    if (
      currentLocation &&
      currentLocation.longitude &&
      currentLocation.latitude
    ) {
      verifiedLocation.longitude = currentLocation.longitude;
      verifiedLocation.latitude = currentLocation.latitude;
    }
    MapBoxAPI.search(text, verifiedLocation, verifiedBounds).then(result => {
      debugger;
      if (result && result.data && result.data.predictions) {
        setSearchedResult(result.data.predictions);
      }
    });
  };

  const searchWithBounds = text => {
    getCurrentPosition(
      currentLocation => {
        const { coords } = currentLocation;
        search(text, coords);
      },
      () => search(text),
    );
  };

  function populateMarkers() {
    console.log('========== POPULATE MARKERS =========');
    setUserMarkers(require('./components/san-francisco.json'));
    // SafePathsAPI.getPositions({ latitude: region[1], longitude: region[0] }).then(userPositions => {
    //   let userMarkers = _.get(userPositions, 'data', null);
    //   console.log('---- markers -----', userMarkers);
    //   setUserMarkers(userMarkers);
    // });
  }

  const changeSearchingState = state => {
    console.log('======= CHANGE SEARCHING STATE =======');
    if (state) {
      setSearchingState(state);
    } else {
      setSearchingState(state);
    }
  };

  const onChangeDestination = debounce(async destination => {
    if (destination && destination.length > 3) {
      searchWithBounds(destination);
    }
  }, 1000);

  const renderSearchResults = () => {
    if (isSearching) {
      return (
        <div
          style={{
            position: 'absolute',
            width: "100%",
            height: "100%",
            zIndex: 2,
            backgroundColor: 'white',
          }}>
          <div style={{ marginTop: 130 }}>
            {searchedResult.map((item, index) => {
              return (
                <div>
                  {onRenderSearchItems({item, index})}
                  <div />
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  const onRenderSearchItems = ({ item, index }) => {
    console.log('ITEM=>>', item);

    if (!item || !item.description || !item.place_id) return null;

    const itemClick = item => {
      SafePathsAPI.getLocationInfo(item.place_id).then(data => {
        if (data && data.data) {
          const geoJSON = createGeoJSON(data.data);
          setMapLocation(geoJSON.geometry.coordinates);
          setPlaceLocation({
            coordinates: geoJSON.geometry.coordinates,
            name: geoJSON.properties.name,
            address: geoJSON.properties.address,
            busyTimes: geoJSON.properties.busyHours,
          });
        }
      });
    };

    return (
      <div
        activeOpacity={0.8}
        onClick={() => {
          itemClick(item);
        }}
        key={index}>
        <div>
          {item.description}
        </div>
      </div>
    );
  };

  // const renderBottomPanel = () => {
  //   if (place && place.name) return null;
  //   return (
  //     <BottomPanel
  //       isSearching={isSearching}
  //       modal={modal}
  //       setModal={setModal}
  //       sliderRef={sliderRef}
  //       getInitialState={getInitialState}
  //     />
  //   );
  // };
  //
  // const renderLocationDetailPanel = () => {
  //   if (place && !place.name) return null;
  //   return <BottomPanelLocationDetails modal={modal} sliderRef={sliderRef} />;
  // };
  //
  // const renderBlacklistModal = () => {
  //   return (
  //     <BlacklistModal
  //       modal={modal}
  //       setModal={setModal}
  //       search={search}
  //       searchedResult={searchedResult}
  //       setSearchedResult={setSearchedResult}
  //     />
  //   );
  // };
  //
  // const renderActivityModal = () => {
  //   return <ActivityLog setModal={setModal} modal={modal} />;
  // };
  //
  // const renderAppInfoModal = () => {
  //   return <AppInfo setModal={setModal} modal={modal} />;
  // };
  //
  const renderSearchInput = () => {
    if (modal) return null;
    return (
      <SearchAddress
        textInputRef={textInputRef}
        isSearching={isSearching}
        setIsSearching={changeSearchingState}
        onChangeDestination={onChangeDestination}
        modal={modal}
        setModal={setModal}
        goToMyLocation={() => {return}}
      />
    );
  };

  return (
    <div>
      <MapView userMarkers={userMarkers} />
      {renderSearchInput()}
      {/*{renderBlacklistModal()}*/}
      {/*{renderActivityModal()}*/}
      {renderSearchResults()}
      {/*{renderAppInfoModal()}*/}
      {/*{renderBottomPanel()}*/}
      {/*{renderLocationDetailPanel()}*/}
    </div>
  );
};

// const styles = {
//   container: {
//     flex: 1,
//     alignItems: 'center',
//   },
//   box: {
//     borderBottomWidth: 0.5,
//     borderBottomColor: '#BDBDBD',
//     padding: 15,
//   },
//   separator: {
//     marginTop: 4,
//     marginBottom: 4,
//     height: 1,
//     backgroundColor: '#ccc',
//   },
// }

const mapStateToProps = state => ({
  isLogging: state.isLogging,
  region: state.mapLocation,
  place: state.placeLocation,
  isSearching: state.isSearching,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    { setMapLocation, setSearchingState, setPlaceLocation },
    dispatch,
  );

export default memo(connect(mapStateToProps, mapDispatchToProps)(App));
