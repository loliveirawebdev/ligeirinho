---
name: clarify
description: Asks the product questions before planning, one at a time, with a recommendation and options. Use at the start of a ligeirinho feature, or at any stage when a question comes up that changes the product, a rule, the contract or the experience.
---

# Clarify

Ask before planning. It prevents a lot of problems.

## Rules

1. **One question at a time.** Most important first: the one that, answered differently, changes the rest the
   most.
2. **Always with a recommendation and options.** Format:
   > **Question:** who can cancel a paid registration?
   > **I recommend:** only the organizer, with an automatic refund, because … (cite the source if it's a common
   > industry pattern).
   > **Options:** (a) only the organizer · (b) the organizer and the registrant up to X days before · (c) other
   If your agent has a structured question tool, use it, with the recommendation as the first option.
3. **No question limit.** Stop when nothing is left that changes **the product, a rule, the contract or the
   experience**.
4. **Technical details aren't questions.** Library, table name, folder structure: you decide and explain it in the
   plan.
5. **Reuse what was already decided.** Before asking, look for the answer in the area doc, the feature notes and
   the conversation. If you find it, don't ask; cite where it came from in the plan.
6. Also ask what the rules require to be decided and the request doesn't say: who can and who can't (zero trust),
   which operations are sensitive (auditing), what happens on retries (idempotency), empty and error states of the
   screens.

## Output

Keep the questions and answers for the **Clarify** section of the feature note (`docs/features/NNN-name.md`). You
can create the note right now with **Request** and **Clarify** filled in.

When done, move on to the `plan` skill and run `scripts/state.sh NNN-name plan`.
