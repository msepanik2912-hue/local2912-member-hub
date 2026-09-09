# Stage 5 Validation — Retrieval Gate

## Purpose

Before enabling generated Ask 2912 explanations, test whether ordinary member phrasing retrieves the contract provision a steward would expect the app to surface.

## Regression set

`tests/member_questions.json` contains 78 questions across 11 topic groups.

## Acceptance gate used for this build

- No expected controlling source may fall outside the top 3.
- CBA/Personnel Rules conflict questions must preserve the represented-member source hierarchy.
- Discipline/investigation questions must surface CBA Article 20.
- General grievance/deadline questions must surface CBA Article 21 rather than Personnel Rule XVI.
- Probation questions for represented employees must surface CBA Section 12.10 rather than the general Personnel Rules six-month provision.

## Results

### Stage 4-style baseline

Top-1: 58/78 (74.4%)  
Top-3: 72/78 (92.3%)  
Top-5: 77/78 (98.7%)

### Stage 5 tuned retrieval

Top-1: 78/78 (100%)  
Top-3: 78/78 (100%)  
Top-5: 78/78 (100%)

## What changed

`data/retrieval_hints.json` adds reviewable lexical intent boosts for recurring member phrasing such as:

- call-in pay;
- mandatory/overtime rotation;
- schedule changes;
- vacation amount/carryover/selection;
- discipline and representation;
- grievance steps and missed deadlines;
- probation;
- seniority/break-in-service;
- bid/detail/higher-rated work;
- personnel file retention/rebuttal;
- accommodations and leave;
- health/safety; and
- CBA-versus-Personnel-Rules governance.

Complex-layout/table records also receive a modest ranking penalty so a schedule-table extraction is less likely to displace a directly relevant textual contract section.

## Limitation

A 100% result on a curated regression set is not proof of universal accuracy. The correct operational practice is to add failed or ambiguous real member questions to this suite and prevent regressions before each deployment.
