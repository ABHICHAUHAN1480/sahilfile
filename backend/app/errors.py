from sqlalchemy.exc import IntegrityError


def unique_constraint_message(error: IntegrityError) -> str:
    message = str(error.orig).lower()
    if "products" in message and "sku" in message:
        return "Product SKU/code must be unique."
    if "customers" in message and "email" in message:
        return "Customer email must be unique."
    return "A record with the same unique value already exists."
