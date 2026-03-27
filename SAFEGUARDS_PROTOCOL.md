# KeSMIS Data Security & Safeguards Protocol

**System:** Kenya Settlement Monitoring Information System (KeSMIS)
**Owner:** Kenya Informal Settlements Improvement Programme (KISIP)
**Classification:** OFFICIAL — SENSITIVE
**Version:** 1.0
**Date:** 2026-03-27
**Review Cycle:** Annual (or following any major security incident)

---

## Designated Personnel Register

The following individuals hold named responsibilities under this protocol. This register must be kept up to date. When a person leaves or changes role, the ICT Administrator must update this register and ensure access rights are adjusted accordingly.

| Role | Name | Responsibilities Under This Protocol |
|------|------|--------------------------------------|
| **Data Protection Officer (DPO)** | Martin Musembi | KDPA compliance, breach notification, data subject requests, third-party data processing agreements |
| **Super Admin** | Christine Sabwa | Full system access — national ICT administration |
| **Super Admin** | Sally Lessas | Full system access — national ICT administration |
| **Super Admin** | Akach | Full system access — national ICT administration |
| **Super Admin** | Christine Ndanu | Full system access — national ICT administration |
| **Root Admin** | *(name to be inserted)* | Server and database administration, credential management, incident response |

> **Note:** Super Admin and Root Admin accounts must be reviewed every 6 months. Access must be revoked immediately upon a person's departure or change of role.

---

## 1. Purpose & Scope

This document sets out how the Kenya Settlement Monitoring Information System (KeSMIS) protects the data it holds and ensures only the right people can access it. It applies to everyone who uses, manages, or builds the system — including KISIP staff at the national and county levels, field officers, contractors, and any third parties given access.

KeSMIS holds sensitive information about informal settlements, their residents, vulnerability assessments, grievances, and government planning records. If this data were accessed by the wrong people, altered without authorisation, or lost, it could directly harm vulnerable communities, damage the programme's credibility, and put KISIP in breach of the **Kenya Data Protection Act, 2019 (KDPA)**.

This document explains in plain terms what controls are in place, who is responsible for what, and what to do if something goes wrong.

---

## 2. System Overview

KeSMIS is a web-based government information system built to support the monitoring and management of informal settlement improvement activities across Kenya. It is accessible via web browser and a mobile data-collection app used by field officers.

| Component | What It Does |
|-----------|-------------|
| **Web Application** | The main interface used by KISIP staff, county officers, and programme managers |
| **Mobile App** | Used by field collectors to capture settlement and household data in the field |
| **Backend Server** | Processes all requests, enforces security, and communicates with the database |
| **Database** | Stores all programme data — settlements, users, grievances, maps, reports |
| **SMS Gateway (QuickSMS)** | Sends one-time passwords to users for account verification and password resets |
| **Mapping Service (GeoServer)** | Provides the spatial/map layers used within the system |
| **AI Document Processing** | Assists with document analysis (no personal data is submitted to this service) |

---

## 3. Data Classification

### 3.1 What Data Does KeSMIS Hold?

The system collects and stores a range of data as part of its programme activities. Each type of data carries a different level of sensitivity and must be handled accordingly.

| Data Category | Examples | Sensitivity Level |
|--------------|---------|------------------|
| **Settlement profiles** | Location, boundaries, population estimates, settlement type | OFFICIAL |
| **Beneficiary & household data** | Household details, vulnerability scores, programme eligibility | SENSITIVE |
| **User account data** | Staff names, email addresses, phone numbers, login credentials | SENSITIVE |
| **Grievances & incident reports** | Complaints, GBV reports, case resolutions | HIGHLY SENSITIVE |
| **Audit & access records** | Records of who accessed or changed what data, and when | OFFICIAL |
| **Spatial / map data** | GIS boundary layers, settlement coordinates | OFFICIAL |
| **System credentials** | Database passwords, API keys, authentication secrets | RESTRICTED |

### 3.2 What Do These Levels Mean?

Understanding data sensitivity levels helps every user know how carefully a piece of information needs to be handled:

- **RESTRICTED** — The most sensitive category. Known only to system administrators. These are things like passwords and system keys. They must never be written down in shared documents, sent over email, or stored anywhere other than secure server configuration files.

- **HIGHLY SENSITIVE** — Personal data that could put someone at risk if it were disclosed — for example, a GBV report or a grievance lodged by a community member. Access to this data must be strictly limited to those who need it to do their job. It must never be discussed in open forums or shared without authorisation.

- **SENSITIVE** — Personal information about individuals (staff or beneficiaries) that is protected under the Kenya Data Protection Act. This information can only be accessed by logged-in, authorised users. It must not be exported, shared, or printed without approval.

- **OFFICIAL** — Internal programme data that is not public but does not contain personal information. Accessible to all authenticated system users in their relevant area of work.

---

## 4. Access Control

### 4.1 How Access Is Managed

Access to KeSMIS is not open to everyone. Every person who uses the system must have an account that has been reviewed and approved by an administrator. When a new account is created, it is inactive by default — it only becomes usable after an administrator explicitly approves and activates it.

Each user is assigned a **role** that defines what they can see and do within the system. A field officer in Mombasa, for example, will only be able to see data from Mombasa County — not from Nairobi or Kisumu. This limits the damage that can be done if an account is ever compromised.

### 4.2 User Roles

| Role | What They Can Do | Who Typically Has This Role |
|------|-----------------|----------------------------|
| **Super Admin** | Full access to all data and all system functions | National KISIP ICT team only |
| **Root Admin** | Full access to all data and all system functions | System administrators only |
| **Admin** | Broad access within their assigned location | Programme managers |
| **County Admin** | Access to data within their county only | County coordinators |
| **Staff** | Day-to-day operational access | Field officers, data entry staff |
| **GRM Officer** | Manages grievances and incident reports | Grievance and Redress Mechanism officers |
| **GBV Officer** | Handles GBV-specific incident records | GBV coordinators |
| **Moderator** | Reviews and moderates content | Designated content moderators |
| **National Public** | Read-only access to the public settlement register | Members of the public, researchers |

> **Important:** Super Admin and Root Admin roles have unrestricted access to all system functions. These roles must only be assigned to trusted ICT administrators and must never be shared or delegated.

### 4.3 Geographic Scoping — You Only See What You Need To

A core principle of KeSMIS is that users can only access data relevant to their area of work. This is enforced automatically by the system:

- A **county-level user** can only see data from their assigned county.
- A **sub-county user** can only see data from their assigned sub-county.
- A **national-level user** can see data from all counties.
- Users who register without a specific county (e.g., researchers or members of the public) are automatically given read-only, national-level public access.

### 4.4 Fine-Grained Permissions

On top of roles, the system uses individual permissions to control specific actions — for example, whether a user can export a report, update a settlement record, or manage other users. These permissions are assigned to roles and checked automatically every time a user tries to perform an action. Any attempt to perform an unauthorised action is blocked and logged.

### 4.5 The Principle of Least Privilege

Every user is given the lowest level of access that allows them to do their job. This means:
- A field officer does not need — and does not get — the ability to manage other users' accounts.
- A county coordinator does not need — and does not get — access to data from other counties.
- Elevated admin roles are never assigned as a convenience — they must be formally justified.

This limits the potential damage from both accidental misuse and deliberate attacks.

### 4.6 Account Lifecycle — From Creation to Deactivation

| Stage | What Happens |
|-------|-------------|
| **Registration** | User submits their details including name, email, phone, organisation, and reason for access. Account is created but inactive. |
| **Approval** | An administrator reviews the request and activates the account, assigning the appropriate role and location. |
| **Active use** | User logs in with their credentials. All actions are logged. |
| **Role change** | Any change to a user's role or permissions is automatically recorded in the audit log. |
| **Password reset** | User requests a reset; a one-time code is sent to their registered phone number. |
| **Logout** | The user's session is closed. Any tokens issued before logout are immediately invalidated — even if someone copied the token, it cannot be reused. |
| **Staff departure / suspension** | Account must be deactivated **immediately** by an administrator. This is the responsibility of the line manager to request. |

---

## 5. Authentication — Proving You Are Who You Say You Are

### 5.1 Passwords

Every account is protected by a password. To ensure passwords are strong enough to resist attacks, the system enforces the following rules at the time of registration — weak passwords are rejected automatically:

- At least **8 characters** long, no more than 20
- Must include at least one **uppercase letter** (e.g., A, B, C)
- Must include at least one **lowercase letter** (e.g., a, b, c)
- Must include at least one **number** (e.g., 1, 2, 3)
- Must include at least one **special character** (e.g., @, #, !, %)

Passwords are **never stored in readable form**. The system uses a one-way mathematical process (bcrypt, strength level 12) to convert passwords into a scrambled code — even system administrators cannot read a user's password. If an administrator needs to help a user who has forgotten their password, they use the password reset process — they cannot look up the old one.

### 5.2 How Login Tokens Work

When a user logs in successfully, the system issues a secure digital token (similar to a temporary visitor pass). This token:
- Is valid for **24 hours**
- Is required for every request to protected parts of the system
- Is **immediately cancelled when the user logs out** — it cannot be reused after logout
- Is signed with a secret key stored securely on the server, so it cannot be forged

If a user's device is stolen or their session is suspected compromised, the user must log out immediately — this cancels their current session token. Note: administrator-triggered force-logout of another user's session is not yet available in the system; where a user cannot log out themselves (e.g., device is lost), the ICT Administrator should deactivate the account until the situation is resolved.

### 5.3 One-Time Passwords (OTP) via SMS

Certain actions — such as verifying a new account or resetting a password — require the user to enter a one-time code sent to their registered phone number via SMS. This adds a layer of protection: even if someone knows your email and password, they still cannot complete the action without access to your phone.

- OTP codes are **single-use** — they cannot be used twice
- OTP codes **expire** after a short time
- The system allows a maximum of **10 OTP attempts per 10 minutes** from any one device, to prevent automated guessing attacks

### 5.4 Brute-Force Protection (Rate Limiting)

To prevent automated attacks where a computer tries thousands of password combinations rapidly, the system limits how many login attempts can be made in a short time:

| Action | Limit |
|--------|-------|
| Sign in, Sign up, Password reset | 20 attempts per 15 minutes (per device/IP) |
| OTP verification | 10 attempts per 10 minutes (per device/IP) |

If the limit is exceeded, the system temporarily blocks further attempts from that device.

### 5.5 Password Reset Process

When a user forgets their password, the reset process is designed so that even if the database were compromised, the reset token stored there could not be used by an attacker:

1. The user requests a password reset
2. The system generates a random, one-time code and sends it to the user's phone via SMS
3. Only a scrambled (SHA-256 hashed) version of the code is stored in the database — not the code itself
4. When the user submits the code, it is scrambled the same way and compared to what is stored
5. If they match, the reset is allowed. The original code is never written to the database.

---

## 6. Data Protection

### 6.1 Data Moving Between Users and the System (In Transit)

Every time data travels between a user's browser or app and the KeSMIS server, it must be encrypted. This prevents anyone monitoring the network — for example, on a shared Wi-Fi connection — from reading the data as it passes.

- All traffic must use **HTTPS** (the padlock you see in your browser address bar), which encrypts data in transit
- The server only accepts connections from approved web addresses (the official KeSMIS domains and the data collector app) — random websites or tools cannot connect to the API

### 6.2 Data Stored in the System (At Rest)

Data stored in the database is protected in several ways:

- **Passwords** are stored only as irreversible hashes — the actual password text is never saved
- **Password reset tokens** are stored only as hashes — the actual token is never saved
- The **database server** is not accessible from the internet — it can only be reached from the application server on the same network
- **Database credentials** (the username and password used by the application to connect to the database) are stored in a secure configuration file on the server, never in the application code or in any shared document

### 6.3 File Uploads

Users can upload documents and files through the system. Uploaded files are stored in a dedicated folder on the server. Administrators are responsible for ensuring that:
- Only authorised users upload files
- Uploaded files are periodically reviewed for appropriateness

### 6.4 Sensitive Fields Are Automatically Hidden in Logs

The audit logging system is designed to never record sensitive values. The following fields are automatically replaced with `[REDACTED]` before any log entry is written:

- Passwords
- Password reset tokens
- Login tokens
- One-time passwords (OTPs)

This means even if someone gained access to the audit logs, they would not find any usable credentials.

---

## 7. Audit Trail & Monitoring

### 7.1 What Is the Audit Trail?

The audit trail is a tamper-evident record of every significant action taken within the system. Think of it as the system's memory — it records who did what, to which record, and when. This serves two purposes: accountability (ensuring staff can be held responsible for their actions) and security (detecting unusual or unauthorised behaviour).

Every time a user creates, modifies, or deletes a record in the system, the audit trail automatically captures:

| What Is Recorded | Example |
|-----------------|---------|
| **Who did it** | Username and user ID of the person who made the change |
| **What they did** | Created a new settlement / updated a grievance / deleted a user account |
| **Which record** | The specific record that was affected |
| **What changed** | The values before and after the change |
| **When** | The exact date and time (server time) |

### 7.2 What Actions Are Logged?

The following activities are all captured in the audit trail:

- Any changes to settlement data
- Any changes to user accounts (including creating or deactivating accounts)
- **Any changes to user roles or permissions** — if someone is given more access than they should have, this will be recorded
- Any updates to grievance or incident records
- Any system configuration changes

### 7.3 Who Can See the Audit Logs?

Access to the raw audit log data is restricted to system administrators (`super_admin` and `root_admin` roles). Programme managers can request audit reports through the ICT team.

### 7.4 How Long Are Logs Kept?

Audit logs must be retained for a minimum of **3 years** in line with KDPA accountability requirements. Older logs must be archived securely, not simply deleted.

### 7.5 Server-Level Monitoring

In addition to the application audit trail, the server itself records all incoming requests — including the device's IP address, the page or resource requested, and whether it succeeded. These logs are monitored by the ICT team for unusual patterns such as repeated failed logins, access at unusual hours, or requests from unknown locations.

---

## 8. Third-Party Services

KeSMIS connects to several external services to deliver its functions. Each integration is governed by the principle of data minimisation — only the information strictly necessary is shared, and no personal data is sent to third-party services unless there is a legal and operational basis to do so.

| Service | What It Does for KeSMIS | Data Shared | How Credentials Are Protected |
|---------|------------------------|-------------|-------------------------------|
| **QuickSMS / AdvantaSMS** | Sends OTP codes and notifications to users' phones | Phone number and the OTP message only | API key stored in server config file — never in code |
| **GeoServer** | Provides mapping and spatial data layers | Settlement boundary data (no personal data) | Admin credentials in server config file — never in code |
| **OpenAI API** | Assists with document processing and analysis | Document text only — no personal data should be submitted | API key in server config file |
| **YouTube API** | Enables video content search within the system | Search query text only | API key in server config file |
| **XAI (Grok)** | AI assistance features | To be defined — no personal data until policy confirmed | API key in server config file |

**Rules for all third-party integrations:**
- API credentials are stored only in secure server configuration files — never written into the application code or shared documents
- If there is any reason to believe a credential has been exposed, it must be rotated immediately
- A data processing agreement must be in place with any third party that handles personal data belonging to KISIP beneficiaries or staff
- Any new integration proposed for the system must be reviewed by the ICT lead and Data Protection Officer before implementation

---

## 9. Infrastructure Security

### 9.1 Server Security

The servers running KeSMIS are hardened against common attacks:

- The application runs under a **restricted user account** — it does not have administrator-level access to the server, so even if it were compromised, the damage would be limited
- **Only the ports needed for the application** are open on the server firewall — all other network access is blocked
- The **database is not accessible from outside the server network** — it can only be reached from the application running on the same server
- **Remote server access** (SSH) uses cryptographic keys, not passwords — this means an attacker who guesses a password still cannot log in to the server
- The server's operating system and software packages are kept up to date with **security patches**

### 9.2 Protecting System Credentials

System credentials — database passwords, API keys, authentication secrets — are among the most sensitive items in the entire system. The following rules govern how they are managed:

- All credentials are stored in **environment configuration files** on the server (`.env` files). These files are readable only by the application and by system administrators with direct server access.
- These configuration files are **never included in the application's source code repository** — a technical control (`.gitignore`) prevents this automatically
- The source code repository's entire history has been **audited and purged** of any credentials that may have been accidentally committed in the past (completed 2026-03-27)
- Credentials must be **rotated** (changed and updated on the server) in the following circumstances:
  - Immediately if there is any reason to suspect they may have been seen by an unauthorised person
  - When a staff member who knew the credentials leaves or changes roles
  - At least once a year as part of the annual security review

### 9.3 Source Code Management

- The system's source code is held in a **private repository** accessible only to the development team
- All changes to the code must go through a **review process** before being deployed to the production system
- The production deployment process requires approval from the ICT lead

---

## 10. Incident Response

### 10.1 What Is a Security Incident?

A security incident is any event — or suspected event — involving unauthorised access to, disclosure of, modification of, or loss of KeSMIS data. Examples include:

- A staff member believes their login credentials have been stolen or shared
- An account appears to be active at unusual times or from an unknown location
- A user notices records have been changed without their knowledge
- A large amount of data appears to have been exported without authorisation
- The system becomes unavailable following suspicious activity
- A third-party service connected to KeSMIS reports a breach

If you suspect an incident, **report it immediately** — even if you are not sure. It is always better to report and investigate than to wait.

### 10.2 Who to Contact

**Data Protection Officer:** Martin Musembi
Martin Musembi is responsible for overseeing KISIP's data protection obligations, including incident response, breach notification to regulators, and ensuring the organisation complies with the Kenya Data Protection Act. He is the first point of contact for any matter involving personal data risk.

**ICT Lead:** KeSMIS Systems Administrator
The ICT lead is responsible for the technical response to any security incident — isolating affected systems, rotating credentials, reviewing logs, and restoring services.

### 10.3 Step-by-Step Response Procedure

| Step | Action | Who Is Responsible |
|------|--------|--------------------|
| **1 — Report** | Any staff member who detects or suspects an incident must report it to the ICT lead and the Data Protection Officer within **1 hour** | Any staff member |
| **2 — Contain** | ICT lead disables affected accounts, rotates any exposed credentials, and isolates affected systems if necessary | ICT Administrator |
| **3 — Assess** | ICT lead and the Data Protection Officer determine the scope: what data was affected, how many people are involved, and how it happened | ICT Lead + Data Protection Officer |
| **4 — Notify management** | KISIP programme management is informed of the incident and its likely impact | ICT Lead |
| **5 — Regulatory notification** | If personal data has been breached, the Data Protection Officer must notify the **Office of the Data Protection Commissioner (ODPC) within 72 hours** as required by the KDPA | the Data Protection Officer |
| **6 — Notify affected individuals** | If individuals are at risk of harm from the breach, they must be informed in clear, plain language | the Data Protection Officer + ICT Lead |
| **7 — Remediate** | Fix the technical vulnerability; restore from a clean backup if data was lost or corrupted | ICT Administrator |
| **8 — Document** | A formal incident report is written, covering: what happened, the timeline, the data affected, the response taken, and lessons learned | ICT Lead |
| **9 — Review** | Security controls are updated to prevent recurrence; this document is updated if necessary | ICT Lead + Management |

### 10.4 If System Credentials Are Compromised

If a database password, API key, or authentication secret is suspected to have been seen by an unauthorised person:

1. **Immediately change the credential** — do not wait to investigate first
2. Update the server configuration file with the new credential
3. Restart the application so it loads the new credential
4. Review audit logs for any suspicious activity that may have occurred using the old credential
5. If the authentication secret (JWT secret) is changed, **all users will be logged out automatically** — inform users in advance if possible

---

## 11. Compliance

### 11.1 Kenya Data Protection Act, 2019

KeSMIS collects and processes personal data about informal settlement residents, programme beneficiaries, and system users. Under the Kenya Data Protection Act, 2019, KISIP is the **data controller** — meaning KISIP is legally responsible for how this data is handled.

**KISIP's Data Protection Officer is listed in Section 1.1 below.** He is responsible for ensuring the organisation meets its legal obligations under the KDPA and is the designated contact for any data protection matter, both internally and with the regulator.

KISIP's obligations as data controller include:

- **Registration:** KISIP must be registered with the Office of the Data Protection Commissioner (ODPC).
- **Purpose limitation:** Data collected through KeSMIS must only be used for the purposes of the programme — not for other uses without the data subject's consent.
- **Data minimisation:** Only the data that is genuinely necessary should be collected. The system should not collect information just because it might be useful in the future.
- **Security:** Personal data must be protected against unauthorised access, accidental loss, destruction, or damage. The controls in this document are part of meeting that obligation.
- **Breach notification:** If personal data is breached, the Data Protection Officer must notify the ODPC within **72 hours** of becoming aware of the breach. Where individuals are at high risk of harm, they must also be notified directly.
- **Data subject rights:** Individuals whose data is held in KeSMIS have the right to access their data, correct it, or request its deletion in certain circumstances. Requests must be responded to within **21 days**. All such requests should be directed to the Data Protection Officer.
- **Cross-border transfers:** Personal data must not be transferred outside Kenya to a country that does not provide adequate data protection — unless specific safeguards are in place and approved by the DPO.

### 11.2 National ICT Policy

KeSMIS, as a government information system, is subject to the Kenya National ICT Policy and guidelines issued by the Ministry of Information, Communications and the Digital Economy. The controls in this document are designed to align with those requirements.

### 11.3 Data Retention Schedule

Retaining data longer than necessary creates unnecessary risk. The following minimum retention periods apply, after which data should be reviewed for deletion or archiving:

| Data Type | Minimum Retention Period | Basis |
|-----------|------------------------|-------|
| User account data | Duration of programme + 3 years | KDPA / programme records policy |
| Audit trail logs | 3 years | KDPA accountability principle |
| Settlement profiles | Indefinite — core programme asset | Government records |
| Grievance and incident records | 5 years | Programme accountability |
| Server access logs | 1 year | Security monitoring |

---

## 12. Backup & Disaster Recovery

### 12.1 Why Backups Matter

KeSMIS holds years of settlement profiling data, grievance records, and programme history that cannot easily be recreated. If the system were to fail — due to a hardware fault, accidental deletion, ransomware, or a natural disaster — a reliable backup is what allows the programme to continue without losing its data.

### 12.2 Backup Schedule

| Data | Backup Frequency | Backup Type |
|------|-----------------|-------------|
| PostgreSQL database (all programme data) | Daily — automated, overnight | Full database dump |
| Uploaded files (documents, images) | Daily | File system copy |
| Server configuration files | After every change | Versioned copy |
| Application source code | Continuously | Git repository (GitHub) |

### 12.3 Where Backups Are Stored

- Database backups must be stored in **at least two locations** — one on the primary server and one in a separate, off-site location (e.g., a secure cloud storage bucket or a physically separate server)
- Backups must be **encrypted** before being transferred off-site — unencrypted backup files containing personal data must never be stored on third-party services without encryption
- Backup SQL files must **never** be committed to the source code repository (Git)

### 12.4 Backup Integrity Testing

A backup that has never been tested is not a reliable backup. The ICT team must:
- **Monthly:** Verify that backup files are being created and are not corrupted (check file sizes, timestamps)
- **Quarterly:** Perform a test restore to a staging environment to confirm the backup can actually be used to recover the system
- **Document** the results of each test restore, including the date, who performed it, and whether it succeeded

### 12.5 Recovery Time Objectives

In the event of a system failure, the following targets apply:

| Scenario | Target Recovery Time |
|----------|---------------------|
| Server restart / application crash | Within 30 minutes |
| Database corruption or accidental data loss | Within 4 hours (restore from last backup) |
| Full server failure (hardware) | Within 24 hours |
| Ransomware / deliberate destruction | Within 48 hours (clean restore from off-site backup) |

### 12.6 Disaster Recovery Procedure

1. **Assess** the nature and extent of the failure — is it the application, the database, or the server?
2. **Notify** KISIP management and the ICT lead immediately
3. **Isolate** the affected system to prevent further damage (take it offline if needed)
4. **Restore** from the most recent clean backup — the ICT lead confirms which backup to use
5. **Verify** that the restored system is working correctly and data is intact before bringing it back online
6. **Document** what happened, what data (if any) was lost, and the steps taken to recover

---

## 13. Staff Training & Awareness

### 13.1 Why Training Is Required

Technology controls alone are not enough to keep a system secure. The majority of security incidents involve human error — clicking a phishing link, using a weak password, sharing credentials, or failing to report a suspected breach. All KeSMIS users must understand their responsibilities and how to recognise and respond to threats.

### 13.2 Training Requirements

| User Group | Required Training | When |
|------------|------------------|------|
| **All new users** | KeSMIS system orientation including data protection obligations, acceptable use, and how to report incidents | Before account activation |
| **All users** | Annual data protection refresher covering KDPA obligations and any policy updates | Every 12 months |
| **ICT staff and developers** | Secure development practices, credential management, incident response procedures | On joining and annually |
| **Programme managers** | Access control responsibilities, how to request account changes, managing staff departures | On appointment and annually |

### 13.3 Awareness Reminders

In addition to formal training, the ICT team should issue periodic reminders to all users covering:
- Phishing and social engineering — how to recognise suspicious emails or messages asking for credentials
- Password hygiene — not reusing passwords, not writing them down
- Reporting obligations — reminding staff that security incidents must be reported immediately, even if they are not certain

### 13.4 Acknowledgement

Before being granted access to KeSMIS, every user must sign or electronically acknowledge that they have read and understood:
- This Safeguards Protocol
- Their obligations under the Kenya Data Protection Act, 2019
- The Acceptable Use Policy (Section 15)

Records of these acknowledgements must be retained by the ICT administrator.

---

## 14. Physical Security

### 14.1 Server Environment

The physical security of the servers hosting KeSMIS is as important as the software security controls. An attacker with physical access to a server can bypass many technical controls.

The following requirements apply to any location hosting KeSMIS infrastructure:

- **Restricted access:** Server rooms or data centre facilities must be accessible only to authorised ICT personnel. Access must be controlled by a lock (physical key, PIN, or access card).
- **Visitor log:** Any visitor to a server room must be logged — name, purpose, date, time in and time out.
- **No unattended access:** Third-party technicians (e.g., hardware vendors) must be accompanied by an authorised KISIP ICT staff member at all times.
- **Environmental controls:** Server rooms must have adequate cooling, power protection (UPS), and fire suppression appropriate for ICT equipment.
- **Cable management:** Network cables must be labelled and secured to prevent accidental disconnection or unauthorised interception.

### 14.2 End-User Devices

Staff who access KeSMIS from their workstations, laptops, or mobile devices are responsible for the physical security of those devices:

- Devices must be **locked** when left unattended — even briefly
- Laptops and mobile devices used to access the system must have **screen lock** enabled with a PIN or password
- Lost or stolen devices that were used to access KeSMIS must be **reported immediately** to the ICT lead so that the associated user session can be invalidated
- Staff must not access KeSMIS from **shared or public computers** (e.g., internet cafés)
- Staff must not access KeSMIS over **unsecured public Wi-Fi** without a VPN

### 14.3 Printed Data

Occasionally, system data may need to be printed (e.g., reports, settlement registers). The following rules apply:

- Printed documents containing **SENSITIVE** or **HIGHLY SENSITIVE** data must be stored securely when not in use and shredded when no longer needed — they must not be left on desks or in bins
- Printed documents must not be taken out of the office without authorisation from a programme manager
- Bulk data exports or printed registers containing personal data must be approved by the Data Protection Officer before printing

---

## 15. Privacy Notices & Consent

### 15.1 Informing Data Subjects

Under the Kenya Data Protection Act, 2019, individuals whose data is collected must be informed — at the time of collection — about how their data will be used. This is the legal requirement for transparency.

For KeSMIS, data subjects include:
- **Settlement residents and beneficiaries** whose household and vulnerability data is captured by field officers
- **System users** (staff, county officers) whose account and activity data is held in the system
- **Grievance and incident complainants** whose cases are recorded in the system

### 15.2 What Data Subjects Must Be Told

Before or at the time their data is collected, data subjects must be informed of:

| Information | Details for KeSMIS |
|-------------|-------------------|
| Who is collecting the data | Kenya Informal Settlements Improvement Programme (KISIP), under the Ministry responsible for Housing |
| Why the data is being collected | To assess settlement conditions, allocate programme resources, and monitor improvements under the KISIP programme |
| What data is being collected | Household details, location, vulnerability assessment scores, contact information |
| Who the data will be shared with | County government offices, relevant national ministries, and development partners on a need-to-know basis |
| How long it will be kept | As per the retention schedule in Section 11.3 |
| Their rights | Right to access, correct, or request deletion of their data — contact the Data Protection Officer |
| The Data Protection Officer | Data Protection Officer — [contact details to be inserted] |

### 15.3 Consent for Sensitive Data

Where **HIGHLY SENSITIVE** data is collected — particularly grievance reports and GBV-related incident records — free and informed consent must be obtained from the data subject before the data is recorded. The person must:
- Understand what they are consenting to
- Consent voluntarily, without pressure
- Have the ability to withdraw consent and understand what that means

Consent records must be retained by the programme.

### 15.4 Data Subject Rights Procedure

Any individual whose data is held in KeSMIS has the following rights under the KDPA:

| Right | What It Means | How to Exercise It |
|-------|--------------|-------------------|
| **Access** | The right to know what data KeSMIS holds about them | Submit a written request to the Data Protection Officer |
| **Correction** | The right to have inaccurate data corrected | Submit a written request to the Data Protection Officer |
| **Deletion** | The right to request that their data be deleted, where legally permissible | Submit a written request to the Data Protection Officer |
| **Objection** | The right to object to certain uses of their data | Contact the Data Protection Officer |

All requests must be responded to within **21 days**. The Data Protection Officer is responsible for coordinating responses with the ICT team.

---

## 16. Acceptable Use Policy

### 16.1 Purpose

This policy sets out what KeSMIS users are and are not permitted to do with the system. It protects the data held in KeSMIS, ensures the system is used for its intended purposes, and protects staff from inadvertently breaching the law.

Every user must read and acknowledge this policy before being granted access.

### 16.2 What You Are Permitted to Do

- Access KeSMIS to perform tasks that are part of your official KISIP programme duties
- View, enter, and update data within your assigned location and role scope
- Export reports and data that you are authorised to access, for legitimate programme purposes
- Report security concerns or suspected incidents to the ICT team or the Data Protection Officer

### 16.3 What You Are Not Permitted to Do

The following actions are strictly prohibited and may result in disciplinary action, termination, or legal prosecution under the KDPA or Computer Misuse and Cybercrimes Act, 2018:

| Prohibited Action | Why |
|------------------|-----|
| Sharing your login credentials with anyone — including colleagues | Every user must have their own account; shared credentials make audit trails meaningless |
| Accessing data that is outside your assigned location or role | Unauthorised access to personal data is a criminal offence under the KDPA |
| Exporting, copying, or printing large volumes of data without authorisation | Bulk data exports create serious data breach risk |
| Using KeSMIS data for personal purposes or outside the programme | Data collected for the programme must only be used for the programme |
| Attempting to access parts of the system you are not authorised for | Unauthorised access attempts are logged and may trigger investigation |
| Installing software on the server or making changes to system configuration without ICT approval | Unauthorised changes can compromise system security and data integrity |
| Failing to report a suspected security incident | Delayed reporting can significantly worsen the impact of a breach |
| Accessing the system from an unsecured or public device or network | This exposes credentials and data to interception |

### 16.4 Consequences of Misuse

Violations of this policy will be handled in accordance with KISIP's disciplinary procedures. Depending on the nature of the violation, consequences may include:

- Immediate suspension of system access
- Formal disciplinary action
- Reporting to the Office of the Data Protection Commissioner
- Criminal prosecution under the Computer Misuse and Cybercrimes Act, 2018 or the KDPA

### 16.5 User Acknowledgement

By accessing KeSMIS, users confirm that they have read, understood, and agree to comply with this Acceptable Use Policy and the full Safeguards Protocol. A signed acknowledgement form must be completed before initial access is granted and renewed annually.

---

## 17. Responsibilities (Summary)

Keeping KeSMIS secure is a shared responsibility. The following table sets out what each person or group is expected to do.

| Role | Key Responsibilities |
|------|---------------------|
| **KISIP ICT Administrator** | Maintain server and database security; manage system credentials; ensure software is patched and up to date; activate/deactivate user accounts; respond to security incidents |
| **Martin Musembi — Data Protection Officer** | Ensure KISIP complies with the KDPA; oversee data protection practices; handle data subject requests; lead regulatory breach notification within 72 hours; review third-party data processing agreements |
| **Programme Managers (National & County)** | Approve user access requests; ensure staff in their team follow this policy; report departures or role changes promptly so accounts can be updated or deactivated |
| **All System Users** | Use a strong, unique password; never share login credentials with anyone; lock your screen or log out when stepping away; report any suspicious activity or potential breach immediately; only use the system for its intended programme purposes |
| **System Developers** | Never write credentials or secrets into source code; follow secure coding practices; have all changes reviewed before deployment; inform the ICT lead of any vulnerability discovered |

---

## 18. Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-27 | KeSMIS ICT | Initial document — based on security audit and system review |

**Next Review Date:** 2027-03-27 — or immediately following any material security incident or change to the system.

Questions about this document should be directed to **the Data Protection Officer** or the KeSMIS ICT Administrator.

---

*This document is classified OFFICIAL — SENSITIVE. Distribution is limited to KISIP programme management, ICT staff, and designated county coordinators. Do not share externally without authorisation from the KISIP Programme Director.*
