# CloudWall Automation

End-to-end test suite for the CloudWall staffing platform, built with [Playwright](https://playwright.dev/) and JavaScript.

Covers order management, talent gather workflows, and login flows against CloudWall's multi-iframe legacy UI.

---

## Prerequisites

- **Node.js** 18 or later
- **SSH key** (`~/.ssh/id_ed25519`) authorized for the CloudWall database jump host — required by tests that create orders or talent via stored procedures
- **VPN access** to the CloudWall test environment (the `cw-pwright.aquent.io` host must be reachable)
- **Mailinator API token** — used by gather email verification tests

---

## Setup

### 1. Clone the repository

```bash
git clone <repo-url> CloudwallAutomation
cd CloudwallAutomation
```

### 2. Install dependencies

```bash
npm install
```

### 3. Install Playwright browsers

```bash
npx playwright install
```

This downloads Chromium, Firefox, and WebKit. If you only need Chrome:

```bash
npx playwright install chromium
```

### 4. Configure credentials

Copy the example file and fill in your real passwords and API tokens:

```bash
cp configs/test_data.example.json configs/test_data.json
```

Open `configs/test_data.json` and replace every `${...}` placeholder with the actual value. At minimum you need:

| Key | Purpose |
|---|---|
| `agent_pwd` | CloudWall agent account password |
| `mailinator_api_token` | API token for gather email verification |
| `imap_hostname` / `imap_password` | IMAP server for legacy email verification |
| `contact_password` | Contact portal account password |

> **Important:** `configs/test_data.json` contains real credentials. After filling it in, run `git update-index --assume-unchanged configs/test_data.json` so git ignores your local edits. Only `test_data.example.json` (with placeholders) should be committed with real changes.

The test suite loads `test_data.json` credentials into `process.env` automatically via `utils/spec_helper.js` — all keys are uppercased (e.g. `agent_pwd` becomes `process.env.AGENT_PWD`).

### 5. Verify database connectivity (optional)

Tests that create orders via the DB need an SSH tunnel to the PostgreSQL database. The tunnel is managed automatically by `utils/db_util.js`, but you can verify your SSH key works:

```bash
ssh -i ~/.ssh/id_ed25519 pwright-user@<ssh-host> -N -L 5432:cw-pwright-db.corp.aquent.io:5432
```

If this connects without errors, the test suite will be able to tunnel automatically.

---

## Running Tests

### Run all tests

```bash
npx playwright test
```

### Run a specific spec file

```bash
npx playwright test tests/cloudwall/order/order_custom_gather_01.spec.js
```

### Run tests by keyword in the test name

```bash
npx playwright test -g "custom gather"
```

### Run tests by tag

```bash
npx playwright test --grep "@BIZ-21978"
```

### Run in headed mode (see the browser)

```bash
npx playwright test --headed
```

### Run with a single worker (recommended for gather tests)

```bash
npx playwright test --workers=1 --headed
```

### Run only in Chromium

```bash
npx playwright test --project=chromium
```

### View the HTML report after a run

```bash
npx playwright show-report
```

---

## Project Structure

```
CloudwallAutomation/
├── configs/
│   ├── env_rcbot.json              # Environment-specific server hosts and URLs
│   ├── test_data.json              # Credentials (local only, not committed with real values)
│   └── test_data.example.json      # Credential template (copy to test_data.json and fill in)
│
├── data/
│   ├── cloudwall/                  # Shared entity data (market codes, tax codes)
│   ├── files/                      # Test fixtures (resume PDF)
│   ├── loginData.json              # Login test data (extra users)
│   └── yaml/                       # Per-spec test data
│       ├── cloudwall/order/        # Order gather spec data
│       ├── cloudwall/talent/       # Talent gather spec data
│       └── utils/                  # Order/SQL utility data
│
├── pages/                          # Page Object Model classes
│   ├── elements/                   # Reusable UI element classes
│   │   ├── bootstrap2_modal.js     # Base class for Bootstrap 2 modals
│   │   └── select2_element.js      # Select2 dropdown helper
│   └── cloudwall/
│       ├── frameset.js             # Main CloudWall frameset (post-login container)
│       ├── legacy_action_screen.js # Base class for legacy action screens
│       ├── listScreen.js           # Base class for list/grid views
│       ├── action_screen.js        # Base class for action screens
│       ├── search_page.js          # Base class for search pages
│       ├── arealist/               # Area list base classes
│       ├── order/                  # Order page objects (28 files)
│       │   ├── manage_candidates.page.js
│       │   ├── order_edit_detail.page.js
│       │   ├── gather_candidates_modal.page.js
│       │   ├── posting_edit.page.js
│       │   └── ...
│       └── talent/                 # Talent page objects
│           ├── talent_edit_detail.page.js
│           └── talent_view_detail.page.js
│
├── tests/                          # Test specs
│   └── cloudwall/
│       ├── login.spec.js           # Login and session tests
│       ├── order/
│       │   ├── order_custom_gather_01.spec.js  # Gather email send + verify
│       │   ├── order_custom_gather_02.spec.js  # Gather status + ineligible talent
│       │   └── order_gather_email_talent_responses.spec.js  # Gather link responses
│       └── talent/
│           └── talent_gather.spec.js  # Talent gather response + MOATS tests
│
├── utils/                          # Shared utilities
│   ├── modules/
│   │   └── cloudwall.js            # Login, session management, frame mappings
│   ├── cloudwall/
│   │   ├── cloudwall_helpers.js    # Frame-aware helpers (click, search, gather, etc.)
│   │   ├── order_util.js           # Order creation via DB stored procedures
│   │   ├── order_sql_util.js       # Order-related SQL queries
│   │   ├── talent_util.js          # Talent creation utilities
│   │   ├── talent_sql_util.js      # Talent-related SQL queries
│   │   └── job_posting_util.js     # Job posting utilities
│   ├── spec_helper.js              # YAML data loading, config builder, test fixtures
│   ├── db_util.js                  # PostgreSQL connection with automatic SSH tunneling
│   ├── email_util.js               # IMAP email search and parsing
│   ├── post_api_util.js            # HTTP API helpers
│   ├── util.js                     # General utilities (YAML, date formatting)
│   └── make_resume_json.js         # Resume JSON builder for talent creation
│
├── playwright.config.js            # Playwright configuration
├── package.json
└── .gitignore
```

---

## Test Suites

### Login (`login.spec.js`)

Verifies CloudWall login, session persistence across page refresh, and multi-user login. This is the only spec currently using page objects directly — it serves as the reference pattern for refactoring the other specs.

### Order Custom Gather 01 (`order_custom_gather_01.spec.js`)

Creates fresh talents via UI, creates an order via DB, adds talents as candidates, sends custom gather emails, and verifies delivery via Mailinator API. Also tests gather activity history on both the order and talent detail screens.

### Order Custom Gather 02 (`order_custom_gather_02.spec.js`)

Tests candidate status changes after gather send, modal behavior for ineligible talent, gather re-send restrictions, and pre-interview question flows.

### Order Gather Email Talent Responses (`order_gather_email_talent_responses.spec.js`)

End-to-end gather response flow: creates a fresh talent, sends gather email, extracts response links from Mailinator, navigates "Apply" and "Not a Fit" links, and verifies candidate status updates in CloudWall. Includes 3 skipped EEOC tests pending future implementation.

### Talent Gather (`talent_gather.spec.js`)

Tests talent gather response rates, MOATS (availability) updates after gather responses, gather pause/resume based on check-in dates, and gather eligibility rules.

---

## Key Concepts

### CloudWall's iframe architecture

CloudWall renders most content inside nested iframes (`topFrame`, `mainFrame`, result frames, etc.). The helpers in `cloudwall_helpers.js` handle this transparently — functions like `findInFrames`, `clickAsaba`, and `waitForInFrames` search across all frames automatically.

### ASABA actions

CloudWall navigation uses "ASABA" links — anchor tags with action names like `AWUIDrawManageCandidates` or `AWUIDrawTalentEditPlacementInfo`. The `clickAsaba(page, actionName)` helper finds and clicks these across all frames.

### Talent creation

All tests create fresh talents via `createTalentViaUI` in `cloudwall_helpers.js` instead of relying on pre-existing talent IDs. Each talent gets a unique Mailinator email address (e.g. `aquent+radcliffe047308@muukteam.testinator.com`) so tests are self-contained and repeatable.

### Order creation

Orders are created via a database stored procedure (`createNewNyMarvelCartoonTestOrderWithoutPostingFromDb` in `order_util.js`). This requires SSH tunnel access to the PostgreSQL database, which `db_util.js` manages automatically.

### Email verification

Gather email delivery is verified through the Mailinator API. The `verifyEmailsViaMailinator` helper in `cloudwall_helpers.js` polls the shared `aquent` inbox, filters by subject and recency, and matches emails by content. Rate limit handling and response status checks are built in.

---
