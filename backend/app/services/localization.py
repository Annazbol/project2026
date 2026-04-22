import os
from functools import lru_cache
from typing import Any

import yaml


current_dir = os.path.dirname(__file__)
parent_dir = os.path.dirname(current_dir)
LOCALES_DIR = os.path.join(parent_dir, "locales")
DEFAULT_LANG = "ru"


@lru_cache(maxsize=8)
def _load(lang: str) -> dict:
    path = os.path.join(LOCALES_DIR, f"{lang}.yaml")
    if not os.path.exists(path):
        path = os.path.join(LOCALES_DIR, f"{DEFAULT_LANG}.yaml")
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f)


def _get(data: dict, key_path: str) -> Any:
    """Получить значение по пути вида 'section.key'."""
    parts = key_path.split(".")
    node = data
    for part in parts:
        if not isinstance(node, dict) or part not in node:
            return key_path  
        node = node[part]
    return node


def t(key: str, lang: str = DEFAULT_LANG, **kwargs) -> str:
    
    data = _load(lang)
    value = _get(data, key)
    if kwargs:
        try:
            value = value.format(**kwargs)
        except (KeyError, AttributeError):
            pass
    print(f"DEBUG: Путь к локалям: {LOCALES_DIR}")
    return str(value)
