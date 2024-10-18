from lxml import etree
from typing import List, Optional, Tuple
from collections import deque


def get_starting_el(xml_string_input: str) -> Tuple[Optional[etree._Element], Optional[etree._Element]]:
    parser = etree.XMLParser(ns_clean=True, remove_comments=True)
    root_el = etree.fromstring(xml_string_input, parser)

    # skip <teiHeader> and go straight to <text> element
    starting_el = root_el.find(".//tei:text", namespaces={"tei": "http://www.tei-c.org/ns/1.0"})
    return root_el, starting_el


def extract_text_from_tei_xml(xml_string_input: str) -> Tuple[str, List[int]]:
    """
    Extracts .text and .tail string textual content from TEI XML <text>.
    Also keeps count of lines for each text block (relevant when restoring in case of splitting).
    """
    _, starting_el = get_starting_el(xml_string_input)

    if starting_el is None:
        print("Warning: Could not find starting element in XML.")
        return [], []

    texts_to_transform = []
    text_line_counts = []

    for el in starting_el.iter():

        for prop in ['text', 'tail']:

            value = getattr(el, prop)

            if value is not None and (text := value.strip()) != '':
                texts_to_transform.append(text)
                text_line_counts.append(text.count('\n') + 1)

    text_str_to_transform = '\n'.join(texts_to_transform)
    return text_str_to_transform, text_line_counts


def restore_tei_xml(original_xml_string_input: str, transformed_text_str: str, text_line_counts: List[int]) -> str:
    """
    Puts transformed .text and .tail string textual content back in place.
    """
    transformed_texts = transformed_text_str.split('\n')

    # ensure that number of lines is correct post-transformation before proceeding
    if len(transformed_texts) != sum(text_line_counts):
        raise ValueError("transformed_texts and text_line_counts count mismatch")

    root_el, starting_el = get_starting_el(original_xml_string_input)

    if root_el is None or starting_el is None:
        print("Warning: Could not find root or starting element in XML.")
        return ""

    # switch to double-ended queues before consumption for more efficient pop from front
    transformed_texts_dq = deque(transformed_texts)
    text_line_counts_dq = deque(text_line_counts)

    for el in starting_el.iter():

        for prop in ['text', 'tail']:

            value = getattr(el, prop)

            if value is not None and value.strip() != '':

                # preserve leading/trailing whitespace
                leading_ws = value[:len(value) - len(value.lstrip())]
                trailing_ws = value[len(value.rstrip()):]

                # use line_counts to know how many items to use from transformed_texts
                num_items: int = text_line_counts_dq.popleft()
                transformed_text = '\n'.join(
                    transformed_texts_dq.popleft()
                    for _ in range(num_items)
                )

                new_value = leading_ws + transformed_text + trailing_ws
                setattr(el, prop, new_value)

    return etree.tostring(root_el, encoding='unicode', pretty_print=True)
