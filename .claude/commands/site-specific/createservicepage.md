# [CreateServicePage] - Service Page Creation Automation

**Version**: 1.0.0
**Command**: `[CreateServicePage]` or `/createservicepage`
**Type**: SITE-SPECIFIC (customize per project)
**Trigger**: Type when adding a new service offering
**Purpose**: Create conversion-optimized service page with proper structure
**Executor**: [Cipher] (StoryBrand Lead), [Aesthetica] (Design), [Bran] (SEO)

---

## AUTO-EXECUTION INSTRUCTIONS

**You are now executing the Service Page Creation workflow. This creates a conversion-focused service page using StoryBrand framework.**

---

## STEP 1: Gather Service Information
**Executor**: [Cipher] (Lead)

### Required Information:
```
SERVICE PAGE BRIEF:
===================

Service Details:
- Service Name: [Name]
- Service Slug: [url-friendly-name]
- Service Category: [Category if multiple services]
- Price Range: [If applicable]
- Delivery Timeline: [Typical duration]

Target Customer:
- Who needs this service?
- What problem are they facing?
- What have they tried before?
- What's their biggest fear?
- What does success look like for them?

Service Features:
- Feature 1: [Feature + benefit]
- Feature 2: [Feature + benefit]
- Feature 3: [Feature + benefit]

Differentiators:
- What makes this service unique?
- Why choose you over competitors?

Social Proof:
- Testimonials available?
- Case studies to link?
- Metrics/results to highlight?
```

---

## STEP 2: Apply StoryBrand Framework
**Executor**: [Cipher] (Lead)

### Page Structure (StoryBrand SB7):
```
STORYBRAND SERVICE PAGE STRUCTURE:
===================================

1. HERO SECTION (Above the fold)
   - Headline: [Clear statement of what you offer]
   - Subheadline: [How it helps the customer]
   - Primary CTA: [Main action button]
   - Hero image: [Relevant visual]

2. PROBLEM SECTION
   - External Problem: [Tangible issue]
   - Internal Problem: [How it makes them feel]
   - Philosophical Problem: [Why it's wrong]

3. GUIDE SECTION (Position yourself)
   - Empathy statement
   - Authority markers (experience, credentials, results)

4. PLAN SECTION (3-step process)
   - Step 1: [First step customer takes]
   - Step 2: [Second step]
   - Step 3: [Third step / result]

5. CALL TO ACTION
   - Primary CTA: [Direct action - "Get Started"]
   - Transitional CTA: [Lower commitment - "Learn More"]

6. SUCCESS SECTION
   - Paint the picture of life after using service
   - Specific outcomes and benefits

7. FAILURE SECTION (Stakes)
   - What happens if they don't act?
   - Implied consequences

8. SOCIAL PROOF
   - Testimonials
   - Case study snippets
   - Trust badges/logos
   - Results metrics

9. FAQ SECTION
   - Common questions
   - Objection handling

10. FINAL CTA
    - Repeat primary call to action
    - Contact information
```

---

## STEP 3: Create Service Page File
**Executor**: [Aesthetica] (Lead)

### Page Template:
```php
<?php
// pages/services/[service-slug].php

$pageTitle = "[SERVICE_NAME] | [COMPANY_NAME]";
$pageDescription = "[META_DESCRIPTION]";
$pageKeywords = "[service], [related terms], [location if local]";

include '../includes/header.php';
?>

<!-- Hero Section -->
<section class="hero bg-gradient-to-r from-primary to-secondary py-20">
    <div class="container mx-auto px-4 text-center text-white">
        <h1 class="text-4xl md:text-5xl font-bold mb-4">
            [HEADLINE - What You Offer]
        </h1>
        <p class="text-xl mb-8 max-w-2xl mx-auto">
            [SUBHEADLINE - How It Helps]
        </p>
        <div class="flex justify-center gap-4">
            <a href="#contact" class="btn btn-primary">Get Started</a>
            <a href="#how-it-works" class="btn btn-secondary">Learn More</a>
        </div>
    </div>
</section>

<!-- Problem Section -->
<section class="py-16 bg-gray-50">
    <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">
            [PROBLEM HEADLINE]
        </h2>
        <div class="grid md:grid-cols-3 gap-8">
            <div class="text-center">
                <div class="text-4xl mb-4">[ICON]</div>
                <h3 class="font-semibold mb-2">[External Problem]</h3>
                <p>[Description]</p>
            </div>
            <div class="text-center">
                <div class="text-4xl mb-4">[ICON]</div>
                <h3 class="font-semibold mb-2">[Internal Problem]</h3>
                <p>[Description]</p>
            </div>
            <div class="text-center">
                <div class="text-4xl mb-4">[ICON]</div>
                <h3 class="font-semibold mb-2">[Philosophical Problem]</h3>
                <p>[Description]</p>
            </div>
        </div>
    </div>
</section>

<!-- Guide Section -->
<section class="py-16">
    <div class="container mx-auto px-4">
        <div class="grid md:grid-cols-2 gap-12 items-center">
            <div>
                <h2 class="text-3xl font-bold mb-4">We Understand [Their Struggle]</h2>
                <p class="mb-4">[Empathy statement]</p>
                <p class="mb-4">[Authority statement with credentials/experience]</p>
                <ul class="space-y-2">
                    <li>[Credential/Trust marker 1]</li>
                    <li>[Credential/Trust marker 2]</li>
                    <li>[Credential/Trust marker 3]</li>
                </ul>
            </div>
            <div>
                <img src="/assets/images/services/[image].png" alt="[Alt text]" class="rounded-lg shadow-lg">
            </div>
        </div>
    </div>
</section>

<!-- Plan Section -->
<section id="how-it-works" class="py-16 bg-gray-50">
    <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div class="grid md:grid-cols-3 gap-8">
            <div class="text-center">
                <div class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
                <h3 class="font-semibold mb-2">[Step 1 Title]</h3>
                <p>[Step 1 Description]</p>
            </div>
            <div class="text-center">
                <div class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
                <h3 class="font-semibold mb-2">[Step 2 Title]</h3>
                <p>[Step 2 Description]</p>
            </div>
            <div class="text-center">
                <div class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
                <h3 class="font-semibold mb-2">[Step 3 Title]</h3>
                <p>[Step 3 Description]</p>
            </div>
        </div>
    </div>
</section>

<!-- Success Section -->
<section class="py-16">
    <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold mb-8">Imagine [Success State]</h2>
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="p-6 bg-green-50 rounded-lg">
                <div class="text-3xl font-bold text-green-600 mb-2">[Metric]</div>
                <p>[Benefit description]</p>
            </div>
            <!-- Repeat for other success metrics -->
        </div>
    </div>
</section>

<!-- Testimonials -->
<section class="py-16 bg-gray-50">
    <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">What Our Clients Say</h2>
        <div class="grid md:grid-cols-2 gap-8">
            <blockquote class="bg-white p-6 rounded-lg shadow">
                <p class="italic mb-4">"[Testimonial quote]"</p>
                <cite class="font-semibold">— [Name], [Title] at [Company]</cite>
            </blockquote>
            <!-- Repeat for other testimonials -->
        </div>
    </div>
</section>

<!-- FAQ Section -->
<section class="py-16">
    <div class="container mx-auto px-4 max-w-3xl">
        <h2 class="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div class="space-y-4">
            <details class="bg-gray-50 rounded-lg p-4">
                <summary class="font-semibold cursor-pointer">[Question 1]</summary>
                <p class="mt-2">[Answer 1]</p>
            </details>
            <!-- Repeat for other FAQs -->
        </div>
    </div>
</section>

<!-- Final CTA -->
<section id="contact" class="py-16 bg-primary text-white">
    <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold mb-4">Ready to [Desired Outcome]?</h2>
        <p class="mb-8 text-xl">[Final value proposition]</p>
        <a href="/contact" class="btn btn-white">Get Started Today</a>
    </div>
</section>

<?php include '../includes/footer.php'; ?>
```

---

## STEP 4: SEO Optimization
**Executor**: [Bran] (Lead)

### SEO Checklist:
```
SERVICE PAGE SEO:
=================

Title Tag: "[Service Name] Services | [Company] - [Location if local]"
Meta Description: "[Service] helps you [benefit]. [Unique value prop]. Get started today."

Target Keywords:
- Primary: [service name]
- Secondary: [service + location], [service + industry]
- Long-tail: [how to + problem service solves]

On-Page:
[ ] H1 contains primary keyword
[ ] Service name in first paragraph
[ ] Benefits-focused content
[ ] Internal links to related services
[ ] Link to relevant case studies

Schema.org:
[ ] Service schema
[ ] Organization schema
[ ] FAQ schema (for FAQ section)
[ ] Review schema (for testimonials)
```

### Service Schema:
```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "[SERVICE_NAME]",
  "description": "[SERVICE_DESCRIPTION]",
  "provider": {
    "@type": "Organization",
    "name": "[COMPANY_NAME]"
  },
  "areaServed": "[LOCATION]",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "[SERVICE_NAME]",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "[SERVICE_FEATURE]"
        }
      }
    ]
  }
}
```

---

## STEP 5: Create Assets
**Executor**: [Aesthetica] (Lead)

### Required Images:
```
SERVICE PAGE ASSETS:
====================

1. Hero Image
   - Dimensions: 1920x1080px (or responsive)
   - Show service in action or result

2. Service Icon
   - Dimensions: 128x128px
   - Used in service listings

3. Process Step Icons
   - Dimensions: 64x64px
   - One per step in process

4. Testimonial Photos
   - Dimensions: 100x100px
   - Client headshots (with permission)

5. Open Graph Image
   - Dimensions: 1200x630px
   - For social sharing
```

---

## STEP 6: Add to Navigation
**Executor**: [Aesthetica] (Lead)

### Update Navigation:
```php
// includes/navigation.php
// Add service to menu structure

$services = [
    [
        'name' => '[SERVICE_NAME]',
        'slug' => '[service-slug]',
        'description' => '[Short description]'
    ],
    // ... other services
];
```

### Update Footer:
```php
// includes/footer.php
// Add service link to footer services list
```

---

## FINAL REPORT

```
SERVICE PAGE CREATION COMPLETE
===============================

Service: [SERVICE_NAME]
URL: [PRODUCTION_URL]/services/[service-slug]
Status: [Draft | Published]

Files Created:
- Page: /pages/services/[service-slug].php
- Hero Image: /assets/images/services/[slug]-hero.png
- OG Image: /assets/images/services/[slug]-og.png

StoryBrand Elements:
[X] Hero with clear headline and CTA
[X] Problem section (3 levels)
[X] Guide positioning (empathy + authority)
[X] 3-step plan
[X] Success vision
[X] Social proof
[X] FAQ section
[X] Final CTA

SEO:
[X] Meta tags optimized
[X] Schema.org Service markup
[X] Internal linking configured

Navigation:
[X] Added to main menu
[X] Added to footer

Next Steps:
1. Write final copy
2. Add testimonials
3. Create images
4. QA review: [TaskQA]
```

---

## CONFIGURATION

```json
{
  "services": {
    "page_template": "/templates/service-page.php",
    "image_path": "/assets/images/services",
    "categories": ["web-design", "development", "seo", "marketing"],
    "pricing_display": false,
    "schema_type": "Service"
  }
}
```

---

**Command Status**: SITE-SPECIFIC TEMPLATE
**Customization Required**: Yes - update template paths and styling
**Last Updated**: 2025-01-01
**Maintainer**: [Cipher] (StoryBrand) / [Aesthetica] (Design)
