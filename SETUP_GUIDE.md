# Credit Compass — Setup Guide
## How to go live using GitHub Pages + Google Sheets

---

## PART 1 — Google Sheets Setup (5 minutes)

### Step 1: Create a new Google Sheet
1. Go to sheets.google.com
2. Create a new blank spreadsheet
3. Name it: **Credit Compass**

### Step 2: Open Apps Script
1. In the spreadsheet, click **Extensions → Apps Script**
2. Delete all existing code in the editor
3. Copy the entire contents of **Code.gs** (included in this folder)
4. Paste it into the Apps Script editor
5. Click **Save** (Ctrl+S)

### Step 3: Deploy as Web App
1. Click **Deploy → New Deployment**
2. Click the gear icon next to "Type" → select **Web App**
3. Set the following:
   - Description: `ATM Inventory API`
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**
5. Click **Authorize access** → choose your Google account → Allow
6. **Copy the Web App URL** — you will need this later
   (looks like: `https://script.google.com/macros/s/XXXX/exec`)

---

## PART 2 — GitHub Pages Setup (5 minutes)

### Step 4: Upload to GitHub
1. Go to github.com → create a free account if needed
2. Click **New repository**
3. Name it: `credit-compass`
4. Set to **Public**
5. Click **Create repository**
6. Upload ALL files keeping the exact folder structure:
   ```
   index.html
   Code.gs
   SETUP_GUIDE.md
   css/style.css
   js/app.js
   js/auth.js
   js/data.js
   js/settings.js
   ... (all js files)
   ```

### Step 5: Enable GitHub Pages
1. In your repository, click **Settings**
2. Click **Pages** in the left sidebar
3. Under Source: select **Deploy from a branch**
4. Branch: **main** → folder: **/ (root)**
5. Click **Save**
6. Wait 2 minutes — GitHub gives you a URL like:
   `https://yourusername.github.io/credit-compass`

---

## PART 3 — Connect the App to Google Sheets (2 minutes)

### Step 6: Set the Script URL
1. Open your app URL in the browser
2. Log in (PIN: 1234 for all users)
3. Go to **Settings** (bottom of sidebar)
4. Find **Google Apps Script Connection**
5. Paste the Web App URL you copied in Step 3
6. Click **Save & Connect**
7. The app will sync — you should see "Connected ✓"

---

## PART 4 — Share with your team

Just share the GitHub Pages URL with all staff.
Everyone logs in with their own name + PIN.
All data is shared in real time through Google Sheets.

---

## Default PINs (change these after first login!)
| Name | Role | PIN |
|------|------|-----|
| Maria Lopez | Admin | 1234 |
| Jose Ramos | Admin | 1234 |
| R. Santos | Staff | 1234 |
| L. Cruz | Staff | 1234 |
| M. Diaz | Staff | 1234 |
| B. Reyes | Staff | 1234 |

> **Username** = Full name exactly as listed (e.g. "Maria Lopez", "R. Santos")
> **Password** = The value in the Password column above

Change passwords in: **Settings → Staff Accounts → Change Password**

---

## Troubleshooting

**"Script URL not responding"**
- Make sure you deployed as "Anyone can access"
- Try re-deploying with a new deployment

**Data not showing after connecting**
- Refresh the page
- Check Settings — the URL should show "Connected ✓"

**Works on one computer but not another**
- Make sure all staff are using the same GitHub Pages URL
- Clear browser cache and try again

---

## Data Backup
Go to **Settings → Export All Data** to download a JSON backup anytime.
You can also view/edit data directly in your Google Sheet.
