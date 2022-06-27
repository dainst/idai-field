#!/usr/bin/env bash

docker exec field-hub-client-integration-test /app/bin/field_hub eval 'FieldHub.CLI.setup_couchdb_single_node()'
docker exec field-hub-client-integration-test /app/bin/field_hub eval 'FieldHub.CLI.create_project_with_default_user("test_tmp_project", "pw")'