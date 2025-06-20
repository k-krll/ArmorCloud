// quiz.js

let quizQuestions = [];
let quizLoaded = false;

// --- Состояние квиза ---
let quizState = {
    step: 1, // 1: контакты, 2: тест, 3: расширенный
    contact: {
        name: '',
        email: '',
        phone: '',
        consent: false
    },
    answers: [],
    extended: {},
    explanations: [] // для комментариев кандидата
};

let testIndex = 0;
let shuffledOptions = [];

// --- WebSocket ---
let ws = null;
let wsUserId = null;
function wsConnect() {
    ws = new WebSocket('ws://' + window.location.host);
    ws.onopen = () => {};
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'ack' && data.payload.id) {
                wsUserId = data.payload.id;
            }
        } catch {}
    };
    ws.onerror = () => {};
    ws.onclose = () => {};
}
wsConnect();

function wsSend(type, payload) {
    if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ type, payload }));
    }
}

// --- Загрузка вопросов из JSON ---
function loadQuizQuestions(callback) {
    fetch('quiz_questions.json')
        .then(res => res.json())
        .then(data => {
            quizQuestions = data;
            quizLoaded = true;
            if (typeof callback === 'function') callback();
        })
        .catch(() => {
            // fallback: если не удалось загрузить, используем 1 тестовый вопрос
            quizQuestions = [
                {
                    category: 'C#',
                    question: 'Что такое делегат в C#?',
                    options: [
                        { text: 'Тип, представляющий ссылку на метод', tag: 'green', explain: 'Делегат — это тип, который представляет ссылку на метод с определённой сигнатурой.' },
                        { text: 'Тип коллекции', tag: 'red', explain: 'Это неверно. Делегат не является коллекцией.' },
                        { text: 'Класс для работы с файлами', tag: 'yellow', explain: 'Это не совсем так. Делегат не связан с файлами.' },
                        { text: 'Тип исключения', tag: 'red', explain: 'Это неверно. Делегат не связан с исключениями.' },
                        { text: 'Нет нужного ответа', tag: 'none', explain: 'Если не знаете — ничего страшного, это базовый вопрос.' }
                    ]
                }
            ];
            quizLoaded = true;
            if (typeof callback === 'function') callback();
        });
}

// --- Shuffle helper ---
function shuffleArray(arr) {
    // Вариант с tag 'none' всегда последний
    const withNone = arr.filter(opt => opt.tag === 'none');
    const withoutNone = arr.filter(opt => opt.tag !== 'none');
    const a = withoutNone.map((v, i) => ({...v, _originalIndex: arr.indexOf(v)}));
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    if (withNone.length) {
        // Добавляем 'none' в конец, сохраняем _originalIndex
        a.push({...withNone[0], _originalIndex: arr.indexOf(withNone[0])});
    }
    return a;
}

// --- Рендеринг ---
function renderQuiz() {
    const root = document.getElementById('quiz-root');
    root.innerHTML = '';
    if (quizState.step === 1) renderContactStep(root);
    else if (quizState.step === 2) renderTestStep(root);
    else if (quizState.step === 3) renderExtendedStep(root);
}

// --- Валидация ---
function validateName(name) {
    return /^[A-Za-zА-Яа-яЁё\-\s]+$/.test(name.trim());
}
function validateEmail(email) {
    return /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(email.trim());
}
function validatePhone(phone) {
    return /^\+7 \d{3} \d{3} \d{2}-\d{2}$/.test(phone.trim());
}
function formatPhone(input) {
    // Оставляем только цифры
    let digits = input.replace(/\D/g, '');
    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
    if (!digits.startsWith('7')) digits = '7' + digits;
    digits = digits.slice(0, 11); // 1 (код страны) + 10 цифр
    let res = '+7';
    if (digits.length > 1) res += ' ' + digits.slice(1, 4);
    if (digits.length > 4) res += ' ' + digits.slice(4, 7);
    if (digits.length > 7) res += ' ' + digits.slice(7, 9);
    if (digits.length > 9) res += '-' + digits.slice(9, 11);
    return res;
}

// --- Шаг 1: Контакты ---
function renderContactStep(root) {
    const container = document.createElement('div');
    container.className = 'quiz-card';
    container.innerHTML = `
        <h2>Контактная информация</h2>
        <div class="quiz-field">
            <label>Имя</label>
            <input type="text" id="contact-name" value="${quizState.contact.name}" autocomplete="name" />
            <div id="name-error" class="quiz-error" style="display:none"></div>
        </div>
        <div class="quiz-field">
            <label>Email</label>
            <input type="email" id="contact-email" value="${quizState.contact.email}" autocomplete="email" />
            <div id="email-error" class="quiz-error" style="display:none"></div>
        </div>
        <div class="quiz-field">
            <label>Телефон</label>
            <input type="tel" id="contact-phone" value="${quizState.contact.phone}" autocomplete="tel" maxlength="18" />
            <div id="phone-error" class="quiz-error" style="display:none"></div>
        </div>
        <div class="quiz-field">
            <label style="display:flex;align-items:center;gap:8px;">
                <input type="checkbox" id="contact-consent" ${quizState.contact.consent ? 'checked' : ''} />
                Я согласен с <a href="privacy_policy.html" target="_blank">политикой конфиденциальности</a>
            </label>
        </div>
        <button id="contact-next" class="quiz-btn" disabled>Далее</button>
    `;
    root.appendChild(container);

    // Валидация
    let touched = { name: false, email: false, phone: false };
    const update = () => {
        quizState.contact.name = document.getElementById('contact-name').value.trim();
        quizState.contact.email = document.getElementById('contact-email').value.trim();
        quizState.contact.phone = document.getElementById('contact-phone').value.trim();
        quizState.contact.consent = document.getElementById('contact-consent').checked;
        let valid = true;
        // Имя
        if (!validateName(quizState.contact.name)) {
            if (touched.name) {
                document.getElementById('name-error').textContent = 'Имя должно содержать только буквы и дефис';
                document.getElementById('name-error').style.display = 'block';
                document.getElementById('name-error').style.color = touched.name === 'blur' ? '#E04747' : '#ffe066';
            } else {
                document.getElementById('name-error').style.display = 'none';
            }
            valid = false;
        } else {
            document.getElementById('name-error').style.display = 'none';
        }
        // Email
        if (!validateEmail(quizState.contact.email)) {
            if (touched.email) {
                document.getElementById('email-error').textContent = 'Некорректный email';
                document.getElementById('email-error').style.display = 'block';
                document.getElementById('email-error').style.color = touched.email === 'blur' ? '#E04747' : '#ffe066';
            } else {
                document.getElementById('email-error').style.display = 'none';
            }
            valid = false;
        } else {
            document.getElementById('email-error').style.display = 'none';
        }
        // Телефон
        if (!validatePhone(quizState.contact.phone)) {
            if (touched.phone) {
                document.getElementById('phone-error').textContent = 'Телефон должен быть в формате +7 XXX XXX XX-XX';
                document.getElementById('phone-error').style.display = 'block';
                document.getElementById('phone-error').style.color = touched.phone === 'blur' ? '#E04747' : '#ffe066';
            } else {
                document.getElementById('phone-error').style.display = 'none';
            }
            valid = false;
        } else {
            document.getElementById('phone-error').style.display = 'none';
        }
        document.getElementById('contact-next').disabled = !(valid && quizState.contact.consent);
    };
    ['contact-name','contact-email','contact-phone','contact-consent'].forEach(id => {
        document.getElementById(id).addEventListener('input', e => {
            touched[id.split('-')[1]] = true;
            update();
        });
        document.getElementById(id).addEventListener('blur', e => {
            touched[id.split('-')[1]] = 'blur';
            update();
        });
        document.getElementById(id).addEventListener('change', update);
    });
    document.getElementById('contact-phone').addEventListener('input', function(e) {
        const formatted = formatPhone(e.target.value);
        e.target.value = formatted;
        quizState.contact.phone = formatted;
        update();
    });
    update();
    document.getElementById('contact-next').onclick = () => {
        wsSend('contact_info', {
            name: quizState.contact.name,
            email: quizState.contact.email,
            phone: quizState.contact.phone
        });
        quizState.step = 2;
        renderQuiz();
    };
}

// --- Шаг 2: Тест ---
function renderTestStep(root) {
    const q = quizQuestions[testIndex];
    const hasGreen = q.options.some(opt => opt.tag === 'green');
    let options = q.options.slice();
    let isNoCorrect = !hasGreen;
    if (isNoCorrect && !options.some(opt => opt.tag === 'none')) {
        options = options.concat([{ text: 'Мне трудно ответить на этот вопрос', tag: 'none', explain: 'Поясните, почему вам трудно ответить на этот вопрос.' }]);
    }
    if (!shuffledOptions[testIndex]) {
        shuffledOptions[testIndex] = shuffleArray(options);
    }
    const shuffled = shuffledOptions[testIndex];
    const selected = quizState.answers[testIndex];
    const requireExplanation = !!q.requireExplanation;
    const container = document.createElement('div');
    container.className = 'quiz-card';
    container.innerHTML = `
        <div class="quiz-progress">
            Вопрос ${testIndex+1} из ${quizQuestions.length}
        </div>
        <h2>${q.category}</h2>
        <div class="quiz-question">${q.question}</div>
        <div class="quiz-options">
            ${shuffled.map((opt,i) => `
                <label class="quiz-option" id="option-${i}">
                    <input type="radio" name="quiz-option" value="${i}" ${selected===i?'checked':''} />
                    ${opt.text}
                </label>
            `).join('')}
        </div>
        <div id="quiz-explain"></div>
        <div class="quiz-nav">
            <button id="test-prev" class="quiz-btn" ${testIndex===0?'disabled':''}>Назад</button>
            <button id="test-next" class="quiz-btn" disabled>Далее</button>
        </div>
    `;
    root.appendChild(container);

    // Подсветка и объяснения
    function showFeedback(force) {
        if (requireExplanation) {
            // Не подсвечиваем варианты цветом
            shuffled.forEach((opt, i) => {
                const el = document.getElementById('option-'+i);
                el.classList.remove('green','yellow','red','none');
            });
        } else {
            shuffled.forEach((opt, i) => {
                const el = document.getElementById('option-'+i);
                el.classList.remove('green','yellow','red','none');
                if (opt.tag) el.classList.add(opt.tag);
            });
        }
        // Для requireExplanation показываем textarea сразу после выбора
        if (requireExplanation && (selected !== undefined || force)) {
            let explain = `<div class='quiz-explain-msg' style='color:#E047A0;'>Поясните, почему вы выбрали этот вариант ответа, а не другие:</div><textarea id='disagree-comment' class='quiz-wide-textarea' placeholder='Ваше пояснение...'>${quizState.explanations[testIndex]||''}</textarea>`;
            document.getElementById('quiz-explain').innerHTML = explain;
            const textarea = document.getElementById('disagree-comment');
            if (textarea) {
                textarea.addEventListener('input', e => {
                    quizState.explanations[testIndex] = e.target.value;
                    document.getElementById('test-next').disabled = !e.target.value.trim();
                });
                document.getElementById('test-next').disabled = !textarea.value.trim();
            }
        } else if (selected !== undefined) {
            const tag = shuffled[selected].tag;
            let explain = '';
            if (isNoCorrect) {
                explain = `<div class='quiz-explain-msg'>Поясните, почему вы выбрали этот вариант:</div><textarea id='disagree-comment'>${quizState.explanations[testIndex]||''}</textarea>`;
            } else if (tag === 'red' || tag === 'yellow') {
                explain = `<div class='quiz-explain-msg'>${shuffled[selected].explain || ''}<br><b>Почему правильный ответ зелёный?</b> ${shuffled.find(o=>o.tag==='green')?.explain||''}</div>`;
                explain += `<div class='quiz-disagree'><label>Если вы не согласны, объясните почему ваш ответ верный:</label><textarea id='disagree-comment'>${quizState.explanations[testIndex]||''}</textarea></div>`;
            } else if (tag === 'none') {
                explain = `<div class='quiz-explain-msg'>${shuffled[selected].explain||''}</div>`;
            } else if (tag === 'green') {
                explain = `<div class='quiz-explain-msg' style='color:#47E0A0;'>Верно!</div>`;
            }
            document.getElementById('quiz-explain').innerHTML = explain;
            const textarea = document.getElementById('disagree-comment');
            if (textarea) {
                textarea.addEventListener('input', e => {
                    quizState.explanations[testIndex] = e.target.value;
                });
            }
        }
    }

    // Навигация и выбор
    document.querySelectorAll('input[name="quiz-option"]').forEach(radio => {
        radio.addEventListener('change', e => {
            quizState.answers[testIndex] = parseInt(e.target.value);
            showFeedback(true);
            if (!requireExplanation) {
                document.getElementById('test-next').disabled = false;
                const idx = parseInt(e.target.value);
                wsSend('answer', {
                    questionIndex: testIndex,
                    selectedOption: shuffled[idx]._originalIndex,
                    tag: shuffled[idx].tag,
                    comment: quizState.explanations[testIndex] || ''
                });
            }
        });
    });
    if (selected !== undefined) {
        showFeedback(true);
        if (!requireExplanation) {
            document.getElementById('test-next').disabled = false;
        }
    }
    document.getElementById('test-prev').onclick = () => {
        if (testIndex > 0) {
            testIndex--;
            renderQuiz();
        }
    };
    document.getElementById('test-next').onclick = () => {
        const currentShuffled = shuffledOptions[testIndex];
        const currentSelected = quizState.answers[testIndex];
        if (requireExplanation) {
            if (typeof currentSelected !== 'number' || currentSelected < 0 || currentSelected >= currentShuffled.length) {
                alert('Пожалуйста, выберите вариант ответа и заполните пояснение.');
                return;
            }
            wsSend('answer', {
                questionIndex: testIndex,
                selectedOption: currentShuffled[currentSelected]._originalIndex,
                tag: currentShuffled[currentSelected].tag,
                comment: quizState.explanations[testIndex] || ''
            });
        }
        if (testIndex < quizQuestions.length-1) {
            testIndex++;
            renderQuiz();
        } else {
            wsSend('complete', {});
            quizState.step = 3;
            renderQuiz();
        }
    };
}

// --- Шаг 3: Расширенный опросник ---
function renderExtendedStep(root) {
    const container = document.createElement('div');
    container.className = 'quiz-card';
    container.innerHTML = `
        <h2>Опыт и мотивация</h2>
        <form id="extended-form">
            <div class="quiz-field">
                <label>Возраст:</label>
                <div>
                    <label><input type="radio" name="age" value="до 20">До 20</label>
                    <label><input type="radio" name="age" value="20-25">20–25</label>
                    <label><input type="radio" name="age" value="26-35">26–35</label>
                    <label><input type="radio" name="age" value="36-45">36–45</label>
                    <label><input type="radio" name="age" value="46+">46+</label>
                    <label><input type="radio" name="age" value="student">Студент-олимпиадник <span style="color:#E047A0;font-size:0.95em;">(рассматриваем выдающихся студентов и олимпиадников)</span></label>
                </div>
            </div>
            <div class="quiz-field">
                <label>Опыт работы с C#/.NET:</label>
                <div>
                    <label><input type="radio" name="exp" value="1-3">1–3 года</label>
                    <label><input type="radio" name="exp" value="3-5">3–5 лет</label>
                    <label><input type="radio" name="exp" value="5+">5+ лет</label>
                    <label><input type="radio" name="exp" value="student">Студент/меньше года</label>
                </div>
            </div>
            <div class="quiz-field">
                <label>Сколько боевых проектов у вас было?</label>
                <div>
                    <label><input type="radio" name="projects" value="1-2">1–2</label>
                    <label><input type="radio" name="projects" value="3-5">3–5</label>
                    <label><input type="radio" name="projects" value="6+">6 и более</label>
                </div>
            </div>
            <div class="quiz-field">
                <label>Опыт с оборудованием (плоттеры/принтеры):</label>
                <div>
                    <label><input type="radio" name="hardware" value="none">Нет</label>
                    <label><input type="radio" name="hardware" value="rare">Было пару раз</label>
                    <label><input type="radio" name="hardware" value="regular">Регулярно работаю</label>
                </div>
            </div>
            <div class="quiz-field">
                <label>Портфолио:</label>
                <textarea name="portfolio" placeholder="Ссылки на github, pet-проекты, описание задач"></textarea>
                <div style="color:#999;font-size:0.95em;">Укажите ссылки на github, pet-проекты, опишите интересные задачи</div>
            </div>
            <div class="quiz-field">
                <label>Ожидания:</label>
                <textarea name="expectations" placeholder="Желаемый уровень дохода, формат работы, график"></textarea>
                <div style="color:#999;font-size:0.95em;">Желаемый уровень дохода, формат работы, график</div>
            </div>
            <div class="quiz-field">
                <label>Готовность к тестовому заданию:</label>
                <div>
                    <label><input type="radio" name="testtask" value="yes">Да</label>
                    <label><input type="radio" name="testtask" value="no">Нет</label>
                    <label><input type="radio" name="testtask" value="depends">Зависит от объёма</label>
                </div>
            </div>
            <div class="quiz-nav">
                <button type="button" id="extended-skip" class="quiz-btn">Пропустить</button>
                <button type="submit" class="quiz-btn">Отправить</button>
            </div>
        </form>
    `;
    root.appendChild(container);
    document.getElementById('extended-form').onsubmit = function(e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(this).entries());
        quizState.extended = data;
        // Отправляем расширенные ответы на сервер
        wsSend('extended', data);
        showQuizResult();
    };
    document.getElementById('extended-skip').onclick = function() {
        showQuizResult();
    };
}

// --- Финальный экран ---
function showQuizResult() {
    const root = document.getElementById('quiz-root');
    root.innerHTML = `<div class="quiz-card">
        <h2>Спасибо!</h2>
        <p>Ваши ответы отправлены. Мы свяжемся с вами по указанным контактам.</p>
    </div>`;
    // Здесь можно отправить quizState на сервер или в Google Sheets
}

// --- Инициализация ---
document.addEventListener('DOMContentLoaded', function() {
    loadQuizQuestions(renderQuiz);
});

// --- CSS для подсветки ---
(function addQuizColors(){
    if(document.getElementById('quiz-color-style')) return;
    const style = document.createElement('style');
    style.id = 'quiz-color-style';
    style.innerHTML = `
    .quiz-option.green { background: #e6fff2; border-color: #47E0A0; }
    .quiz-option.yellow { background: #fffbe6; border-color: #ffe066; }
    .quiz-option.red { background: #ffeaea; border-color: #E04747; }
    .quiz-option.none { background: #f8f9fa; border-color: #999; }
    .quiz-explain-msg { margin: 1rem 0; color: #E047A0; }
    .quiz-disagree { margin: 1rem 0; }
    .quiz-disagree textarea { width: 100%; min-height: 60px; border-radius: 1.2vmin; border: 1px solid #D743DD; padding: 0.5rem; }
    `;
    document.head.appendChild(style);
})();

// --- CSS для ошибок ---
(function addQuizErrorStyle(){
    if(document.getElementById('quiz-error-style')) return;
    const style = document.createElement('style');
    style.id = 'quiz-error-style';
    style.innerHTML = `
    .quiz-error { font-size: 0.95em; min-height: 1.2em; transition: color 0.2s; }
    `;
    document.head.appendChild(style);
})();

// --- CSS для широких текстовых полей ---
(function addQuizWideTextarea(){
    if(document.getElementById('quiz-wide-textarea-style')) return;
    const style = document.createElement('style');
    style.id = 'quiz-wide-textarea-style';
    style.innerHTML = `
    .quiz-wide-textarea { width: 100%; min-height: 90px; border-radius: 1.2vmin; border: 1px solid #D743DD; padding: 0.7rem; font-size: 1.05em; margin-bottom: 1em; box-sizing: border-box; }
    `;
    document.head.appendChild(style);
})(); 