"""Translation adapters for the translator service."""

from .sarvam_translate import SarvamTranslateClient, sarvam_translate, translate_block_texts, translate_blocks

__all__ = ["SarvamTranslateClient", "sarvam_translate", "translate_block_texts", "translate_blocks"]

