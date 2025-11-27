## Grievance Reporting & Management Manual (Public Portal)

### 1. Purpose
This manual explains how members of the public can submit a grievance through the KeSMIS online form located at `/grm`. The portal walks you through four guided steps, enforces mandatory data, and issues an acknowledgement with your reference code once submitted.

### 2. Before You Start
- Have the complainant’s identification (ID number, phone, optional email).
- Know the project location (county, settlement) and project phase (KISIP 1 or 2).
- Prepare a concise description of the complaint, desired remedy, and any witness details.
- Optional: up to three PDF/JPG/PNG documents under 500 KB each for supporting evidence.

### 3. Step-by-Step Filing Process

#### Step 1 – Personal Details
1. Enter the complainant’s full name. You may write “Anonymous” if privacy is required.
2. Select gender and age bracket.
3. Provide the National ID number.
4. Enter the phone number in international format. The form automatically enforces the `254XXXXXXXXX` format and removes leading zeros.  
5. Email is optional but recommended for updates.

#### Step 2 – Grievance Details
1. Pick the County. The Settlement list filters automatically to that county (an animated “…” indicator shows loading).
2. Choose the Settlement. The system captures the linked subcounty and ward automatically.
3. Select the project phase (default is KISIP 2).
4. Provide the physical address or landmark description.
5. Set the date reported (future dates are disabled; defaults to today).
6. Tick whether the complaint involves Gender-Based Violence (GBV) or is already in court.  
   - GBV complaints are escalated directly to the national level for confidentiality.  
   - “In court” grievances are tagged with status `In Court`; others begin in `Sorting`.

#### Step 3 – Complaint Details
1. If the complaint is **not** GBV-related, choose a “Nature of Complaint” category from the predefined list (land issues, compensation, infrastructure, etc.).
2. Describe the complaint in your own words (what happened, where, when, and parties involved).
3. State the plea or action you are requesting from KISIP.

#### Step 4 – Review & Submit
1. Provide witness details (name, phone, statement) if available.
2. Indicate whether you are the complainant using the toggle:
   - If “No”, supply your name and phone number as the reporter.
3. Upload supporting documents (up to three files, max 500 KB each). Files are stored as protected records labeled “Supporting Documentation”.
4. Review everything and press **Submit**. Use **Previous** to revise any step or **Reset** to start over.

### 4. After Submission
1. The form validates all required fields at each step. Missing or incorrect data triggers inline error messages—correct them and try again.
2. Once valid, the system:
   - Generates a grievance record (`status` = `Sorting` or `In Court`, `current_level` = `settlement` unless GBV ⇒ `national`).
   - Logs an initial “Reported” action containing the first 100 characters of your description.
   - Uploads any attachments to the grievance and links them to the action.
   - Sends an acknowledgement via SMS/email with your grievance code, location details, and summary.
3. You are redirected to the landing page and shown a success toast.

### 5. Tips & Troubleshooting
- **Focus Guidance:** Each step automatically focuses the first field when you click **Next**, helping keyboard-only users.
- **Phone Formatting:** Only digits are allowed. The system strips non-numeric characters and enforces the `254` prefix and 12-digit limit.
- **County/Settlement Filtering:** If settlements take time to load, the field shows a disabled state with animated dots. Wait until the list is ready.
- **File Upload Errors:** If you exceed three files, you’ll see “You can only upload up to 3 files.” Remove extras and retry.
- **Accessibility:** Hidden headings, consistent labels, helper texts, and tour tips (Help button) guide new users through each part of the form.

### 6. Support
If you experience issues beyond validation errors, note your browser, time, and any on-screen message, then contact the KISIP help desk through the channels listed on the KeSMIS landing page.


