#!/bin/bash

 
export PGPASSWORD='Admin@2011'
 

SCHEMA="public"
DB="kisip"

psql -U 'postgres' -Atc  "select tablename from pg_tables where schemaname='$SCHEMA'" $DB |\
  while read TBL; do
  echo $TBL
  #Remove white space after file name
  tbsl=`echo $TBL | sed -e 's/^[[:space:]]*//'`
 
       
        
 
   # psql  -U 'postgres' -c "  ALTER TABLE  $TBL; ALTER COLUMN geom TYPE GEOMETRY"


  psql  -U 'postgres' -d $DB -c  "ALTER TABLE $SCHEMA.$TBL ALTER COLUMN geom TYPE GEOMETRY  USING geom::geometry;"  


    psql  -U 'postgres' -c "COPY $SCHEMA.$TBL TO STDOUT WITH CSV HEADER delimiter ','" $DB > $tbsl'.csv'
 
  done

 
 