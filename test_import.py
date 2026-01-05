import uvicorn
print(f"Uvicorn version: {uvicorn.__version__}")
try:
    from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
    print("Import successful")
except ImportError as e:
    print(f"Import failed: {e}")
