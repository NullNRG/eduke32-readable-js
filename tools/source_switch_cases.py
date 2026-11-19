"""Recover guarded C case entries as ordinary, source-level JS switch arms."""
import copy


def recover_guarded_cases(function):
    recoveries = []

    def children(node):
        return node.get('inner', [])

    def walk(node):
        yield node
        for child in children(node):
            yield from walk(child)

    def marker(node):
        if node.get('kind') == 'NullStmt':
            return True
        return (node.get('kind') == 'AttributedStmt'
                and all(child.get('kind') in ('FallThroughAttr', 'NullStmt') for child in children(node))
                and any(child.get('kind') == 'NullStmt' for child in children(node)))

    def visit(node):
        if node.get('kind') == 'LambdaExpr':
            return node
        parts = [visit(child) for child in children(node)]
        if any(new is not old for new, old in zip(parts, children(node))):
            node = {**node, 'inner': parts}
        if node.get('kind') != 'SwitchStmt' or not parts or parts[-1].get('kind') != 'CompoundStmt':
            return node
        statements = children(parts[-1])
        rewritten = []
        position = 0
        while position < len(statements):
            case = statements[position]
            case_parts = children(case)
            guard = case_parts[-1] if case_parts else {}
            guard_parts = children(guard)
            branch = guard_parts[-1] if guard_parts else {}
            branch_parts = children(branch)
            target = branch_parts[-1] if branch_parts else {}
            following = position + 1
            while following < len(statements) and statements[following].get('kind') not in ('CaseStmt', 'DefaultStmt'):
                following += 1
            suffix = statements[position + 1:following]
            # Only duplicate a terminating, declaration-free suffix. A live
            # local, side-entry label, loop exit or another guarded dispatch
            # needs its own lifetime/control-flow proof.
            valid_suffix = (bool(suffix) and suffix[-1].get('kind') in ('BreakStmt', 'ContinueStmt', 'ReturnStmt')
                            and not any(part.get('kind') in ('VarDecl', 'LabelStmt', 'CaseStmt', 'DefaultStmt',
                                                            'GotoStmt', 'LambdaExpr', 'SwitchStmt')
                                        for statement in suffix for part in walk(statement)))
            valid = (case.get('kind') == 'CaseStmt' and len(case_parts) == 2
                     and guard.get('kind') == 'IfStmt' and len(guard_parts) == 2
                     and not guard.get('hasElse') and not guard.get('hasInit') and not guard.get('hasVar')
                     and branch.get('kind') == 'CompoundStmt' and bool(branch_parts)
                     and target.get('kind') == 'CaseStmt' and len(children(target)) == 2
                     and all(marker(part) for part in branch_parts[:-1]) and valid_suffix
                     and not any(part.get('kind') in ('VarDecl', 'LabelStmt', 'CaseStmt', 'DefaultStmt',
                                                      'GotoStmt', 'LambdaExpr')
                                 for part in walk(children(target)[-1])))
            if not valid:
                rewritten.append(case)
                position += 1
                continue
            # Entry through the enclosing case still evaluates the original
            # guard once. Entry through its nested case bypasses that guard,
            # then executes the same original body and terminating suffix.
            clean_branch = {**branch, 'inner': [children(target)[-1]]}
            clean_guard = {**guard, 'inner': [guard_parts[0], clean_branch]}
            rewritten.extend([{**case, 'inner': [case_parts[0], clean_guard]}, *suffix,
                              copy.deepcopy(target), *copy.deepcopy(suffix)])
            recoveries.append({'abi': 'source-guarded-switch-case/1',
                               'enclosing_case': case.get('id'), 'nested_case': target.get('id'),
                               'guard_evaluated_only_at_original_entry': True})
            position = following
        if not recoveries or rewritten == statements:
            return node
        return {**node, 'inner': [*parts[:-1], {**parts[-1], 'inner': rewritten}]}

    return visit(function), recoveries
