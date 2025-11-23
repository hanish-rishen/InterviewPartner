import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from .prompts import INTERVIEWER_SYSTEM_PROMPT, FEEDBACK_SYSTEM_PROMPT
from .memory import get_session_history

load_dotenv()

# Initialize Gemini - using gemini-pro (stable and widely available)
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    temperature=0.7,
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

def get_interview_chain():
    prompt = ChatPromptTemplate.from_messages([
        ("system", INTERVIEWER_SYSTEM_PROMPT),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{input}"),
    ])

    chain = prompt | llm | StrOutputParser()

    with_message_history = RunnableWithMessageHistory(
        chain,
        get_session_history,
        input_messages_key="input",
        history_messages_key="history",
    )
    return with_message_history

def generate_feedback(session_id: str):
    history = get_session_history(session_id)
    messages = history.messages

    # Convert messages to a string transcript
    transcript = "\n".join([f"{msg.type}: {msg.content}" for msg in messages])

    prompt = ChatPromptTemplate.from_template(FEEDBACK_SYSTEM_PROMPT + "\n\nTranscript:\n{transcript}")
    chain = prompt | llm | StrOutputParser()

    return chain.invoke({"transcript": transcript})
