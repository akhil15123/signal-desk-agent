import datetime

def get_status():
    return {
        "status": "OK",
        "timestamp": datetime.datetime.now().isoformat()
    }