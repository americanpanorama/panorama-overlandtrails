# richmondatlas-overlandtrails
Overland Trails

Latest build can be viewed at [http://studio.stamen.com/richmond/show/overland-trails/](http://studio.stamen.com/richmond/show/overland-trails/)


##Data Sets
A list of all base datasets for this project in CartoDB.  Each one these should have a public `materialized` view as well.

Dataset Name | Description | Comments
------------ | ----------- | --------
site_overland_trails_emigration_numbers | NTD
site_overland_trails_journal_entries | `SELECT cartodb_id, ST_Transform(ST_SetSRID(ST_Transform(the_geom,2163),3857),4326) as the_geom, date, entry, journal_id, lat, location, long, name FROM master_overland_trails_journal_entries WHERE the_geom is not null`
site_overland_trails_journal_source | `SELECT cartodb_id, abbreviation, full_citation, gender, journal_id, trail, url, year FROM overland_trails_journal_source`
site_overland_trails_diarylines_unsplit | `SELECT a.cartodb_id, a.name, a.the_geom_webmercator, b.journal_id, b.year, b.trail from (SELECT journal_id as cartodb_id, name, ST_MakeLine(ARRAY_AGG(ST_SetSRID(ST_Transform(the_geom_webmercator,2163),3857) ORDER BY to_date(date,'MM/DD/YYYY'))) as the_geom_webmercator FROM master_overland_trails_journal_entries where date != '' and the_geom_webmercator is not null group by journal_id, name order by journal_id) a INNER JOIN overland_trails_journal_source b on a.cartodb_id = b.journal_id WHERE trail != 'Santa Fe Trail' AND year >= 1840 AND year <= 1860` | Note: this table is not used by the interface. It is an intermediate table that `site_overland_trails_diarylines` (below) depends on.
site_overland_trails_diarylines | `SELECT cartodb_id, journal_id, name, trail, year, ST_Union(the_geom_webmercator) as the_geom_webmercator FROM (SELECT cartodb_id, journal_id, name, trail, year, ST_MakeLine(sp,ep) as the_geom_webmercator, ST_Length(ST_MakeLine(sp,ep)) as length FROM (SELECT cartodb_id, journal_id, name, trail, year, ST_PointN(the_geom_webmercator, generate_series(1, ST_NPoints(the_geom_webmercator)-1)) as sp, ST_PointN(the_geom_webmercator, generate_series(2, ST_NPoints(the_geom_webmercator)  )) as ep FROM site_overland_trails_diarylines_unsplit_materialized) AS segments) AS diarylines_segments WHERE length < 500000 group by cartodb_id, journal_id, name, trail, year`

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