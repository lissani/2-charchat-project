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

    chatLog.removeChild(loadingElem);

    const data = await response.json();

    if (data.text || data.type) {
      appendBotMessage(data);
    } else if (data.reply) {
      appendMessage('bot', data.reply);
    } else if (data.error) {
      appendMessage('bot', 'Error: ' + data.error);
    }
  } catch (err) {
    if (chatLog.contains(loadingElem)) {
      chatLog.removeChild(loadingElem);
    }
    appendMessage('bot', 'Error: 요청 실패');
    console.error(err);
  }
}

// 사용자 / 챗봇 메시지 기본 출력
function appendMessage(sender, text) {
  const messageElem = document.createElement('div');
  messageElem.classList.add('message', sender);

  if (sender === 'user') {
    messageElem.textContent = text;
  } else {
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

// 구조화된 JSON 응답 처리
function appendBotMessage(data) {
  const messageElem = document.createElement('div');
  messageElem.classList.add('message', 'bot');

  const botImg = document.createElement('img');
  botImg.classList.add('bot-big-img');
  botImg.src = botImageUrl;
  botImg.alt = "챗봇 이미지";
  messageElem.appendChild(botImg);

  const messageContainer = document.createElement('div');
  messageContainer.classList.add('bot-content');

  const messageText = document.createElement('div');
  messageText.classList.add('bot-text');
  if (data.text) messageText.textContent = data.text;
  messageContainer.appendChild(messageText);

  if (data.type === 'intro' && typeof data.text === 'object') {
  const { title, description, commands } = data.text;

  const messageElem = document.createElement('div');
  messageElem.classList.add('message', 'bot');

  const botImg = document.createElement('img');
  botImg.classList.add('bot-big-img');
  botImg.src = botImageUrl;
  botImg.alt = "챗봇 이미지";
  messageElem.appendChild(botImg);

  const contentDiv = document.createElement('div');
  contentDiv.classList.add('bot-content');

  const titleDiv = document.createElement('div');
  titleDiv.classList.add('bot-text');
  titleDiv.innerText = title;
  contentDiv.appendChild(titleDiv);

  const desc = document.createElement('p');
  desc.textContent = description;
  contentDiv.appendChild(desc);

  const ul = document.createElement('ul');
  commands.forEach(cmd => {
    const li = document.createElement('li');
    li.textContent = `${cmd.label}: ${cmd.desc}`;
    ul.appendChild(li);
  });
  contentDiv.appendChild(ul);

  messageElem.appendChild(contentDiv);
  chatLog.appendChild(messageElem);
  chatLog.scrollTop = chatLog.scrollHeight;
  return;  // ✅ intro 응답은 여기서 종료
}
  // === /도움말 ===
  if (data.type === 'help') {
    const helpTitle = document.createElement('h4');
    helpTitle.textContent = '도움말 명령어 목록';
    messageContainer.appendChild(helpTitle);

    const commandList = document.createElement('ul');
    data.commands.forEach(cmd => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.textContent = cmd.command;
      btn.title = cmd.description;
      btn.classList.add('command-btn');
      btn.addEventListener('click', () => {
        userMessageInput.value = cmd.example;
        sendMessage();
      });
      li.appendChild(btn);
      li.innerHTML += ` - ${cmd.description}`;
      commandList.appendChild(li);
    });
    messageContainer.appendChild(commandList);
  }

  // === /상태 ===
  if (data.type === 'status') {
    const statusTitle = document.createElement('h4');
    statusTitle.textContent = '현재 상태';
    messageContainer.appendChild(statusTitle);

    const currentEvent = document.createElement('p');
    currentEvent.innerHTML = `<strong>현재 이벤트:</strong> ${data.current_event} (${data.current_choice_made ? '선택 완료' : '선택 필요'})`;
    messageContainer.appendChild(currentEvent);

    const statsTitle = document.createElement('h4');
    statsTitle.textContent = '전공 스탯';
    messageContainer.appendChild(statsTitle);

    const statsList = document.createElement('ul');
    const maxStat = Math.max(...Object.values(data.major_stats));
    Object.entries(data.major_stats).forEach(([major, value]) => {
      const li = document.createElement('li');
      li.innerHTML = `${major}: <div class="stat-bar"><div class="stat-bar-fill" style="width: ${value / maxStat * 100}%"></div></div>`;
      statsList.appendChild(li);
    });
    messageContainer.appendChild(statsList);

    const choiceTitle = document.createElement('h4');
    choiceTitle.textContent = '선택 내역';
    messageContainer.appendChild(choiceTitle);

    const choiceList = document.createElement('ul');
    Object.entries(data.choices_history).forEach(([event, info]) => {
      const li = document.createElement('li');
      li.textContent = `${event}: ${info.choice}`;
      choiceList.appendChild(li);
    });
    messageContainer.appendChild(choiceList);
  }

  // === 이벤트 정보 ===
  if (data.event) {
    const eventDiv = document.createElement('div');
    eventDiv.classList.add('event-container');

    const eventTitle = document.createElement('h3');
    eventTitle.textContent = data.event.name || '이벤트';
    eventDiv.appendChild(eventTitle);

    const eventDesc = document.createElement('p');
    eventDesc.textContent = data.event.description;
    eventDiv.appendChild(eventDesc);

    if (data.event.choices && data.event.choices.length > 0) {
      const choicesList = document.createElement('ul');
      choicesList.classList.add('choices-list');

      data.event.choices.forEach((choice, index) => {
        const choiceItem = document.createElement('li');
        choiceItem.textContent = `${index + 1}. ${choice}`;
        choiceItem.addEventListener('click', () => {
          userMessageInput.value = `/선택 ${index + 1}`;
          sendMessage();
        });
        choiceItem.style.cursor = 'pointer';
        choicesList.appendChild(choiceItem);
      });

      eventDiv.appendChild(choicesList);
    }

    messageContainer.appendChild(eventDiv);
  }

  // === 감정 이모지 ===
  if (data.emotion) {
    const emotionDiv = document.createElement('div');
    emotionDiv.classList.add('emotion-tag');
    const emoji = data.emotion.emoji || '';
    const emotion = data.emotion.dominant_emotion || '';
    emotionDiv.textContent = `${emoji} ${emotion}`;
    messageContainer.appendChild(emotionDiv);
  }

  // === 힌트 메시지 ===
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

// 전송 관련 이벤트
userMessageInput.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') sendMessage();
});
sendBtn.addEventListener('click', sendMessage);

// 모달 제어
function openModal(modalId) {
  document.getElementById(modalId).style.display = 'block';
}
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}
videoBtn.addEventListener('click', () => openModal('videoModal'));
imageBtn.addEventListener('click', () => openModal('imageModal'));
document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => {
    const modal = btn.closest('.modal');
    closeModal(modal.id);
  });
});

// 첫 진입 환영 메시지
document.addEventListener('DOMContentLoaded', () => {
  if (botId == 4) {
    appendMessage('bot', '안녕하세요, 선배님! 저는 서강대 자율전공 새내기 알로스에요. 대학 생활에 대해 궁금한 것이 있으시면 물어봐주세요!');
  }
});
