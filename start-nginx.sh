#!/bin/sh
rm -f /var/run/nginx.pid

# Check if onlyoffice-server resolves in DNS
if ! getent hosts onlyoffice-server > /dev/null 2>&1; then
    echo "WARNING: onlyoffice-server host not found in DNS. Redirecting to localhost."
    sed -i 's/onlyoffice-server/127.0.0.1/g' /etc/nginx/nginx.conf
else
    echo "OK: onlyoffice-server host resolved successfully."
fi

echo "Starting Nginx web server immediately..."
exec /usr/sbin/nginx -g "daemon off;"
