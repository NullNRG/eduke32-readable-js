"""Conservative type-spelling queries; template arguments are not declarators."""


def has_outer_indirection(spelling,tokens='*&['):
    depth = 0
    for char in spelling:
        if char == '<':
            depth += 1
        elif char == '>':
            depth = max(0, depth - 1)
        elif depth == 0 and char in tokens:
            return True
    return False
