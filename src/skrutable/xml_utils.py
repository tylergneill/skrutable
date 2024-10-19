from lxml import etree
from typing import List, Optional, Tuple
from collections import deque


def _strip_xml_declaration(content: str) -> Tuple[str, Optional[str]]:
    """Strips the XML declaration if present and returns the stripped content and declaration."""
    if content.startswith('<?xml'):
        declaration, content = content.split('?>', 1)
        return content.strip(), f"{declaration}?>"
    return content, None

def _restore_xml_declaration(content: str, declaration: Optional[str]) -> str:
    """Restores the XML declaration if it was stripped."""
    return f"{declaration}\n{content}" if declaration else content


def _get_starting_els(xml_string_input: str) -> Tuple[Optional[etree._Element], Optional[etree._Element]]:
    """
    Returns the root element and, if found, the <text> element.
    """
    parser = etree.XMLParser()
    root_el = etree.fromstring(xml_string_input, parser)
    text_el = root_el.find(".//tei:text", namespaces={"tei": "http://www.tei-c.org/ns/1.0"})
    return root_el, text_el


def extract_text_from_tei_xml(xml_string_input: str) -> Tuple[str, List[int]]:
    """
    Extracts .text and .tail string textual content from TEI XML (<text>).
    Returns as single newline-joined string.
    Also keeps count of lines for each text block (relevant when restoring in case of splitting).
    """
    safe_content, _ = _strip_xml_declaration(xml_string_input)

    root_el, text_el = _get_starting_els(safe_content)
    if root_el is None:
        print("Warning: Could not find root element in XML.")
        return [], []
    starting_el = text_el if text_el is not None else root_el

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


def restore_tei_xml(
        original_xml_string_input: str,
        transformed_text_str: str,
        text_line_counts: List[int],
    ) -> str:
    """
    Puts transformed .text and .tail string textual content back in place.
    """
    safe_content, encoding_declaration = _strip_xml_declaration(original_xml_string_input)

    root_el, text_el = _get_starting_els(safe_content)
    if root_el is None:
        print("Warning: Could not find root element in XML.")
        return ""
    starting_el = text_el if text_el is not None else root_el

    transformed_texts = transformed_text_str.split('\n')

    # ensure that number of lines is correct post-transformation before proceeding
    if len(transformed_texts) != sum(text_line_counts):
        raise ValueError("transformed_texts and text_line_counts count mismatch")

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

    transformed_xml_str = etree.tostring(root_el, encoding='unicode', pretty_print=False)
    final_xml_str = _restore_xml_declaration(transformed_xml_str, encoding_declaration)

    return final_xml_str