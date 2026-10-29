"""Conservative type-spelling queries; template arguments are not declarators."""


def has_outer_indirection(spelling):
    depth = 0
    for char in spelling:
        if char == '<':
            depth += 1
        elif char == '>':
            depth = max(0, depth - 1)
        elif depth == 0 and char in '*&[':
            return True
    return False
