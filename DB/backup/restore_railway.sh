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

  export PGHOST="containers-us-west-138.railway.app"
  export PGPORT="6542"
  export PGUSER="postgres"
  export PGPASSWORD="lfqb3md5ixbmn3tam15D"

fi


 
echo
echo "Restoring databases"
echo "---------------------------------------------------------------------------------"
echo


 
  psql -c 'DROP DATABASE  "railway" WITH (FORCE)';

  echo "Now restoring......"
  psql -c 'CREATE DATABASE  "railway"';

  now="$(date +'%d%m%Y')"
  
 echo "Now restoring...... $now.kisip.sql"
  psql -f $now.kisip.sql  railway

 




echo
echo "---------------------------------------------------------------------------------"
echo "Leaving Operations Databases Restoration Script"
echo "---------------------------------------------------------------------------------"
echo