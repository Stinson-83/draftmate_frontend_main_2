
"""
Test script to verify real Indian Kanoon API integration.
"""

import asyncio
import sys
import os
import time
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

# Load environment variables
project_root = Path(__file__).parent.parent.parent.parent
env_path = project_root / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)

from services.indiankanoon_service import (
    IndianKanoonService,
    IndianKanoonAPIError,
    AuthenticationError,
    RateLimitError,
    NotFoundError
)


class IndianKanoonAPIVerifier:
    def __init__(self):
        self.service = IndianKanoonService()
        self.test_results = []
        self.total_requests = 0
        self.total_response_time = 0.0
        self.limitations = []

    async def run_test(self, test_name, async_func):
        """Run a single test and track results."""
        self.total_requests += 1
        start_time = time.perf_counter()
        result = {
            "name": test_name,
            "success": False,
            "execution_time_ms": 0,
            "response_size": 0,
            "error": None,
            "data": None
        }
        try:
            print(f"\n[Running test]: {test_name}")
            data = await async_func()
            result["data"] = data
            result["response_size"] = len(str(data))
            result["success"] = True
            print(f"[PASSED] {test_name} (took {result['execution_time_ms']:.2f} ms, response size: {result['response_size']} chars)")
        except Exception as e:
            result["error"] = str(e)
            print(f"[FAILED] {test_name} FAILED: {e}")
        
        end_time = time.perf_counter()
        result["execution_time_ms"] = (end_time - start_time) * 1000
        self.total_response_time += result["execution_time_ms"]
        self.test_results.append(result)
        return result

    async def verify_search_judgments(self):
        test_queries = [
            ("Section 420 IPC", "Search Section 420 IPC"),
            ("Article 21 Constitution", "Search Article 21 Constitution")
        ]
        
        all_results = []
        for query, test_name in test_queries:
            async def run_query():
                return await self.service.search_judgments(query, page=1)
            
            res = await self.run_test(test_name, run_query)
            if res["success"] and len(res["data"]) > 0:
                all_results.extend(res["data"])
        
        if len(all_results) == 0:
            self.limitations.append("Search API returned no results for test queries")
        
        return all_results

    async def verify_search_by_act(self):
        async def search():
            return await self.service.search_by_act("Indian Evidence Act")
        
        res = await self.run_test("Search By Act (Indian Evidence Act)", search)
        if res["success"] and len(res["data"]) == 0:
            self.limitations.append("Search by act returned no results for Indian Evidence Act")
        return res.get("data", [])

    async def verify_search_by_citation(self):
        async def search():
            return await self.service.search_by_citation("AIR 1973 SC 1461")
        
        res = await self.run_test("Search By Citation (AIR 1973 SC 1461)", search)
        if res["success"] and len(res["data"]) == 0:
            self.limitations.append("Search by citation returned no results for AIR 1973 SC 1461")
        return res.get("data", [])

    async def verify_document_retrieval(self, doc_id):
        async def get_doc():
            doc_text = await self.service.get_document(doc_id)
            if not doc_text:
                raise ValueError("get_document returned empty string")
            return doc_text
        
        res = await self.run_test(f"Get Document (ID: {doc_id})", get_doc)
        return res

    async def verify_metadata_retrieval(self, doc_id, known_metadata=None):
        async def get_metadata():
            if known_metadata:
                # Use known metadata we already have from search to avoid extra API call
                metadata = known_metadata
            else:
                metadata = await self.service.get_document_metadata(doc_id)
            
            if not metadata:
                raise ValueError("get_document_metadata returned None")
            
            # Verify fields
            assert metadata.title is not None, "metadata.title is missing"
            assert metadata.court is not None, "metadata.court is missing"
            assert metadata.citation is not None, "metadata.citation is missing"
            assert metadata.date is not None, "metadata.date is missing"
            assert metadata.judges is not None, "metadata.judges is missing"
            assert metadata.pdf_url is not None, "metadata.pdf_url is missing"
            assert metadata.source == "Indian Kanoon", "metadata.source is not correct"
            
            return metadata
        
        res = await self.run_test(f"Get Document Metadata (ID: {doc_id})", get_metadata)
        return res

    async def verify_error_handling(self):
        tests = []
        
        # Test invalid token
        original_token = self.service.api_token
        self.service.api_token = "invalid-token-123"
        
        async def invalid_token_test():
            await self.service.search_judgments("test")
        
        res = await self.run_test("Error Handling: Invalid Token", invalid_token_test)
        if not res["success"] and isinstance(res.get("error"), AuthenticationError):
            print("   ✅ Correctly raised AuthenticationError")
        
        self.service.api_token = original_token  # Restore token
        
        # Test invalid document ID
        async def invalid_doc_id_test():
            await self.service.get_document("invalid-doc-id-123456789")
        
        res = await self.run_test("Error Handling: Invalid Document ID", invalid_doc_id_test)
        
        return tests

    def print_report(self):
        print("\n" + "=" * 70)
        print("INDIAN KANOON API VERIFICATION REPORT")
        print("=" * 70)
        
        for test in self.test_results:
            status = "[PASSED]" if test["success"] else "[FAILED]"
            print(f"{status} {test['name']}")
        
        print("\nAverage response time: {:.2f} ms".format(
            self.total_response_time / len(self.test_results) if self.test_results else 0
        ))
        
        if self.limitations:
            print("\n[API Limitations Discovered]:")
            for limitation in self.limitations:
                print(f"  - {limitation}")

    async def run_all_tests(self):
        print("=" * 70)
        print("STARTING INDIAN KANOON API VERIFICATION")
        print("=" * 70)
        print(f"Using API Token: {'Set' if self.service.api_token else 'Not Set'}")
        print(f"Using Base URL: {self.service.base_url}")
        
        # Run search tests and get a document ID for further testing
        search_results = await self.verify_search_judgments()
        await self.verify_search_by_act()
        await self.verify_search_by_citation()
        
        doc_id = None
        known_metadata = None
        if search_results and len(search_results) > 0:
            # Try to pick a judgment document (skip the first one if it's an act)
            for result in search_results:
                if result.court != "11":  # "11" seems to be the code for acts/statutes
                    doc_id = result.id
                    known_metadata = result
                    break
            
            if not doc_id:  # If all are acts, just pick first one
                doc_id = search_results[0].id
                known_metadata = search_results[0]
            
            print(f"\n[INFO] Using document ID {doc_id} for further tests")
            await self.verify_document_retrieval(doc_id)
            await self.verify_metadata_retrieval(doc_id, known_metadata)
        else:
            print("\n[WARNING] No search results, skipping document/metadata tests")
        
        await self.verify_error_handling()
        
        self.print_report()


async def main():
    verifier = IndianKanoonAPIVerifier()
    await verifier.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())
