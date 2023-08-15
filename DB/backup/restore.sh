#!/bin/sh
# See: https://stackoverflow.com/questions/6405127/how-do-i-specify-a-password-to-psql-non-interactively#6405296
# See: https://stackoverflow.com/questions/14549270/check-if-database-exists-in-postgresql-using-shell

echo
echo "---------------------------------------------------------------------------------"
echo "Entering Operations Databases Restoration Script"
echo "---------------------------------------------------------------------------------"
echo

echo
echo "Setting up Resource Paths"
echo

# root/project/scripts/operations/databases
DATABASES_DIR="$(cd "$(dirname "$0")" && pwd)"

# root/project/scripts/operations
OPERATIONS_DIR="$(dirname "$DATABASES_DIR")"

# root/project/scripts
SCRIPTS_DIR="$(dirname "$OPERATIONS_DIR")"

# root/project/
PROJECT_DIR="$(dirname "$SCRIPTS_DIR")"

# Connection Details
# ----------------------------------------------------------------------------------

 CLOUD_SERVER=1

 

if [ $CLOUD_SERVER -eq 1 ]; then

  echo
  echo "Setting up cloud host connection details"
  echo

  export PGHOST="localhost"
  export PGPORT="5432"
  export PGUSER="postgres"
  export PGPASSWORD="Admin@2011"

fi


 
echo
echo "Restoring databases"
echo "---------------------------------------------------------------------------------"
echo


 
  psql -c 'DROP DATABASE  "kisip" WITH (FORCE)';

  echo "Now restoring......"
  psql -c 'CREATE DATABASE  "kisip"';

  now="$(date +'%d%m%Y')"

#psql -f 20052023.kisip.sql  xkisip
pg_restore  -d kisip 15082023.kesmis.sql.tar 

 




echo
echo "---------------------------------------------------------------------------------"
echo "Leaving Operations Databases Restoration Script"
echo "---------------------------------------------------------------------------------"
echo
