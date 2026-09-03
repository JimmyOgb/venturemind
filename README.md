# VentureMind

[![GenLayer Bradbury Testnet](https://img.shields.io/badge/GenLayer-Bradbury%20Testnet%20(4221)-blue.svg)](https://rpc-bradbury.genlayer.com)
[![Intelligent Contract](https://img.shields.io/badge/Contract-VentureMindAI-green.svg)](https://scan-bradbury.genlayer.com)
[![Frontend Tests](https://img.shields.io/badge/Vitest-38%2F38%20Passing-brightgreen.svg)](frontend/src/tests)
[![Contract Tests](https://img.shields.io/badge/Pytest-75%20Passed-brightgreen.svg)](tests/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**VentureMind** is a decentralized, consensus-backed AI startup due-diligence oracle powered by GenLayer Intelligent Contracts on the Bradbury Testnet (`testnet-bradbury`, Chain ID: `4221`). It ingests structured founder metadata alongside **independently retrieved primary external evidence** (official corporate registries, regulatory filings, authoritative datasets, and live canonical websites). GenLayer validators independently retrieve and authenticate this external evidence, cross-examine it against untrusted founder claims, reach contested consensus on 9 structured diligence dimensions within strict mathematical tolerances, and commit tamper-evident diligence reports with cryptographic SHA-256 proofs directly on-chain.

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Why GenLayer?](#why-genlayer)
- [Why Not Centralized AI?](#why-not-centralized-ai)
- [System Architecture](#system-architecture)
- [End-to-End User Flow](#end-to-end-user-flow)
- [Deployed Intelligent Contract](#deployed-intelligent-contract)
- [Bradbury Network Configuration](#bradbury-network-configuration)
- [Intelligent Contract Design & Architecture](#intelligent-contract-design--architecture)
  - [Evidence & Input Security Model](#evidence--input-security-model)
  - [Founder Authorization Model](#founder-authorization-model)
  - [Website Canonicalization](#website-canonicalization)
  - [Deterministic `rep_key` Derivation](#deterministic-rep_key-derivation)
  - [Nine Diligence Dimensions & Scoring Weights](#nine-diligence-dimensions--scoring-weights)
  - [Verdict Decision Thresholds](#verdict-decision-thresholds)
  - [Consensus Mechanism & Equivalence Enforcement](#consensus-mechanism--equivalence-enforcement)
  - [Report Integrity & SHA-256 Commitment](#report-integrity--sha-256-commitment)
  - [Contract State Machine](#contract-state-machine)
  - [Resource & Storage Limits](#resource--storage-limits)
- [Frontend Architecture](#frontend-architecture)
- [Project Directory Structure](#project-directory-structure)
- [Installation & Local Development](#installation--local-development)
  - [Prerequisites](#prerequisites)
  - [1. Frontend Setup](#1-frontend-setup)
  - [2. Intelligent Contract Setup](#2-intelligent-contract-setup)
- [Running Test Suites](#running-test-suites)
  - [Frontend Tests (Vitest)](#frontend-tests-vitest)
  - [Intelligent Contract Tests (Pytest)](#intelligent-contract-tests-pytest)
  - [Known GLSim 0.29.2 Test Limitation](#known-glsim-0292-test-limitation)
- [How to Use VentureMind](#how-to-use-venturemind)
  - [1. Connect Wallet to Bradbury Testnet](#1-connect-wallet-to-bradbury-testnet)
  - [2. Submit a Startup](#2-submit-a-startup)
  - [3. Trigger Diligence Evaluation](#3-trigger-diligence-evaluation)
  - [4. Inspect Diligence Report & Cryptographic Commitments](#4-inspect-diligence-report--cryptographic-commitments)
- [Contract Interaction Details](#contract-interaction-details)
- [Security Considerations](#security-considerations)
- [Known Limitations & Disclaimers](#known-limitations--disclaimers)
- [Roadmap](#roadmap)
- [License](#license)

---

## The Problem

Early-stage startup investing and grant allocation suffer from acute information asymmetry and evaluation friction:

1. **Unverified Claims & Opaque Pitch Materials**: Founders provide pitch decks, traction claims, and projections that require extensive manual analysis.
2. **Subjective & Inconsistent Due Diligence**: Human analyst reviews vary widely in rigor, criteria weighting, and risk calibration.
3. **Centralized AI Pitfalls**: Off-chain AI evaluation tools run in centralized black boxes that can be silently altered, hallucinate without checks, or serve biased outcomes without audit trails.
4. **No Cryptographic Accountability**: Traditional reports lack tamper-evident on-chain commitments tying the exact evidence evaluated to the final score and reasoning.

---

## The Solution

**VentureMind** turns startup diligence into a deterministic on-chain protocol:

* **On-Chain Evidence Ingestion**: Founders submit bounded pitch materials and documentation directly to the Intelligent Contract.
* **Dual-Validator LLM Consensus**: GenLayer validators independently execute evaluation prompts using non-deterministic AI execution (`gl.nondet.exec_prompt`) with structured schema constraints.
* **Equivalence Principles**: Leader and validator results are compared on-chain; writes to contract storage occur **only** if both validators agree on the verdict and their dimension scores fall within strict tolerance thresholds ($\pm 10$ points).
* **Deterministic Integer Scoring**: A composite 0–100 score is calculated on-chain using fixed integer arithmetic and explicit dimension weights.
* **Tamper-Evident SHA-256 Commitments**: The final report hash is computed on-chain and stored immutably in GenLayer state.

---

## Why GenLayer?

Traditional blockchains cannot process natural language pitch decks or unstructured evidence documents natively. Centralized oracles introduce central points of failure and trust assumptions.

GenLayer uniquely enables **Intelligent Contracts** that combine:
* **Native AI Execution in Consensus**: Validators run large language models as part of state transition verification.
* **Asymmetric Validator Verification**: The contract's `validate_leader` logic programmatically enforces multi-node agreement before committing state changes.
* **Non-Deterministic Execution with Deterministic Outcomes**: AI outputs are validated against strict mathematical tolerances and schemas, yielding deterministic final scores, verdicts, and cryptographic hashes.

---

## Why Not Centralized AI?

| Feature | Centralized AI API / SaaS | VentureMind on GenLayer |
| :--- | :--- | :--- |
| **Trust Model** | Trust single company/API host | Decentralized validator consensus |
| **Tamper Resistance** | Prompts and weights can change silently | Immutable Intelligent Contract code on-chain |
| **Validator Consensus** | None (single LLM inference) | Leader + Validator independent runs |
| **Equivalence Check** | No cross-validation | On-chain tolerance enforcement ($\pm 10$ dimension bounds) |
| **Auditability** | Opaque server logs | Publicly verifiable on-chain report hash & state |
| **Sybil & Spam Bounds** | Opaque rate limits | Explicit contract-level storage and payload bounds |

---

## System Architecture

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             BROWSER FRONTEND (React)                             │
│  - EIP-1193 Wallet Connection       - Document Sanitization Preview              │
│  - External Source Category Inputs  - Live Contract State Reads (gen_call)       │
│  - GenLayer RLP Calldata Encoding   - Evidence Provenance & Cryptographic Proofs │
└───────────────────────────┬──────────────────────────────────────────────────────┘
                            │
                   eth_sendTransaction
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                     GENLAYER BRADBURY TESTNET (Chain ID: 4221)                   │
│                     Contract: VentureMindAI (0xc350...07D1)                      │
│                                                                                  │
│   1. submit_startup(name, website, sector, founder, docs, [external_sources])    │
│      ├── Transaction sender normalization & founder address binding              │
│      ├── Conservative website & external source URL canonicalization             │
│      ├── Injection sanitization & bounded parsing                                │
│      └── Compute rep_key: SHA256(canonical_url + ":" + founder) → SUBMITTED      │
│                                                                                  │
│   2. evaluate_startup(rep_key) [Founder Only]                                    │
│      │                                                                           │
│      ├── Step A: Leader Validator Execution                                      │
│      │    ├── Independently fetches canonical website & external sources (HTTP)  │
│      │    ├── Bounds responses (≤10k chars/source), sanitizes, hashes evidence   │
│      │    ├── Compiles prompt: FOUNDER_EVIDENCE + PRIMARY_EXTERNAL_EVIDENCE      │
│      │    └── Runs nondeterministic LLM prompt (JSON mode) & schema validation   │
│      │                                                                           │
│      ├── Step B: Independent Validator Execution                                 │
│      │    ├── Independently fetches canonical website & external sources (HTTP)  │
│      │    ├── Independently compiles prompt with its own retrieved evidence      │
│      │    └── Independently runs nondeterministic LLM prompt & schema validation │
│      │                                                                           │
│      ├── Step C: Contested Equivalence Principle Checks                          │
│      │    ├── Evidence agreement check: URLs, statuses, & SHA-256 hashes agree   │
│      │    ├── Verdict match: Leader verdict == Validator verdict                 │
│      │    ├── Dimension score delta ≤ ±10 per dimension                          │
│      │    ├── Overall score delta ≤ ±10 points                                   │
│      │    └── Confidence score delta ≤ ±15 points                                │
│      │                                                                           │
│      ├── Step D: Deterministic Score Calculation (Integer Arithmetic)            │
│      │    └── score = floor(sum(dimension_score * weight) / 100)                 │
│      │                                                                           │
│      ├── Step E: Cryptographic Report Hash Commitment                            │
│      │    └── report_hash = SHA256(canonical_json(report_data_with_provenance)) │
│      │                                                                           │
│      └── Step F: State Update → RESOLVED                                         │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## The Trust Model: Founder vs. Primary External Evidence

### The Reviewer Challenge Addressed

In early versions, validators assessed only founder-controlled pitch deck text. While validators were independent, they were evaluating purely self-reported founder claims.

### The Upgraded Due Diligence Trust Model

| Dimension | Previous Architecture | Upgraded Primary Evidence Architecture |
| :--- | :--- | :--- |
| **Evidence Input** | Founder-provided text only | Founder claims + **independently retrieved primary external evidence** |
| **Validator Action** | Evaluated identical static founder text | **Independently fetch external websites/registries** via `gl.nondet.web.get` |
| **Consensus Basis** | LLM interpretation agreement on pitch deck | **Contested consensus over independently retrieved external evidence** |
| **Contradiction Detection** | None (no external data to refute claims) | Explicitly checks for conflicts between claims and public records |
| **Provenance Tracking** | None | Full on-chain commitments: source URL, category, status, SHA-256 hashes |
| **Positioning** | "AI diligence" | **Consensus-backed startup due diligence using independently sourced evidence** |

### Evidence Classifications

1. **Founder-Provided Evidence (`founder_supplied`)**:
   - Documents submitted directly by the startup founder (pitch deck, executive summary, cap table notes, self-reported metrics).
   - Treated strictly as **untrusted claims**. Never accepted as verified truth.
2. **Primary External Evidence (`external_retrieved`)**:
   - Evidence retrieved directly from publicly accessible sources by GenLayer validators during contract execution.
   - Categories:
     - `official_registry`: Official company registration and corporate filings (e.g. SEC EDGAR, UK Companies House, state business registers).
     - `regulatory_filing`: Regulatory disclosures, licenses, compliance registrations.
     - `authoritative_dataset`: Publicly verified industry datasets, indices, and market benchmarks.
     - `domain_record`: DNS records, SSL/TLS certificate transparency, hosting infrastructure.
     - `founder_selected`: Founder-provided external URLs (e.g. product page, news article). Treated as external data, but **not** automatically certified as authoritative.

### What VentureMind Verifies vs. What It Cannot

> [!IMPORTANT]
> **What VentureMind CAN Verify:**
> * Validators independently access live external web sources and corporate registries.
> * Validators independently verify whether external evidence corroborates or contradicts founder claims.
> * Dynamic webpage tampering or contradictory data between nodes fails consensus.
> * Final scores, verdicts, and cryptographic report commitments are deterministic and immutable.
>
> **What VentureMind CANNOT Verify:**
> * Real-world legal truth that is not recorded in publicly accessible online records.
> * Cryptographic domain ownership without zero-knowledge TLS proofs (TLSNotary).
> * The system does **not** guarantee that a business is truthful or will succeed. It provides transparent, consensus-audited due diligence.

---

## End-to-End User Flow

```text
[Founder Wallet]
       │
       ▼ (1) Connect to Bradbury Testnet (Chain ID 4221)
[VentureMind UI]
       │
       ▼ (2) Enter metadata, up to 5 pitch documents, & up to 3 primary external sources
[Client-side Validation] (Enforces ≤12k char/doc, ≤50k combined docs, ≤3 sources, URL formats)
       │
       ▼ (3) Call submit_startup() via Web3 Wallet
[VentureMindAI Contract] ─── Stored as SUBMITTED state with deterministic rep_key
       │
       ▼ (4) Submitting founder triggers evaluate_startup(rep_key)
[GenLayer Consensus]
  ├── Leader Validator independently fetches external sources & evaluates
  ├── Independent Validator independently fetches external sources & evaluates
  ├── Evidence Agreement Check (URLs, statuses, content hashes match)
  └── Equivalence Verification (Tolerance: ±10 points, exact verdict match)
       │
       ▼ (5) Deterministic Score + Cryptographic SHA-256 Report Hash persisted on-chain
[RESOLVED State]
       │
       ▼ (6) Founder & Public inspect 9-dimension report & external evidence provenance
```

---

## Deployed Intelligent Contract

The updated VentureMindAI Intelligent Contract (incorporating primary external evidence verification) is live on the GenLayer Bradbury Testnet:

| Parameter | Value |
| :--- | :--- |
| **Contract Name** | `VentureMindAI` (v2 — Primary External Evidence) |
| **Active Contract Address** | `0xc350Cd4E4E6254FB72903cD803f354a993C907D1` |
| **Deployment Transaction** | `0x0350e3661a814b8631cdcbf31fd1bc9cdcd4cfedc8246eca881a30075add0f38` |
| **Network** | GenLayer Bradbury Testnet |
| **Chain ID** | `4221` (`0x107d`) |
| **RPC Endpoint** | `https://rpc-bradbury.genlayer.com` |
| **Block Explorer** | `https://scan-bradbury.genlayer.com` |
| **Admin / Deployer Address** | `0xE4220c4b71877bb94EB173f467ef5c5557017085` |
| **Consensus Contract** | `0xb7278A61aa25c888815aFC32Ad3cC52fF24fE575` |
| **Historical v1 Deployment** | `0xCB19Df1488aFabA7e5bDB2246C6E6F58fcfe8DF1` *(v1 founder-text-only baseline; deprecated)* |
| **Historical v1 Tx** | `0xb903ca7fccb693af3e98d4c8563dbad04ca990ed8874c813f83a55c43a5c4e45` |

---

## Bradbury Network Configuration

To configure your Web3 browser wallet (MetaMask, Rabby, Coinbase Wallet) for Bradbury:

* **Network Name**: `GenLayer Bradbury`
* **New RPC URL**: `https://rpc-bradbury.genlayer.com`
* **Chain ID**: `4221` (Hex: `0x107d`)
* **Currency Symbol**: `GEN`
* **Block Explorer URL**: `https://scan-bradbury.genlayer.com`

---

## Intelligent Contract Design & Architecture

The smart contract [`contract/venturemind.py`](contract/venturemind.py) is implemented in Python for the GenVM runtime using the `genlayer` SDK.

### Evidence & Input Security Model

To prevent memory exhaustion, sybil spam, and prompt injection attacks:

* **Founder Document Count Limit**: Maximum 5 documents per submission.
* **Per-Document Character Limit**: Maximum 12,000 characters per document.
* **Combined Document Character Limit**: Maximum 50,000 characters across all documents.
* **Raw Documents JSON Payload Limit**: Maximum 64,000 characters for `documents_json`.
* **External Sources Limit**: Maximum 3 external sources per submission.
* **Per-External Source Content Limit**: Maximum 10,000 characters (bounded extraction if exceeded).
* **Combined External Content Limit**: Maximum 30,000 characters across all external sources.
* **Prompt Buffer Limit**: Maximum 128,000 characters for the assembled LLM prompt.
* **Assessment Serialization Limit**: Maximum 32,000 characters for the validated assessment JSON.
* **Prompt Injection Defense**: Both founder documents and external webpages are treated as untrusted data encapsulated inside explicit JSON data boundaries (`--- BEGIN UNTRUSTED EVIDENCE JSON ---`), and known injection sequences (e.g. `SYSTEM_PROMPT:`, `IGNORE_INSTRUCTIONS`, `system message`) are automatically sanitized to `[SANITIZED]`.

### Founder Authorization Model

* `submit_startup()` requires that the supplied `founder_address` matches `gl.message.sender_address` (case-normalized).
* `evaluate_startup(rep_key)` enforces that only the original submitting founder address can trigger the consensus evaluation.
* *Note*: This guarantees **transaction-level sender authorization**, proving that the caller is the address that submitted the data. It does **not** prove real-world legal identity or domain ownership.

### Website Canonicalization

The contract normalizes startup website URLs conservatively:
* Schemes allowed: `http` and `https` only.
* Hostname: Lowercased; IPv6 addresses enclosed in brackets.
* Default ports (80 for HTTP, 443 for HTTPS) are stripped; non-standard ports are preserved.
* Trailing root slash is stripped (`https://acme.com/` → `https://acme.com`).
* URL fragments (`#section`) are removed.
* Non-root paths and query strings are preserved.
* Embedded credentials (`user:pass@host`) are strictly rejected.

### Deterministic `rep_key` Derivation

Each submission is indexed by a deterministic 64-character SHA-256 hash:

$$\text{rep\_key} = \text{SHA-256}(\text{canonical\_website} + \text{":"} + \text{normalized\_founder\_address})$$

This prevents duplicate submissions for the same website by the same founder.

### Nine Diligence Dimensions & Scoring Weights

The contract evaluates evidence across 9 structured dimensions:

| Dimension | Weight | Description | Scoring Rule |
| :--- | :---: | :--- | :--- |
| **Verification** | 10% | Internal consistency and factual grounding of evidence | Higher is better (0–100) |
| **Team** | 10% | Founding team credentials, domain depth, track record | Higher is better (0–100) |
| **Market** | 15% | TAM sizing, growth tailwinds, market timing | Higher is better (0–100) |
| **Competition** | 10% | Defensibility, moats, competitive positioning | Higher is better (0–100) |
| **Technology** | 15% | Feasibility, architectural robustness, IP/tech roadmap | Higher is better (0–100) |
| **Financials** | 15% | Unit economics, burn rate, revenue model, capital efficiency | Higher is better (0–100) |
| **Legal** | 5% | Regulatory compliance, IP protection, corporate structure | Higher is better (0–100) |
| **Fraud Signals** | 10% | Detection of deceptive claims, fake metrics, or red flags | **Inverted**: Score contributes $(100 - \text{score})$ |
| **Risk Resilience** | 10% | Operational contingency planning, down-market resilience | Higher is better (0–100) |

The composite score is calculated using integer arithmetic:

$$\text{Composite Score} = \left\lfloor \frac{\sum_{d \in \text{Dimensions}} (\text{Effective Score}_d \times \text{Weight}_d)}{100} \right\rfloor$$

### Verdict Decision Thresholds

| Final Score Range | Verdict | Interpretation |
| :---: | :---: | :--- |
| **$75 \le \text{Score} \le 100$** | **`INVEST`** | Strong evidentiary support across technology, team, and financials with low fraud signals. |
| **$45 \le \text{Score} \le 74$** | **`MONITOR`** | Promising fundamentals with identifiable risks or unverified claims requiring follow-up. |
| **$0 \le \text{Score} \le 44$** | **`REJECT`** | Substantial evidentiary deficits, elevated fraud indicators, or unviable unit economics. |

### Consensus Mechanism & Equivalence Enforcement

Consensus execution uses `gl.vm.run_nondet_unsafe`:

1. **Leader Assessment**: The leader node executes the prompt via `gl.nondet.exec_prompt(prompt, response_format="json")` and validates the output against the schema.
2. **Validator Verification**: The validator node executes the exact same prompt independently.
3. **Equivalence Agreement (`_assessments_agree`)**:
   * **Exact Verdict Match**: Leader verdict == Validator verdict.
   * **Dimension Score Tolerance**: $|\text{Leader Score}_d - \text{Validator Score}_d| \le 10$ for every dimension $d$.
   * **Overall Score Tolerance**: $|\text{Leader Composite} - \text{Validator Composite}| \le 10$.
   * **Confidence Tolerance**: $|\text{Leader Confidence} - \text{Validator Confidence}| \le 15$.
4. **State Persistence**: If agreement succeeds, the report is saved and the state transitions to `RESOLVED`. If consensus fails, transaction execution aborts and the submission remains in `SUBMITTED` state for retry.

### Report Integrity & SHA-256 Commitment

Once evaluation completes, the contract builds a canonical JSON representation of the report (without the hash) and computes:

$$\text{report\_hash} = \text{SHA-256}(\text{canonical\_json}(\text{report\_without\_hash}))$$

This hash commits to the score, verdict, confidence, executive reasoning, and all 9 dimension scores and summaries.

### Contract State Machine

```text
[ Non-Existent ] 
       │
       ▼ submit_startup()
[ SUBMITTED ]  (Indexed by rep_key, evidence stored, status="SUBMITTED")
       │
       ▼ evaluate_startup() [Consensus Agreement]
[ RESOLVED ]   (Report saved with report_hash, status="RESOLVED")
```

### Resource & Storage Limits

* **Global Submission Limit**: `MAX_SUBMISSIONS = 100` (prototype resource control on testnet).
* **Assessment Length Limit**: `MAX_ASSESSMENT_LENGTH = 32,000` bytes.
* **Summary String Limit**: `MAX_SUMMARY_LENGTH = 1,000` characters per dimension.
* **Reasoning String Limit**: `MAX_REASONING_LENGTH = 3,000` characters.

---

## Frontend Architecture

The frontend is located in [`frontend/`](frontend/) and built using React 18, TypeScript, Tailwind CSS, and Vite.

* **`src/services/calldata.ts`**: Pure TypeScript implementation of GenLayer's custom calldata encoding, combining Protocol Buffers (varint, zigzag encoding, field keys) with Ethereum RLP serialization.
* **`src/services/contract.ts`**: High-level contract service handling `gen_call` view queries, transaction encoding for `submit_startup` and `evaluate_startup`, and report polling.
* **`src/services/wallet.ts`**: EIP-1193 Web3 wallet connector managing chain switching to Bradbury (4221), account subscriptions, and error handling.
* **`src/services/storage.ts`**: Local client-side caching of tracked `rep_key` submissions for easy dashboard access.
* **`src/components/`**: Modular UI components including `SubmitForm`, `EvaluationsList`, `ReportView`, `DimensionCard`, `EvaluationModal`, `LookupModal`, and `Hero`.

---

## Project Directory Structure

```
venturemind/
├── contract/                          # Intelligent Contract source
│   └── venturemind.py                 # Core GenLayer Intelligent Contract
├── tests/                             # Python smart contract test suite
│   ├── conftest.py                    # Pytest configuration & fixtures
│   ├── test_venturemind.py            # 57 unit tests (security, scoring, consensus)
│   └── integration/
│       └── test_venturemind_consensus.py # GLSim integration tests
├── frontend/                          # React + TypeScript Web Application
│   ├── index.html                     # Application HTML entry point
│   ├── package.json                   # Frontend dependencies & scripts
│   ├── package-lock.json
│   ├── vite.config.ts                 # Vite build configuration
│   ├── tsconfig.json                  # TypeScript compiler options
│   ├── tailwind.config.js             # Tailwind CSS theme & styling
│   ├── postcss.config.js
│   └── src/
│       ├── main.tsx                   # React root mount
│       ├── App.tsx                    # Main application container & view router
│       ├── index.css                  # Global styles & Tailwind directives
│       ├── components/                # Reusable UI components
│       │   ├── DimensionCard.tsx      # Individual dimension score & summary card
│       │   ├── EvaluationModal.tsx    # 7-stage consensus progress tracker
│       │   ├── EvaluationsList.tsx    # Founder evaluations dashboard
│       │   ├── Footer.tsx             # Network info & contract link footer
│       │   ├── Header.tsx             # Navbar with wallet connection & lookups
│       │   ├── Hero.tsx               # Official hero banner & live stats
│       │   ├── LookupModal.tsx        # Direct rep_key explorer modal
│       │   ├── ReportView.tsx         # Full diligence report viewer
│       │   ├── StatusBadge.tsx        # Color-coded verdict & status badges
│       │   ├── SubmissionDetail.tsx   # Detailed submission view
│       │   ├── SubmitForm.tsx         # Startup submission form with live validation
│       │   └── icons.tsx              # SVG icon library
│       ├── services/                  # Application services
│       │   ├── calldata.ts            # GenLayer Protobuf & RLP calldata encoder
│       │   ├── contract.ts            # Contract RPC calls & write transactions
│       │   ├── storage.ts             # LocalStorage submission cache
│       │   └── wallet.ts              # EIP-1193 browser wallet provider
│       ├── types/                     # TypeScript interface definitions
│       │   ├── contract.ts            # Contract types, reports, submissions
│       │   └── global.d.ts            # Window.ethereum typing
│       └── tests/                     # Frontend Vitest test suite
│           ├── calldata.test.ts       # Calldata encoding/decoding tests
│           ├── contract.test.ts       # Service & validation tests
│           ├── storage.test.ts        # Storage persistence tests
│           ├── wallet.test.ts         # Wallet connection & network tests
│           └── setup.ts               # Test environment setup
├── requirements.txt                   # Python dependencies (genlayer-py, pytest, genvm-linter)
├── .gitignore                         # Repository ignore rules
└── README.md                          # Project documentation
```

---

## Installation & Local Development

### Prerequisites

* **Node.js**: `v18.0.0` or higher
* **npm**: `v9.0.0` or higher
* **Python**: `3.12` (for contract tests & linting)

### 1. Frontend Setup

```powershell
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Intelligent Contract Setup

```powershell
# In repository root: create and activate Python virtual environment
python -m venv .venv
.venv\Scripts\Activate.ps1   # On Windows (or 'source .venv/bin/activate' on Linux/macOS)

# Install Python requirements
pip install -r requirements.txt
```

---

## Running Test Suites

### Frontend Tests (Vitest)

The frontend test suite includes 35 comprehensive unit tests covering calldata encoding/decoding, input validation, wallet state transitions, and local storage.

```powershell
cd frontend
npm run test
```

Expected Output:
```text
 ✓ src/tests/wallet.test.ts (4 tests)
 ✓ src/tests/contract.test.ts (16 tests)
 ✓ src/tests/calldata.test.ts (12 tests)
 ✓ src/tests/storage.test.ts (3 tests)

 Test Files  4 passed (4)
      Tests  35 passed (35)
```

To run a production build:
```powershell
cd frontend
npm run build
```

### Intelligent Contract Tests (Pytest)

The smart contract test suite tests equivalence principles, scoring logic, injection sanitization, bounds validation, and consensus callbacks.

```powershell
# From root directory with virtual environment activated:
.venv\Scripts\python.exe -m pytest tests -v
```

Expected Output:
```text
======================== 57 passed, 1 skipped in 7.31s ========================
```

### Known GLSim 0.29.2 Test Limitation

* In GLSim `0.29.2`, simulated multi-validator mock responses share the first validator's mock response across all mock validator nodes.
* Because genuine asymmetric per-validator mocking is not supported by GLSim `0.29.2`, unit tests directly test the contract's `_assessments_agree` and validator callback logic with explicit asymmetric test payloads.
* The integration test module in [`tests/integration/test_venturemind_consensus.py`](tests/integration/test_venturemind_consensus.py) is skipped by default unless `RUN_VENTUREMIND_CONSENSUS_INTEGRATION=1` is set.

---

## How to Use VentureMind

### 1. Connect Wallet to Bradbury Testnet
1. Click **Connect Wallet** in the top navigation bar.
2. If your wallet is connected to a different network, click **Switch to Bradbury**.
3. The app connects to Chain ID `4221` and reads the live contract state.

### 2. Submit a Startup
1. Click **Submit Startup** in the navigation bar.
2. Enter the **Startup Name**, **Official Website URL**, and **Sector**.
3. Add up to **5 Evidence Documents** (e.g. Executive Summary, Technical Architecture, Financial Projections, Founder Bios).
4. Review the character counters and injection sanitization preview.
5. Click **Submit to GenLayer Bradbury**. Confirm the transaction in your wallet.
6. Upon confirmation, the contract generates your unique `rep_key`.

### 3. Trigger Diligence Evaluation
1. In the **My Evaluations** dashboard, locate your startup (status: `SUBMITTED`).
2. Click **Run Diligence Evaluation**.
3. Confirm the transaction in your wallet.
4. The 7-stage consensus tracker monitors the evaluation:
   `Preparing` $\rightarrow$ `Wallet Confirmation` $\rightarrow$ `Tx Submitted` $\rightarrow$ `GenLayer Consensus` $\rightarrow$ `Reading Report` $\rightarrow$ `Complete`.

### 4. Inspect Diligence Report & Cryptographic Commitments
1. View the **Executive Summary & Reasoning**.
2. Check the **Composite Score** (0–100) and **Verdict Badge** (`INVEST`, `MONITOR`, or `REJECT`).
3. Examine all **9 Dimension Cards** with individual scores, progress bars, and evidence summaries.
4. Verify the **Cryptographic Commitments**:
   * `rep_key` (SHA-256 startup identifier)
   * `report_hash` (SHA-256 canonical report commitment)
   * Raw on-chain JSON export.

---

## Contract Interaction Details

### Read Methods (via `gen_call`)

```bash
# Read startup submission
curl -X POST https://rpc-bradbury.genlayer.com \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "gen_call",
    "params": [{
      "type": "read",
      "to": "0xc350Cd4E4E6254FB72903cD803f354a993C907D1",
      "from": "0x0000000000000000000000000000000000000000",
      "data": "<RLP_ENCODED_CALLDATA>",
      "transaction_hash_variant": "latest-nonfinal"
    }]
  }'
```

Methods available:
* `get_submission(rep_key: str) -> str`
* `get_report(rep_key: str) -> str`
* `get_admin() -> str`
* `get_submission_count() -> str`

### Write Methods (via `eth_sendTransaction`)

* `submit_startup(name: str, website: str, sector: str, founder_address: str, documents_json: str, external_sources_json: str = "[]") -> str`
* `evaluate_startup(rep_key: str) -> str`

---

## Security Considerations

1. **Transaction Authorization**: Only the original submitting founder address can trigger `evaluate_startup` for their `rep_key`.
2. **Payload Sanitization**: Prompt injection delimiters and directives are stripped prior to LLM evaluation.
3. **Structured Schema Enforcement**: AI responses must adhere strictly to a closed JSON schema. Extraneous fields or malformed structures trigger rejection.
4. **Tolerance Bounds**: Validators must agree on the final verdict and remain within $\pm 10$ dimension score tolerance.
5. **Deterministic Integer Math**: Scoring avoids floating point non-determinism across platforms.

---

## Known Limitations & Disclaimers

* **Prompt Injection**: While prompt sanitization and structured data fences are applied, no AI system can guarantee mathematical immunity to adversarial prompt injection.
* **Founder & Domain Ownership**: Sender verification confirms the transaction signer only; it does not verify legal corporate entity status or DNS control.
* **Testnet Scope**: Bradbury is a testnet environment. `MAX_SUBMISSIONS = 100` is a prototype resource control limit.
* **No Financial Escrow**: The deployed contract does not hold, escrow, or distribute investment capital.
* **Assessment Disclaimer**: VentureMind evaluations reflect consensus assessment of submitted evidence documents. They do not constitute financial advice, investment guarantees, or verified legal audits.

---

## Roadmap

- [ ] Support for IPFS / Arweave decentralized document storage hashes in evidence submissions.
- [ ] Integration of on-chain TLSNotary / zk-proof proofs of domain ownership.
- [ ] Multi-round diligence with follow-up validator inquiries.
- [ ] Automated syndication and decentralized milestone-based escrow contracts.

---

## License

This project is licensed under the [MIT License](LICENSE).
