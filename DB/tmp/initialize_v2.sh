#!/bin/sh
# See: https://stackoverflow.com/questions/6405127/how-do-i-specify-a-password-to-psql-non-interactively#6405296
# See: https://stackoverflow.com/questions/14549270/check-if-database-exists-in-postgresql-using-shell

echo
echo "---------------------------------------------------------------------------------"
echo "Entering databases Initialization Script"
echo "---------------------------------------------------------------------------------"
echo

echo
echo "Setting up Resource Paths"
echo

 
# Connection Details
# ----------------------------------------------------------------------------------
  export PGHOST="localhost"
  export PGPORT="5432"
  export PGUSER="postgres"
  export PGPASSWORD="Admin@2011"
 

# Use the flags 1 and 0 below to configure the databases that you want to initialize
# 1 = on, 0 = off
# ----------------------------------------------------------------------------------
for i in './Initial-Data/*.csv'; do

    #model=basename  $i .csv
    #fields= head  -n 1 $i

    echo $i
   # echo "Setting up   database"
   # echo  "-d kisip  -1 -c \copy ${model}(${fields}) from  ${i}  DELIMITER ',' CSV HEADER"  

   # psql -d $model -1 -c "\copy $model($fields) from  ${i} DELIMITER ',' CSV HEADER";
    # psql -d "kisip" -1 -c "\copy ${model}(account_type_id,name,version) from  $i DELIMITER ',' CSV HEADER"


  
  # Load the account's database data
  #psql -d "accounts" -1 -c "\copy account(account_type_id,name,version) from  '$i' DELIMITER ',' CSV HEADER"




    [ -f "$i" ] || break
 
done


echo
echo "Initializing database collections"
echo "---------------------------------------------------------------------------------"
echo


# ----------------------------------------------------------------------------------
# 
# ----------------------------------------------------------------------------------

echo
echo "---------------------------------------------------------------------------------"
echo "Leaving databases Initialization Script"
echo "---------------------------------------------------------------------------------"
echo
