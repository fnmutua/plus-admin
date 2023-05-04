#!/bin/sh
# See: https://stackoverflow.com/questions/6405127/how-do-i-specify-a-password-to-psql-non-interactively#6405296
# See: https://stackoverflow.com/questions/14549270/check-if-database-exists-in-postgresql-using-shell

echo
echo "---------------------------------------------------------------------------------"
echo "Entering Operations Databases Dump Script"
echo "---------------------------------------------------------------------------------"
echo

echo
echo "Setting up Resource Paths"
echo


# Connection Details
# ----------------------------------------------------------------------------------

DEVELOPMENT_SERVER=1
CLOUD_SERVER=0

if [ $DEVELOPMENT_SERVER -eq 1 ]; then

  echo
  echo "Setting up local host connection details"
  echo

  export PGHOST="localhost"
  export PGPORT="5432"
  export PGUSER="postgres"
  export PGPASSWORD="Admin@2011"
  export DB_name="kisip"

fi

if [ $CLOUD_SERVER -eq 1 ]; then

  echo
  echo "Setting up cloud host connection details"
  echo

 

  export PGHOST="containers-us-west-138.railway.app"
  export PGPORT="6542"
  export PGUSER="postgres"
  export PGPASSWORD="lfqb3md5ixbmn3tam15D"
  export DB_name="railway"
fi



echo
echo "Dumping databases"
echo "---------------------------------------------------------------------------------"
echo


#pg_dumpall > backup.out
now="$(date +'%d%m%Y')"

echo $now.kisip.sql
pg_dump $DB_name >  $now.kisip.sql
pg_dump -Ft $DB_name  >  $now.kisip.sql.tar
 

echo
echo "---------------------------------------------------------------------------------"
echo "Leaving Operations Databases Dump Script"
echo "---------------------------------------------------------------------------------"
echo
