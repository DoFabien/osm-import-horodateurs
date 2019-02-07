/*
[out:json];
(
	area["name"="Grenoble"]["admin_level"="8"]->.grenoble;
  	node["amenity"="vending_machine"]["vending"="parking_tickets"](area.grenoble);
);
out meta;
>;
out skel;
*/
// => INPUT osm-raw-data.json

const fs = require('fs-extra');
const kdbush = require('kdbush');
const geokdbush = require('geokdbush');
const geojsontoosm = require('geojsontoosm');



/* DISTANCE MAX EN METRE
Si un point (source open data) est à moins de xx m d'une point OSM,
alors il sera exclu du resultat final
*/
const distMMax = 30;

const distKmMax = distMMax / 1000;

// import et transdormation en geojson des données OSM
const osmFeatures = JSON.parse(fs.readFileSync('./INPUT/osm-raw-data.json', 'utf8')).elements
    .filter(e => e.type === 'node')
    .map(el => {
        return {
            "type": 'Feature',
            "properties": {
                "id": el.id
            },
            "geometry": {
                "type": 'Point',
                'coordinates': [el.lon, el.lat]
            }
        }
    });

// kdbush, pour la mesure des distances et trouvé le voisin le plus proche
const index = new kdbush(osmFeatures,
    (feature) => feature.geometry.coordinates[0],
    (feature) => feature.geometry.coordinates[1]
);


// from : http://data.metropolegrenoble.fr/ckan/dataset/emplacement-des-horodateurs-sur-grenoble/resource/9d5ae078-da9e-4288-a2ae-8ba3f8a4de08?view_id=ec2624fb-5742-406a-8b65-0ab236ffd9ec
// import et mise en forme des attributs
const openDataFeatures = JSON.parse(fs.readFileSync('./INPUT/data-grenoble.json', 'utf8')).features
    .map(el => {
        return {
            "type": el.type,
            "geometry": el.geometry,
            "properties": {
                amenity: 'vending_machine',
                vending: 'parking_tickets',
                source: 'data.metropolegrenoble.fr 11-01-2018',
                ref: el.properties.HOROD_NUMPLASTRON,
                note: `tarif : ${el.properties.HOROD_TARIF_NOM}; model: ${el.properties.HOROD_MODEL_NOM}`
            }
        }
    })

// On a au moins un horodateur dans les données OSM à moins de 30m, on l'exclu.
const excludeFeatures = openDataFeatures.filter(feature => {
    const reskd = geokdbush.around(index, feature.geometry.coordinates[0], feature.geometry.coordinates[1], 2, distKmMax);
    return reskd.length > 0;
})

const keepFeatures = openDataFeatures.filter(feature => {
    const reskd = geokdbush.around(index, feature.geometry.coordinates[0], feature.geometry.coordinates[1], 2, distKmMax);
    return reskd.length === 0;

})

console.log(keepFeatures.length);
console.log(excludeFeatures.length);

const geojsonKeep = {
    "type": "FeatureCollection",
    "features": keepFeatures
}

const geojsonExclude = {
    "type": "FeatureCollection",
    "features": excludeFeatures
}

const geojsonOsmData = {
    "type": "FeatureCollection",
    "features": osmFeatures
}


/*
Le plugin geojson de JSOM bug... :( 
On passe donc par 'geojsontoosm' pour convertir les objets en type OSM
*/

fs.writeFileSync('./OUT/keep.geojson', JSON.stringify(geojsonKeep));
fs.writeFileSync('./OUT/keep.osm', geojsontoosm(geojsonKeep));


fs.writeFileSync('./OUT/exclude.geojson', JSON.stringify(geojsonExclude));
fs.writeFileSync('./OUT/exclude.osm', geojsontoosm(geojsonExclude));


fs.writeFileSync('./OUT/OSM_data.geojson', JSON.stringify(geojsonOsmData));
fs.writeFileSync('./OUT/OSM_data.osm', geojsontoosm(geojsonOsmData));
