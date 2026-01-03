# [CreateBlogPost] - Blog Post Creation Automation

**Version**: 1.0.0
**Command**: `[CreateBlogPost]` or `/createblogpost`
**Type**: SITE-SPECIFIC (customize per project)
**Trigger**: Type when creating a new blog post
**Purpose**: Automate blog post scaffolding, SEO setup, and content workflow
**Executor**: [Echo] (Content Lead), [Bran] (SEO), [Aesthetica] (Design)

---

## AUTO-EXECUTION INSTRUCTIONS

**You are now executing the [BlogCreation] workflow. This creates all required files and sets up proper SEO from the start.**

---

## STEP 1: Gather Blog Post Information
**Executor**: [Echo] (Lead), [Cipher] (StoryBrand Support)

### Required Information:
```
BLOG POST BRIEF:
================

Title: [Ask user or suggest based on topic]
Slug: [auto-generate from title, kebab-case]
Author: [Default: PRODUCT_OWNER or specify]
Category: [technology|business|tutorial|case-study|news]
Target Keywords: [primary keyword, secondary keywords]
Meta Description: [150-160 characters for SEO]

Content Type:
[ ] How-to/Tutorial
[ ] Opinion/Thought Leadership
[ ] News/Announcement
[ ] Case Study Summary
[ ] Listicle
[ ] Deep Dive

Target Audience: [Who is this for?]
Call-to-Action: [What should reader do next?]
```

### Auto-Generate Suggestions:
```bash
# Generate slug from title
SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-')

# Generate date
POST_DATE=$(date +%Y-%m-%d)

# Generate file path
BLOG_PATH="[CONTENT_BLOG_PATH]/${POST_DATE}-${SLUG}.md"
IMAGE_PATH="[ASSETS_IMAGES]/blogs/${POST_DATE}-${SLUG}.png"
```

---

## STEP 2: Create Blog Post File
**Executor**: [Echo] (Lead)

### Actions to Execute:

**Create markdown file from template:**
```bash
BLOG_CONTENT="---
title: \"$TITLE\"
slug: \"$SLUG\"
date: \"$POST_DATE\"
author: \"[AUTHOR_NAME]\"
description: \"$META_DESCRIPTION\"
keywords: \"$KEYWORDS\"
category: \"$CATEGORY\"
tags: [$TAGS]
image: \"$IMAGE_PATH\"
image_alt: \"$IMAGE_ALT\"
featured: false
draft: true
---

# $TITLE

[HOOK - Opening paragraph that captures attention]

## The Problem

[Describe the challenge your reader faces]

## The Solution

[Present your solution or key insight]

### Key Point 1

[Expand on first major point]

### Key Point 2

[Expand on second major point]

### Key Point 3

[Expand on third major point]

## Practical Application

[How readers can apply this information]

## Conclusion

[Summarize key takeaways]

---

**Ready to [desired action]?** [Call-to-action with link]
"

echo "$BLOG_CONTENT" > "$BLOG_PATH"
echo "Blog post created at: $BLOG_PATH"
```

---

## STEP 3: SEO Optimization Checklist
**Executor**: [Bran] (Lead)

### SEO Requirements:
```
SEO CHECKLIST:
==============

Title Tag:
[ ] Contains primary keyword
[ ] Under 60 characters
[ ] Compelling and click-worthy

Meta Description:
[ ] Contains primary keyword
[ ] 150-160 characters
[ ] Includes call-to-action

URL/Slug:
[ ] Contains primary keyword
[ ] Short and descriptive
[ ] No stop words

Content:
[ ] Primary keyword in first 100 words
[ ] H2/H3 headings include keywords
[ ] Internal links to related content
[ ] External links to authoritative sources
[ ] Image alt text optimized

Schema.org:
[ ] BlogPosting schema will be auto-generated
[ ] Author information complete
[ ] datePublished and dateModified set
```

### Auto-Generate Schema Preview:
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "[TITLE]",
  "description": "[META_DESCRIPTION]",
  "author": {
    "@type": "Person",
    "name": "[AUTHOR_NAME]"
  },
  "datePublished": "[POST_DATE]",
  "image": "[IMAGE_PATH]",
  "keywords": "[KEYWORDS]"
}
```

---

## STEP 4: Create Blog Image
**Executor**: [Aesthetica] (Lead)

### Image Requirements:
```
BLOG IMAGE SPECIFICATIONS:
==========================

Dimensions: 1200x630px (16:9 aspect ratio)
Format: PNG preferred
File Size: Under 500KB (optimize for web)
Location: [ASSETS_IMAGES]/blogs/[POST_DATE]-[SLUG].png

Design Guidelines:
- Clear, readable text if text overlay
- Brand colors and fonts
- High contrast for accessibility
- Works at both 256px and 384px display heights

Placeholder Command (if no image ready):
Create a placeholder image note in the post frontmatter:
image: "/assets/images/blogs/placeholder.png"
image_status: "pending"
```

### Image Checklist:
```
[ ] Image created at correct dimensions
[ ] Image optimized for web
[ ] Alt text written
[ ] Image placed in correct folder
[ ] Frontmatter image path updated
```

---

## STEP 5: Create Kanban Card
**Executor**: [Codey] (Lead)

### Actions to Execute:
```bash
# Generate task ID (next available)
LAST_ID=$(grep -oP 'data-id="\K\d+' "$KANBAN_FILE" | sort -n | tail -1)
NEW_ID=$((LAST_ID + 1))

# Create kanban card HTML
CARD_HTML="<div class=\"kanban-card bg-white rounded-lg p-3 mb-2 shadow-sm priority-medium\" data-id=\"$NEW_ID\" data-type=\"docs\" data-priority=\"medium\">
    <h4 class=\"font-medium text-sm text-gray-800\">#$NEW_ID - Blog: $TITLE</h4>
    <p class=\"text-xs text-gray-500 mt-1\">Create and publish blog post</p>
    <div class=\"flex items-center justify-between mt-2\">
        <span class=\"card-assignee text-xs text-gray-600\">[Echo]</span>
        <span class=\"card-status text-xs\">Draft</span>
    </div>
</div>"

# Add to Sprint column using kanban-updater or manual insert
node /.autopilot/automation/kanban-updater.js \
  --action="add" \
  --column="sprint" \
  --card-html="$CARD_HTML"
```

---

## STEP 6: Content Writing Guide
**Executor**: [Echo] (Lead), [Cipher] (StoryBrand)

### StoryBrand Framework Application:
```
STORYBRAND STRUCTURE:
=====================

1. HERO (The Reader)
   - Who is struggling with [problem]?
   - What do they want to achieve?

2. PROBLEM (External, Internal, Philosophical)
   - External: [Tangible problem they face]
   - Internal: [How it makes them feel]
   - Philosophical: [Why this is wrong/unfair]

3. GUIDE (You/Your Company)
   - Show empathy for their struggle
   - Demonstrate authority to help

4. PLAN (Clear Steps)
   - Step 1: [First action]
   - Step 2: [Second action]
   - Step 3: [Third action]

5. CALL TO ACTION
   - Primary CTA: [Main action to take]
   - Transitional CTA: [Lower commitment option]

6. SUCCESS (Paint the Picture)
   - What life looks like after following advice

7. FAILURE (Stakes)
   - What happens if they don't act
```

---

## STEP 7: Publishing Workflow
**Executor**: [Codey] (Lead)

### Pre-Publish Checklist:
```
PUBLISHING CHECKLIST:
=====================

Content:
[ ] Proofread for spelling/grammar
[ ] All links working
[ ] Code examples tested (if applicable)
[ ] Images display correctly

SEO:
[ ] Meta description complete
[ ] Keywords placed naturally
[ ] Internal links added
[ ] Schema.org will generate correctly

Technical:
[ ] Draft flag set to false
[ ] Correct date set
[ ] Category and tags assigned
[ ] Sitemap will update automatically

Promotion:
[ ] Social media posts drafted
[ ] Newsletter mention planned
[ ] Related content linked
```

### Publish Actions:
```bash
# Change draft to false
sed -i 's/draft: true/draft: false/' "$BLOG_PATH"

# Commit the blog post
git add "$BLOG_PATH"
git add "$IMAGE_PATH"
git commit -m "content: add blog post - $TITLE

New blog post: $TITLE
Category: $CATEGORY
Author: [AUTHOR_NAME]

Co-Authored-By: Claude <noreply@anthropic.com>"

echo "Blog post ready for deployment"
```

---

## STEP 8: Post-Publish Actions
**Executor**: [Bran] (Lead)

### After Deployment:
```bash
# Update sitemap (if not automatic)
php lib/update-sitemap.php

# Verify post is live
curl -s -o /dev/null -w "%{http_code}" "[PRODUCTION_URL]/blog/$SLUG"

# Submit to search engines (optional)
# ping sitemap to Google Search Console
```

### Promotion Checklist:
```
POST-PUBLISH PROMOTION:
=======================

[ ] Share on LinkedIn
[ ] Share on Twitter/X
[ ] Share in relevant communities
[ ] Include in next newsletter
[ ] Update internal documentation if relevant
[ ] Notify stakeholders
```

---

## FINAL REPORT
**Executor**: [Codey] (Lead)

```
BLOG POST CREATION COMPLETE
============================

Post Details:
- Title: [TITLE]
- Slug: [SLUG]
- Date: [POST_DATE]
- Author: [AUTHOR_NAME]
- Category: [CATEGORY]

Files Created:
- Content: [BLOG_PATH]
- Image: [IMAGE_PATH]

Kanban:
- Task #[NEW_ID] created in Sprint column

Status: [Draft | Published]

URLs:
- Local: [LOCAL_DEV_URL]/blog/[SLUG]
- Production: [PRODUCTION_URL]/blog/[SLUG]

Next Steps:
1. Write/complete content
2. Create featured image
3. Run [TaskQA] when ready for review
4. Publish and promote
```

---

## CONFIGURATION

### Customize for your project:
```json
{
  "content": {
    "blog_path": "/content/blog",
    "blog_image_path": "/assets/images/blogs",
    "blog_image_dimensions": "1200x630",
    "default_author": "[AUTHOR_NAME]",
    "categories": ["technology", "business", "tutorial", "case-study", "news"],
    "auto_sitemap_update": true
  }
}
```

---

**Command Status**: SITE-SPECIFIC TEMPLATE
**Customization Required**: Yes - update paths and defaults
**Last Updated**: 2025-01-01
**Maintainer**: [Echo] (Content Strategist)
