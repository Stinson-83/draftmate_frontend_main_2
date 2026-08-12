from difflib import SequenceMatcher

def score_match(row, user_query):
    score_title = SequenceMatcher(None, row["canonical_title"], user_query.lower()).ratio()
    score_snippet = SequenceMatcher(None, row["snippet"].lower(), user_query.lower()).ratio()
    return (score_title + score_snippet) / 2
