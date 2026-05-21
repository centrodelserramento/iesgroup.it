# Repository Guidelines

## Project Structure & Module Organization
Core Django settings and ASGI/WSGI entry points live in `core/`. REST-facing serializers and views reside in `api/`, while domain logic, forms, and HTML templates live under `home/`. Shared layout templates are collected in `templates/`, static assets in `static/`, and compiled copies in `staticfiles/`. SQLite databases for local runs sit at the repository root; archive long-lived snapshots into `database_backups/`. Cross-app tests live in `tests/`, with app-specific suites in `home/tests/` and reusable factories in `tests/factories.py`.

## Build, Test, and Development Commands
Install dependencies with `uv sync --dev`, which reads `pyproject.toml` and `uv.lock`.

Use `uv` for all Python/Django/pytest commands (or the `make` targets that wrap `uv`). Prefer `uv run ...` over invoking `python`, `django-admin`, or `pytest` directly, and avoid `pip` in favor of `uv` to keep the environment consistent with `uv.lock`.

The Makefile already shells through `uv`, so rely on the provided shortcuts:
- `make migrate` applies schema changes.
- `make run` starts the development server on port 8000.
- `make collectstatic` prepares assets for deployment.
- `make dump` exports data.
- `make reset` rebuilds migrations and local SQLite DB.
- `make pull` updates production service.

Use `docker-compose up --build` if you need a containerized environment.

## Production Deployments
Default rule: touch production only when explicitly requested.

Hard rule: never deploy code to production if the related branch or PR has not been merged into `main` yet.
- A branch that is only open as a PR is not deployable.
- A branch that exists only on GitHub or only on the server is not deployable.
- If code is found on production before merge, stop and fix the GitHub state first by merging or explicitly closing/replacing the PR as directed.

Production server:
- Host: `ssh shitaly`
- App path: `~/cds_planner`
- Typical deploy command: `make pull` (includes restart via systemd)

Important DB env rule:
- `gunicorn.service` loads environment from `~/cds_planner/env_gunicon`.
- For production migrations, always load `env_gunicon` before `python manage.py migrate`.
- Do not run production migrations with `env.sh` alone, because it may target local SQLite instead of production Postgres.

If migrations are needed and `uv` is unavailable on server, use:
`cd ~/cds_planner && set -a && . env_gunicon && set +a && . .venv/bin/activate && python manage.py migrate`

Quick production verification after deploy:
- Confirm app revision: `cd ~/cds_planner && git rev-parse HEAD`
- Confirm DB target from Django settings is Postgres before migrate:
  `cd ~/cds_planner && set -a && . env_gunicon && set +a && . .venv/bin/activate && python manage.py shell -c "from django.conf import settings; print(settings.DATABASES['default'])"`
- Smoke check public and internal pages:
  - `/ies/contatto/` must return `200`
  - `/contatti-esterni/` must return `200` after login with `codex_test`

Special rule for `check issues`:
- Deployment is always required.
- Deploy only once, at the end of the full issue batch.
- Do not deploy while any issue is still only in branch/PR-review state.
- Finish the full issue batch first: create all PRs, monitor them to merge, then run one final local test pass and one final deployment.

## Coding Style & Naming Conventions
Target Python 3.11 with 4-space indentation and judicious type hints (see `api/views.py`). Follow Django conventions: Model/Form classes in PascalCase, modules/helpers in snake_case, and template IDs/data attributes in kebab-case. Group imports by standard library, third-party, then local modules. Aim for `black`-compatible formatting (88-character lines) and keep logging/translation patterns consistent with existing code.

## Testing Guidelines
`pytest` with `pytest-django` is configured via `pytest.ini`, discovering files named `tests.py`, `test_*.py`, and `*_tests.py`. Prefer behavior-driven module names (`test_posa_calendar_sync.py`) and descriptive test functions. Run full suite with `make test`; during development, target files directly when needed.

### Running tests locally (quick reference)
- Ensure dependencies are present: `uv sync --dev && uv sync --extra dev`.
- Export dummy AWS values in tests when needed: `AWS_ACCESS_KEY_ID=dummy AWS_SECRET_ACCESS_KEY=dummy`.
- Install browser once per machine: `uv run playwright install chromium`.
- For browser fixtures vs DB sync limits: `DJANGO_ALLOW_ASYNC_UNSAFE=true`.
- Example full run:
  `AWS_ACCESS_KEY_ID=dummy AWS_SECRET_ACCESS_KEY=dummy DJANGO_ALLOW_ASYNC_UNSAFE=true uv run pytest -q`.
- `make test` already sources `env.sh`, so use it when real creds are available.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commit prefixes (`feat:`, `fix:`, `chore:`) with imperative summaries. Keep commits scoped, including required migrations/fixtures/static artifacts. PRs should link issues, summarize user impact, and include validation evidence.

Use authenticated `gh` CLI for GitHub operations.

Default completion rule:
- When the user asks for implementation and the related work is complete locally, do not stop at code changes or test results.
- Continue through the full publish flow: commit, push, and open or update the related PR unless the user explicitly says not to.
- If you are blocked from opening the PR, report the blocker only after completing every prior step that is still possible.
- Never stop at PR creation alone when the task is expected to go end-to-end.
- After creating or updating the PR, keep monitoring its GitHub status roughly every 5 minutes until it reaches a terminal state, the user redirects the work, or you hit a real blocker.
- If checks fail, fix the branch, push again, and continue the monitoring loop.
- If the PR is merged into `main` and the user has explicitly requested deployment for that work, continue through deployment and post-deploy verification instead of stopping at merge.
- Never deploy just because the PR is green; deployment still requires explicit user request and the PR must already be merged into `main`.

Before starting any coding work, always sync with the latest `main` from GitHub.
- Required sequence:
  - `git fetch origin main`
  - confirm whether your branch is based on current `origin/main`
  - if not, rebase or branch from current `origin/main` before making code changes
- Do not start implementation, open a PR, or run final validation on a branch that is behind `origin/main`.

## Issue References
When the user references `issues`, assume GitHub issues for this repository. Use `gh` CLI unless explicitly told otherwise.

## GitHub Communication Language
All text written on GitHub issues and pull requests must be in Italian and non-technical, including descriptions and comments.

## Post-Deploy Communication Evidence
When a task includes production deployment or production verification, any follow-up written to GitHub issues and any related email replies must mention the specific production checks that passed.

Do not write only generic statements such as "verificato in produzione" or "funziona". Include concrete checks, for example:
- The exact production pages or URLs tested.
- The account used for logged-in checks, when relevant.
- The expected result observed, such as `200`, the row appearing in `firmati`, the row no longer appearing in `da firmare`, or a specific missing-record result.
- Any remaining blocker discovered in production, such as a missing signed document or a URL returning `404`.

For email-originated issues, reply in the original email thread to the original sender with the same concrete production checks included in the GitHub issue comment. Never send a new standalone email when answering an existing email thread unless the user explicitly asks for a new email. If Marco needs to clarify or recover missing information, send him the relevant GitHub links and clearly state what needs clarification.

After every production deployment, use `gog` to send a deployment report to `andrea.zonca@gmail.com`. Include the deployed revision, the production pages or URLs tested, the account used for logged-in checks when relevant, and the concrete results observed.

## URL Verification Rule
Test every URL before giving it to the user. If you have not tested it, say it is unverified and do not present it as ready.

## Time Tracking Spreadsheet
At the end of any completed job, ask the user whether they want to add time for the work to the time-tracking spreadsheet.

Spreadsheet:
- ID: `156E73vK8vkGKacCuOhwNvs9wmiJsaMX9lKq57_PjdEk`
- URL: `https://docs.google.com/spreadsheets/d/156E73vK8vkGKacCuOhwNvs9wmiJsaMX9lKq57_PjdEk/edit`
- Title: `centro del serramento`
- Tab: `current`

Use `gog` with the first configured Google account:
`gog --account andrea.zonca@gmail.com ...`

To inspect the sheet:
```sh
gog --account andrea.zonca@gmail.com sheets metadata 156E73vK8vkGKacCuOhwNvs9wmiJsaMX9lKq57_PjdEk --json
gog --account andrea.zonca@gmail.com sheets get 156E73vK8vkGKacCuOhwNvs9wmiJsaMX9lKq57_PjdEk current!A:F --json
```

The `current` tab uses these columns:
- `A`: date (`quando`)
- `B`: work description (`cosa`)
- `C`: fixed amount (`fisso`)
- `D`: hours (`ore`)
- `E`: planner minutes (`minuti planner`)
- `F`: planner hours (`Ore planner`)

When the user confirms adding time, append one row to `current!A:F`.
Use today's Italian-formatted date, a short work description, and put the time in either column `E` for minutes or column `F` for planner hours. Leave unused cells empty.

Example for a 15-minute issue fix:
```sh
gog --account andrea.zonca@gmail.com sheets append \
  156E73vK8vkGKacCuOhwNvs9wmiJsaMX9lKq57_PjdEk \
  current!A:F \
  --input USER_ENTERED \
  --insert INSERT_ROWS \
  --values-json '[[\"venerdì, aprile 24, 2026\",\"issue 356 correzione View DDT\",\"\",\"\",\"15\",\"\"]]' \
  --json
```

After appending, verify the write with a narrow read around the updated row, for example:
```sh
gog --account andrea.zonca@gmail.com sheets get 156E73vK8vkGKacCuOhwNvs9wmiJsaMX9lKq57_PjdEk current!A80:F90 --json
```

## External Contact Intake Workflow
There is a public intake flow for external companies. Treat it as a lightweight contact-collection workflow, not as a material request or immediate order-creation workflow.

The public form is centered on describing the intervention needed. It should not collect material rows.

Public-form expectations:
- Contact company is optional.
- Contact phone is optional.
- Do not collect customer VAT number.
- Do not collect customer legal/company name.
- Do not collect customer tax code.
- Do not collect ZIP code for either the customer address or the site address.
- Do not collect country for either the customer address or the site address.
- Support photo uploads.

External companies are first-class records. Each one should have:
- A name.
- A notification email.
- A color.
- A branded header.
- A dedicated public entry link.

Known expected companies include IES and Centro del Serramento.

Submitted entries should become internal contacts to manage, not immediate orders.

The internal workflow uses only two active working categories:
- `da gestire`
- `in gestione`

Internal users should be able to:
- Add notes.
- Mark a contact as handled.
- Convert a contact into a rilievo.

When converting a contact into a rilievo:
- Preserve the context already collected.
- Ask only for the missing information.
- Link the created rilievo back to the original contact.
- Mark the original contact as handled.

When working on this area, treat this workflow as the default product truth unless the user explicitly overrides it.

## Mandatory Issue Workflow (`check issues`)
Whenever the user asks to `check issues`, follow this flow.

### Core ordering and batching rules
- List all open issues and sort by oldest first.
- Start from oldest issue.
- Do not stop after a partial subset of issues.
- Continue until the entire current open-issue queue has been handled: each issue must end as merged or explicitly blocked/skipped with evidence.
- Work on exactly one issue at a time until its PR is created and set to auto-merge.
- After one issue reaches PR + auto-merge state, move immediately to the next oldest open issue.
- Do not wait for checks to finish before starting the next issue, unless the current issue is blocked before PR creation.
- Once all open issues in the queue have PRs open, switch into PR monitoring mode across the whole batch.
- In PR monitoring mode, watch every open issue PR, fix any failing checks, and continue until every PR is either merged or explicitly blocked.
- If an issue is blocked, mark it blocked with reason/evidence and skip to next issue.

### Single-agent execution

The assistant handling `check issues` must do the entire workflow directly.

Hard rule: do not use subagents, workers, delegated agents, parallel issue owners, or any other spawned assistant process for `check issues`.

The single assistant is responsible for:
- Build and maintain the oldest-first queue.
- Process issues sequentially, one at a time, until every open issue in the queue has its own PR opened or is marked blocked/skipped.
- Assign one dedicated worktree + branch to each issue while it is being worked.
- Reproduce and fix each issue directly in that issue's worktree.
- Add dedicated tests, and Playwright E2E coverage plus before/after screenshots when the issue is UI-related.
- Run targeted tests and iterate to green.
- Open or update the dedicated PR for the issue.
- Track live checklist status and evidence links.
- Ensure every issue has its own PR.
- Enable auto-merge on each PR immediately after the PR is ready.
- After all issue PRs exist, monitor all of them as a batch.
- Trigger fixes/re-push when PR checks fail.
- Ensure every PR is merged by green checks plus auto-merge, or mark it blocked with evidence.
- Post-merge, ensure issue comment is sent in non-technical Italian.
- Never stop the workflow while open issues from the queue remain unhandled.
- After all queue issue PRs are merged, run one complete final local test pass.
- Perform one final production deploy after all targeted issues are merged.
- Verify in production after final deploy using Playwright with the shared test account (`codex_test`).
- Return a final report listing all handled issues and their production verification outcome.

### Worktree policy
Use one worktree per issue to isolate changes while that issue is being implemented.

1. Create branch + worktree from main repo:
   ```sh
   git worktree add ../cds_planner-issue-<number> -b fix/issue-<number>
   ```
2. Run the assigned issue work only inside that worktree path.
3. Keep all commits for that issue in that branch.
4. Keep the worktree available until the PR is merged or the issue is explicitly abandoned.
5. After merge/closure:
   ```sh
   git worktree remove ../cds_planner-issue-<number>
   git branch -d fix/issue-<number>
   ```

## Required Checklists
Maintain live checklists in status updates. Never mark complete without evidence.

### Per-issue checklist (run for every issue)
- [ ] List all open issues and sort by oldest first.
- [ ] Select the current oldest issue and read full details. (Looking into an issue means reading all the comments.)
- [ ] Reproduce the issue locally.
- [ ] Implement the fix.
- [ ] Add a dedicated test file for this issue's fix.
- [ ] If UI-related: add/update a Playwright end-to-end test. If not UI-related, mark `N/A` with reason.
- [ ] If UI-related: capture before screenshots. If not UI-related, mark `N/A` with reason.
- [ ] Run targeted tests for this feature and iterate until green.
- [ ] If UI-related: capture after screenshots. If not UI-related, mark `N/A` with reason.
- [ ] Visually review screenshots for correctness and privacy safety. If not UI-related, mark `N/A` with reason.
- [ ] Upload screenshots to litterbox (`time=72h` by default) and collect direct URLs. If not UI-related, mark `N/A` with reason.
- [ ] Open a dedicated PR for this issue.
- [ ] Set the PR to auto-merge.
- [ ] Hand off the issue in `PR ready` state, or mark it blocked with evidence.
- [ ] Move to the next oldest open issue.

### PR monitoring checklist (batch phase, after all issue PRs are open)
- [ ] Confirm every open issue from the queue is either in `PR ready` state or explicitly blocked/skipped.
- [ ] Monitor all open issue PRs as a batch.
- [ ] If any PR check fails: fix, push, and restore auto-merge if needed.
- [ ] Continue monitoring until every queue PR is merged or explicitly blocked.
- [ ] Comment on each merged GitHub issue in non-technical Italian, include screenshots when useful, and confirm the fix is merged and queued for deployment.

### Final batch checklist (coordinator only, once at the end)
- [ ] Confirm all issues from the original open queue are merged (or explicitly marked blocked/skipped).
- [ ] Run full test suite on the integration branch/state.
- [ ] Deploy to production once.
- [ ] Verify fixes in production with Playwright using `codex_test` credentials.
- [ ] Return the final checklist/report with the full issue list and production verification status for each issue.
- [ ] Post/update GitHub issue comments if needed to explicitly confirm production deployment.

## Checklist Rules and Evidence
- Never skip checklist items unless the user explicitly instructs you to do so.
- If a step is blocked, record it immediately with reason and evidence, then skip to next issue.
- Each issue must have its own PR (no shared PR across multiple issues).
- Every issue PR should be put into auto-merge as soon as it is ready.
- Do not manually merge or allow merge of PRs with failing GitHub checks.
- Never deploy a branch before its PR is merged into `main`.
- Do not deploy per issue; deploy once at the end of the whole batch.
- Run the final complete local test pass only after all queue PRs are merged.
- Never stop the `check issues` workflow early just because several issues are already in progress; finish the full open queue first.

For each issue:
- Always add a dedicated test file for the fix.
- Prefer a new test file to keep tests organized.
- UI issue => add Playwright E2E test.
- Run targeted tests after each iteration.
- UI issue => before/after screenshots.
- A UI issue is not `PR ready` until screenshots are captured, reviewed, privacy-checked, and uploaded.
- Ensure screenshots contain no personal data.
- Visually inspect screenshots before sharing.

Screenshot sharing for GitHub issue comments:
- Use `litterbox.catbox.moe` (not GitHub attachments).
- Use direct `https://litter.catbox.moe/...` URLs with Markdown `![](...)`.
- Default expiry: `time=72h`.

Local screenshot viewing (if requested):
```sh
nohup setsid feh --zoom 50 /tmp/page1.png /tmp/page2.png >/tmp/feh.log 2>&1 < /dev/null & disown
```

Upload example:
```sh
IMG_URL=$(curl -sS https://litterbox.catbox.moe/resources/internals/api.php \
  -F 'reqtype=fileupload' \
  -F 'time=72h' \
  -F 'fileNameLength=16' \
  -F 'fileToUpload=@/tmp/test.png')
echo "$IMG_URL"
```

## Environment & Secrets
Copy `env.sample` to `.env` for local work and keep real secrets out of version control. Store service-account credentials outside repo and reference them via environment variables consumed by `core.settings`. `uv` caches wheels under `uv_cache/`; keep it but do not edit manually. When rotating credentials or changing S3 buckets, update deployment scripts (`deploy/`, `render.yaml`, `run.sh`) along with env keys.

## Test Accounts (local/dev + prod)
- Base account (Managers): `codex_test` / `cAnRBUVQ@p7_NaKasnmj`
- CapoPosatori: `codex_test_capoposatori` / `Y9!mQ2#rT7@kL4$uN8`
- Contabili: `codex_test_contabili` / `V4@pN9!sD2#xH7$kR6`
- Managers: `codex_test_managers` / `T8#zL3@qW6!mP1$rF9`
- Posatori: `codex_test_posatori` / `R5$hK1!vC8@nJ3#xM7`
- Rilievi: `codex_test_rilievi` / `P2!wD7#bG4@tQ9$yL6`
- DDTManager: `codex_test_ddtmanager` / `N6!pR2#kT9@wL5$vQ3`

## Known Contacts
- Marco Colombo: `marco.colombo@centrodelserramento.com`

## Email Sending
- When the user asks to send an email from the local machine, prefer `gog` over other mail tools.
- For direct email sends with attachments, use the local CLI form instead of connector fallbacks when possible.
- When replying to an email, always reply in the existing email thread. Preserve the original thread context and recipients unless the user explicitly asks for a new separate email or changed recipients.

Quick snippet:
```sh
gog send --no-input -y \
  --from andrea.zonca@gmail.com \
  --to marco.colombo@centrodelserramento.com \
  --subject 'Oggetto' \
  --body-file - \
  --attach /tmp/allegato.png <<'EOF'
Ciao Marco,

testo del messaggio.

A presto,
Andrea
EOF
```
