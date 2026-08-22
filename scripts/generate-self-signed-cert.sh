#!/usr/bin/env sh
set -eu

# Creates a development certificate for nginx. Pass the EC2 public DNS name or
# IP as the first argument to include it as a subject alternative name.
# Replace certs/tls.crt and certs/tls.key with real certificate files when
# terminating TLS in nginx.
CERT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/../certs" && pwd)"
CERT_NAME="${1:-localhost}"
mkdir -p "$CERT_DIR"

CERT_CONFIG="$(mktemp)"
trap 'rm -f "$CERT_CONFIG"' EXIT
case "$CERT_NAME" in
  *[!0-9.]*) SAN_ENTRY="DNS.1 = $CERT_NAME" ;;
  *) SAN_ENTRY="IP.1 = $CERT_NAME" ;;
esac

cat > "$CERT_CONFIG" <<EOF
[req]
distinguished_name = subject
x509_extensions = extensions
prompt = no
[subject]
CN = $CERT_NAME
[extensions]
subjectAltName = @alt_names
[alt_names]
$SAN_ENTRY
EOF

openssl req -x509 -nodes -newkey rsa:2048 -sha256 -days 365 \
  -keyout "$CERT_DIR/tls.key" \
  -out "$CERT_DIR/tls.crt" \
  -config "$CERT_CONFIG"

echo "Created $CERT_DIR/tls.crt and $CERT_DIR/tls.key"
