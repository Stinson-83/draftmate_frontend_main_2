def parse_s3_uri(uri: str):
    # s3://bucket/key... → (bucket, key)
    assert uri.startswith("s3://")
    bucket, key = uri[5:].split("/", 1)
    return bucket, key
