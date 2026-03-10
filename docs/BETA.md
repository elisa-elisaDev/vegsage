# VegSage — Beta Launch Guide

Target: 50 early users, 2-week beta.

---

## Beta Checklist

### Pre-launch
- [ ] All smoke tests in DEPLOYMENT_CHECKLIST.md pass
- [ ] Legal pages published and reviewed
- [ ] Paddle sandbox → production switch done
- [ ] PWA icons in place
- [ ] Manual test on iOS Safari + Android Chrome

### Invite Strategy (50 users)
- [ ] Post in r/vegetarian, r/PlantBasedDiet (mention it's free, no spam)
- [ ] Share in vegetarian Facebook groups / Discord servers
- [ ] Personal network (WhatsApp / Signal / email)
- [ ] Product Hunt "upcoming" page (optional)

### Beta User Onboarding Message

> "Hey! I built VegSage — a simple tracker for vegetarian micro-nutrients (B12, iron, zinc, etc.).
> It gives you a daily Vegetarian Confidence Score based on what you eat.
> Free to try, no credit card needed: vegsage.com
> Would love your honest feedback — what's useful, what's missing, what's confusing."

---

## KPIs to Track (Week 1 & 2)

| KPI | Target | How to measure |
|---|---|---|
| Signups | 50 | Supabase → auth.users count |
| D1 retention | >40% | Users with ≥2 daily_scores rows |
| D7 retention | >20% | Users with ≥7 daily_scores rows |
| Time-to-first-add | <90s | Supabase: time between profiles.created_at and first meal_items row |
| Weekly return | >30% | Users with meals in week 2 |
| Score engagement | >60% open | Check /app/score views (Vercel analytics or simple DB flag) |
| Insight dismiss rate | — | Dismissed insights / total insights |
| Paddle conversion | — | is_premium=true count / total signups |

---

## Feedback Collection

- Email: contact.vegsage@gmail.com
- Simple in-app feedback: add a "Send feedback" link in settings pointing to a Google Form or email
- After 7 days: send a short 5-question survey to beta users

### Survey Questions
1. What's your main use case for VegSage?
2. Which nutrient do you check most?
3. What's the biggest thing missing?
4. How likely are you to keep using VegSage? (1–10)
5. Would you pay €5.90/month for unlimited history? (Yes / No / Maybe)

---

## Quick Fixes to Prioritize During Beta

Based on expected feedback:
1. "I can't find my food" → improve search UX, add partial barcode lookup
2. "The score seems wrong" → add score explanation tooltip
3. "I want to see what I ate" → add simple meal log view (future feature)
4. "I want to delete a food entry" → add delete meal_item (future feature)

---

## Post-Beta

- Analyze KPIs
- If D7 retention > 20% → proceed to public launch
- If conversion > 2% → pricing is right
- Adjust insights and onboarding based on feedback
