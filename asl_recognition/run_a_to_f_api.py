import uvicorn
import os
import sys
import subprocess

# Get the absolute path to the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))

if __name__ == "__main__":
    try:
        # Change to the asl_recognition directory
        os.chdir(current_dir)
        
        # Print current working directory for debugging
        print(f"Running from directory: {os.getcwd()}")
        
        # Run using direct path to the file
        result = subprocess.run(["python", "a_to_f_api.py"], 
                             check=True, 
                             text=True,
                             capture_output=False)
    except Exception as e:
        print(f"Error running API: {e}") 