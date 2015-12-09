#CartoDB data tables used in Overland Trails

**This file contains the queries used to generate each of the derived tables used by the application.** We call these tables "materialized", even though they are not technically [Materialized Views](http://www.postgresql.org/docs/9.3/static/sql-creatematerializedview.html) in the PostgreSQL sense. They are simply copies.

**Why do we do this?**
1. Using these copied tables is more efficient, because the query doesn't have to be run every time a new user loads the application.
2. They allow us to make the derived table public (so the application does not require API keys) while keeping the source data private.
3. They make the application more resilient in case the source data tables are undergoing modification or development. Using materialized tables means that the application will always be using a version of the data that is known to work.

**How to use these queries:**

1. Create a new empty table in the CartoDB web interface. This table will be used only temporarily, from which to create our materialized table.
2. Paste the SQL into the CartoDB "Custom SQL query" panel. Click "Apply query".
3. Select "Dataset from query" in the "Edit" menu.
4. Click on the name of the new table to change the name from `untitled_table_NN_copy` to `site_tablename_materialized`.
5. Select "Change privacy" in the "Edit" menu, so that the table is accessible to anyone "With link".
6. (optional) You can now delete the empty table you created in step 1.

The following sections list the names of each of the tables used by the application. The "Tables" section is a list of the source tables used by the query. The "SQL" section documents the query used to generate the derived table.


####site_overland_trails_emigration_numbers_materialized
**Tables:**
`overland_trails_emigration_total_numbers`

**SQL**
```sql
SELECT * FROM overland_trails_emigration_total_numbers
```

####site_overland_trails_journal_entries_materialized
**Tables:**
`master_overland_trails_journal_entries`

**SQL**
```sql
SELECT cartodb_id, ST_Transform(ST_SetSRID(ST_Transform(the_geom,2163),3857),4326) as the_geom, date, entry, journal_id, lat, location, long, name FROM master_overland_trails_journal_entries WHERE the_geom is not null
```

####site_overland_trails_journal_source_materialized
**Tables:**
`overland_trails_journal_source`

**SQL**
```sql
SELECT cartodb_id, abbreviation, full_citation, gender, journal_id, trail, url, year FROM overland_trails_journal_source
```

####site_overland_trails_diarylines_unsplit_materialized
**Tables:**
`master_overland_trails_journal_entries`, `overland_trails_journal_source`

**SQL**
```sql
SELECT a.cartodb_id, a.name, a.the_geom_webmercator, b.journal_id, b.year, b.trail from (SELECT journal_id as cartodb_id, name, ST_MakeLine(ARRAY_AGG(ST_SetSRID(ST_Transform(the_geom_webmercator,2163),3857) ORDER BY to_date(date,'MM/DD/YYYY'))) as the_geom_webmercator FROM master_overland_trails_journal_entries where date != '' and the_geom_webmercator is not null group by journal_id, name order by journal_id) a INNER JOIN overland_trails_journal_source b on a.cartodb_id = b.journal_id WHERE trail != 'Santa Fe Trail' AND year >= 1840 AND year <= 1860
```

####site_overland_trails_diarylines_materialized
**Tables:**
`site_overland_trails_diarylines_unsplit_materialized` **NOTE: depends on the table above**

**SQL**
```sql
SELECT cartodb_id, journal_id, name, trail, year, ST_Union(the_geom_webmercator) as the_geom_webmercator FROM (SELECT cartodb_id, journal_id, name, trail, year, ST_MakeLine(sp,ep) as the_geom_webmercator, ST_Length(ST_MakeLine(sp,ep)) as length FROM (SELECT cartodb_id, journal_id, name, trail, year, ST_PointN(the_geom_webmercator, generate_series(1, ST_NPoints(the_geom_webmercator)-1)) as sp, ST_PointN(the_geom_webmercator, generate_series(2, ST_NPoints(the_geom_webmercator) )) as ep FROM site_overland_trails_diarylines_unsplit_materialized) AS segments) AS diarylines_segments WHERE length < 500000 group by cartodb_id, journal_id, name, trail, year
```
