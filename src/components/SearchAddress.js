import React, {memo, useState} from 'react';
import colors from '../constants/colors';
import styled from 'styled-components';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { setMapLocation } from '../reducers/actions';
import { getCurrentPosition } from "../services/LocationService";
import GooglePlacesAutocomplete, { geocodeByPlaceId, getLatLng } from 'react-google-places-autocomplete';

import Script from 'react-load-script';

import PlacesAutocomplete from 'react-places-autocomplete';

const SearchInput = styled.input`
  margin-right: 16,
  font-size: 14,
  font-family: 'DMSans-Regular',
  font-weight: '500',
  
  width: 100%;
  padding: 12px 20px;
  margin: 8px 0;
  display: inline-block;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  
  ::placeholder {
  color: #435d8b;
  opacity: 1; /* Firefox */
  }
`

const Container = styled.div`
  flexDirection: 'column',
  color: colors.PRIMARY_TEXT,
  z-index: 999,
  top: 0,
  border-radius: 6,
  margin: '0 auto',
  width: 100vw;
  position: relative;

  display: flex;
  flex-flow: column wrap;
  align-items: center;
`

const SearchAddress = ({
  isSearching,
  setIsSearching,
  onChangeDestination,
  isLogging,
  textInputRef,
  modal,
  setModal,
  setMapLocation,
}) => {

  const [searchText, setSearchText] = useState(null);

  const exitSearch = () => {
    if (textInputRef && textInputRef.current) {
      textInputRef.current.value = null;
    }
    setIsSearching(false);
  };

  const renderCloseButton = () => {
    if (isSearching && isLogging) {
      return (
        <div
          style={{
            alignSelf: 'center',
            padding: 4,
            marginLeft: 12,
            marginRight: 8,
          }}
          onClick={() => {
            exitSearch();
          }}>
          <img
            src={require('../assets/images/blue_close.png')}
            style={{ width: 12, height: 12, resizeMode: 'cover' }}
          />
        </div>
      );
    }
    return null;
  };

  const renderAppInfoIcon = () => {
    if (modal || isSearching) return null;
    return (
      <div onClick={() => setModal('info')} style={styles.appIcon}>
        <img
          src={require('../assets/images/infoIcon.png')}
          style={{ width: 30, height: 30, resizeMode: 'cover' }}
        />
      </div>
    );
  };

  const renderMyLocationIcon = () => {
    if (modal || isSearching) return null;
    return (
      <div
        onClick={() => {
          getCurrentPosition(location => {
            const { coords: {latitude, longitude} } = location;
            setMapLocation([20.39, 36.56]);
            setMapLocation([longitude, latitude]);
          });
        }}
        style={styles.myLocation}>
        <img
          src={require('../assets/images/myLocationIcon.png')}
          style={{ width: 30, height: 30, resizeMode: 'cover' }}
        />
      </div>
    );
  };

  const getPlaceDetails = (result) => {
    if (result && result.place_id) {
      geocodeByPlaceId(result.place_id)
        .then(results => {
          if (results && results.length > 0) {
            const result = results[0];
            getLatLng(result).then(location => {
              setMapLocation([location.lng, location.lat]);
            })
          }
        })
        .catch(error => console.error(error));
    }
  }

  return (
    <Container>
      <GooglePlacesAutocomplete
        onSelect={getPlaceDetails}
        inputStyle={styles.search}
        suggestionsStyles={{container: {backgroundColor: 'white'}}}
      />
    </Container>
  );
};

const styles = {
  search: {
    zIndex: 999,
    fontSize: 14,
    fontFamily: 'DMSans-Regular',
    fontWeight: '500',
    display: 'inline-block',
    padding: '12px 20px',
    margin: '8px 0',
    border: '1px solid #ccc',
    borderRradius: '4px',
    boxSizing: 'border-box',
  },
  searchView: {
    backgroundColor: '#fff',
    width: '95%',
    borderRadius: 6,
    marginTop: 32,
    marginLeft: 10,
    height: 48,
  },
  searchInput: {
    marginRight: 16,
    fontSize: 14,
    fontFamily: 'DMSans-Regular',
    fontWeight: '500',
  },
  // App Icon
  infoContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    marginTop: 10,
    width: '100%',
  },
  appIcon: {
    color: colors.PRIMARY_TEXT,
    alignSelf: 'flex-end',
  },
  myLocation: {
    color: colors.PRIMARY_TEXT,
    alignSelf: 'flex-start',
    flex: 1,
    marginLeft: 10,
  },
};

const mapStateToProps = state => ({
  isLogging: state.isLogging,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators({ setMapLocation }, dispatch);

export default memo(
  connect(mapStateToProps, mapDispatchToProps)(SearchAddress),
);
