# Generation quality evaluation (roadmap stage 0B)

**Status: blocked pending a safely executable evaluation, an approved spend limit, and business sign-off.** No real-provider generations or cost-incurring calls have been made for this baseline. Automated tests mock providers and are not evidence of image quality. Private face images were not opened or transmitted during this work.

## Before running

- Obtain explicit, documented consent for each evaluation subject's image to be processed by the named image providers for this evaluation. Do not reuse customer uploads or scrape public images.
- Use a staging environment and private, access-controlled storage. Keep source/result images outside Git and out of logs, issue comments, screenshots, and this scorecard.
- The project owner must run any real-provider evaluation in an environment and provider account they control. This assistant will not inspect or transmit private face images to external providers.
- Agree the maximum number of generations and spend with the business, then apply the provider/account budget controls before any real calls. Stop if a failure would trigger an uncontrolled retry.
- Prepare 10–15 varied, consented face-and-wig combinations. Assign random case IDs and record no names, contact details, or other unnecessary personal data.
- Have the subject/business reviewer evaluate results against the original input and selected wig. Keep the same source cases when comparing one changed generation setting at a time.

## Record the run configuration

| Field | Value |
| --- | --- |
| Date and staging release/commit | |
| Reviewer(s) and business approver | |
| Consent register location (restricted; not a public URL) | |
| Model/provider and model version | |
| Prompt/version | |
| Input resize/crop settings | |
| Mask method and model/version, if used | |
| Quality/output settings | |
| Approved total request/spend cap | |
| Agreed pass threshold and unacceptable failures | |

## Score each result

Score each dimension from 1 (unacceptable) to 5 (acceptable/excellent). Record a brief, non-identifying observation; do not paste image URLs or personal data.

| Case ID | Consent verified | Face/identity preserved (1–5) | Hairline (1–5) | Wig shape (1–5) | Color (1–5) | Artifacts (1–5) | Latency (seconds) | Approx. cost | Pass/fail | Non-identifying notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| case-01 | | | | | | | | | | |
| case-02 | | | | | | | | | | |
| case-03 | | | | | | | | | | |
| case-04 | | | | | | | | | | |
| case-05 | | | | | | | | | | |
| case-06 | | | | | | | | | | |
| case-07 | | | | | | | | | | |
| case-08 | | | | | | | | | | |
| case-09 | | | | | | | | | | |
| case-10 | | | | | | | | | | |
| case-11 | | | | | | | | | | |
| case-12 | | | | | | | | | | |
| case-13 | | | | | | | | | | |
| case-14 | | | | | | | | | | |
| case-15 | | | | | | | | | | |

Add additional rows only when needed; do not exceed the approved request or spend cap. A face/identity distortion, unconsented image, unexpected provider charge, or private-image exposure is an automatic stop and failure regardless of average score.

## Compare and decide

For each controlled change, record the same cases, configuration, successful/failed request count, median and slowest latency, and approximate total/per-result cost. Compare identity preservation, hairline, shape, color, and artifacts individually; an average must not hide a severe identity failure. Do not assume prompt or lighting changes fix face distortion.

| Configuration/change | Cases | Successes / failures | Median / max latency | Approx. total / per-result cost | Quality differences and failure modes |
| --- | ---: | ---: | --- | --- | --- |
| Baseline | | | | | |
| Comparison 1 | | | | | |
| Comparison 2 | | | | | |

**Business decision:** ☐ acceptable for pilot ☐ prototype only ☐ reject and investigate  
**Agreed pass criteria/failure cases:**  
**Approved by / date:**  
**Follow-up and retest required before customer pilot:**  

Do not call the generation experience pilot-ready until the business has reviewed actual outputs, filled the pass criteria, and signed off. If quality is not accepted, label any business demo as a prototype and resolve the failure before a customer pilot.
