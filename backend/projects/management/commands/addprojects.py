import re
from openpyxl import load_workbook
from django.contrib.auth import get_user_model

# ============ CONFIG ============
EXCEL_PATH = r"D:\shrunked.xlsx"
SHEET_NAME = None
LIMIT = 50

IGNORE_NAMES = ["kifuko-koech"]
EMAIL_DOMAIN = "kalro.org"
PASSWORD = "P@$$w0rd254"

DRY_RUN = False          # ← flip to False when the preview looks right
# ================================

User = get_user_model()

wb = load_workbook(EXCEL_PATH, data_only=True)
ws = wb[SHEET_NAME] if SHEET_NAME else wb.active
rows = list(ws.iter_rows(values_only=True))

header = [str(h).strip() if h is not None else "" for h in rows[0]]
data_rows = rows[1:1 + LIMIT]

c_pi = None
for i, h in enumerate(header):
    if h.strip().upper() == "PI":
        c_pi = i
        break

if c_pi is None:
    print("PI column not found. Available columns:")
    for h in header:
        print("  ", h)
    raise SystemExit


def s(val):
    if val is None:
        return ""
    t = str(val).strip()
    if t.lower() in ("nan", "none", "nat"):
        return ""
    return t


def strip_title(name):
    return re.sub(
        r"^(dr|prof|mr|mrs|ms|miss|eng|sir)\.?\s*",
        "",
        name,
        flags=re.IGNORECASE,
    )


def split_name(full_name):
    name = s(full_name)
    if not name:
        return "", ""
    name = re.sub(r"\(.*?\)", " ", name)
    name = strip_title(name)
    name = name.replace(",", " ")
    parts = [p for p in name.split() if p]
    if len(parts) == 0:
        return "", ""
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], parts[-1]


def is_ignored(full_name):
    low = full_name.lower()
    return any(bad in low for bad in IGNORE_NAMES)


def clean_part(p):
    p = p.lower()
    p = re.sub(r"[^a-z0-9-]", "", p)
    return p


def make_email_base(first, last):
    f = clean_part(first)
    l = clean_part(last)
    if not f and not l:
        return "user"
    if not l:
        return f
    return f"{f}.{l}"


print(f"{'ROW':<5} {'FULL NAME':<45} {'FIRST':<15} {'LAST':<15} {'EMAIL':<35}")
print("-" * 120)

created = 0
skipped = 0
failed = 0

seen = set()
blank_count = 0
dup_count = 0
ignored_count = 0

for r_i, row in enumerate(data_rows, start=2):
    try:
        full_name = s(row[c_pi]) if c_pi < len(row) else ""

        if not full_name:
            blank_count += 1
            skipped += 1
            continue

        if is_ignored(full_name):
            ignored_count += 1
            skipped += 1
            continue

        key = full_name.lower()
        if key in seen:
            dup_count += 1
            skipped += 1
            continue
        seen.add(key)

        first, last = split_name(full_name)
        base = make_email_base(first, last)
        email = f"{base}@{EMAIL_DOMAIN}"

        # ensure email is unique against the DB
        n = 1
        while User.objects.filter(email=email).exists():
            n += 1
            email = f"{base}{n}@{EMAIL_DOMAIN}"

        print(f"{r_i:<5} {full_name!r:<45} {first!r:<15} {last!r:<15} {email:<35}")

        if DRY_RUN:
            continue

        # Create the user — all marked as staff
        User.objects.create_user(
            email=email,
            password=PASSWORD,
            first_name=first,
            last_name=last,
            is_staff=True,
        )
        created += 1

    except Exception as e:
        failed += 1
        print(f"Row {r_i}: FAILED -> {e}")

print("-" * 120)
print(f"Created: {created}   Skipped: {skipped}   Failed: {failed}")
print(f"(blanks={blank_count}, dupes={dup_count}, ignored={ignored_count})")
if DRY_RUN:
    print("DRY RUN — nothing written to the DB. Set DRY_RUN = False to insert.")