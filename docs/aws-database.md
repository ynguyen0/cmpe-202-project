# Connect to PostgreSQL on AWS

The same backend can connect to an Amazon RDS for PostgreSQL instance. RDS runs
community PostgreSQL, which fits this local Docker setup. Aurora PostgreSQL is another
option if your application later needs its scaling and availability architecture.
These instructions prepare a connection; no database has been provisioned.

## 1. Prepare the database and network

Use an RDS PostgreSQL instance with a database named `cmpe202` (or substitute your
existing database name). Choose a PostgreSQL version supported in your AWS region;
the local development image uses major version 17. Keep application environments on
the same major version where possible.

Keep the instance private. The backend needs a route into its VPC, such as running
inside that VPC or connecting your development computer through an approved VPN.
Allow inbound TCP 5432 on the database security group from the backend's security
group (or the approved VPN network). A private endpoint is not directly reachable
from an ordinary home internet connection.

Enable encryption at rest, backups, and TLS enforcement (`rds.force_ssl=1`). For
production, also plan Multi-AZ availability, deletion protection, and managed secrets.
Choose capacity and review current AWS pricing before provisioning resources.

Create a dedicated application login with access to the application database. Use a
separate migration role for schema changes in production. The demo bootstrap requires
permission to create the `notes` table; the running API needs SELECT and INSERT on
that table and usage on its identity sequence.

## 2. Download the AWS trust bundle

From the repository root:

```sh
mkdir -p server/certs
curl --fail --location https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem \
  --output server/certs/global-bundle.pem
```

## 3. Configure the backend

Update your local `server/.env` with your actual endpoint and credentials:

```dotenv
PORT=3001
DATABASE_URL=postgresql://APP_USER:URL_ENCODED_PASSWORD@YOUR_RDS_ENDPOINT:5432/cmpe202
DB_SSL=true
DB_SSL_CA=/absolute/path/to/cmpe-202/server/certs/global-bundle.pem
```

URL-encode special characters in the username/password. Do not add `sslmode`,
`sslcert`, `sslkey`, or `sslrootcert` query parameters: these can override the driver's
explicit TLS settings. The starter verifies both the certificate chain and hostname.
Use the actual RDS hostname, not an IP address. Do not disable certificate verification.
In deployment, inject environment variables through your hosting platform's secret
configuration and mount the CA bundle at `DB_SSL_CA`.

## 4. Initialize and verify

From a machine with access to the VPC:

```sh
npm run db:migrate
npm run dev
curl --fail http://localhost:3001/api/health
```

Expected health response: `{"status":"ok","database":"connected"}`.
Save a note in the UI and refresh to verify persistence. Local Docker is not needed
while the backend points to AWS. Switch `server/.env` back to its example values to
use local PostgreSQL again.

For timeouts, check VPC routing and security groups. For certificate errors, check
the CA path and endpoint hostname. For missing-table errors, run the schema bootstrap
against the intended database.

Sources: [RDS PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html),
[RDS PostgreSQL TLS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/PostgreSQL.Concepts.General.SSL.html),
[node-postgres TLS](https://node-postgres.com/features/ssl).
