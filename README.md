# osm-import-horodateurs
Script Node destiné à l'import des horodateurs depuis l'opendata de la Métro (Grenoble) vers OSM


#### Installation des dépendances

```sh
npm install
```

#### Inputs 
Dans le répértoire *INPUT* :

1. [Données de la Métro en Geojson](http://data.metropolegrenoble.fr/ckan/dataset/emplacement-des-horodateurs-sur-grenoble/resource/9d5ae078-da9e-4288-a2ae-8ba3f8a4de08?view_id=ec2624fb-5742-406a-8b65-0ab236ffd9ec)

2. Donnés OSM avant l'import vià overpassapi :
```sh
[out:json];
(
	area["name"="Grenoble"]["admin_level"="8"]->.grenoble;
  	node["amenity"="vending_machine"]["vending"="parking_tickets"](area.grenoble);
);
out meta;
>;
out skel;
```
#### Execution du script 
```sh
node index.js
```

#### Outputs
Dans le répértoire *OUT*, 3 paires de sorties (en .geojson et en .osm pour être directement ouvert avec JOSM)

1. *OSM_data* : Données d'OSM venant de l'overpassapi
2. *exclude*: Les horodateurs de l'opendata qui se trouvent à moins de 30m d'un horodateur dans les données OSM
3. *keep* : Les autres horodateurs de l'open data qui se situent à plus de 30m d'un objet OSM. C'est eux qui seront importés 

