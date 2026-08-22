# AI Food Recognition & Recipe Discovery — Project Brief

## 1. Project Overview

Build a consumer mobile application that allows users to take a photo of a dish and discover what the dish most likely is, what ingredients it probably contains, and — most importantly — how to recreate it at home.

The core product concept is:

> **Snap a dish → Recognize it → Find the closest recipe → Cook it**

The product should not be positioned merely as an "AI recipe generator."

The stronger product proposition is:

> **Find the recipe behind the food you see.**

The long-term vision is to become a "Shazam for food": a visual food recognition and recipe discovery platform that connects real-world dishes with recipes, ingredients, restaurants, chefs, videos, and cooking instructions.

---

# 2. Problem

People frequently encounter food they would like to recreate:

- a dish they ate at a restaurant
- food seen on social media
- a meal prepared by someone else
- an unfamiliar dish while traveling
- food photographed from a cookbook or menu
- leftovers or ingredients they want to identify

Existing AI applications can often identify a dish and generate a plausible recipe.

However, this is not necessarily the same as answering:

> "What recipe was this particular dish probably made from?"

A photo cannot reliably reveal exact quantities, hidden ingredients, preparation techniques, or cooking times.

Therefore, the application must explicitly distinguish between:

1. **Visual recognition**
2. **Ingredient inference**
3. **Recipe retrieval**
4. **Recipe generation**
5. **Confidence / uncertainty**

The system should avoid presenting AI guesses as facts.

---

# 3. Market Context

The basic "photo → recipe" concept is already validated.

Existing products and competitors include applications such as:

- Picnic
- DishDetect
- DishDNA
- BiteFrame
- AI Recipe Snap
- Recipe Scanner / similar food-scanning applications
- Snapcipe
- Pluck
- Kella

These products demonstrate demand for:

- food image recognition
- image-to-recipe generation
- ingredient detection
- nutrition analysis
- shopping lists
- recipe saving
- hands-free cooking

Therefore:

> **Do NOT build a generic image-to-recipe wrapper.**

The product needs a stronger differentiation strategy.

---

# 4. Core Differentiation

The primary differentiator should be:

## Recipe Retrieval Instead of Recipe Generation

When the user photographs a dish, the system should first attempt to find the most likely existing recipe or recipe family.

Instead of:

> "This looks like chicken tikka masala, so here is an AI-generated chicken tikka masala recipe."

Prefer:

> "This appears to be chicken tikka masala. We found 5 recipes that closely match the visual characteristics and inferred ingredients. This one is the closest match."

The system should rank recipes based on multiple signals:

- dish classification
- cuisine
- inferred ingredients
- ingredient combinations
- visual characteristics
- sauce characteristics
- protein
- garnish
- preparation technique
- texture
- recipe metadata
- regional variations
- potentially restaurant information
- potentially user-provided contextual information

The result should include a **confidence / match score**.

Example:

```text
Chicken Tikka Masala
93% recognition confidence

Closest recipes:

1. Chicken Tikka Masala — 92% match
2. Butter Chicken — 84% match
3. Chicken Korma — 73% match
```

---

# 5. Product Positioning

Potential positioning:

> **The Shazam for food.**

Or:

> **Take a photo. Discover the recipe. Cook it at home.**

The product should feel more like a food discovery engine than an AI chatbot.

---

# 6. Primary User Journey

## Step 1 — Capture

User opens the application.

Primary CTA:

> **Scan a dish**

User takes a photo.

---

## Step 2 — Recognition

The system analyzes the image.

Example:

```text
Chicken Tikka Masala

93% confidence

Likely ingredients:
✓ Chicken
✓ Tomato
✓ Onion
✓ Cream
✓ Garam masala

Possible:
? Garlic
? Ginger
? Butter
```

Do not represent uncertain ingredients as confirmed facts.

---

## Step 3 — User Confirmation

The application can optionally ask lightweight clarification questions.

Example:

> Was the sauce creamy?

Options:

- Yes
- No
- Not sure

Or:

> Did the dish contain cheese?

This additional context can substantially improve recipe retrieval.

Do not create unnecessary friction. Questions should only be asked when they materially improve confidence.

---

# 7. Recipe Matching

After recognition, retrieve and rank candidate recipes.

Example:

```text
We found 4 recipes that look similar.

#1 — 92% match
#2 — 84% match
#3 — 77% match
#4 — 71% match
```

Each recipe should explain the basis of the match where possible.

Example:

```text
Why this matches:

✓ Same main protein
✓ Similar sauce
✓ Similar garnish
✓ Same cuisine
✓ Similar ingredient profile
```

The application should distinguish:

- exact/official recipe
- likely recipe
- similar recipe
- AI-generated approximation

---

# 8. Recipe Confidence Model

A core product feature should be a **Recipe Confidence Engine**.

The system should separate confidence levels for different claims.

Example:

```text
Dish recognition: 94%

Chicken: 98%
Tomato: 91%
Cream: 72%
Garlic: 54%

Recipe match: 87%
```

Avoid false precision when appropriate. Scores may be normalized confidence indicators rather than claims of scientific certainty.

The UI should communicate uncertainty clearly and naturally.

---

# 9. Restaurant Mode

One potentially powerful future feature is **Restaurant Mode**.

Example user journey:

1. User eats at a restaurant.
2. User photographs the dish.
3. App identifies the dish.
4. App attempts to identify the restaurant or dish name.
5. App searches for the restaurant's menu or official recipe if available.
6. App provides the closest recreation recipe.

Example:

```text
Truffle Pasta

Likely restaurant:
Restaurant X

Official menu match:
✓ Truffle Pasta

Recipe:
Official restaurant recipe unavailable.

Closest recreation:
89% match
```

Long-term, restaurants could become partners.

Restaurants could provide official recipes or structured dish information.

The app could then attribute the dish to the restaurant and link users back to it.

This creates a potential B2B component in addition to the consumer product.

---

# 10. Initial Geographic Opportunity

Consider launching with a strong Bulgarian / European food focus.

Potential advantage:

## Many competitors are primarily designed around English-speaking global markets.

# 11. MVP Scope

The first version should remain deliberately small.

## MVP features

### 1. Photo capture

User photographs a dish.

### 2. AI food recognition

Identify the most likely dish.

### 3. Ingredient inference

Extract visible and probable ingredients.

### 4. Recipe retrieval

Find 3–5 relevant recipes.

### 5. Recipe ranking

Rank candidates based on visual and semantic similarity.

### 6. Best-match recipe

Present the strongest result.

### 7. Cooking mode

Convert the selected recipe into a simple step-by-step cooking experience.

### 8. Save

Allow users to save recipes.

---

# 12. Features Explicitly Out of Scope for Initial MVP

Do NOT prioritize these in the first release:

- extensive calorie tracking
- meal planning
- grocery delivery
- advanced nutrition analytics
- fridge scanning
- pantry management
- social network
- complex recipe creation tools
- large restaurant marketplace
- extensive gamification

These can be considered after validating the core workflow.

---

# 13. Cooking Mode

After selecting a recipe, the user should be able to enter:

> **Start Cooking**

The experience should be optimized for use while cooking.

Example:

```text
STEP 1

Dice the onion.

[Next]
```

Then:

```text
STEP 2

Heat 2 tbsp olive oil in a pan.

[Start Timer] [Next]
```

Future functionality:

- voice control
- hands-free navigation
- timers
- ingredient substitution
- serving-size adjustment
- metric/imperial conversion

---

# 14. Technical Architecture

Do not train a custom computer vision model for the initial MVP unless there is a compelling reason.

Start with existing multimodal AI capabilities.

High-level architecture:

```text
Mobile App
    ↓
Image Upload
    ↓
Vision / Multimodal Model
    ↓
Dish Recognition
    ↓
Ingredient Extraction
    ↓
Structured Food Representation
    ↓
Recipe Retrieval Engine
    ↓
Candidate Ranking
    ↓
LLM Reasoning / Normalization
    ↓
Structured Recipe
    ↓
Cooking UI
```

---

# 15. Structured Food Representation

Do not store recipes as unstructured text only.

Represent recipes using structured data.

Example:

```text
Recipe
├── dish_name
├── cuisine
├── region
├── ingredients
│   ├── ingredient
│   ├── quantity
│   └── unit
├── cooking_methods
├── preparation_steps
├── protein
├── sauce
├── garnish
├── texture
├── appearance
├── dietary_attributes
├── source
└── metadata
```

Similarly, convert image recognition results into a structured representation.

Example:

```text
DishObservation
├── dish_candidates
├── confidence
├── visible_ingredients
├── inferred_ingredients
├── cuisine
├── region
├── protein
├── sauce
├── garnish
├── appearance
└── contextual_information
```

---

# 16. Recipe Retrieval Engine

This should become one of the most important proprietary components of the product.

The engine should compare:

```text
DishObservation
        ↕
RecipeRepresentation
```

Potential retrieval signals:

- semantic similarity
- ingredient overlap
- ingredient importance
- cuisine match
- dish type
- protein match
- sauce match
- garnish match
- visual similarity
- cooking method
- regional match
- user context
- restaurant context

Consider using embeddings / vector search combined with structured filtering and ranking.

Do not rely exclusively on an LLM.

---

# 17. Recipe Sources and Data Strategy

Investigate legally usable sources for recipes.

Potential sources:

- licensed recipe databases
- partnerships
- user-created recipes
- public-domain / appropriately licensed recipes
- restaurant-provided recipes
- original recipes created by the product
- APIs with commercial usage rights

Important:

Do not build the business around scraping copyrighted recipe websites without verifying licensing and terms of use.

The system should maintain provenance for recipe data.

Every recipe should ideally have:

```text
source
source_url
license
author
date_added
```

---

# 18. AI Output Requirements

AI-generated information must be structured and predictable.

Prefer JSON-like internal schemas over free-form prose.

Example:

```json
{
  "dish": "Chicken Tikka Masala",
  "confidence": 0.93,
  "ingredients": [
    {
      "name": "chicken",
      "confidence": 0.98,
      "status": "likely"
    }
  ],
  "recipe_matches": []
}
```

The backend should validate model output before displaying it.

---

# 19. Key Product Principle

The application should never imply:

> "We know exactly how this dish was cooked."

unless the source is authoritative.

Instead use language such as:

- "Most likely"
- "Closest match"
- "Estimated ingredients"
- "Likely recipe"
- "AI-generated approximation"
- "Official recipe"

This distinction is critical for user trust.

---

# 20. Business Model

Potential subscription model:

## Free

- limited scans per month
- basic recognition
- limited recipe results

## Premium

Target range:

**€4.99–€7.99/month**

Potential premium features:

- unlimited scans
- advanced recipe matching
- recipe history
- nutrition
- personalized recipes
- ingredient substitutions
- cooking mode
- shopping lists
- saved cookbook
- advanced restaurant mode

Validate pricing through experimentation rather than assuming a specific price.

---

# 21. Potential Long-Term Business Model

Possible revenue streams:

### B2C

- subscriptions
- one-time scan packs
- premium features

### B2B

- restaurant partnerships
- branded recipes
- restaurant discovery
- official recipe pages
- food brands
- grocery partnerships

### Marketplace

Potentially connect:

```text
Dish
→ Recipe
→ Ingredients
→ Grocery products
```

This could eventually create affiliate or commerce opportunities.

---

# 22. Competitive Strategy

The product should NOT compete primarily on:

> "Our AI recognizes food better."

That is difficult to defend.

Instead compete on:

### 1. Better recipe retrieval

Find the recipe closest to the actual dish.

### 2. Better uncertainty handling

Tell users what the system knows versus what it is guessing.

### 3. Better structured food knowledge

Build a high-quality food/recipe knowledge graph.

### 4. Restaurant Mode

Connect photographed food to real restaurants and official dishes.

### 6. Better cooking experience

Turn recognition into an actual cooking workflow.

---

# 23. Success Metric

The key metric should NOT initially be:

> Number of scans.

The more meaningful metric is:

> **Photo → Recipe → Cooking session**

Potential funnel:

```text
Photo taken
    ↓
Dish recognized
    ↓
Recipe selected
    ↓
Recipe saved
    ↓
Cooking started
    ↓
Cooking completed
```

Potential north-star metric:

> **Successful cooking sessions generated from photographed dishes per active user.**

---

# 24. MVP Validation

Before building a large product, validate the following hypotheses:

### Hypothesis 1

People are willing to photograph food to discover how to recreate it.

### Hypothesis 2

Users prefer recipe retrieval / matching over generic AI recipe generation.

### Hypothesis 3

Users trust a confidence-based result more than an AI answer presented as fact.

### Hypothesis 4

Restaurant food is a particularly strong use case.

### Hypothesis 5

Users are willing to pay for unlimited or advanced usage.

---

# 25. Recommended MVP Development Approach

Build the first version as quickly as possible.

Do not build a sophisticated proprietary AI stack initially.

Start with:

```text
Mobile UI
+
Multimodal AI API
+
Recipe database
+
Vector search
+
Simple ranking algorithm
+
LLM normalization
```

Collect real-world user interactions.

Use these interactions to discover:

- which foods are difficult to recognize
- which ingredients are frequently misidentified
- which recipe matches are poor
- which clarification questions help
- what users actually want to know
- which use cases generate repeat usage

Only after sufficient data should custom models or highly specialized computer vision systems be considered.

---

# 26. Research Tasks for Claude

As part of this project, perform ongoing research into:

1. Current competitors in image-to-recipe and food-recognition applications.
2. Their features.
3. Their pricing.
4. Their technology where publicly known.
5. Their App Store / Google Play positioning.
6. User complaints and negative reviews.
7. Gaps in existing products.
8. Potential recipe APIs and their commercial licensing.
9. Multimodal AI models suitable for food recognition.
10. Vector databases / search technologies suitable for recipe retrieval.
11. Cost per image analysis.
12. Cost per recipe retrieval.
13. Cost per active user.
14. Potential monetization.
15. Restaurant partnership opportunities.
16. Bulgarian / Balkan food databases.
17. Legal and licensing considerations.
18. Privacy considerations for user-uploaded food photographs.
19. Potential expansion opportunities.
20. Technical feasibility of restaurant dish matching.

Prioritize current information and verify important claims using primary sources whenever possible.

---

# 27. Competitive Research Output

When researching competitors, create a structured comparison containing:

```text
Company
Product
Platform
Core feature
Photo recognition
Recipe generation
Recipe retrieval
Ingredient detection
Nutrition
Shopping list
Cooking mode
Restaurant functionality
Pricing
Target audience
Strengths
Weaknesses
User complaints
Differentiation opportunity
```

Do not merely list competitors.

Identify actionable gaps.

---

# 28. Product Strategy Questions

Before finalizing the architecture, answer:

1. Is recipe retrieval technically superior to pure recipe generation?
2. What is the minimum viable recipe database?
3. Should the product use web search, APIs, licensed datasets, or a proprietary database?
4. How should recipe similarity be calculated?
5. Which multimodal AI model provides the best cost/accuracy tradeoff?
6. How can restaurant dishes be identified?
7. How can the system distinguish between similar dishes?
8. How should confidence be calculated?
9. How can hallucinated ingredients be reduced?
10. What is the best UX for uncertainty?
11. What is the best initial market?
12. Should the first launch target Bulgaria, Europe, or the global English-speaking market?
13. What should be free versus paid?
14. What is the likely cost per active user?
15. What is the minimum feature set needed for product-market validation?

---

# 29. Product Design Principles

The application should be:

- fast
- visual
- simple
- trustworthy
- transparent about uncertainty
- useful in the real world
- optimized for mobile
- optimized for cooking
- low-friction

Avoid making the product feel like:

> "ChatGPT with a camera."

It should feel like:

> **A visual food discovery tool.**

---

# 30. Long-Term Vision

The ultimate product could become a food recognition layer connecting the physical world of food with digital food knowledge.

Potential journey:

```text
PHOTO
  ↓
DISH
  ↓
INGREDIENTS
  ↓
RECIPE
  ↓
RESTAURANT / CHEF
  ↓
VIDEO
  ↓
SHOPPING LIST
  ↓
GROCERY PRODUCTS
  ↓
COOKING
  ↓
PERSONALIZED RECIPE
```

The application could eventually understand:

- what a dish is
- where it comes from
- how it is traditionally made
- where the user ate it
- which recipes resemble it
- how to reproduce it
- what ingredients are required
- what substitutions are possible
- where to buy the ingredients
- how to cook it step-by-step

---

# 31. Working Product Statement

Use this as the current product definition:

> **An AI-powered visual food discovery app that identifies dishes from photos and finds the most likely recipes behind them, helping users recreate the food they see at home.**

Short version:

> **Snap it. Identify it. Find the recipe. Cook it.**

Long-term positioning:

> **The Shazam for food.**

---

# 32. Important Strategic Constraint

The core innovation is NOT the image recognition model.

The defensible value should increasingly come from:

```text
Food Knowledge
+
Recipe Data
+
Recipe Retrieval
+
Similarity Ranking
+
User Feedback
+
Restaurant Data
+
Regional Expertise
```

The AI model is replaceable.

The food knowledge layer and retrieval system should become the product's long-term competitive moat.

---

# 33. First Objective

The immediate objective is NOT to build the complete platform.

The immediate objective is:

> **Build and validate a simple MVP that can take a photograph of a dish, identify it, retrieve several plausible recipes, rank them, explain the match, and guide the user through cooking the selected recipe.**

Everything else should be secondary until this workflow demonstrates real user value.
