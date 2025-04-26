#!/usr/bin/env python
import uvicorn
from api import app  # Direct import from the local api.py file

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True) 