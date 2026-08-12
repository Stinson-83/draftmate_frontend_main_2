from bs4 import BeautifulSoup as bs
import time

def extract_metadata_from_html(html_content : str, md: dict) -> dict:
    """Extract metadata such as title and headings from HTML content.

    Args:
        html_content (str): The HTML content as a string.

    Returns:
        dict: A dictionary containing extracted metadata.
    """

    # data_dict = {
    #                         "title": section_title,
    #                         "source_url": link,
    #                         "download_url": doc_url,
    #                         "original_filename": doc_name,
    #                         "file_extension": doc_ext,
    #                         "file_size_kb": doc_size,
    #                         "language": "en",
    #                         "scrape_timestamp": "2025-10-26T14:40:00Z", # You can update this
    #                         "snippet": "",
    #                         "tags": ["template", "form", section_title]
    #                     }
    
    snippet_soup = bs(html_content, 'html.parser')
    spans = snippet_soup.find_all("span", class_="content-element text-span")
    if spans:
        all_text = " ".join([span.text.strip() for span in spans])
        snippet_length = int(len(all_text) * 0.4)
        text = all_text[:snippet_length]
        if len(all_text) > snippet_length:
            text += "..." 

    section_title="----TBD----"
    data_dict = {
                    "title": section_title,
                    "source_url": "Use-end",
                    "download_url": "User-end",
                    "original_filename": md["File-Name"],
                    "file_extension": md["File-Ext"],
                    "file_size_kb": md["File-Size"],
                    "language": "en",
                    "scrape_timestamp": md["Upload-Time"], # You can update this
                    "snippet": text.strip(),
                    "tags": ["template", "form", section_title]
                }
    
    return data_dict
