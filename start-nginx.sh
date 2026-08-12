#!/bin/sh
# Check if onlyoffice-server resolves in DNS
if ! getent hosts onlyoffice-server > /dev/null; then
    echo "⚠️ onlyoffice-server host not found in DNS (likely running on ECS Fargate). Redirecting onlyoffice proxy to localhost (127.0.0.1)."
    sed -i 's/onlyoffice-server/127.0.0.1/g' /etc/nginx/nginx.conf
else
    echo "✅ onlyoffice-server host resolved successfully."
fi
exec /usr/sbin/nginx -g "daemon off;"
