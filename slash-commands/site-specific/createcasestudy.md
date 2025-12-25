# [CreateCaseStudy] - Case Study Creation Automation

**Version**: 1.0.0
**Command**: `[CreateCaseStudy]` or `/createcasestudy`
**Type**: SITE-SPECIFIC (customize per project)
**Trigger**: Type when creating a new client case study
**Purpose**: Automate case study scaffolding with results-focused structure
**Executor**: [Echo] (Content Lead), [Cipher] (StoryBrand), [Bran] (SEO)

---

## AUTO-EXECUTION INSTRUCTIONS

**You are now executing the [CaseStudy] workflow. This creates a results-focused case study that demonstrates value.**

---

## STEP 1: Gather Case Study Information
**Executor**: [Echo] (Lead)

### Required Information:
```
CASE STUDY BRIEF:
=================

Client Information:
- Client Name: [Company/Individual name]
- Industry: [Industry sector]
- Company Size: [Startup/SMB/Enterprise]
- Location: [Geographic location]

Project Details:
- Project Type: [Web design, SEO, Development, etc.]
- Timeline: [Project duration]
- Services Provided: [List of services]
- Budget Range: [Optional - if shareable]

Results & Metrics:
- Primary Metric: [e.g., "150% increase in leads"]
- Secondary Metric: [e.g., "50% faster load times"]
- Tertiary Metric: [e.g., "200% ROI"]
- Qualitative Result: [e.g., "Streamlined workflow"]

Testimonial:
- Quote: [Client testimonial]
- Author: [Name]
- Title: [Job title]

Assets Available:
[ ] Before/After screenshots
[ ] Client logo (with permission)
[ ] Metrics/data visualization
[ ] Client headshot for testimonial
```

### Auto-Generate Values:
```bash
# Generate slug from client name
CLIENT_SLUG=$(echo "$CLIENT_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-')
SLUG="case-study-${CLIENT_SLUG}"

# Generate date
POST_DATE=$(date +%Y-%m-%d)

# Generate file path
CASE_STUDY_PATH="[CONTENT_CASE_STUDIES_PATH]/${POST_DATE}-${SLUG}.md"
IMAGE_PATH="[ASSETS_IMAGES]/case-studies/${SLUG}.png"
```

---

## STEP 2: StoryBrand Framework Application
**Executor**: [Cipher] (Lead)

### Case Study Story Structure:
```
STORYBRAND CASE STUDY FRAMEWORK:
================================

1. THE HERO (Client as Hero)
   - Introduce the client
   - Their aspirations and goals
   - Why they matter in their industry

2. THE PROBLEM
   - External Problem: [Tangible business challenge]
     Example: "Website was outdated and not mobile-friendly"

   - Internal Problem: [Emotional frustration]
     Example: "Felt embarrassed sending prospects to their site"

   - Philosophical Problem: [Why this is wrong]
     Example: "Great companies deserve great digital presence"

3. THE GUIDE (Your Company)
   - Show empathy: "We understood their frustration"
   - Show authority: "With 10+ years of experience..."
   - Position as guide, not hero

4. THE PLAN (Your Solution)
   - Phase 1: [Discovery/Audit]
   - Phase 2: [Strategy/Design]
   - Phase 3: [Implementation]
   - Phase 4: [Launch/Optimization]

5. THE CALL TO ACTION
   - What the client committed to
   - The decision point

6. SUCCESS (Results Achieved)
   - Quantifiable metrics
   - Before/after comparison
   - Emotional transformation
   - Business impact

7. AVOIDING FAILURE
   - What would have happened without action
   - Implied stakes for prospects reading
```

---

## STEP 3: Create Case Study File
**Executor**: [Echo] (Lead)

### Actions to Execute:

```bash
CASE_STUDY_CONTENT="---
title: \"$CLIENT_NAME: $RESULT_HEADLINE\"
slug: \"$SLUG\"
date: \"$POST_DATE\"
client: \"$CLIENT_NAME\"
industry: \"$INDUSTRY\"
services: [$SERVICES]
description: \"$META_DESCRIPTION\"
image: \"$IMAGE_PATH\"
image_alt: \"$CLIENT_NAME case study results\"
featured: false
testimonial:
  quote: \"$TESTIMONIAL_QUOTE\"
  author: \"$TESTIMONIAL_AUTHOR\"
  title: \"$TESTIMONIAL_TITLE\"
results:
  - metric: \"$METRIC_1_NAME\"
    value: \"$METRIC_1_VALUE\"
    description: \"$METRIC_1_CONTEXT\"
  - metric: \"$METRIC_2_NAME\"
    value: \"$METRIC_2_VALUE\"
    description: \"$METRIC_2_CONTEXT\"
  - metric: \"$METRIC_3_NAME\"
    value: \"$METRIC_3_VALUE\"
    description: \"$METRIC_3_CONTEXT\"
---

# $CLIENT_NAME: $RESULT_HEADLINE

## Overview

**Client**: $CLIENT_NAME
**Industry**: $INDUSTRY
**Timeline**: $TIMELINE
**Services**: $SERVICES

## The Challenge

[Describe the client's situation before working with you. What problems were they facing? What were the pain points? What had they tried before?]

### Key Pain Points

- [Pain point 1]
- [Pain point 2]
- [Pain point 3]

## The Solution

[Describe your approach and the solution you implemented]

### Phase 1: Discovery

[What you learned and assessed]

### Phase 2: Strategy

[The plan you developed]

### Phase 3: Implementation

[How you executed]

### Phase 4: Launch & Optimization

[How you deployed and refined]

## The Results

[Summary of outcomes achieved]

### Key Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| [Metric 1] | [Before] | [After] | [Change] |
| [Metric 2] | [Before] | [After] | [Change] |
| [Metric 3] | [Before] | [After] | [Change] |

## Client Testimonial

> \"$TESTIMONIAL_QUOTE\"
>
> — **$TESTIMONIAL_AUTHOR**, $TESTIMONIAL_TITLE at $CLIENT_NAME

## Key Takeaways

1. [Takeaway 1]
2. [Takeaway 2]
3. [Takeaway 3]

---

**Facing similar challenges?** [Call-to-action with link to contact page]
"

echo "$CASE_STUDY_CONTENT" > "$CASE_STUDY_PATH"
echo "Case study created at: $CASE_STUDY_PATH"
```

---

## STEP 4: SEO Optimization
**Executor**: [Bran] (Lead)

### SEO Checklist:
```
CASE STUDY SEO:
===============

Title Tag Structure:
"[Client Name] Case Study: [Result] | [Your Company]"
Example: "Acme Corp Case Study: 150% Lead Increase | Your Agency"

Meta Description:
"See how we helped [Client] achieve [result] through [service]. Read the full case study with before/after metrics."

Keywords to Target:
- "[Industry] case study"
- "[Service] results"
- "[Service] success story"
- "[Problem] solution"

Schema.org:
[ ] Article schema with case study type
[ ] Organization schema for client
[ ] Review/testimonial schema
```

### Auto-Generate Schema:
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[CLIENT_NAME]: [RESULT_HEADLINE]",
  "description": "[META_DESCRIPTION]",
  "author": {
    "@type": "Organization",
    "name": "[YOUR_COMPANY]"
  },
  "about": {
    "@type": "Organization",
    "name": "[CLIENT_NAME]",
    "industry": "[INDUSTRY]"
  },
  "datePublished": "[POST_DATE]"
}
```

---

## STEP 5: Visual Assets
**Executor**: [Aesthetica] (Lead)

### Required Images:
```
CASE STUDY VISUALS:
===================

1. Hero Image (Required)
   - Dimensions: 1200x630px
   - Content: Client logo + key metric highlight
   - Location: [ASSETS_IMAGES]/case-studies/[slug].png

2. Before/After Screenshots (Recommended)
   - Show transformation
   - Annotate key improvements
   - Side-by-side or overlay format

3. Results Infographic (Optional)
   - Visualize key metrics
   - Brand-consistent design
   - Shareable on social media

4. Client Logo
   - Permission verified
   - High-quality version
   - Proper sizing

5. Testimonial Author Photo (Optional)
   - Professional headshot
   - Cropped to circle/square
```

---

## STEP 6: Create Kanban Card
**Executor**: [Codey] (Lead)

### Add to Kanban:
```bash
LAST_ID=$(grep -oP 'data-id="\K\d+' "$KANBAN_FILE" | sort -n | tail -1)
NEW_ID=$((LAST_ID + 1))

node /docs-framework/automation/kanban-updater.js \
  --action="add" \
  --column="sprint" \
  --task-id="$NEW_ID" \
  --title="Case Study: $CLIENT_NAME" \
  --type="docs" \
  --priority="medium" \
  --assignee="[Echo]"
```

---

## STEP 7: Client Approval Workflow
**Executor**: [Codey] (Lead)

### Approval Checklist:
```
CLIENT APPROVAL REQUIRED:
=========================

Before Publishing:
[ ] Client reviewed and approved content
[ ] Metrics verified as accurate
[ ] Testimonial quote approved
[ ] Logo usage permission confirmed
[ ] No confidential information exposed
[ ] Legal/NDA compliance verified

Approval Status: [Pending | Approved | Revisions Requested]
Approved By: [Client contact name]
Approval Date: [Date]
```

### Approval Request Template:
```
Subject: Case Study Review - [Your Company] x [Client Name]

Hi [Client Contact],

We've drafted a case study highlighting our work together and the great results you achieved.

Please review the attached/linked draft and confirm:
1. All metrics are accurate
2. The testimonial quote is approved
3. We have permission to use your company logo
4. No confidential information is included

Draft Link: [Link to preview]

Please reply with your approval or any requested changes.

Best regards,
[Your Name]
```

---

## STEP 8: Publishing
**Executor**: [Codey] (Lead)

### Pre-Publish Actions:
```bash
# Update sitemap
php lib/update-sitemap.php

# Commit case study
git add "$CASE_STUDY_PATH"
git add "$IMAGE_PATH"
git commit -m "content: add case study - $CLIENT_NAME

Case Study: $CLIENT_NAME - $RESULT_HEADLINE
Industry: $INDUSTRY
Services: $SERVICES

Client approved: [Date]

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Promotion Plan:
```
CASE STUDY PROMOTION:
=====================

Immediate:
[ ] Share on LinkedIn (company page)
[ ] Share on LinkedIn (personal profiles)
[ ] Tweet/X with key metric highlight
[ ] Add to portfolio/work page

Within Week:
[ ] Include in email newsletter
[ ] Add to sales deck
[ ] Update relevant service pages
[ ] Share in industry communities

Ongoing:
[ ] Reference in proposals
[ ] Use in sales conversations
[ ] Link from related blog posts
```

---

## FINAL REPORT
**Executor**: [Codey] (Lead)

```
CASE STUDY CREATION COMPLETE
=============================

Case Study Details:
- Client: [CLIENT_NAME]
- Title: [RESULT_HEADLINE]
- Industry: [INDUSTRY]
- Date: [POST_DATE]

Key Results Highlighted:
- [METRIC_1]: [VALUE]
- [METRIC_2]: [VALUE]
- [METRIC_3]: [VALUE]

Files Created:
- Content: [CASE_STUDY_PATH]
- Hero Image: [IMAGE_PATH]

Client Approval: [Pending | Approved]

Kanban:
- Task #[NEW_ID] created

URLs:
- Local: [LOCAL_DEV_URL]/case-studies/[SLUG]
- Production: [PRODUCTION_URL]/case-studies/[SLUG]

Next Steps:
1. Complete content writing
2. Create visual assets
3. Get client approval
4. Publish and promote
```

---

## CONFIGURATION

```json
{
  "content": {
    "case_studies_path": "/content/case-studies",
    "case_study_image_path": "/assets/images/case-studies",
    "require_client_approval": true,
    "industries": ["technology", "healthcare", "finance", "retail", "education"],
    "services": ["web-design", "seo", "development", "marketing"]
  }
}
```

---

**Command Status**: SITE-SPECIFIC TEMPLATE
**Customization Required**: Yes - update paths and approval workflow
**Last Updated**: 2025-01-01
**Maintainer**: [Echo] (Content Strategist)
