# Retrieval Evaluation — stage4_baseline

Questions: **78**  
Top-1 correct: **58 (74.4%)**  
Top-3 correct: **72 (92.3%)**  
Top-5 correct: **77 (98.7%)**

## Topic performance

| Topic | N | Top-1 | Top-3 | Misses outside top 3 |
|---|---:|---:|---:|---|
| work_hours | 10 | 7/10 | 9/10 | Q005 |
| vacation_leave | 10 | 8/10 | 10/10 | — |
| discipline | 8 | 5/8 | 7/8 | Q028 |
| grievance | 10 | 7/10 | 9/10 | Q036 |
| probation | 4 | 4/4 | 4/4 | — |
| seniority_jobs | 11 | 8/11 | 10/11 | Q045 |
| records | 5 | 3/5 | 4/5 | Q056 |
| leaves_accommodation | 6 | 5/6 | 6/6 | — |
| health_safety | 4 | 2/4 | 4/4 | — |
| other | 7 | 7/7 | 7/7 | — |
| source_governance | 3 | 2/3 | 2/3 | Q077 |

## Questions missing the expected source in the top 3

### Q005 — If I am called in outside my regular hours, what is the minimum pay?

Expected: `cba-097`; rank: 5

- `cba-069` (cba) — Section 12.5 — Layoff/Recall (score 55)
- `cba-094` (cba) — Section 16.6 - Overtime (score 55)
- `cba-028` (cba) — Section 5.3--Payment of Wages (score 47)
- `cba-051` (cba) — Section 10.4 — Family Coverage (score 47)
- `cba-097` (cba) — Section 16.9 — Call In Pa (score 47)

### Q028 — If I am disciplined, do they have to give me written reasons?

Expected: `cba-110`; rank: 4

- `cba-069` (cba) — Section 12.5 — Layoff/Recall (score 55)
- `cba-071` (cba) — Section 12.7 - Filling of Permanent Vacancies (score 53)
- `cba-142` (cba) — Section 27.3 - Disciplinary Action (score 49)
- `cba-110` (cba) — ARTICLE 20 - DISCIPLINE AND PREDISCIPLINARY PROCEDURES (score 48)
- `cba-112` (cba) — Section - 21.1—a1 Grievance Procedur (score 46)

### Q036 — What happens if management misses a grievance response deadline?

Expected: `cba-114`; rank: 5

- `cba-111` (cba) — ARTICLE 21-GRIEVANCES AND ARBITRATION (score 52)
- `cba-020` (cba) — Section 4.1 - Labor/Management (score 49)
- `cba-116` (cba) — Section 21.4--Grievance Resolutions (score 45)
- `cba-112` (cba) — Section - 21.1—a1 Grievance Procedur (score 42)
- `cba-114` (cba) — Section 21.2 - Reasonable Time For Union Stewards/Meeting Rooms/Miscellaneous Grievance (score 42)

### Q045 — Can I lose seniority if I am absent five days without calling in?

Expected: `cba-068`; rank: 4

- `cba-069` (cba) — Section 12.5 — Layoff/Recall (score 71)
- `cba-071` (cba) — Section 12.7 - Filling of Permanent Vacancies (score 62)
- `cba-035` (cba) — Section 6.5 — Sick Leave (score 60)
- `cba-068` (cba) — Section 12.4 — Break In Service (score 59)
- `cba-070` (cba) — Section 12.6 — Balancing the Workforce (score 59)

### Q056 — How long can old discipline be used against me?

Expected: `cba-081`; rank: 4

- `cba-110` (cba) — ARTICLE 20 - DISCIPLINE AND PREDISCIPLINARY PROCEDURES (score 62)
- `cba-112` (cba) — Section - 21.1—a1 Grievance Procedur (score 40)
- `cba-124` (cba) — Section 24.1 - Prohibition Against Discrimination (score 39)
- `cba-081` (cba) — Section 14.1 - Employee Files (score 37)
- `cba-007` (cba) — Section 2.1 - Management Rights (score 35)

### Q077 — Should I use the City Personnel Rules grievance procedure or the AFSCME contract grievance procedure?

Expected: `cba-112, cba-111`; rank: 6

- `cba-110` (cba) — ARTICLE 20 - DISCIPLINE AND PREDISCIPLINARY PROCEDURES (score 74)
- `cba-117` (cba) — ARTICLE 22 - CONTRACTING OUT (score 72)
- `cba-114` (cba) — Section 21.2 - Reasonable Time For Union Stewards/Meeting Rooms/Miscellaneous Grievance (score 69)
- `cba-223` (cba) — SIDE LETTER 36 (score 66)
- `pr-115` (personnel) — Section 1 - Causes for Disciplinary Action (score 66)

