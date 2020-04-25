import React, { memo } from 'react';
import { connect } from 'react-redux';
import ReactMapboxGl, { Marker, Cluster, Popup } from "react-mapbox-gl";
const defaultGeoJSON = require('./defaultGeoJSON.json');

console.log(process.env.REACT_APP_MAPBOX_ACCESS_TOKEN);

const Map = ReactMapboxGl({
  accessToken: process.env.REACT_APP_MAPBOX_ACCESS_TOKEN
});

// const layerStyles = {
//   route: {
//     lineColor: '#2E4874',
//     lineCap: MapboxGL.LineJoin.Round,
//     lineWidth: 3,
//     lineOpacity: 0.84,
//   },
//   singlePoint: {
//     circleColor: 'green',
//     circleOpacity: 0.84,
//     circleStrokeWidth: 2,
//     circleStrokeColor: 'white',
//     circleRadius: 5,
//     circlePitchAlignment: 'map',
//   },
//
//   clusteredPoints: {
//     circlePitchAlignment: 'map',
//
//     circleColor: [
//       'step',
//       ['get', 'point_count'],
//       '#51bbd6',
//       100,
//       '#f1f075',
//       750,
//       '#f28cb1',
//     ],
//
//     circleRadius: ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
//
//     circleOpacity: 0.84,
//     circleStrokeWidth: 2,
//     circleStrokeColor: 'white',
//   },
//
//   clusterCount: {
//     textField: '{point_count}',
//     textSize: 12,
//     textPitchAlignment: 'map',
//   },
// };

const MapViewComponent = ({
  isLogging,
  region,
  place,
  userMarkers,
  navigation,
}) => {
  // const renderAnnotations = () => {
  //   console.log('===== PLACE =====', place);
  //   if (place.name && place.address && place.coordinates) {
  //     return (
  //       <MapboxGL.PointAnnotation
  //         key={place.name}
  //         id={place.name}
  //         coordinate={place.coordinates}
  //         title={place.name}>
  //         <MapboxGL.Callout title={place.name} />
  //       </MapboxGL.PointAnnotation>
  //     );
  //   }
  //   return null;
  // };

  // const renderRoute = () => {
  //   if (isLogging && navigation) {
  //     console.log('====== HAS NAVIGATION ======', region, place);
  //     return (
  //       <MapboxGL.ShapeSource id='routeSource' shape={navigation}>
  //         <MapboxGL.LineLayer id='routeFill' style={layerStyles.route} />
  //       </MapboxGL.ShapeSource>
  //     );
  //   }
  // };

  // if (region.coordinates !== 2) return null;

  console.log('====== MAP REGION ======', region);

  const clusterMarker = (coordinates, pointCount, getLeaves, limit, offset) => (
    <Marker
      key={coordinates.toString()}
      coordinates={coordinates}
      style={styles.clusterMarker}
    >
      <div>{pointCount}</div>
    </Marker>
  );

  console.log(region);

  if (region.length !== 2) return null;

  return (
    <Map
      style={'mapbox://styles/mapbox/light-v10'}
      center={region}
      zoom={[16]}
      containerStyle={styles.map}
    >
      <Cluster ClusterMarkerFactory={clusterMarker}>
        {(userMarkers || defaultGeoJSON).features.map((feature, key) => (
          <Marker
            key={key}
            style={styles.marker}
            coordinates={feature.geometry.coordinates}
            data-feature={feature}
          >
            {/*<div title={feature.properties.name}>*/}
            {/*  {feature.properties.name[0]}*/}
            {/*</div>*/}
          </Marker>
        ))}
      </Cluster>
    </Map>
  );
};

const styles = {
  // Container covers the entire screen
  map: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    position: 'absolute',
    width: "100%",
    height: "100%",
  },
  dropper: {
    width: 24,
    height: 41,
  },
  clusterMarker: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    backgroundColor: '#51D5A0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
    border: '2px solid #56C498',
    cursor: 'pointer'
  },
  marker: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    backgroundColor: 'green',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: '2px solid #C9C9C9'
  }
}

const mapStateToProps = state => ({
  isLogging: state.isLogging,
  region: state.mapLocation,
  place: state.placeLocation,
  navigation: state.navigation,
});

export default memo(connect(mapStateToProps, null)(MapViewComponent));
