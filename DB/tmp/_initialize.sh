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

# root/project/scripts/setup/system/databases
DATABASES_DIR="$(cd "$(dirname "$0")" && pwd)"

# root/project/scripts/setup/system
SYSTEM_DIR="$(dirname "$DATABASES_DIR")"

# root/project/scripts/setup
SETUP_DIR="$(dirname "$SYSTEM_DIR")"

# root/project/scripts
SCRIPTS_DIR="$(dirname "$SETUP_DIR")"

# root/project/
PROJECT_DIR="$(dirname "$SCRIPTS_DIR")"


# Connection Details
# ----------------------------------------------------------------------------------

DEVELOPMENT_SERVER=0
CLOUD_SERVER=1

if [ $DEVELOPMENT_SERVER -eq 1 ]; then

  echo
  echo "Setting up local host connection details"
  echo

  export PGHOST="localhost"
  export PGPORT="5432"
  export PGUSER="postgres"
  export PGPASSWORD="postgres"

fi

if [ $CLOUD_SERVER -eq 1 ]; then

  echo
  echo "Setting up cloud host connection details"
  echo

  export PGHOST="localhost"
  export PGPORT="31392"
  export PGUSER="postgres"
  export PGPASSWORD="postgres"

fi

# Use the flags 1 and 0 below to configure the databases that you want to initialize
# 1 = on, 0 = off
# ----------------------------------------------------------------------------------

# Single databases
ACCOUNTABILITIES=0
ACCOUNTS=0
ACCOUNTABILITY_RULES=0
ACCOUNTABILITY_TYPES=0
ACTIVITIES=0
ACTIVITIES_IMPLEMENTATIONS=0
ACTIVITIES_IMPLEMENTATIONS_STATUS=0
ADMINISTRATIVE_HIERARCHIES=0
ADMINISTRATIVE_HIERARCHIES_TYPES=0
ADMINISTRATIVE_HIERARCHIES_TYPES_UNITS_TYPES=0
ADMIN_HIERARCHIES_TYPES_UNITS_TYPES_SUBSIDIARIES=0
ADMINISTRATIVE_UNITS=0
ADMINISTRATIVE_UNITS_TYPES=0
BENEFICIARIES_TYPES=0
CATEGORIES=0
CATEGORIES_OBSERVATIONS=0
CONTACTS=0
CONTACT_TYPES=0
CONTEXTS=0
CONTEXT_TYPES=0
DATA_FORMS_FIELDS=0
DATA_FORMS_FIELDS_TYPES=0
DOMAINS=0
ENTITIES=1
EVENT_TYPES=0
EVENTS=0
FORMS=0
FORMS_SECTIONS=0
PARTIES_FORMS_EVENTS=0
METADATA_TYPES=0
OBSERVATIONS=0
ORGANISATIONS=0
ORGANISATIONS_ROLES=0
ORGANISATIONS_TYPES=0
PARTICIPATING_ORGANISATIONS=1
PARTIES=0
PARTNERS=0
PARTNERS_ROLES=0
PARTY_TYPES=0
PHENOMENON_TYPES=0
QUANTITIES_OBSERVATIONS=0
REPORTING_FRAMEWORKS=0
SYSTEMS_MODULES=0
SYSTEMS_MODULES_PERMISSIONS=0
SYSTEMS_USERS=0
SYSTEMS_USERS_ROLES=0
SYSTEMS_USERS_ROLES_PERMISSIONS=0
TIME_PERIODS=0
TIME_POINTS=0
UNIT_CATEGORIES=0
UNITS=0

# database Collections



echo
echo "Initializing specific databases"
echo "---------------------------------------------------------------------------------"
echo

# accounts
# -------------------------------------------------------------------------------------
if [ $ACCOUNTS -eq 1 ]; then

  echo
  echo "Setting up accounts database"
  echo

  # drop the accounts database if it exists
  psql -c "DROP DATABASE IF EXISTS accounts"

  # create a new accounts database
  psql -c "CREATE DATABASE accounts"

  # Create the account's database objects
  psql -d "accounts" -1 -f "$PROJECT_DIR/services/accounts/src/main/resources/accounts.sql"

  # Load the account's database data
  psql -d "accounts" -1 -c "\copy account(account_type_id,name,version) from \
          '$PROJECT_DIR/data/accounts.csv' DELIMITER ',' CSV HEADER"

fi


# accountabilities
# -------------------------------------------------------------------------------------
if [ $ACCOUNTABILITIES -eq 1 ]; then

  echo
  echo "Setting up accountabilities database"
  echo

  # drop the accountabilities database if it exists
  psql -c "DROP DATABASE IF EXISTS accountabilities"

  # create a new accountabilities database
  psql -c "CREATE DATABASE accountabilities"

  # Create the accountability's database objects
  psql -d "accountabilities" -1 -f "$PROJECT_DIR/services/accountabilities/src/main/resources/accountabilities.sql"

  # Load the accountability's database data
  psql -d "accountabilities" -1 -c "\copy accountability(accountability_type_id,accountability_rule_id,parent_party_id,subsidiary_party_id,version) from \
          '$PROJECT_DIR/data/accountabilities.csv' DELIMITER ',' CSV HEADER"

fi


# accountability rules
# -------------------------------------------------------------------------------------
if [ $ACCOUNTABILITY_RULES -eq 1 ]; then

  echo
  echo "Setting up accountability rules database"
  echo

  # drop the accountability rules database if it exists
  psql -c "DROP DATABASE IF EXISTS accountability_rules"

  # create a new accountability rules database
  psql -c "CREATE DATABASE accountability_rules"

  # Create the accountability rules database objects
  psql -d "accountability_rules" -1 -f "$PROJECT_DIR/services/accountability-rules/src/main/resources/accountability_rules.sql"

  # Load the accountability rules database data
  psql -d "accountability_rules" -1 -c "\copy accountability_rule(accountability_type_id,parent_party_type_id,subsidiary_party_type_id, version) from \
          '$PROJECT_DIR/data/accountability_rules.csv' DELIMITER ',' CSV HEADER"

fi


# accountability types
# -------------------------------------------------------------------------------------
if [ $ACCOUNTABILITY_TYPES -eq 1 ]; then

  echo
  echo "Setting up accountability types database"
  echo

  # drop the accountability types database if it exists
  psql -c "DROP DATABASE IF EXISTS accountability_types"

  # create a new accountability types database
  psql -c "CREATE DATABASE accountability_types"

  # Create the accountability types database objects
  psql -d "accountability_types" -1 -f "$PROJECT_DIR/services/accountability-types/src/main/resources/accountability_types.sql"

  # Load the accountability types database data
  psql -d "accountability_types" -1 -c "\copy accountability_type(name, version) from \
          '$PROJECT_DIR/data/accountability_types.csv' DELIMITER ',' CSV HEADER"

fi




# activities
# -------------------------------------------------------------------------------------
if [ $ACTIVITIES -eq 1 ]; then

  echo
  echo "Setting up activities database"
  echo

  # drop the activities database if it exists
  psql -c "DROP DATABASE IF EXISTS activities"

  # create a new activities database
  psql -c "CREATE DATABASE activities"

  # Create the activity's database objects
  psql -d "activities" -1 -f "$PROJECT_DIR/services/activities/src/main/resources/activities.sql"

  # Load the activity's database data
  psql -d "activities" -1 -c "\copy activity(name,description,indicators,metadata,version) from \
          '$PROJECT_DIR/data/activities.csv' DELIMITER ',' CSV HEADER"

fi


# activities implementations
# -------------------------------------------------------------------------------------
if [ $ACTIVITIES_IMPLEMENTATIONS -eq 1 ]; then

  echo
  echo "Setting up activities implementations database"
  echo

  # drop the activities implementations database if it exists
  psql -c "DROP DATABASE IF EXISTS activities_implementations"

  # create a new activities implementations database
  psql -c "CREATE DATABASE activities_implementations"

  # Create the activities implementations database objects
  psql -d "activities_implementations" -1 -f "$PROJECT_DIR/services/activities-implementations/src/main/resources/activities_implementations.sql"

  # Load the activities implementations database data
  psql -d "activities_implementations" -1 -c "\copy activity_implementation(parent_id,activity_id,location_party_id,activity_implementation_status_id,time_references,partners,beneficiaries,indicators,metadata, version) from \
          '$PROJECT_DIR/data/activities_implementations.csv' DELIMITER ',' CSV HEADER"

fi


# activities implementations status
# -------------------------------------------------------------------------------------
if [ $ACTIVITIES_IMPLEMENTATIONS_STATUS -eq 1 ]; then

  echo
  echo "Setting up activities implementations status database"
  echo

  # drop the activities implementations status database if it exists
  psql -c "DROP DATABASE IF EXISTS activities_implementations_status"

  # create a new activities implementations status database
  psql -c "CREATE DATABASE activities_implementations_status"

  # Create the activities implementations status database objects
  psql -d "activities_implementations_status" -1 -f "$PROJECT_DIR/services/activities-implementations-status/src/main/resources/activities_implementations_status.sql"

  # Load the activities implementations status database data
  psql -d "activities_implementations_status" -1 -c "\copy activity_implementation_status(name, version) from \
          '$PROJECT_DIR/data/activities_implementations_status.csv' DELIMITER ',' CSV HEADER"

fi

# administrative hierarchies
# -------------------------------------------------------------------------------------
if [ $ADMINISTRATIVE_HIERARCHIES -eq 1 ]; then

  echo
  echo "Setting up administrative hierarchies database"
  echo

  # drop the administrative hierarchies database if it exists
  psql -c "DROP DATABASE IF EXISTS administrative_hierarchies"

  # create a new administrative hierarchies database
  psql -c "CREATE DATABASE administrative_hierarchies"

  # Create the administrative hierarchies database objects
  psql -d "administrative_hierarchies" -1 -f "$PROJECT_DIR/services/administrative-hierarchies/src/main/resources/administrative_hierarchies.sql"

  # Load the administrative hierarchies database data
  psql -d "administrative_hierarchies" -1 -c "\copy administrative_hierarchy(administrative_hierarchy_type_id,parent_administrative_unit_type_id,parent_administrative_unit_id,
  subsidiary_administrative_unit_type_id,subsidiary_administrative_unit_id,version) from \
          '$PROJECT_DIR/data/administrative_hierarchies.csv' DELIMITER ',' CSV HEADER"

fi

# administrative hierarchies types
# -------------------------------------------------------------------------------------
if [ $ADMINISTRATIVE_HIERARCHIES_TYPES -eq 1 ]; then

  echo
  echo "Setting up administrative hierarchies types database"
  echo

  # drop the administrative hierarchies types database if it exists
  psql -c "DROP DATABASE IF EXISTS administrative_hierarchies_types"

  # create a new administrative hierarchies types database
  psql -c "CREATE DATABASE administrative_hierarchies_types"

  # Create the administrative hierarchies types database objects
  psql -d "administrative_hierarchies_types" -1 -f "$PROJECT_DIR/services/administrative-hierarchies-types/src/main/resources/administrative_hierarchies_types.sql"

  # Load the administrative hierarchies types database data
  psql -d "administrative_hierarchies_types" -1 -c "\copy administrative_hierarchy_type(name,version) from \
          '$PROJECT_DIR/data/administrative_hierarchies_types.csv' DELIMITER ',' CSV HEADER"

fi

# administrative hierarchies types units types
# -------------------------------------------------------------------------------------
if [ $ADMINISTRATIVE_HIERARCHIES_TYPES_UNITS_TYPES -eq 1 ]; then

  echo
  echo "Setting up administrative hierarchies types units types database"
  echo

  # drop the administrative hierarchies types units types database if it exists
  psql -c "DROP DATABASE IF EXISTS administrative_hierarchies_types_units_types"

  # create a new administrative hierarchies types units types database
  psql -c "CREATE DATABASE administrative_hierarchies_types_units_types"

  # Create the administrative hierarchies types units types database objects
  psql -d "administrative_hierarchies_types_units_types" -1 -f "$PROJECT_DIR/services/administrative-hierarchies-types-units-types/src/main/resources/administrative_hierarchies_types_units_types.sql"

  # Load the administrative hierarchies types units types database data
  psql -d "administrative_hierarchies_types_units_types" -1 -c "\copy administrative_hierarchy_type_unit_type(administrative_hierarchy_type_id,administrative_unit_type_id,version) from \
          '$PROJECT_DIR/data/administrative_hierarchies_types_units_types.csv' DELIMITER ',' CSV HEADER"

fi

# admin hierarchies types units types subsidiaries
# -------------------------------------------------------------------------------------
if [ $ADMIN_HIERARCHIES_TYPES_UNITS_TYPES_SUBSIDIARIES -eq 1 ]; then

  echo
  echo "Setting up admin hierarchies types units types subsidiaries database"
  echo

  # drop the admin hierarchies types units types subsidiaries database if it exists
  psql -c "DROP DATABASE IF EXISTS admin_hierarchies_types_units_types_subsidiaries"

  # create a new admin hierarchies types units types subsidiaries database
  psql -c "CREATE DATABASE admin_hierarchies_types_units_types_subsidiaries"

  # Create the admin hierarchies types units types subsidiaries database objects
  psql -d "admin_hierarchies_types_units_types_subsidiaries" -1 -f "$PROJECT_DIR/services/admin-hierarchies-types-units-types-subsidiaries/src/main/resources/admin_hierarchies_types_units_types_subsidiaries.sql"

  # Load the admin hierarchies types units types subsidiaries database data
  psql -d "admin_hierarchies_types_units_types_subsidiaries" -1 -c "\copy admin_hierarchy_type_unit_type_subsidiary(administrative_hierarchy_type_id,parent_administrative_unit_type_id,subsidiary_administrative_unit_type_id, version) from \
          '$PROJECT_DIR/data/admin_hierarchies_types_units_types_subsidiaries.csv' DELIMITER ',' CSV HEADER"

fi

# administrative units
# -------------------------------------------------------------------------------------
if [ $ADMINISTRATIVE_UNITS -eq 1 ]; then

  echo
  echo "Setting up administrative units database"
  echo

  # drop the administrative units database if it exists
  psql -c "DROP DATABASE IF EXISTS administrative_units"

  # create a new administrative units database
  psql -c "CREATE DATABASE administrative_units"

  # Create the administrative units database objects
  psql -d "administrative_units" -1 -f "$PROJECT_DIR/services/administrative-units/src/main/resources/administrative_units.sql"

  # Load the administrative units database data
  psql -d "administrative_units" -1 -c "\copy administrative_unit(administrative_unit_type_id, name,geometry,description,version) from \
          '$PROJECT_DIR/data/administrative_units.csv' DELIMITER ',' CSV HEADER"

fi

# administrative units types
# -------------------------------------------------------------------------------------
if [ $ADMINISTRATIVE_UNITS_TYPES -eq 1 ]; then

  echo
  echo "Setting up administrative units types database"
  echo

  # drop the administrative units types database if it exists
  psql -c "DROP DATABASE IF EXISTS administrative_units_types"

  # create a new administrative units types database
  psql -c "CREATE DATABASE administrative_units_types"

  # Create the administrative units types database objects
  psql -d "administrative_units_types" -1 -f "$PROJECT_DIR/services/administrative-units-types/src/main/resources/administrative_units_types.sql"

  # Load the administrative units types database data
  psql -d "administrative_units_types" -1 -c "\copy administrative_unit_type(name,plural,version) from \
          '$PROJECT_DIR/data/administrative_units_types.csv' DELIMITER ',' CSV HEADER"

fi



# beneficiaries types
# -------------------------------------------------------------------------------------
if [ $BENEFICIARIES_TYPES -eq 1 ]; then

  echo
  echo "Setting up beneficiaries types database"
  echo

  # drop the beneficiaries types database if it exists
  psql -c "DROP DATABASE IF EXISTS beneficiaries_types"

  # create a new beneficiaries types database
  psql -c "CREATE DATABASE beneficiaries_types"

  # Create the beneficiaries types database objects
  psql -d "beneficiaries_types" -1 -f "$PROJECT_DIR/services/beneficiaries-types/src/main/resources/beneficiaries_types.sql"

  # Load the beneficiaries types database data
  psql -d "beneficiaries_types" -1 -c "\copy beneficiary_type(activity_implementation_id,party_type_id,version) from \
          '$PROJECT_DIR/data/beneficiaries_types.csv' DELIMITER ',' CSV HEADER"

fi


# categories
# -------------------------------------------------------------------------------------
if [ $CATEGORIES -eq 1 ]; then

  echo
  echo "Setting up categories database"
  echo

  # drop the categories database if it exists
  psql -c "DROP DATABASE IF EXISTS categories"

  # create a new categories database
  psql -c "CREATE DATABASE categories"

  # Create the category's database objects
  psql -d "categories" -1 -f "$PROJECT_DIR/services/categories/src/main/resources/categories.sql"

  # Load the category's database data
  psql -d "categories" -1 -c "\copy category(name,version) from \
          '$PROJECT_DIR/data/categories.csv' DELIMITER ',' CSV HEADER"

fi


# categories observations
# -------------------------------------------------------------------------------------
if [ $CATEGORIES_OBSERVATIONS -eq 1 ]; then

  echo
  echo "Setting up categories observations database"
  echo

  # drop the categories observations database if it exists
  psql -c "DROP DATABASE IF EXISTS categories_observations"

  # create a new categories observations database
  psql -c "CREATE DATABASE categories_observations"

  # Create the categories observations database objects
  psql -d "categories_observations" -1 -f "$PROJECT_DIR/services/categories-observations/src/main/resources/categories_observations.sql"

  # Load the categories observations database data
  psql -d "categories_observations" -1 -c "\copy category_observation(observation_id,field_id,category_id, notes,version) from \
          '$PROJECT_DIR/data/categories_observations.csv' DELIMITER ',' CSV HEADER"

fi



# contacts
# -------------------------------------------------------------------------------------
if [ $CONTACTS -eq 1 ]; then

  echo
  echo "Setting up contacts database"
  echo

  # drop the contacts database if it exists
  psql -c "DROP DATABASE IF EXISTS contacts"

  # create a new contacts database
  psql -c "CREATE DATABASE contacts"

  # Create the contact's database objects
  psql -d "contacts" -1 -f "$PROJECT_DIR/services/contacts/src/main/resources/contacts.sql"

  # Load the contact's database data
  psql -d "contacts" -1 -c "\copy contact(contact_type_id,party_id,details,version) from \
          '$PROJECT_DIR/data/contacts.csv' DELIMITER ',' CSV HEADER"

fi


# contact types
# -------------------------------------------------------------------------------------
if [ $CONTACT_TYPES -eq 1 ]; then

  echo
  echo "Setting up contact types database"
  echo

  # drop the contact types database if it exists
  psql -c "DROP DATABASE IF EXISTS contact_types"

  # create a new contact types database
  psql -c "CREATE DATABASE contact_types"

  # Create the contact types database objects
  psql -d "contact_types" -1 -f "$PROJECT_DIR/services/contact-types/src/main/resources/contact_types.sql"

  # Load the contact types database data
  psql -d "contact_types" -1 -c "\copy contact_type(parent_id,name,version) from \
          '$PROJECT_DIR/data/contact_types.csv' DELIMITER ',' CSV HEADER"

fi


# contexts
# -------------------------------------------------------------------------------------
if [ $CONTEXTS -eq 1 ]; then

  echo
  echo "Setting up contexts database"
  echo

  # drop the contexts database if it exists
  psql -c "DROP DATABASE IF EXISTS contexts"

  # create a new contexts database
  psql -c "CREATE DATABASE contexts"

  # Create the contexts database objects
  psql -d "contexts" -1 -f "$PROJECT_DIR/services/contexts/src/main/resources/contexts.sql"

  # Load the contexts database data
  psql -d "contexts" -1 -c "\copy context(context_type_id, name, description, indicators, metadata, version) from \
          '$PROJECT_DIR/data/contexts.csv' DELIMITER ',' CSV HEADER"

fi


# context types
# -------------------------------------------------------------------------------------
if [ $CONTEXT_TYPES -eq 1 ]; then

  echo
  echo "Setting up context types database"
  echo

  # drop the context types database if it exists
  psql -c "DROP DATABASE IF EXISTS context_types"

  # create a new context types database
  psql -c "CREATE DATABASE context_types"

  # Create the context types database objects
  psql -d "context_types" -1 -f "$PROJECT_DIR/services/context-types/src/main/resources/context_types.sql"

  # Load the context types database data
  psql -d "context_types" -1 -c "\copy context_type(name, version) from \
          '$PROJECT_DIR/data/context_types.csv' DELIMITER ',' CSV HEADER"

fi

# data forms fields
# -------------------------------------------------------------------------------------
if [ $DATA_FORMS_FIELDS -eq 1 ]; then

  echo
  echo "Setting up data forms fields database"
  echo

  # drop the data forms fields database if it exists
  psql -c "DROP DATABASE IF EXISTS data_forms_fields"

  # create a new data forms fields database
  psql -c "CREATE DATABASE data_forms_fields"

  # Create the data forms fields database objects
  psql -d "data_forms_fields" -1 -f "$PROJECT_DIR/services/data-forms-fields-types/src/main/resources/data_forms_fields.sql"

  # Load the data forms fields database data
  psql -d "data_forms_fields" -1 -c "\copy data_form_field(data_form_section_id,data_type_id,name,description,categories,unit,rules,active,version) from \
          '$PROJECT_DIR/data/data_forms_fields.csv' DELIMITER ',' CSV HEADER"

fi

# data forms fields types
# -------------------------------------------------------------------------------------
if [ $DATA_FORMS_FIELDS_TYPES -eq 1 ]; then

  echo
  echo "Setting up data forms fields types database"
  echo

  # drop the data forms fields types database if it exists
  psql -c "DROP DATABASE IF EXISTS data_forms_fields_types"

  # create a new data forms fields types database
  psql -c "CREATE DATABASE data_forms_fields_types"

  # Create the data forms fields types database objects
  psql -d "data_forms_fields_types" -1 -f "$PROJECT_DIR/services/data-forms-fields-types/src/main/resources/data_forms_fields_types.sql"

  # Load the data forms fields types database data
  psql -d "data_forms_fields_types" -1 -c "\copy data_form_field_type(name,version) from \
          '$PROJECT_DIR/data/data_forms_fields_types.csv' DELIMITER ',' CSV HEADER"

fi

# domains
# -------------------------------------------------------------------------------------
if [ $DOMAINS -eq 1 ]; then

  echo
  echo "Setting up domains database"
  echo

  # drop the domains database if it exists
  psql -c "DROP DATABASE IF EXISTS domains"

  # create a new domains database
  psql -c "CREATE DATABASE domains"

  # Create the domains database objects
  psql -d "domains" -1 -f "$PROJECT_DIR/services/domains/src/main/resources/domains.sql"

  # Load the domains database data
  psql -d "domains" -1 -c "\copy domain(name, indicators, metadata, version) from \
          '$PROJECT_DIR/data/domains.csv' DELIMITER ',' CSV HEADER"

fi

# entities
# -------------------------------------------------------------------------------------
if [ $ENTITIES -eq 1 ]; then

  echo
  echo "Setting up entities database"
  echo

  # drop the entities database if it exists
  psql -c "DROP DATABASE IF EXISTS entities"

  # create a new entities database
  psql -c "CREATE DATABASE entities"

  # Create the entity's database objects
  psql -d "entities" -1 -f "$PROJECT_DIR/services/entities/src/main/resources/entities.sql"

  # Load the entity's database data
  psql -d "entities" -1 -c "\copy entity(entity_type_id, name, location, partners, observations, version) from \
          '$PROJECT_DIR/data/entities.csv' DELIMITER ',' CSV HEADER"

fi


# event types
# -------------------------------------------------------------------------------------
if [ $EVENT_TYPES -eq 1 ]; then

  echo
  echo "Setting up event types database"
  echo

  # drop the event types database if it exists
  psql -c "DROP DATABASE IF EXISTS event_types"

  # create a new event types database
  psql -c "CREATE DATABASE event_types"

  # Create the event types database objects
  psql -d "event_types" -1 -f "$PROJECT_DIR/services/event-types/src/main/resources/event_types.sql"

  # Load the event types database data
  psql -d "event_types" -1 -c "\copy event_type(name, description, version) from \
          '$PROJECT_DIR/data/event_types.csv' DELIMITER ',' CSV HEADER"

fi


# events
# -------------------------------------------------------------------------------------
if [ $EVENTS -eq 1 ]; then

  echo
  echo "Setting up events database"
  echo

  # drop the events database if it exists
  psql -c "DROP DATABASE IF EXISTS events"

  # create a new events database
  psql -c "CREATE DATABASE events"

  # Create the events database objects
  psql -d "events" -1 -f "$PROJECT_DIR/services/events/src/main/resources/events.sql"

  # Load the events database data
  psql -d "events" -1 -c "\copy event(event_type_id, party_id, timepoint_id, version) from \
          '$PROJECT_DIR/data/events.csv' DELIMITER ',' CSV HEADER"

fi


# forms
# -------------------------------------------------------------------------------------
if [ $FORMS -eq 1 ]; then

  echo
  echo "Setting up forms database"
  echo

  # drop the forms database if it exists
  psql -c "DROP DATABASE IF EXISTS forms"

  # create a new forms database
  psql -c "CREATE DATABASE forms"

  # Create the forms database objects
  psql -d "forms" -1 -f "$PROJECT_DIR/services/forms/src/main/resources/forms.sql"

  # Load the forms database data
  psql -d "forms" -1 -c "\copy form(name, description, jurisdiction, version) from \
          '$PROJECT_DIR/data/forms.csv' DELIMITER ',' CSV HEADER"

fi


# forms sections
# -------------------------------------------------------------------------------------
if [ $FORMS_SECTIONS -eq 1 ]; then

  echo
  echo "Setting up forms sections database"
  echo

  # drop the forms sections database if it exists
  psql -c "DROP DATABASE IF EXISTS forms_sections"

  # create a new forms sections database
  psql -c "CREATE DATABASE forms_sections"

  # Create the forms sections database objects
  psql -d "forms_sections" -1 -f "$PROJECT_DIR/services/forms-sections/src/main/resources/forms_sections.sql"

  # Load the forms sections database data
  psql -d "forms_sections" -1 -c "\copy form_section(form_id, name, description, phenomena, version) from \
          '$PROJECT_DIR/data/forms_sections.csv' DELIMITER ',' CSV HEADER"

fi


# parties forms events
# -------------------------------------------------------------------------------------
if [ $PARTIES_FORMS_EVENTS -eq 1 ]; then

  echo
  echo "Setting up parties forms events database"
  echo

  # drop the parties forms events database if it exists
  psql -c "DROP DATABASE IF EXISTS parties_forms_events"

  # create a new parties forms events database
  psql -c "CREATE DATABASE parties_forms_events"

  # Create the parties forms events database objects
  psql -d "parties_forms_events" -1 -f "$PROJECT_DIR/services/parties-forms-events/src/main/resources/parties_forms_events.sql"

  # Load the parties forms events database data
  psql -d "parties_forms_events" -1 -c "\copy party_form_event(party_id,form_id, event_id, version) from \
          '$PROJECT_DIR/data/parties_forms_events.csv' DELIMITER ',' CSV HEADER"

fi


# metadata types
# -------------------------------------------------------------------------------------
if [ $METADATA_TYPES -eq 1 ]; then

  echo
  echo "Setting up metadata types database"
  echo

  # drop the metadata types database if it exists
  psql -c "DROP DATABASE IF EXISTS metadata_types"

  # create a new metadata types database
  psql -c "CREATE DATABASE metadata_types"

  # Create the metadata types database objects
  psql -d "metadata_types" -1 -f "$PROJECT_DIR/services/metadata-types/src/main/resources/metadata_types.sql"

  # Load the metadata types database data
  psql -d "metadata_types" -1 -c "\copy metadatum_type(name, version) from \
          '$PROJECT_DIR/data/metadata_types.csv' DELIMITER ',' CSV HEADER"

fi

# observations
# -------------------------------------------------------------------------------------
if [ $OBSERVATIONS -eq 1 ]; then

  echo
  echo "Setting up observations database"
  echo

  # drop the observations database if it exists
  psql -c "DROP DATABASE IF EXISTS observations"

  # create a new observations database
  psql -c "CREATE DATABASE observations"

  # Create the observation's database objects
  psql -d "observations" -1 -f "$PROJECT_DIR/services/observations/src/main/resources/observations.sql"

  # Load the observation's database data
  psql -d "observations" -1 -c "\copy observation(entity_id,data_form_id,time_point_id,version) from \
          '$PROJECT_DIR/data/observations.csv' DELIMITER ',' CSV HEADER"

fi


# organisations
# -------------------------------------------------------------------------------------
if [ $ORGANISATIONS -eq 1 ]; then

  echo
  echo "Setting up organisations database"
  echo

  # drop the organisations database if it exists
  psql -c "DROP DATABASE IF EXISTS organisations"

  # create a new organisations database
  psql -c "CREATE DATABASE organisations"

  # Create the organisation's database objects
  psql -d "organisations" -1 -f "$PROJECT_DIR/services/organisations/src/main/resources/organisations.sql"

  # Load the organisation's database data
  psql -d "organisations" -1 -c "\copy organisation(organisation_type_id, name, abbreviation, website, disabled, version) from \
          '$PROJECT_DIR/data/organisations.csv' DELIMITER ',' CSV HEADER"

fi


# organisations roles
# -------------------------------------------------------------------------------------
if [ $ORGANISATIONS_ROLES -eq 1 ]; then

  echo
  echo "Setting up organisations roles database"
  echo

  # drop the organisations roles database if it exists
  psql -c "DROP DATABASE IF EXISTS organisations_roles"

  # create a new organisations roles database
  psql -c "CREATE DATABASE organisations_roles"

  # Create the organisations roles database objects
  psql -d "organisations_roles" -1 -f "$PROJECT_DIR/services/organisations-roles/src/main/resources/organisations_roles.sql"

  # Load the organisations roles database data
  psql -d "organisations_roles" -1 -c "\copy organisation_role(name,plural,version) from \
          '$PROJECT_DIR/data/organisations_roles.csv' DELIMITER ',' CSV HEADER"

fi


# organisations types
# -------------------------------------------------------------------------------------
if [ $ORGANISATIONS_TYPES -eq 1 ]; then

  echo
  echo "Setting up organisations types database"
  echo

  # drop the organisations types database if it exists
  psql -c "DROP DATABASE IF EXISTS organisations_types"

  # create a new organisations types database
  psql -c "CREATE DATABASE organisations_types"

  # Create the organisations types database objects
  psql -d "organisations_types" -1 -f "$PROJECT_DIR/services/organisations-types/src/main/resources/organisations_types.sql"

  # Load the organisations types database data
  psql -d "organisations_types" -1 -c "\copy organisation_type(name, plural, abbreviation,colour_code,version) from \
          '$PROJECT_DIR/data/organisations_types.csv' DELIMITER ',' CSV HEADER"

fi


# participating organisations
# -------------------------------------------------------------------------------------
if [ $PARTICIPATING_ORGANISATIONS -eq 1 ]; then

  echo
  echo "Setting up participating organisations database"
  echo

  # drop the participating organisations database if it exists
  psql -c "DROP DATABASE IF EXISTS participating_organisations"

  # create a new participating organisations database
  psql -c "CREATE DATABASE participating_organisations"

  # Create the participating organisations database objects
  psql -d "participating_organisations" -1 -f "$PROJECT_DIR/services/participating-organisations/src/main/resources/participating_organisations.sql"

  # Load the participating organisations database data
  psql -d "participating_organisations" -1 -c "\copy participating_organisation(organisation_type_id,organisation_id,location,entity_type_id,entity_id,entity_classifications,supported_domains,version) from \
          '$PROJECT_DIR/data/participating_organisations.csv' DELIMITER ',' CSV HEADER"

fi


# parties
# -------------------------------------------------------------------------------------
if [ $PARTIES -eq 1 ]; then

  echo
  echo "Setting up parties party"
  echo

  # drop the parties party if it exists
  psql -c "DROP DATABASE IF EXISTS parties"

  # create a new parties party
  psql -c "CREATE DATABASE parties"

  # Create the party's party objects
  psql -d "parties" -1 -f "$PROJECT_DIR/services/parties/src/main/resources/parties.sql"

  # Load the party's party data
  psql -d "parties" -1 -c "\copy party(party_type_id,name,version) from \
          '$PROJECT_DIR/data/parties.csv' DELIMITER ',' CSV HEADER"

fi


# partners
# -------------------------------------------------------------------------------------
if [ $PARTNERS -eq 1 ]; then

  echo
  echo "Setting up partners database"
  echo

  # drop the partners database if it exists
  psql -c "DROP DATABASE IF EXISTS partners"

  # create a new partners database
  psql -c "CREATE DATABASE partners"

  # Create the partners database objects
  psql -d "partners" -1 -f "$PROJECT_DIR/services/partners/src/main/resources/partners.sql"

  # Load the partners database data
  psql -d "partners" -1 -c "\copy partner(activity_implementation_id,partner_party_id,partner_role_id, version) from \
          '$PROJECT_DIR/data/partners.csv' DELIMITER ',' CSV HEADER"

fi


# partners roles
# -------------------------------------------------------------------------------------
if [ $PARTNERS_ROLES -eq 1 ]; then

  echo
  echo "Setting up partners roles database"
  echo

  # drop the partners roles database if it exists
  psql -c "DROP DATABASE IF EXISTS partners_roles"

  # create a new partners roles database
  psql -c "CREATE DATABASE partners_roles"

  # Create the partners roles database objects
  psql -d "partners_roles" -1 -f "$PROJECT_DIR/services/partners-roles/src/main/resources/partners_roles.sql"

  # Load the partners roles database data
  psql -d "partners_roles" -1 -c "\copy partner_role(name, version) from \
          '$PROJECT_DIR/data/partners_roles.csv' DELIMITER ',' CSV HEADER"

fi


# party types
# -------------------------------------------------------------------------------------
if [ $PARTY_TYPES -eq 1 ]; then

  echo
  echo "Setting up party types database"
  echo

  # drop the party types database if it exists
  psql -c "DROP DATABASE IF EXISTS party_types"

  # create a new party types database
  psql -c "CREATE DATABASE party_types"

  # Create the party types database objects
  psql -d "party_types" -1 -f "$PROJECT_DIR/services/party-types/src/main/resources/party_types.sql"

  # Load the party types database data
  psql -d "party_types" -1 -c "\copy party_type(parent_party_type_id, name, version) from \
          '$PROJECT_DIR/data/party_types.csv' DELIMITER ',' CSV HEADER"

fi


# phenomenon types
# -------------------------------------------------------------------------------------
if [ $PHENOMENON_TYPES -eq 1 ]; then

  echo
  echo "Setting up phenomenon types database"
  echo

  # drop the phenomenon types database if it exists
  psql -c "DROP DATABASE IF EXISTS phenomenon_types"

  # create a new phenomenon types database
  psql -c "CREATE DATABASE phenomenon_types"

  # Create the phenomenon types database objects
  psql -d "phenomenon_types" -1 -f "$PROJECT_DIR/services/phenomenon-types/src/main/resources/phenomenon_types.sql"

  # Load the phenomenon types database data
  psql -d "phenomenon_types" -1 -c "\copy phenomenon_type(name,description,tags,metadata,version) from \
          '$PROJECT_DIR/data/phenomenon_types.csv' DELIMITER ',' CSV HEADER"

fi

# quantities observations
# -------------------------------------------------------------------------------------
if [ $QUANTITIES_OBSERVATIONS -eq 1 ]; then

  echo
  echo "Setting up quantities observations database"
  echo

  # drop the quantities observations database if it exists
  psql -c "DROP DATABASE IF EXISTS quantities_observations"

  # create a new quantities observations database
  psql -c "CREATE DATABASE quantities_observations"

  # Create the quantities observations database objects
  psql -d "quantities_observations" -1 -f "$PROJECT_DIR/services/quantities-observations/src/main/resources/quantities_observations.sql"

  # Load the quantities observations database data
  psql -d "quantities_observations" -1 -c "\copy quantity_observation(observation_id,field_id,unit_id,value, notes,version) from \
          '$PROJECT_DIR/data/quantities_observations.csv' DELIMITER ',' CSV HEADER"

fi


# systems modules
# -------------------------------------------------------------------------------------
if [ $SYSTEMS_MODULES -eq 1 ]; then

  echo
  echo "Setting up systems modules database"
  echo

  # drop the systems modules database if it exists
  psql -c "DROP DATABASE IF EXISTS systems_modules"

  # create a new systems modules database
  psql -c "CREATE DATABASE systems_modules"

  # Create the systems modules database objects
  psql -d "systems_modules" -1 -f "$PROJECT_DIR/services/systems-modules/src/main/resources/systems_modules.sql"

  # Load the systems modules database data
  psql -d "systems_modules" -1 -c "\copy system_module(name,reserved,version) from \
          '$PROJECT_DIR/data/systems_modules.csv' DELIMITER ',' CSV HEADER"

fi

# systems modules permissions
# -------------------------------------------------------------------------------------
if [ $SYSTEMS_MODULES_PERMISSIONS -eq 1 ]; then

  echo
  echo "Setting up systems modules permissions database"
  echo

  # drop the systems modules permissions database if it exists
  psql -c "DROP DATABASE IF EXISTS systems_modules_permissions"

  # create a new systems modules permissions database
  psql -c "CREATE DATABASE systems_modules_permissions"

  # Create the systems modules permissions database objects
  psql -d "systems_modules_permissions" -1 -f "$PROJECT_DIR/services/systems-modules-permissions/src/main/resources/systems_modules_permissions.sql"

  # Load the systems modules permissions database data
  psql -d "systems_modules_permissions" -1 -c "\copy system_module_permission(module_id,code,name,description,version) from \
          '$PROJECT_DIR/data/systems_modules_permissions.csv' DELIMITER ',' CSV HEADER"

fi


# systems users
# -------------------------------------------------------------------------------------
if [ $SYSTEMS_USERS -eq 1 ]; then

  echo
  echo "Setting up systems users database"
  echo

  # drop the systems users database if it exists
  psql -c "DROP DATABASE IF EXISTS systems_users"

  # create a new systems users database
  psql -c "CREATE DATABASE systems_users"

  # Create the systems users database objects
  psql -d "systems_users" -1 -f "$PROJECT_DIR/services/systems-users/src/main/resources/systems_users.sql"

  # Load the systems users database data
  psql -d "systems_users" -1 -c "\copy system_user(administrative_unit_id,organisation_id,user_role,name,email,password,confirmed,enabled,version) from \
          '$PROJECT_DIR/data/systems_users.csv' DELIMITER ',' CSV HEADER"

fi


# systems users roles
# -------------------------------------------------------------------------------------
if [ $SYSTEMS_USERS_ROLES -eq 1 ]; then

  echo
  echo "Setting up systems users roles database"
  echo

  # drop the systems users roles database if it exists
  psql -c "DROP DATABASE IF EXISTS systems_users_roles"

  # create a new systems users roles database
  psql -c "CREATE DATABASE systems_users_roles"

  # Create the systems users roles database objects
  psql -d "systems_users_roles" -1 -f "$PROJECT_DIR/services/systems-users-roles/src/main/resources/systems_users_roles.sql"

  # Load the systems users roles database data
  psql -d "systems_users_roles" -1 -c "\copy system_user_role(code,name,description,reserved,version) from \
          '$PROJECT_DIR/data/systems_users_roles.csv' DELIMITER ',' CSV HEADER"

fi


# systems users roles permissions
# -------------------------------------------------------------------------------------
if [ $SYSTEMS_USERS_ROLES_PERMISSIONS -eq 1 ]; then

  echo
  echo "Setting up systems users roles permissions database"
  echo

  # drop the systems users roles permissions database if it exists
  psql -c "DROP DATABASE IF EXISTS systems_users_roles_permissions"

  # create a new systems users roles permissions database
  psql -c "CREATE DATABASE systems_users_roles_permissions"

  # Create the systems users roles permissions database objects
  psql -d "systems_users_roles_permissions" -1 -f "$PROJECT_DIR/services/systems-users-roles-permissions/src/main/resources/systems_users_roles_permissions.sql"

  # Load the systems users roles permissions database data
  psql -d "systems_users_roles_permissions" -1 -c "\copy system_user_role_permission(user_role_id,user_role_code,module_id,module_permission_code,version) from \
          '$PROJECT_DIR/data/systems_users_roles_permissions.csv' DELIMITER ',' CSV HEADER"

fi

# quantities observations
# -------------------------------------------------------------------------------------
if [ $QUANTITIES_OBSERVATIONS -eq 1 ]; then

  echo
  echo "Setting up quantities observations database"
  echo

  # drop the quantities observations database if it exists
  psql -c "DROP DATABASE IF EXISTS quantities_observations"

  # create a new quantities observations database
  psql -c "CREATE DATABASE quantities_observations"

  # Create the quantities observations database objects
  psql -d "quantities_observations" -1 -f "$PROJECT_DIR/services/quantities-observations/src/main/resources/quantities_observations.sql"

  # Load the quantities observations database data
  psql -d "quantities_observations" -1 -c "\copy quantity_observation(observation_id,field_Id,unit_Id,value,notes,version) from \
          '$PROJECT_DIR/data/quantities_observations.csv' DELIMITER ',' CSV HEADER"

fi



# reporting frameworks
# -------------------------------------------------------------------------------------
if [ $REPORTING_FRAMEWORKS -eq 1 ]; then

  echo
  echo "Setting up reporting frameworks database"
  echo

  # drop the reporting frameworks database if it exists
  psql -c "DROP DATABASE IF EXISTS reporting_frameworks"

  # create a new reporting frameworks database
  psql -c "CREATE DATABASE reporting_frameworks"

  # Create the reporting frameworks database objects
  psql -d "reporting_frameworks" -1 -f "$PROJECT_DIR/services/reporting-frameworks/src/main/resources/reporting_frameworks.sql"

  # Load the reporting frameworks database data
  psql -d "reporting_frameworks" -1 -c "\copy reporting_framework(name,description,version) from \
          '$PROJECT_DIR/data/reporting_frameworks.csv' DELIMITER ',' CSV HEADER"

fi


# time periods
# -------------------------------------------------------------------------------------
if [ $TIME_PERIODS -eq 1 ]; then

  echo
  echo "Setting up time periods database"
  echo

  # drop the time periods database if it exists
  psql -c "DROP DATABASE IF EXISTS time_periods"

  # create a new time periods database
  psql -c "CREATE DATABASE time_periods"

  # Create the time periods database objects
  psql -d "time_periods" -1 -f "$PROJECT_DIR/services/time-periods/src/main/resources/time_periods.sql"

  # Load the time periods database data
  psql -d "time_periods" -1 -c "\copy time_period(start_time_point_id,end_time_point_id,version) from \
          '$PROJECT_DIR/data/time_periods.csv' DELIMITER ',' CSV HEADER"

fi


# time points
# -------------------------------------------------------------------------------------
if [ $TIME_POINTS -eq 1 ]; then

  echo
  echo "Setting up time points database"
  echo

  # drop the time points database if it exists
  psql -c "DROP DATABASE IF EXISTS time_points"

  # create a new time points database
  psql -c "CREATE DATABASE time_points"

  # Create the time points database objects
  psql -d "time_points" -1 -f "$PROJECT_DIR/services/time-points/src/main/resources/time_points.sql"

fi


# unit categories
# -------------------------------------------------------------------------------------
if [ $UNIT_CATEGORIES -eq 1 ]; then

  echo
  echo "Setting up unit categories database"
  echo

  # drop the unit categories database if it exists
  psql -c "DROP DATABASE IF EXISTS unit_categories"

  # create a new unit categories database
  psql -c "CREATE DATABASE unit_categories"

  # Create the unit categories database objects
  psql -d "unit_categories" -1 -f "$PROJECT_DIR/services/unit-categories/src/main/resources/unit_categories.sql"

  # Load the unit categories' database data
  psql -d "unit_categories" -1 -c "\copy unit_category(name,version) from \
          '$PROJECT_DIR/data/unit_categories.csv' DELIMITER ',' CSV HEADER"

fi


# units
# -------------------------------------------------------------------------------------
if [ $UNITS -eq 1 ]; then

  echo
  echo "Setting up units database"
  echo

  # drop the units database if it exists
  psql -c "DROP DATABASE IF EXISTS units"

  # create a new units database
  psql -c "CREATE DATABASE units"

  # Create the unit's database objects
  psql -d "units" -1 -f "$PROJECT_DIR/services/units/src/main/resources/units.sql"

  # Load the unit's database data
  psql -d "units" -1 -c "\copy unit(name, abbreviation,version) from \
          '$PROJECT_DIR/data/units.csv' DELIMITER ',' CSV HEADER"

fi



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
