# Two-tier EC2 Docker proof of concept

This sample has a React task-board UI served by nginx and a .NET Core 3.1 Web API. It has no database: task changes exist only in the backend container's in-memory list and reset when that container is recreated.

## Prerequisites on EC2

Use an Amazon Linux 2 instance with Docker 24.x and the Docker Compose plugin installed. Confirm the installation with:

```sh
docker --version
docker compose version
```

In the EC2 security group, allow inbound TCP ports **80** and **443**. Allow TCP **5000** only from your own public IP for testing. Port 5000 is an unauthenticated, HTTP-only API endpoint and must be locked down or removed before any production-like use.

## Build and run

From this directory:

```sh
chmod +x scripts/generate-self-signed-cert.sh
./scripts/generate-self-signed-cert.sh <ec2-public-dns-or-ip>
docker compose up --build -d
```

The argument is optional (`localhost` is the default), but providing the EC2 public DNS name or IP includes it in the certificate's subject alternative name.

The certificate is self-signed, so a browser warning is expected. View the UI at:

```
https://<ec2-ip>/
```

Accept the warning to continue. The browser calls `/api/*` on that same HTTPS origin; nginx reverse-proxies those calls over the internal Docker bridge network to the backend.

For direct API testing (which bypasses nginx/TLS), use:

```sh
curl http://<ec2-ip>:5000/api/health
curl http://<ec2-ip>:5000/api/hello
curl http://<ec2-ip>:5000/api/data
```

Expected health response is JSON shaped like `{"status":"ok","timestamp":"..."}`.

The UI also demonstrates `GET`, `POST`, and `DELETE` task requests through the nginx proxy. Its **Simulate API error** button intentionally calls an endpoint that returns HTTP 500, allowing you to see client-side error handling without changing data.

## Services and ports

| Service | Container port | Host port | Purpose |
| --- | --- | --- | --- |
| frontend/nginx | 80 | 80 | Redirects HTTP to HTTPS |
| frontend/nginx | 443 | 443 | React UI and `/api/*` reverse proxy |
| backend/.NET | 5000 | 5000 | Direct, unauthenticated HTTP testing only |

## Replacing the self-signed certificate

For a simple nginx TLS deployment, replace `certs/tls.crt` and `certs/tls.key` with a real certificate and private key, keeping the same filenames, then recreate the frontend container.

For a load-balanced deployment, a typical approach is to terminate a managed ACM certificate at an Application Load Balancer and forward traffic to the instance. Alternatively, use a domain plus Let's Encrypt and mount its certificate files into nginx. In either case, do not expose the backend's port 5000 publicly.

## Stop the sample

```sh
docker compose down
```
