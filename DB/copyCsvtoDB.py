import psycopg2
from pathlib import Path
# import pandas with shortcut 'pd'
import pandas as pd  
# import required module
import os  
# read_csv function which is used to read the required CSV file
import csv
conn = psycopg2.connect("host=localhost dbname=kisip user=postgres password=Admin@2011")

def insertRecord(file):
   conn.autocommit = True
   cursor = conn.cursor()
   table= Path(file).stem
   truncate_sql = """ TRUNCATE   """ +  table + """ RESTART IDENTITY;"""    ## here we clear the existing table and restart ID
   cursor.execute(truncate_sql)

 
   with open(file) as csvFile:
        #reader = csv.reader(csvFile)
        #headers = next(reader, None)
        #print("headers", headers)
        next(csvFile) # SKIP HEADERS

        try:
            cursor.copy_from(csvFile, Path(file).stem, null="", sep=",")

        # POSTGRES COPY COMMAND FOR CSV MODE
        # cur.copy_expert("""COPY "kundeavgang" FROM STDIN WITH CSV""", csvFile)
            #cursor.commit()

        except Exception as exc:
            print(exc)


# assign directory
directory = './Initial-Data'
 
# iterate over files in
# that directory
for filename in os.listdir(directory):
    f = os.path.join(directory, filename)
    # checking if it is a file

    if os.path.isfile(f):
        print(f)
        insertRecord(f)