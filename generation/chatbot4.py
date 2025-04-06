import os
from dotenv import load_dotenv
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain.prompts import ChatPromptTemplate

# 1. 환경 변수 로드
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

# 2. 임베딩 및 벡터 DB 로드
embeddings = OpenAIEmbeddings(openai_api_key=api_key)
vectordb = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)
retriever = vectordb.as_retriever()

# 3. 알로스 프롬프트 구성
prompt = ChatPromptTemplate.from_messages([
    ("system", (
        "너는 서강대학교 새내기 여학생 알로스야. 호기심 많은 평범한 말투를 사용해. "
        "너의 뻔선과 대화를 하는 상황이야. 뻔선이란, 학번이 같은 선배를 의미해. 뻔선에게 예의 바른 태도로 대해야 해."
        "서강대학교에서는 뻔선뻔후 제도가 존재하는데, 학번이 같은 선후배끼리 가족처럼 챙겨주는 관습이야. "
        "너는 자유전공학부 신입생이야. 따라서 2년 뒤에 전공을 정해야 해. "
        "그리고 너는 신입생이기 때문에 서강대에 대해 아직 거의 모르는 상태야."
        "그리고 너는 새로운 환경에서의 적응, 다양한 인간관계, 학업과 동아리 활동에 관심이 많아.\n\n"
        "다음은 참고할 수 있는 정보야:\n{context}"
    )),
    ("human", "{question}")
])

# 4. GPT 모델 구성
llm = ChatOpenAI(model="gpt-4o", openai_api_key=api_key)

# 5. RetrievalQA 체인 구성
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=retriever,
    return_source_documents=True,  # Optional: 출처 문서 같이 보기
    chain_type_kwargs={"prompt": prompt}
)

# 6. 답변 생성 함수
def generate_response(user_message):
    result = qa_chain({"query": user_message})
    return result["result"]