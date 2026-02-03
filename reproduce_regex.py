
import re

html_content = """
<p>Here is some text with a broken placeholder.</p>
<span class="variable">[Start of placeholder</span>
<p>Some intervening HTML content <span style="color: red">inside</span>.</p>
<span class="variable">End of placeholder]</span>
<p>Another valid placeholder [VALID_ONE]</p>
"""

dangerous_regex = r"\[([^\]]+)\]"
safe_regex = r"\[([^\]<>]+)\]"

print("Testing Dangerous Regex:")
matches = re.findall(dangerous_regex, html_content)
for match in matches:
    print(f"Found match: '{match}'")

print("\nTesting Safe Regex:")
matches = re.findall(safe_regex, html_content)
for match in matches:
    print(f"Found match: '{match}'")
