---
name: engineering-intake
description: Inspect an engineering change, define its scope and impact, and select applicable engineering domains and a proportional workflow profile.
---

# Intake

Input: the requested change, existing project instructions, repository structure, and available brief/requirements. Output: the run's intake artifact matching [intake.schema.json](../../schemas/intake.schema.json).

1. Identify the intended behavior, exclusions, affected users/components, deployment target, and available evidence. Inspect existing implementation and prior decisions before asking questions.
2. Assess new-service, persistent-data, identity, infrastructure, public-API, production, and retirement impact. Choose small, service, or critical using [the profile rules](../../workflow/guide.md). Do not minimize impact to pass a lighter profile.
3. Evaluate all eight domains in [the catalog](../../workflow/catalog.json). Mark each required or not applicable with a concrete reason tied to this change. Explicit user/project requirements remain required even if a profile would omit them.
4. Record scope, out-of-scope items, impact, and the profile rationale. If information needed for classification is unknown, ask the focused question and preserve the uncertainty in the requirements draft. Do not claim intake complete while its impact is guessed.
5. Record and complete intake. If subsequent discovery changes impact, update profile/intake and revisit affected downstream work.

Completion: all domains considered, impact and profile consistent, scope supported by the request. Stop dependent planning if scope or authorization is unresolved. A small UI correction should not inherit new-service infrastructure work; a small diff that changes tenant authorization still requires security analysis and negative tests.

Reference [Requirements Gathering](../../docs/01-requirements_gathering.md) when deriving scope. Use [decision rules](../../workflow/decision-rules.md) for tradeoffs and counterexamples.
