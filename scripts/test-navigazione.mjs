/**
 * Test rapido navigazione OSRM + parsing istruzioni.
 * node scripts/test-navigazione.mjs
 */

const DA = { lat: 41.9028, lng: 12.4964 }; // Roma centro
const A = { lat: 42.1408, lng: 12.2389 }; // zona Bracciano

const url =
  `https://router.project-osrm.org/route/v1/driving/${DA.lng},${DA.lat};${A.lng},${A.lat}` +
  '?overview=full&geometries=geojson&steps=true';

const risposta = await fetch(url);
const json = await risposta.json();

if (json.code !== 'Ok' || !json.routes?.[0]) {
  console.error('FAIL OSRM', json.code, json.message);
  process.exit(1);
}

const route = json.routes[0];
const punti = route.geometry.coordinates.length;
const passi = route.legs[0].steps.length;
const km = (route.distance / 1000).toFixed(1);

console.log('OK OSRM');
console.log('  punti geometria:', punti);
console.log('  passi:', passi);
console.log('  distanza km:', km);
console.log('  prima manovra:', route.legs[0].steps[0]?.maneuver?.type);
console.log('  ultima manovra:', route.legs[0].steps.at(-1)?.maneuver?.type);

if (punti < 10 || passi < 2) {
  console.error('FAIL percorso troppo corto');
  process.exit(1);
}

console.log('TUTTO OK');
