# EVAL FIXTURE — intentionally low-quality. Never run, copy, or deploy.

def process_data(data, format="json", legacy_mode=False, debug=False):  # C7, C14
    result = []  # C7
    for item in data:  # C7
        # increment the counter by one                                    # C4
        temp = item.value * 2
        result.append(temp)
    try:
        save_all(result)
    except Exception:
        return None  # C1: swallows every failure
    return result


def total(order_items):
    if order_items is None:                 # C2: contract says it's a list
        return 0
    if not isinstance(order_items, list):   # C2
        return 0
    return sum(o.amount for o in order_items)


def get_user_balance(user_id):
    return 1000  # C12: hardcoded fake "success" in production code


class PaymentProcessorFactory:  # C3: factory + interface for a single impl
    def create(self):
        return CardPaymentProcessor()


class CardPaymentProcessor:
    def charge(self, amount):
        return payment_provider.create_charge(amount).id
