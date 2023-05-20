import psycopg2
from faker import Faker
import pandas as pd
import re
import uuid

# Connect to PostgreSQL
conn = psycopg2.connect(
    host="localhost",
    database="kisip",
    user="postgres",
    password="Admin@2011"
)

# Define the table you want to retrieve
table_name = "households"

# Fetch column names and data types from PostgreSQL
query = f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table_name}'"
cur = conn.cursor()
cur.execute(query)
columns = cur.fetchall()
pattern =  r'^age_70_\d{2}' 

if not columns:
    print("No columns found for the specified table name.")
    cur.close()
    conn.close()
    exit()

# Read names from the Excel file
names_df = pd.read_excel("names.xlsx")
names = names_df["Name"].tolist()
print(columns)
# Read options from the Excel file
options_df = pd.read_excel("options.xlsx")

# Generate fake data for each column based on the column names and data types
fake = Faker()
generated_data = []
for _ in range(455):  # Generate 100 records
    record = {}
    for col_name, data_type in columns:
        if col_name.lower() in ["county_id", "subcounty_id", "ward_id", 'id']:
            continue  # Skip specific columns
        if "name" in col_name.lower():
            record[col_name] = fake.random_element(names)
        elif "phone" in col_name.lower():
            record[col_name] = fake.phone_number()
        elif "email" in col_name.lower():
            record[col_name] = fake.email()
        elif re.match(pattern, col_name):
            record[col_name] = fake.random_int(min=1, max=5)
        elif col_name.lower() in options_df.columns:
            options = options_df[col_name.lower()].dropna().tolist()
            record[col_name] = fake.random_element(options)
        elif data_type == 'integer':
            record[col_name] = fake.random_int(min=1, max=100)
        elif data_type == 'bigint':
            record[col_name] = fake.random_int(min=1, max=100000)
        elif data_type == 'text':
            record[col_name] = fake.text()
        # elif data_type == 'character varying':
            # generated_text = fake.pystr(min_chars=10, max_chars=15)
            # record[col_name] = generated_text[:10]
        elif data_type == 'boolean':
            record[col_name] = fake.boolean()
        elif data_type == 'date':
            record[col_name] = fake.date()
        elif data_type == 'timestamp without time zone':
            record[col_name] = fake.date_time()
            
    generated_data.append(record)

 
# Create a DataFrame from the generated data
df = pd.DataFrame(generated_data)

# Retrieve id and code from the settlement table for each row
cur.execute("SELECT id, code FROM settlement")
settlement_data = cur.fetchall()

# Create a dictionary mapping id to code
settlement_mapping = {row[0]: row[1] for row in settlement_data}

# Add pcode (matching settlement code) to each row in the DataFrame
df['pcode'] = df['settlement_id'].map(settlement_mapping)
df.dropna(subset=['pcode'], inplace=True)

df['national'] = [str(uuid.uuid4()) for _ in range(len(df))]
df = df.drop('settlement_id', axis=1)


# Save the DataFrame to an Excel file
output_file = "generated_data.xlsx"
df.to_excel(output_file, index=False)

# Close the database connection
cur.close()
conn.close()

print("Data generation and saving complete!")
