# API collection

One request per route, generated from the OpenAPI contract (`ligeirinho-bruno scaffold`) and kept in sync by the gate
(`ligeirinho-bruno drift`). `make bruno-env` seeds the dev database and writes `environments/local.bru` with the base
URL and test tokens; that file is ignored by git. Journeys that chain requests go in `flows/`.
