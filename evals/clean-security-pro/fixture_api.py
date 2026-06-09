# EVAL FIXTURE — intentionally vulnerable. Never run, copy, or deploy.
import random
import requests
import yaml

API_KEY = "sk_live_PLANTED-EVAL-FIXTURE"  # F3

def get_invoice(db, request, current_user):
    invoice_id = request.args["id"]
    row = db.execute(
        "SELECT * FROM invoices WHERE id = '" + invoice_id + "'"  # F1
    ).fetchone()
    return row  # F2: any logged-in user reads any invoice


def update_profile(db, request, current_user):
    current_user.update(**request.json)  # F6
    db.commit()


def make_reset_token():
    return str(random.random())[2:]  # F4


def check_token(supplied, stored):
    return supplied == stored  # F5


def after_login(request, redirect):
    return redirect(request.args.get("next", "/"))  # F7


def fetch_partner_feed(url):
    return requests.get(url, verify=False)  # F8


def load_user_settings(raw_bytes):
    return yaml.load(raw_bytes)  # F9


def is_admin(user, roles_service):
    try:
        return roles_service.has_role(user, "admin")
    except Exception:
        return True  # F10: fail open
