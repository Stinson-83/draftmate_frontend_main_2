import sys
import os
import shutil

# Ensure paths
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'Enhance_bot'))

from converter.converters import extract
from Enhance_bot import bot
from bs4 import BeautifulSoup

def run_debug():
    pdf_path = "Deep_research/lex_bot/data/uploads/07af9b91-b01f-49a6-b389-2cccfb20c35f.pdf"
    
    # Use absolute path to avoid ambiguity
    abs_pdf_path = os.path.abspath(pdf_path)
    output_dir = os.path.join(os.getcwd(), "debug_output")
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"\n=== STEP 1: Extract PDF to HTML ===")
    print(f"Input: {abs_pdf_path}")
    
    try:
        extract.cvt_html(abs_pdf_path, output_path=output_dir)
    except Exception as e:
        print(f"Extract failed: {e}")
        return

    base_name = os.path.splitext(os.path.basename(pdf_path))[0]
    html_file = os.path.join(output_dir, base_name + ".html")
    
    if not os.path.exists(html_file):
        print("Error: HTML file was not created.")
        return

    with open(html_file, 'r') as f:
        html_content = f.read()

    print(f"\n--- Analysis of Extract Output ---")
    print(f"Length: {len(html_content)}")
    print(f"Contains <html> tag? {'Yes' if '<html>' in html_content else 'No'}")
    print(f"Contains position:absolute? {'Yes' if 'position: absolute' in html_content else 'No'}")
    print(f"First 200 chars:\n{html_content[:200]}")
    
    if '<html>' in html_content:
        print("FAIL: extract.py is still generating full HTML doc with wrappers.")
    else:
        print("PASS: extract.py is generating a fragment (no wrappers).")

    print(f"\n=== STEP 2: Simulate Bot.py Processing ===")
    
    # Simulate what bot.py does with BeautifulSoup
    soup = BeautifulSoup(html_content, 'lxml')
    processed_html = str(soup)
    
    print(f"--- Analysis of BeautifulSoup Output (simulating bot.py) ---")
    print(f"Contains <html> tag? {'Yes' if '<html>' in processed_html else 'No'}")
    
    # Apply the fix logic I added to bot.py
    final_output = processed_html
    if "<html>" not in html_content and "<html>" in processed_html:
        print("DEBUG: Detected unwanted wrapper addition.")
        if soup.body:
             final_output = "".join([str(x) for x in soup.body.contents])
             print("DEBUG: Stripped wrappers using body contents.")
    
    print(f"\n--- Final Output Check ---")
    print(f"Contains <html> tag? {'Yes' if '<html>' in final_output else 'No'}")
    print(f"First 200 chars:\n{final_output[:200]}")
    
    if '<html>' in final_output:
         print("FAIL: Final output still has wrappers.")
    else:
         print("PASS: Final output is a clean fragment.")

if __name__ == "__main__":
    run_debug()
