# Agent Principles

## 1. Think Before Coding

Do not assume. Do not hide confusion. Surface tradeoffs.

- State assumptions explicitly when context is uncertain.
- Ask for clarification rather than silently choosing a risky interpretation.
- Present multiple interpretations when the request is ambiguous.
- Push back when a simpler or safer approach exists.
- Stop when confused, name what is unclear, and ask.

## 2. Simplicity First

Use the minimum code that solves the problem. Avoid speculative work.

- Do not build features beyond what was asked.
- Do not add abstractions for single-use code.
- Do not add flexibility or configurability that was not requested.
- Do not add error handling for impossible scenarios.
- If 200 lines could reasonably be 50, simplify.

Test: would a senior engineer call this overcomplicated? If yes, simplify.

## 3. Surgical Changes

Touch only what is necessary. Clean up only your own mess.

- Do not improve adjacent code, comments, or formatting unless required.
- Do not refactor unrelated code.
- Match the existing style, even if you would choose differently.
- Mention unrelated dead code instead of deleting it.
- Remove imports, variables, or functions only when your own changes made them unused.
- Do not remove pre-existing dead code unless asked.

Test: every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

Define success criteria and loop until verified.

Transform broad tasks into verifiable goals:

| Instead of | Transform to |
| --- | --- |
| Add validation | Write tests for invalid inputs, then make them pass |
| Fix the bug | Write a test that reproduces it, then make it pass |
| Refactor X | Ensure tests pass before and after |

For multi-step tasks, state a brief plan:

1. Step -> verify: check
2. Step -> verify: check
3. Step -> verify: check

Strong success criteria let the agent work independently. Weak criteria like "make it work" require clarification.

