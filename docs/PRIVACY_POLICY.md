# Ailernova — Privacy Policy

**Status: DRAFT. Not legal advice, and not ready to publish as-is.**
Written by reading what the application actually does, not from a template — so
the facts below are accurate to the code as of 29 August 2026. The *legal*
framing has not been reviewed by a lawyer, and it must be before this goes live.
See "Before publishing this" at the end for what needs a qualified opinion.

Last reviewed against the code: 29 August 2026
Applies to: the Ailernova mobile app (Android) and ailernova.in

---

## Who we are

Ailernova Private Limited
P03-01a & P03-01b, 3rd Floor, Building 51d, WTC Tower D, GIFT City,
Gandhinagar 382050, India

Questions about this policy, or about your data: **saurabh@ailernova.com**

---

## Who uses Ailernova

Ailernova teaches school students, Classes 6 to 12. **Most of our users are
children under 18, and many are under 13.** That shapes everything below: under
India's Digital Personal Data Protection Act 2023, a child's personal data
requires verifiable consent from a parent or guardian, and we may not track a
child's behaviour for advertising or serve them targeted ads.

We do not show advertisements of any kind, and we do not sell personal data.

---

## What we collect

### You give us this

| Data | When | Why | Required? |
|---|---|---|---|
| Name | Sign-up | To address you in the app and on your work | Yes |
| Email address | Sign-up or Google sign-in | To identify your account and let you sign in | Yes, unless you use phone |
| Phone number | Sign-up | Account identification and support | Optional |
| Password | Sign-up | Stored only as a one-way hash — we never hold the password itself | Yes, unless you use Google |
| Class / grade | Sign-up or profile | To show the right syllabus and set the level of explanation | Yes |
| Profile photo | Profile | Shown on your own profile | Optional |
| Study material you upload | "Ask my material" | So the AI teacher can answer questions grounded in your own notes | Optional |

### The app records this as you learn

- Lessons generated, opened and how far through them you are
- Questions attempted, answers given, and whether they were correct
- Doubts you ask the AI teacher, and its replies
- Brain Gym results — score, XP, time taken, streaks
- A "student model": which concepts you find easy or hard, so explanations adapt

This is the substance of the product. Without it, the teacher cannot remember
what you struggled with last week, and every lesson would start from zero.

### Stored only on your device

An authentication token, your profile, lesson position, practice attempts and
streaks are kept in the app's local storage. Deleting the app removes them.

### What we do NOT collect

- No advertising identifiers, and no ad networks
- No analytics or crash-reporting SDK is installed in the app
- No location, contacts, calendar, microphone recordings or photo library beyond
  a profile picture you choose
- No payment card details — we do not take payments in the app

---

## Who else sees your data

We use these providers to run the service. Each receives only what its job
requires, and none of them may use your data to train their own models or for
their own purposes.

| Provider | What it receives | Where | Why |
|---|---|---|---|
| **Anthropic (Claude)** | Your question, the relevant lesson text, and a short summary of your progress on that concept | US | Generates the AI teacher's explanations |
| **ElevenLabs** | The text the teacher is about to speak | US | Turns it into the teacher's voice |
| **OpenAI** | The same text, only if ElevenLabs is unavailable | US | Fallback voice |
| **Voyage AI** | Text from material you upload | US | Converts it to embeddings so answers can be grounded in your notes |
| **Supabase** | Your account record, learning history and uploaded files | Singapore | Our database and file storage |
| **Render** | All API traffic | Singapore | Runs our server |
| **Google** | Your Google account identity, only if you choose Google sign-in | Global | Signing in |
| **Calendly** | Whatever you enter when booking | US | Booking a free demo class |
| **Expo (EAS)** | App version and update checks — not your account data | US | Delivers app updates |

**Your data leaves India.** Our database and server are in Singapore, chosen
because they sit beside each other and keep the app fast. The AI providers are in
the United States. If you are not comfortable with that, please do not use the
app.

---

## Why we are allowed to hold it

- **To provide the service you asked for** — an account, lessons, progress.
- **With consent** — for anything optional, such as uploading your own material.
  You can withdraw consent by deleting that content or your account.
- We do **not** rely on "legitimate interest" for profiling, because our users
  are children.

---

## How long we keep it

| Data | Kept for |
|---|---|
| Account details | While your account is open |
| Learning history | While your account is open — it is what makes the teacher adapt |
| Uploaded material | Until you delete it, or your account closes |
| Doubt conversations | While your account is open |
| Server logs | 30 days |

When an account is deleted we remove personal data within 30 days. Anonymous,
aggregated figures that cannot identify anyone — such as how many students
attempted a chapter — may be kept.

---

## Your rights

You, or a parent on your behalf, can:

- **See** what we hold about you
- **Correct** anything wrong
- **Delete** your account and its data
- **Take your data with you** in a portable format
- **Withdraw consent** for anything optional
- **Complain** to the Data Protection Board of India

Write to **saurabh@ailernova.com**. We will reply within 30 days. We may ask you
to confirm your identity first, so that nobody else can request your data.

---

## Parents and guardians

If your child uses Ailernova, you may ask us at any time to show you what we
hold about them, correct it, or delete it. Email
**saurabh@ailernova.com** from the address on the account, or tell us enough
about the account for us to find it.

We do not knowingly collect more from a child than the service needs, we do not
profile children for advertising, and we do not share their data with anyone
outside the providers listed above.

---

## Security

- Passwords are stored as one-way hashes; we cannot read them
- All traffic uses HTTPS
- Access to the database is limited to the people who need it to run the service
- Sessions expire and can be revoked

No system is perfectly secure. If a breach affects your data, we will notify you
and the Data Protection Board as the law requires.

---

## Changes

If we change this policy we will update the date at the top and, for anything
significant, tell you in the app before it takes effect.

---

# Before publishing this

The facts above were taken from the code. These points were **not** settled by
reading code and need a decision, and most need a lawyer:

1. **Verifiable parental consent.** The DPDP Act requires it for users under 18.
   The app currently has a single tick-box on sign-up and no age gate and no
   parent verification. This is the most significant gap, and it is a product
   change, not a wording change.
2. **No age is collected.** Class is collected, which implies age but does not
   establish it. Whether that is sufficient to identify a child user is a legal
   question.
3. **Data Processing Agreements.** The policy states that Anthropic, ElevenLabs,
   OpenAI and Voyage may not train on your data. Confirm each provider's terms
   actually say so for the plan we are on, and keep the DPA on file.
4. **Cross-border transfer.** Data goes to Singapore and the United States.
   Confirm this is permitted for children's data under the DPDP rules as they are
   finalised.
5. **Account deletion.** The policy promises deletion within 30 days. There is
   currently no in-app delete-account flow — Google Play requires one for apps
   that allow account creation. Either build it or the promise is not kept.
6. **Retention periods.** The 30-day log figure is a placeholder; confirm what
   Render and Supabase actually retain.
7. **Terms of Use.** There is no terms document. The sign-up screen no longer
   claims one — see commit `c1964cb` — but if students are meant to be bound by
   terms, they need writing.
8. **A Grievance Officer** must be named under Indian law. Decide who, and put
   their name and contact here.
