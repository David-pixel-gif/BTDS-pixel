from database import get_database


def init_extensions():
    return {"database": get_database()}
