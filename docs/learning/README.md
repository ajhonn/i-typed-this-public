# Learning Notes Index

## 01 · Foundations
- stack-overview.md — toolkit summary (React, Vite, TypeScript, Tailwind, Vitest, Router)
- react-components.md — props/state/effects explained
- tailwind-basics.md — utility-class cheatsheet
- glossary.md — quick definition list

## 02 · Architecture
- react-router.md — stageplay analogy + our routing stack
- shell-layout.md — shared Ribbon/Page wrapper concept
- tiptap.md — overview of Tiptap/ProseMirror and why we use them

## 03 · Behavior & Data
- local-storage.md — sticky notebook metaphor and current usage
- modal-accessibility.md — dialog semantics checklist
- session-context.md — how the shared editor state feeds the future recorder
- recorder-basics.md — overview of the new event log and download bundle
- session-hashing-eli5.md — why we take a “photo” of each session and double-check it later
- clipboard-ledger.md — ELI5 view of copy tracking + paste matching
- paste-classification-playbook.md — how payload size/idle/ledger hits map to labels
- clipboard-tuning-checklist.md — hashing, TTL, and testing guidance for the ledger
- playback-dock-and-pauses.md — why the floating dock needs safe zones + how the pause toggle works
- paste-ledger-review.md — how to scan the new ledger cards and hop into playback
- ledger-integration.md — how the frontend registers hashes, embeds receipts, and verifies uploads against FastAPI

## 04 · Testing
- testing-vitest.md — Vitest + Testing Library philosophy

## 05 · Practices
- git-basics.md — branching, reset vs revert, general workflow tips
- commits-prs.md — Conventional Commits, PR hygiene
- backend-hash-ledger.md — recap of the newly added server ledger and receipt flow

Add new chapters/files as you learn; keep the numbering to stay organized.
