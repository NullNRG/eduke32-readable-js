"""Clang function-type parsing for source lvalue-reference calling contracts.

This describes source calls, not a native machine ABI. Template commas and
nested function-pointer declarators must never be mistaken for parameters.
"""
import re

REFERENCE_ABI = 'source-cpp-lvalue-reference/1'


def function_type_parts(spelling):
    angle = 0
    opening = None
    for index, char in enumerate(spelling):
        if char == '<': angle += 1
        elif char == '>': angle = max(0, angle - 1)
        elif char == '(' and angle == 0:
            opening = index
            break
    if opening is None: return None
    def close(start):
        depth = 0
        for index in range(start, len(spelling)):
            if spelling[index] == '(': depth += 1
            elif spelling[index] == ')':
                depth -= 1
                if depth == 0: return index
        return None
    end = close(opening)
    if end is None: return None
    result = spelling[:opening].strip()
    # A source function pointer/reference has a separate declarator group.
    if re.fullmatch(r'[\s*&]*(?:const\s*)?', spelling[opening+1:end]):
        following = end + 1
        while following < len(spelling) and spelling[following].isspace(): following += 1
        if following == len(spelling) or spelling[following] != '(': return None
        opening = following
        end = close(opening)
        if end is None: return None
    text = spelling[opening+1:end]
    parts = []
    start = 0
    stack = []
    for index, char in enumerate(text):
        if char in '(<[': stack.append(char)
        elif char in ')>]':
            if stack: stack.pop()
        elif char == ',' and not stack:
            parts.append(text[start:index].strip())
            start = index + 1
    if text.strip(): parts.append(text[start:].strip())
    if parts == ['void']: parts = []
    return result, parts


def lvalue_referent(spelling):
    spelling = spelling.strip()
    if not spelling.endswith('&') or spelling.endswith('&&'): return None
    # Array/function references need their own declarator/storage lowering.
    base = spelling[:-1].strip()
    if any(char in base for char in '()[]'): return None
    return base


def const_referent(spelling):
    base = lvalue_referent(spelling)
    if base is None: return False
    # In `const int *&`, const qualifies the pointee, not the reference slot.
    return bool(re.search(r'\bconst\b', base.rsplit('*', 1)[-1]))
