# Google Play readiness — Ailernova

What Play requires before this app can be approved, checked against the code on
31 August 2026. Internal document; not for publication.

The privacy policy itself is `docs/PRIVACY_POLICY.md`. It must be published at a
public URL and that URL entered in Play Console.

---

## Blockers — approval is unlikely until these are done

### 1. In-app account deletion — MISSING

Play requires any app that lets users create an account to offer deletion **from
inside the app**, plus a web-accessible deletion request URL.

Verified: no deletion flow exists anywhere in `src/`. The only related feature is
admin-side deactivation, which is a different thing and not user-initiated.

The privacy policy promises deletion within 30 days, so today the app states
something it cannot do. Needs: a Profile → Delete account flow, a confirmation
step, and a server endpoint that removes the user row and its dependent records.

### 2. Data Safety form — must match the code exactly

This is where apps are most often rejected, because the form is filled from memory
rather than from the code. Declare all of the following:

| Data type | Collected | Shared | Optional | Purpose |
|---|---|---|---|---|
| Name | Yes | No | No | App functionality, account management |
| Email address | Yes | No | No | App functionality, account management |
| Phone number | Yes | No | Yes | App functionality, account management |
| Photos | Yes | No | Yes | App functionality (profile picture, uploaded material) |
| Voice / audio | **No** | No | — | Speech is converted to text by the device's recogniser; no audio reaches us. Declare the microphone permission, but not audio collection |
| Calendar | Yes (write only) | No | Yes | App functionality — adding a booked demo class |
| App activity / in-app actions | Yes | No | No | App functionality, personalisation |
| Files and docs | Yes | No | Yes | App functionality — uploaded study material |
| Location, contacts, messages, financial info | No | No | — | Not collected |

Also declare: data is encrypted in transit; users can request deletion.

**"Shared" is No throughout, but only if the processor terms hold** — see item 4.
If any provider may use the data for its own purposes, it becomes *shared* and
must be declared as such.

### 3. Families / child-directed policy

The app targets Classes 6–12, so a substantial share of users are children. Decide
the target-audience answer in Play Console honestly. If children are included:

- The app must meet the **Families Policy** requirements
- Ads: none — we serve none, which is the simplest position
- Any SDK in the app must be Families-compliant
- Verified: no ad SDK and no analytics SDK is installed, which helps considerably

### 4. Processor terms for the AI providers

The privacy policy states that Anthropic, ElevenLabs, OpenAI, Voyage and Google
may not use user data for their own purposes or to train their models. **Confirm
this against each provider's terms for the plan we are actually on, and keep the
DPA on file.** If any of them may train on the data, the policy is wrong and the
Data Safety form's "Shared: No" is wrong with it.

---

## Non-blocking, but fix before submitting

### 5. No age collection

The app records class, which implies age without establishing it. Under the DPDP
Act, verifiable parental consent is required for under-18s. Today sign-up has a
single tick-box, no age gate and no parental verification. Decide with legal advice
whether that is sufficient.

### 6. Terms of Use — does not exist

No terms document exists on ailernova.in. The sign-up screen no longer claims one
(commit `c1964cb`). If students are meant to be bound by terms, they must be
written and published.

### 7. Grievance Officer

Indian law requires one to be named. `PRIVACY_POLICY.md` has a `[NAME]` placeholder
that must be filled before publication.

### 8. Permission rationale strings

The app declares `READ_CALENDAR` and `WRITE_CALENDAR` and requests microphone and
photo access at runtime. Play reviewers check that each is justified by a visible
feature. Ours are: calendar → add demo class; microphone → talk to the teacher;
photos → profile picture and study uploads. Make sure the store listing describes
these features so the permissions are self-evident.

---

## Already in good shape

- Privacy policy is accurate to the code (`docs/PRIVACY_POLICY.md`) and reachable
  in-app from three places: sign-up, Profile → Privacy & Security, and the parent
  footer
- No advertising SDK, no analytics SDK, no crash-reporting SDK
- No location, contacts, or messages access
- Passwords stored as one-way hashes; HTTPS throughout
- App signing and versioning handled by EAS

---

## Submission checklist

1. Publish `PRIVACY_POLICY.md` at a public URL (ailernova.in/privacy-policy/)
2. Fill in the Grievance Officer name first
3. Build and upload an AAB; internal testing before production
4. Complete Data Safety using the table above
5. Answer the target-audience and content questions
6. Provide the account-deletion URL — **requires blocker 1 to be built**
7. Complete the content rating questionnaire
8. Finish developer account verification — identity, org website and phone were
   still outstanding in Play Console as of 23 August
