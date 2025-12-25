# [RunSEOAudit] - SEO Audit Automation

**Version**: 1.0.0
**Command**: `[RunSEOAudit]` or `/runseoaudit`
**Type**: SITE-SPECIFIC (customize per project)
**Trigger**: Type to run comprehensive SEO audit on site
**Purpose**: Automated SEO health check with actionable recommendations
**Executor**: [Bran] (SEO Lead), [Syntax] (Technical), [Verity] (QA)

---

## AUTO-EXECUTION INSTRUCTIONS

**You are now executing the SEO Audit workflow. This analyzes on-page SEO, technical SEO, and content optimization.**

---

## STEP 1: Technical SEO Audit
**Executor**: [Syntax] (Lead)

### Automated Checks:

```bash
# 1. Check robots.txt exists and is valid
ROBOTS_URL="[PRODUCTION_URL]/robots.txt"
ROBOTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$ROBOTS_URL")

# 2. Check sitemap.xml exists
SITEMAP_URL="[PRODUCTION_URL]/sitemap.xml"
SITEMAP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITEMAP_URL")

# 3. Check HTTPS redirect
HTTP_REDIRECT=$(curl -s -o /dev/null -w "%{http_code}" -L "http://[DOMAIN]")

# 4. Check page load time
LOAD_TIME=$(curl -s -o /dev/null -w "%{time_total}" "[PRODUCTION_URL]")
```

### Technical Checklist:
```
TECHNICAL SEO AUDIT:
====================

Crawlability:
[ ] robots.txt exists and valid (HTTP $ROBOTS_STATUS)
[ ] sitemap.xml exists and valid (HTTP $SITEMAP_STATUS)
[ ] No blocked important pages
[ ] Crawl budget optimized

Security:
[ ] HTTPS enabled site-wide
[ ] HTTP redirects to HTTPS
[ ] SSL certificate valid
[ ] Security headers present

Performance:
[ ] Page load time: ${LOAD_TIME}s (target: <3s)
[ ] Core Web Vitals passing
[ ] Images optimized
[ ] CSS/JS minified

Mobile:
[ ] Mobile-friendly design
[ ] Viewport meta tag present
[ ] Touch targets sized correctly
[ ] No horizontal scroll
```

---

## STEP 2: On-Page SEO Audit
**Executor**: [Bran] (Lead)

### Page-by-Page Analysis:

```
ON-PAGE SEO CHECKLIST:
======================

For Each Page, Verify:

Title Tag:
[ ] Unique per page
[ ] Under 60 characters
[ ] Contains target keyword
[ ] Compelling for clicks

Meta Description:
[ ] Unique per page
[ ] 150-160 characters
[ ] Contains target keyword
[ ] Has call-to-action

Headings:
[ ] Single H1 per page
[ ] H1 contains primary keyword
[ ] Logical heading hierarchy (H1 > H2 > H3)
[ ] Keywords in H2s where natural

Content:
[ ] Minimum 300 words (most pages)
[ ] Primary keyword in first 100 words
[ ] Related keywords used naturally
[ ] Internal links present
[ ] External links to authority sites

Images:
[ ] Alt text on all images
[ ] Descriptive filenames
[ ] Compressed for web
[ ] Lazy loading enabled

URL Structure:
[ ] Clean, readable URLs
[ ] Keywords in URL
[ ] No unnecessary parameters
[ ] Consistent structure
```

### Automated Page Scan:
```bash
# Scan key pages
PAGES=(
    "/"
    "/about"
    "/services"
    "/blog"
    "/contact"
)

for PAGE in "${PAGES[@]}"; do
    echo "Scanning: [PRODUCTION_URL]$PAGE"

    # Get page HTML
    HTML=$(curl -s "[PRODUCTION_URL]$PAGE")

    # Extract title
    TITLE=$(echo "$HTML" | grep -oP '<title>\K[^<]+')
    TITLE_LEN=${#TITLE}

    # Extract meta description
    META=$(echo "$HTML" | grep -oP 'name="description" content="\K[^"]+')
    META_LEN=${#META}

    # Count H1 tags
    H1_COUNT=$(echo "$HTML" | grep -c '<h1')

    echo "  Title ($TITLE_LEN chars): $TITLE"
    echo "  Meta ($META_LEN chars): ${META:0:50}..."
    echo "  H1 tags: $H1_COUNT"
    echo ""
done
```

---

## STEP 3: Schema.org Validation
**Executor**: [Bran] (Lead)

### Schema Checklist:
```
SCHEMA.ORG AUDIT:
=================

Required Schema Types:
[ ] Organization (homepage)
[ ] WebSite (homepage)
[ ] BreadcrumbList (all pages)
[ ] BlogPosting (blog posts)
[ ] LocalBusiness (if applicable)
[ ] FAQPage (FAQ sections)
[ ] Article (articles/guides)

Validation:
[ ] Valid JSON-LD syntax
[ ] No errors in Google Rich Results Test
[ ] Required properties present
[ ] Recommended properties added
```

### Schema Extraction:
```bash
# Extract JSON-LD from pages
curl -s "[PRODUCTION_URL]" | grep -oP '<script type="application/ld\+json">\K[^<]+'
```

---

## STEP 4: Content Audit
**Executor**: [Echo] (Lead)

### Content Analysis:
```
CONTENT AUDIT:
==============

Blog Posts:
- Total posts: [count]
- Posts this month: [count]
- Average word count: [count]
- Posts needing update: [list old posts]

Page Content:
[ ] All service pages have unique content
[ ] About page tells company story
[ ] Contact info consistent
[ ] CTAs on all pages

Content Gaps:
- Topics competitors cover that we don't
- Keywords with search volume but no content
- Questions customers ask with no answers

Duplicate Content:
[ ] No duplicate title tags
[ ] No duplicate meta descriptions
[ ] Canonical tags properly set
[ ] No thin/low-value pages
```

---

## STEP 5: Link Analysis
**Executor**: [Bran] (Lead)

### Internal Links:
```
INTERNAL LINK AUDIT:
====================

Link Structure:
[ ] Homepage links to key pages
[ ] Key pages linked from navigation
[ ] Blog posts cross-link related content
[ ] Orphan pages identified and linked

Anchor Text:
[ ] Descriptive anchor text used
[ ] Avoiding "click here" links
[ ] Keyword-rich where appropriate
[ ] Natural, varied anchor text
```

### Broken Link Check:
```bash
# Find broken internal links
# Use tool like wget or custom script
wget --spider -r -nd -nv -H -l 2 -w 1 -o links.log [PRODUCTION_URL]
grep -B1 'broken link' links.log
```

---

## STEP 6: Competitor Analysis (Quick)
**Executor**: [Bran] (Lead)

### Competitor Snapshot:
```
COMPETITOR SEO COMPARISON:
==========================

Competitor 1: [Name]
- Domain Authority: [Score]
- Estimated Traffic: [Range]
- Top Keywords: [List]
- Content Strategy: [Blog frequency, content types]

Competitor 2: [Name]
- Domain Authority: [Score]
- Estimated Traffic: [Range]
- Top Keywords: [List]
- Content Strategy: [Blog frequency, content types]

Opportunities:
- Keywords they rank for that we don't
- Content types they're missing
- Backlink gaps
```

---

## STEP 7: Generate SEO Report
**Executor**: [Codey] (Lead)

### Complete Report Template:
```
SEO AUDIT REPORT
=================
**Site**: [PRODUCTION_URL]
**Date**: [Current Date]
**Auditor**: [Bran] (Automated by Claude)

---

EXECUTIVE SUMMARY:

SEO Health Score: [X]/100

Critical Issues: [count]
Warnings: [count]
Passed Checks: [count]

Top 3 Priorities:
1. [Highest impact issue]
2. [Second priority]
3. [Third priority]

---

TECHNICAL SEO:

Status: [Good/Needs Work/Critical]

 Robots.txt: [Present/Missing]
 Sitemap.xml: [Present/Missing/Errors]
 HTTPS: [Enabled/Partial/Missing]
 Page Speed: [Fast/Average/Slow] (${LOAD_TIME}s)
 Mobile-Friendly: [Yes/No/Partial]

Issues Found:
- [List technical issues]

Recommendations:
- [List fixes]

---

ON-PAGE SEO:

Status: [Good/Needs Work/Critical]

Pages Audited: [count]
Title Issues: [count]
Meta Description Issues: [count]
Heading Issues: [count]
Content Issues: [count]

Page-by-Page Summary:
| Page | Title | Meta | H1 | Status |
|------|-------|------|-----|--------|
| / | 55 chars | 148 chars | 1 | OK |
| /about | 72 chars | Missing | 1 | FIX |
...

Recommendations:
- [List fixes]

---

SCHEMA.ORG:

Status: [Good/Needs Work/Missing]

Schema Types Present:
- [List found schemas]

Missing Recommended:
- [List missing schemas]

Recommendations:
- [List fixes]

---

CONTENT:

Status: [Good/Needs Work/Critical]

Blog Posts: [count]
Publishing Frequency: [X posts/month]
Average Content Length: [X words]

Content Gaps Identified:
- [Topic 1]
- [Topic 2]

Recommendations:
- [List content opportunities]

---

ACTION PLAN:

Immediate (This Week):
1. [Critical fix 1]
2. [Critical fix 2]

Short-Term (This Month):
1. [Important improvement 1]
2. [Important improvement 2]

Ongoing:
1. [Regular task 1]
2. [Regular task 2]

---

**Next Audit Scheduled**: [Date + 30 days]
**Report Generated By**: [ProcessSEOAudit] Automation
```

---

## STEP 8: Create Action Items
**Executor**: [Codey] (Lead)

### Add to Kanban:
```bash
# Create cards for critical issues
for ISSUE in "${CRITICAL_ISSUES[@]}"; do
    node /docs-framework/automation/kanban-updater.js \
      --action="add" \
      --column="backlog" \
      --title="SEO: $ISSUE" \
      --type="bug" \
      --priority="high" \
      --assignee="[Bran]"
done
```

---

## CONFIGURATION

```json
{
  "seo_audit": {
    "pages_to_audit": ["/", "/about", "/services", "/blog", "/contact"],
    "competitors": ["competitor1.com", "competitor2.com"],
    "target_load_time": 3.0,
    "min_content_length": 300,
    "audit_frequency_days": 30
  }
}
```

---

**Command Status**: SITE-SPECIFIC TEMPLATE
**Customization Required**: Yes - update target pages and competitors
**Last Updated**: 2025-01-01
**Maintainer**: [Bran] (SEO Specialist)
