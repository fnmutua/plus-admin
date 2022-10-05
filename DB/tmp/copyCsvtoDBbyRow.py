import psycopg2
from pathlib import Path
# import pandas with shortcut 'pd'
import pandas as pd  
import numpy as np 
# import required module
import os  
# read_csv function which is used to read the required CSV file
import csv
conn = psycopg2.connect("host=localhost dbname=kisip user=postgres password=Admin@2011")

def insertRecord(file):
   conn.autocommit = True
   cursor = conn.cursor()
   table= Path(file).stem
   truncate_sql = """ TRUNCATE   """ +  table + """RESTART IDENTITY;"""
   cursor.execute(truncate_sql)

 
   with open(file, 'r') as csvFile:
    #with open('data.csv', 'r') as f:          # Read lines separately
    reader = csv.reader(csvFile, delimiter=',')
    for i, line in enumerate(reader):
        #print(i, line)

        try:
            #cursor.copy_from(csvFile, Path(file).stem, null="", sep=",")
            if(i==0):
                hdr=line
                #print(hdr)
                fields = ",".join(str(x) for x in hdr)
                a= ["%s"] * len(hdr)
                str_holders = ",".join(str(x) for x in a)
                
                print(str_holders)
            if(i>0):
                values=line
                value_str = ",".join(str(x) for x in values)

                postgres_insert_query = """ INSERT INTO """ + table + """ (""" + fields + """)""" +   """ VALUES (""" +str_holders+""")"""
                record_to_insert = """ ("""  + value_str +  """)""" 
                print(postgres_insert_query, record_to_insert)
                cursor.execute(postgres_insert_query, record_to_insert)
                                
 
                count = cursor.rowcount
                print(count, "Record inserted successfully into mobile table")

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