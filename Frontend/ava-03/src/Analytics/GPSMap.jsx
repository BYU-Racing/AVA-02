import React, { useState, useEffect, useCallback } from "react";
import { GoogleMap, Polyline, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

const polylineOptions = {
  strokeColor: "#FF0000",
  strokeOpacity: 1.0,
  strokeWeight: 4,
};

const GPSMap = ({
  dataSets,
  left,
  right,
  globalZoomBounds,
  globalZoom,
  setLeft,
  setRight,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });

  const [map, setMap] = useState(null);

  const path =
    dataSets[0]?.data
      ?.filter(
        (point) =>
          point.value.lat != null &&
          point.value.long != null &&
          !isNaN(point.value.lat) &&
          !isNaN(point.value.long) &&
          point.value.long !== 0 &&
          point.value.lat !== 0
      )
      ?.sort((a, b) => a.timestamp - b.timestamp)
      ?.map((point) => ({
        lat: Number(point.value.lat),
        lng: Number(point.value.long),
      })) || [];

  useEffect(() => {
    if (globalZoom && globalZoomBounds) {
      setLeft(globalZoomBounds.left);
      setRight(globalZoomBounds.right);
    }
  }, [globalZoomBounds, globalZoom]);

  useEffect(() => {
    if (map && path.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      path.forEach((point) => bounds.extend(point));
      map.fitBounds(bounds);
    }
  }, [path, map]);

  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      options={mapOptions}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      {path.length > 0 && (
        <Polyline
          path={path}
          options={polylineOptions}
          key={JSON.stringify(path)} // Key based on actual path data
        />
      )}
    </GoogleMap>
  ) : null;
};

export default GPSMap;
