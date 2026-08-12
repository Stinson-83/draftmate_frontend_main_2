from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import os
import argparse
from dotenv import load_dotenv

# Import ikapi script components
from ikapi import IKApi, FileStorage

load_dotenv()

app = FastAPI(title="Case Search API", description="Wrapper for Indian Kanoon API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up dummy arguments for IKApi initialization to mimic CLI
class DummyArgs:
    def __init__(self):
        self.token = os.getenv('IKApi')
        self.maxcites = 0
        self.maxcitedby = 0
        self.orig = False
        self.maxpages = 1
        self.pathbysrc = False
        self.numworkers = 1
        self.addedtoday = False
        self.fromdate = None
        self.todate = None
        self.sortby = None
        self.csv_output = False
        self.docs_count = False

import logging
logging.basicConfig(level=logging.INFO)

@app.get("/search")
def search_cases(
    q: str = Query(..., description="The search query"),
    pagenum: int = Query(0, description="Page number for pagination"),
    maxpages: int = Query(1, description="Number of pages to retrieve")
):
    try:
        args = DummyArgs()
        args.maxpages = maxpages
        
        # We don't need real storage for direct API calls, but IKApi expects an object
        storage = FileStorage("/tmp/ikapi_dummy_storage")
        ikapi_instance = IKApi(args, storage)
        
        # IKApi internally calls urllib.parse.quote_plus on 'q' inside search()
        # but let's pass it directly
        result_json = ikapi_instance.search_with_exception(q, pagenum, maxpages)
        
        if result_json is None:
            raise HTTPException(status_code=500, detail="Failed to fetch data from Indian Kanoon API")
            
        return result_json

    except Exception as e:
        logging.error(f"Error during search: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/doc/{doc_id}")
def get_document(doc_id: int):
    try:
        args = DummyArgs()
        storage = FileStorage("/tmp/ikapi_dummy_storage")
        ikapi_instance = IKApi(args, storage)
        
        result_str = ikapi_instance.fetch_doc(doc_id)
        if not result_str:
            raise HTTPException(status_code=404, detail="Document not found")
            
        import json
        return json.loads(result_str)
    except Exception as e:
        logging.error(f"Error fetching document {doc_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def health_check():
    return {"status": "ok", "service": "Case Search"}
