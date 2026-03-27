import requests
from requests.auth import HTTPBasicAuth

# Configuration
BASE_URL = "https://collector.kesmis.go.ke"
PROJECT_ID = "30"  # Replace with your Project ID
dataset = "settlements"  # Replace with your dataset name
USERNAME = "kisip.mis@gmail.com"  # Replace with your ODK Central username
PASSWORD = "Admin@2011"  # Replace with your ODK Central password

# Authenticate and fetch entities
def get_entities():
    url = f"{BASE_URL}/v1/projects/{PROJECT_ID}/datasets/{dataset}/Entities"
    print(url)
    
    #response = requests.get(url, auth=HTTPBasicAuth(USERNAME, PASSWORD))
    response = requests.get(url, auth=(USERNAME, PASSWORD))

    if response.status_code == 200:
        return response.json()  # Returns a list of entities (submissions)
    else:
        print(f"Failed to fetch entities. Status code: {response.status_code}, Response: {response.text}")
        return None

# Delete an entity by ID
def delete_entity(entity_id):
    url = f"{BASE_URL}/v1/projects/{PROJECT_ID}/datasets/{dataset}/entities/{entity_id}"
    response = requests.delete(url, auth=HTTPBasicAuth(USERNAME, PASSWORD))

    if response.status_code == 200:
        print(f"Entity with ID {entity_id} deleted successfully.")
    elif response.status_code == 404:
        print(f"Entity with ID {entity_id} not found.")
    else:
        print(f"Failed to delete entity. Status code: {response.status_code}, Response: {response.text}")

# Main execution
if __name__ == "__main__":
    print("Fetching entities...")
    entities = get_entities()

    if entities and isinstance(entities, list):
        print("Entities fetched successfully!")
        print(f"Total entities: {len(entities)}")

        # Loop through the entities and delete them one by one
        for entity in entities:
            entity_id = entity.get("uuid")  # Adjust this if the ID field has a different key name
            if entity_id:
                print(f"Deleting entity with ID: {entity_id}")
                delete_entity(entity_id)
            else:
                print("Entity does not have a valid 'uuid'. Skipping.")
    else:
        print("No entities to fetch or unexpected response format.")
