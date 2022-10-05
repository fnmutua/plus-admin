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

  export PGHOST="collect.casconsultants.co.ke"
  export PGPORT="5433"
  export PGUSER="postgres"
  export PGPASSWORD="MySt0ngDBP@ss-Bit@3%^8"

fi


 
echo
echo "Restoring databases"
echo "---------------------------------------------------------------------------------"
echo


 
  psql -c 'DROP DATABASE  "kisip" WITH (FORCE)';

  echo "Now restoring......"
  psql -c 'CREATE DATABASE  "kisip"';


 
  psql -f 05102022.kisip.sql kisip

 

echo
echo "---------------------------------------------------------------------------------"
echo "Leaving Operations Databases Restoration Script"
echo "---------------------------------------------------------------------------------"
echo
