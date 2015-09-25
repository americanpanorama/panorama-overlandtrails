# richmondatlas-overlandtrails
Overland Trails

Latest build can be viewed at [http://studio.stamen.com/richmond/show/overland-trails/](http://studio.stamen.com/richmond/show/overland-trails/)


##Data Sets
A list of all base datasets for this project in CartoDB.  Each one these should have a public `materialized` view as well.

Dataset Name | Description
------------ | -----------
site_overland_trails_emigration_numbers | NTD
site_overland_trails_journal_entries | `SELECT cartodb_id, the_geom, date, entry, journal_id, lat, location, long, name FROM master_overland_trails_journal_entries WHERE the_geom is not null`
site_overland_trails_journal_source | `SELECT cartodb_id, the_geom, abbreviation, full_citation, gender, journal_id, trail, url, year FROM overland_trails_journal_source`

##Dependencies
* [NPM](https://www.npmjs.com/)
* [CartoDB](https://cartodb.com/) account

##Setup
Make sure you have [NPM](https://www.npmjs.com/) installed.

Load required **NPM** modules.
```bash
npm install
```

Create a `.env.json` file from `.env.json.sample` in **root** directory and add your CartoDB account name to the `.env.json` file. Will look like this...
```json
{
  "siteroot" : "./",
  "cartodbAccountName" : "ACCOUNT NAME HERE"
}
```

##Develop
To run locally:
```bash
npm start
```

Open browser to http://localhost:8888/

##Deploy
**To use development code**: Copy the [build directory](./build) to your server, but for production you will want to run:
```
npm run dist
```

This will create a `dist` directory. Move this directory to your server.

Both directories are all **static files**, so no special server requirements needed.

##Deploy(Stamen Only)
```bash
scp -prq ./build/. studio.stamen.com:www/richmond/show/overland-trails/
scp -prq ./build/. studio.stamen.com:www/richmond/show/yyyy-mm-dd/
```