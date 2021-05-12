import React, { useState, useRef, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polygon,
  GeoJSON,
} from 'react-leaflet';
import logo from './logo.svg';
import './App.css';
import intersect from '@turf/intersect';
import circle from '@turf/circle';
import buffer from '@turf/buffer';
import booleanIntersects from '@turf/boolean-intersects';
import { polygon } from '@turf/helpers';

function App() {
  // radius is in meters;  1609 in a mile
  const [radius, setRadius] = useState(1609);
  const [noaaAlerts, setNoaaAlerts] = useState(null);
  const circleRef = useRef();
  let center = [32.302898, -90.183487];

  const fillBlueOptions = { fillColor: 'blue' };
  const purpleOptions = { color: 'purple', fillColor: 'green' };
  const blueOptions = { color: 'blue', fillColor: 'red' };

  useEffect(() => {
    if (circleRef.current) {
      const geoJsonCircle = circleRef.current.toGeoJSON();
      let milesRadius = radius / 1609;
      let options = { steps: 64, units: 'miles' };
      // debugger;
      let Turfcircle = circle(
        geoJsonCircle.geometry.coordinates,
        milesRadius,
        options
      );

      let warningpolys = noaaAlerts.features.filter((alert) => alert.geometry);

      warningpolys.forEach((poly, idx) => {
        let doesIntersect = booleanIntersects(
          poly.geometry,
          Turfcircle.geometry
        );
        // debugger;
        if (doesIntersect) {
          console.log(poly.id + `of IDX = ${idx} has an intersection!`);
        }
      });
    }
  }, [radius]);

  useEffect(() => {
    async function getAlerts() {
      let response = await fetch(
        'https://api.weather.gov/alerts/active?area=MS'
      );
      let alerts = await response.json();
      setNoaaAlerts(alerts);
    }
    getAlerts();
  }, []);

  if (!noaaAlerts) {
    return <p>loading!</p>;
  }
  let alerts = noaaAlerts.features
    .filter((alert) => alert.geometry)
    .map(function (alert, idx) {
      // debugger;
      let coordinates = alert.geometry.coordinates[0].map((coords) => {
        let copy = [...coords];
        return copy.reverse();
      });

      return (
        <Polygon
          key={idx}
          positions={coordinates}
          pathOptions={purpleOptions}
        />
      );
    });

  return (
    <div className="App">
      <input
        type="range"
        max={160900}
        min={1609}
        value={radius}
        step={1609 / 2}
        onChange={(e) => setRadius(e.target.value)}
      />
      <p>The radius = {radius / 1609} miles</p>
      <MapContainer center={center} zoom={7} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle
          center={center}
          ref={circleRef}
          pathOptions={fillBlueOptions}
          radius={radius}
        />

        {alerts}
      </MapContainer>
    </div>
  );
}

export default App;
