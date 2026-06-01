"""Translation adapters for the translator service."""

from .google_translate import GoogleTranslateClient, translate_block_texts, translate_blocks

__all__ = ["GoogleTranslateClient", "translate_block_texts", "translate_blocks"]

