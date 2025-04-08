// chat-area에서 bot_id와 bot_image_url 정보 꺼내기
const chatArea = document.querySelector('.chat-area');
const botId = chatArea.dataset.botId;
const botImageUrl = chatArea.dataset.botImageUrl;

// 주요 DOM 요소
const chatLog = document.getElementById('chat-log');
const userMessageInput = document.getElementById('user-message');
const sendBtn = document.getElementById('send-btn');
const videoBtn = document.getElementById('videoBtn');
const imageBtn = document.getElementById('imageBtn');

// 메시지 전송 함수
async function sendMessage() {
  const message = userMessageInput.value.trim();
  if (!message) return;

  appendMessage('user', message);
  userMessageInput.value = '';

  // 로딩 표시 추가
  const loadingElem = document.createElement('div');
  loadingElem.classList.add('message', 'bot', 'loading');
  
  const botImg = document.createElement('img');
  botImg.classList.add('bot-big-img');
  botImg.src = botImageUrl;
  botImg.alt = "챗봇 이미지";
  
  const loadingText = document.createElement('div');
  loadingText.classList.add('bot-text');
  loadingText.textContent = "...";
  
  loadingElem.appendChild(botImg);
  loadingElem.appendChild(loadingText);
  chatLog.appendChild(loadingElem);
  chatLog.scrollTop = chatLog.scrollHeight;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bot_id: botId, message: message })
    });
    
    // 로딩 제거
    chatLog.removeChild(loadingElem);
    
    const data = await response.json();
    
    // JSON 구조 응답 처리
    if (data.text) {
      // 새로운 JSON 구조 응답
      appendBotMessage(data);
    } else if (data.reply) {
      // 이전 형식 응답 (문자열만 있는 경우)
      appendMessage('bot', data.reply);
    } else if (data.error) {
      appendMessage('bot', 'Error: ' + data.error);
    }
  } catch (err) {
    // 로딩 제거 (에러 발생 시)
    if (chatLog.contains(loadingElem)) {
      chatLog.removeChild(loadingElem);
    }
    appendMessage('bot', 'Error: 요청 실패');
    console.error(err);
  }
}

// 메시지 DOM에 추가 (기본 형식)
function appendMessage(sender, text) {
  const messageElem = document.createElement('div');
  messageElem.classList.add('message', sender);

  if (sender === 'user') {
    // 사용자 메시지
    messageElem.textContent = text;
  } else {
    // 봇 메시지
    const botImg = document.createElement('img');
    botImg.classList.add('bot-big-img');
    botImg.src = botImageUrl;
    botImg.alt = "챗봇 이미지";

    const messageText = document.createElement('div');
    messageText.classList.add('bot-text');
    messageText.textContent = text;

    messageElem.appendChild(botImg);
    messageElem.appendChild(messageText);
  }

  chatLog.appendChild(messageElem);
  chatLog.scrollTop = chatLog.scrollHeight;
}

// 봇 메시지 추가 (JSON 구조 지원)
function appendBotMessage(data) {
  const messageElem = document.createElement('div');
  messageElem.classList.add('message', 'bot');
  
  // 봇 이미지
  const botImg = document.createElement('img');
  botImg.classList.add('bot-big-img');
  botImg.src = botImageUrl;
  botImg.alt = "챗봇 이미지";
  messageElem.appendChild(botImg);
  
  // 메시지 컨테이너 (텍스트와 추가 요소들을 담는 컨테이너)
  const messageContainer = document.createElement('div');
  messageContainer.classList.add('bot-content');
  
  // 메시지 텍스트
  const messageText = document.createElement('div');
  messageText.classList.add('bot-text');
  messageText.textContent = data.text || '';
  messageContainer.appendChild(messageText);
  
  // 이벤트 정보가 있으면 처리
  if (data.event) {
    const eventDiv = document.createElement('div');
    eventDiv.classList.add('event-container');
    
    const eventTitle = document.createElement('h3');
    eventTitle.textContent = data.event.name || '이벤트';
    eventDiv.appendChild(eventTitle);
    
    const eventDesc = document.createElement('p');
    eventDesc.textContent = data.event.description;
    eventDiv.appendChild(eventDesc);
    
    // 선택지 목록 추가
    if (data.event.choices && data.event.choices.length > 0) {
      const choicesList = document.createElement('ul');
      choicesList.classList.add('choices-list');
      
      data.event.choices.forEach((choice, index) => {
        const choiceItem = document.createElement('li');
        choiceItem.textContent = `${index + 1}. ${choice}`;
        
        // 선택지 클릭 기능 추가 (선택 명령어 자동 입력)
        choiceItem.addEventListener('click', () => {
          userMessageInput.value = `/선택 ${index + 1}`;
          sendMessage();
        });
        
        choiceItem.style.cursor = 'pointer'; // 클릭 가능함을 시각적으로 표시
        choicesList.appendChild(choiceItem);
      });
      
      eventDiv.appendChild(choicesList);
    }
    
    messageContainer.appendChild(eventDiv);
  }
  
  // 감정 정보가 있으면 표시
  if (data.emotion) {
    const emotionDiv = document.createElement('div');
    emotionDiv.classList.add('emotion-tag');
    
    // 이모지와 감정 이름
    const emoji = data.emotion.emoji || '';
    const emotion = data.emotion.dominant_emotion || '';
    emotionDiv.textContent = `${emoji} ${emotion}`;
    
    messageContainer.appendChild(emotionDiv);
  }
  
  // 힌트가 있으면 표시
  if (data.hint) {
    const hintDiv = document.createElement('div');
    hintDiv.classList.add('hint-message');
    hintDiv.textContent = data.hint;
    messageContainer.appendChild(hintDiv);
  }
  
  messageElem.appendChild(messageContainer);
  chatLog.appendChild(messageElem);
  chatLog.scrollTop = chatLog.scrollHeight;
}

// 엔터키 또는 전송 버튼으로 전송
userMessageInput.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    sendMessage();
  }
});
sendBtn.addEventListener('click', sendMessage);

// 모달 열기/닫기
function openModal(modalId) {
  document.getElementById(modalId).style.display = 'block';
}
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// 미디어 버튼
videoBtn.addEventListener('click', () => {
  openModal('videoModal');
});
imageBtn.addEventListener('click', () => {
  openModal('imageModal');
});

// 모달 닫기 버튼들
document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      closeModal(modal.id);
  });
});

// 페이지 로드 시 웰컴 메시지 표시
document.addEventListener('DOMContentLoaded', () => {
  if (botId == 4) { // 알로스 챗봇인 경우
    appendMessage('bot', '안녕하세요, 선배님! 저는 서강대 자율전공 새내기 알로스에요. 대학 생활에 대해 궁금한 것이 있으시면 물어봐주세요!');
  }
});