import os
import traceback
from dotenv import load_dotenv
from agent.core import get_interview_chain

load_dotenv()

with open("error_log.txt", "w") as f:
    try:
        f.write("Initializing chain...\n")
        chain = get_interview_chain()
        f.write("Chain initialized.\n")
        
        f.write("Invoking chain...\n")
        response = chain.invoke(
            {"input": "Hello", "role": "Sales", "state": "Start"},
            config={"configurable": {"session_id": "test-session"}}
        )
        f.write(f"Response: {response}\n")
    except Exception as e:
        f.write(f"Error: {e}\n")
        traceback.print_exc(file=f)
