const path = require('path');
const fs = require('fs');

/**
 * Normalizes question object from JSON
 * Supports English and Indonesian keys, flexible answers (index or text)
 */
function normalizeQuestions(raw) {
  let list = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === 'object') {
    list = raw.questions || raw.soal || raw.quiz || raw.items || raw.pertanyaan || [];
  }

  return list.map((item, idx) => {
    const qText = item.question || item.soal || item.tanya || item.prompt || `Pertanyaan #${idx + 1}`;
    const rawOptions = item.options || item.pilihan || item.opsi || item.choices || [];
    const options = Array.isArray(rawOptions) ? rawOptions.map(String) : [];
    
    let answerIdx = 0;
    const rawAns = item.answer !== undefined 
      ? item.answer 
      : (item.kunci !== undefined ? item.kunci : (item.jawaban !== undefined ? item.jawaban : 0));
    
    if (typeof rawAns === 'number') {
      if (rawAns >= 1 && rawAns <= options.length && !options[rawAns]) {
        answerIdx = rawAns - 1; // 1-based index support
      } else {
        answerIdx = Math.max(0, Math.min(rawAns, options.length - 1));
      }
    } else if (typeof rawAns === 'string') {
      const match = options.findIndex(opt => opt.trim().toLowerCase() === rawAns.trim().toLowerCase());
      if (match !== -1) {
        answerIdx = match;
      } else {
        const parsed = parseInt(rawAns, 10);
        if (!isNaN(parsed)) {
          answerIdx = parsed >= 1 && parsed <= options.length ? parsed - 1 : parsed;
        }
      }
    }

    const explanation = item.explanation || item.penjelasan || item.pembahasan || '';

    return {
      question: qText,
      options: options.length > 0 ? options : ['Benar', 'Salah'],
      answer: answerIdx,
      explanation
    };
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates an interactive, beautiful HTML quiz application from JSON questions
 */
function generateInteractiveQuizHtml(metadata, questions) {
  const title = metadata.title || 'Materi Belajar Interaktif';
  const category = metadata.category || 'Belajar Seru';
  const description = metadata.description || '';
  const safeQuestionsJson = JSON.stringify(questions);

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: radial-gradient(circle at 50% 20%, #1e1b4b, #090d16 85%);
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      overflow-x: hidden;
    }
    .quiz-card {
      width: 100%;
      max-width: 660px;
      background: rgba(30, 41, 59, 0.75);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 28px;
      padding: 32px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1);
      position: relative;
    }
    .badge-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      color: #a5b4fc;
      margin-bottom: 16px;
      font-family: 'Fredoka', sans-serif;
    }
    .progress-bar-bg {
      width: 100%;
      height: 10px;
      background: rgba(15, 23, 42, 0.7);
      border-radius: 999px;
      margin-bottom: 24px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #6366f1, #a855f7);
      width: 0%;
      transition: width 0.4s ease;
      border-radius: 999px;
    }
    h1 {
      font-family: 'Fredoka', sans-serif;
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #ffffff;
      line-height: 1.3;
    }
    .desc-text {
      font-size: 13px;
      color: #94a3b8;
      margin-bottom: 20px;
      line-height: 1.5;
    }
    .question-prompt {
      font-family: 'Fredoka', sans-serif;
      font-size: 18px;
      font-weight: 600;
      line-height: 1.4;
      margin-bottom: 20px;
      color: #f1f5f9;
      background: rgba(15, 23, 42, 0.45);
      padding: 18px 20px;
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .options-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      margin-bottom: 20px;
    }
    .opt-btn {
      width: 100%;
      padding: 16px 20px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 18px;
      color: #e2e8f0;
      font-size: 14px;
      font-weight: 600;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .opt-btn:hover:not(:disabled) {
      background: rgba(99, 102, 241, 0.2);
      border-color: #6366f1;
      transform: translateY(-2px);
      box-shadow: 0 8px 20px -4px rgba(99, 102, 241, 0.25);
    }
    .opt-btn:active:not(:disabled) {
      transform: scale(0.98);
    }
    .opt-btn.correct {
      background: rgba(16, 185, 129, 0.25) !important;
      border-color: #10b981 !important;
      color: #a7f3d0 !important;
    }
    .opt-btn.wrong {
      background: rgba(239, 68, 68, 0.25) !important;
      border-color: #ef4444 !important;
      color: #fca5a5 !important;
    }
    .opt-key {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.08);
      font-size: 12px;
      font-weight: 700;
      font-family: 'Fredoka', sans-serif;
      shrink: 0;
    }
    .explanation-box {
      margin-bottom: 20px;
      padding: 16px;
      border-radius: 16px;
      font-size: 13px;
      line-height: 1.5;
      display: none;
      animation: fadeIn 0.3s ease;
    }
    .explanation-box.correct {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #a7f3d0;
    }
    .explanation-box.wrong {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
    }
    .action-btn {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none;
      border-radius: 18px;
      color: white;
      font-family: 'Fredoka', sans-serif;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);
      transition: all 0.2s;
      display: none;
    }
    .action-btn:hover {
      opacity: 0.95;
      transform: translateY(-2px);
    }
    .result-screen {
      display: none;
      text-align: center;
      padding: 20px 0;
      animation: fadeIn 0.4s ease;
    }
    .result-screen.active {
      display: block;
    }
    .trophy-icon {
      font-size: 64px;
      margin-bottom: 12px;
      animation: bounce 1s infinite alternate;
    }
    .score-badge {
      font-family: 'Fredoka', sans-serif;
      font-size: 56px;
      font-weight: 700;
      background: linear-gradient(135deg, #38bdf8, #818cf8, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 6px;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-8px); } }
  </style>
</head>
<body>
  <div class="quiz-card">
    <div id="quizContent">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span class="badge-tag">📚 ${escapeHtml(category)}</span>
        <span id="qCountText" style="font-size: 12px; font-weight: bold; color: #94a3b8; font-family: 'Fredoka', sans-serif;">
          Pertanyaan 1 / ${questions.length}
        </span>
      </div>

      <div class="progress-bar-bg">
        <div id="progressBar" class="progress-bar-fill"></div>
      </div>

      <h1>${escapeHtml(title)}</h1>
      ${description ? `<p class="desc-text">${escapeHtml(description)}</p>` : ''}

      <div id="questionText" class="question-prompt"></div>

      <div id="optionsContainer" class="options-grid"></div>

      <div id="explanationBox" class="explanation-box"></div>

      <button id="nextBtn" class="action-btn" onclick="nextQuestion()">
        Lanjut ke Pertanyaan Berikutnya ➔
      </button>
    </div>

    <div id="resultScreen" class="result-screen">
      <div class="trophy-icon">🏆</div>
      <h2 style="font-family: 'Fredoka', sans-serif; font-size: 24px; margin-bottom: 4px;">Kuis Selesai! Hebat Sekali!</h2>
      <p style="font-size: 13px; color: #94a3b8; margin-bottom: 16px;">Hasil belajar kamu:</p>

      <div id="finalScoreText" class="score-badge">0</div>
      <div id="starText" style="font-size: 18px; margin-bottom: 24px; font-weight: bold; color: #fbbf24;"></div>

      <button id="finishBtn" class="action-btn" style="display: block; margin-top: 10px;" onclick="sendScoreToParent()">
        ✅ Kirim Skor & Selesaikan
      </button>
      <button class="opt-btn" style="margin-top: 12px; text-align: center; justify-content: center;" onclick="location.reload()">
        🔄 Ulangi Materi
      </button>
    </div>
  </div>

  <script>
    const questions = ${safeQuestionsJson};
    let currentQ = 0;
    let correctAnswers = 0;
    let answered = false;

    // Web Audio synthesizer for sounds
    function playBeep(type) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'correct') {
          osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
          osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
          gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.35);
        } else if (type === 'wrong') {
          osc.frequency.setValueAtTime(260, audioCtx.currentTime);
          osc.frequency.setValueAtTime(200, audioCtx.currentTime + 0.12);
          gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.3);
        }
      } catch (e) {}
    }

    function renderQuestion() {
      answered = false;
      const q = questions[currentQ];
      
      document.getElementById('qCountText').innerText = 'Pertanyaan ' + (currentQ + 1) + ' / ' + questions.length;
      document.getElementById('progressBar').style.width = ((currentQ / questions.length) * 100) + '%';
      document.getElementById('questionText').innerText = q.question;
      
      const optContainer = document.getElementById('optionsContainer');
      optContainer.innerHTML = '';

      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
      q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn';
        btn.innerHTML = '<span class="opt-key">' + (letters[idx] || (idx + 1)) + '</span><span>' + opt + '</span>';
        btn.onclick = () => selectOption(idx);
        optContainer.appendChild(btn);
      });

      document.getElementById('explanationBox').style.display = 'none';
      document.getElementById('nextBtn').style.display = 'none';
    }

    function selectOption(selectedIdx) {
      if (answered) return;
      answered = true;
      const q = questions[currentQ];
      const buttons = document.querySelectorAll('#optionsContainer .opt-btn');

      buttons.forEach(b => b.disabled = true);

      const isCorrect = selectedIdx === q.answer;
      if (isCorrect) {
        correctAnswers++;
        playBeep('correct');
        buttons[selectedIdx].classList.add('correct');
      } else {
        playBeep('wrong');
        buttons[selectedIdx].classList.add('wrong');
        if (buttons[q.answer]) {
          buttons[q.answer].classList.add('correct');
        }
      }

      const expBox = document.getElementById('explanationBox');
      if (isCorrect) {
        expBox.className = 'explanation-box correct';
        expBox.innerHTML = '✅ <strong>Jawaban Kamu Benar!</strong> ' + (q.explanation || 'Hebat sekali!');
      } else {
        expBox.className = 'explanation-box wrong';
        expBox.innerHTML = '💡 <strong>Kurang tepat!</strong> Jawaban yang benar: <strong>' + (q.options[q.answer] || '') + '</strong>. ' + (q.explanation || '');
      }
      expBox.style.display = 'block';

      const nextBtn = document.getElementById('nextBtn');
      if (currentQ < questions.length - 1) {
        nextBtn.innerText = 'Lanjut ke Pertanyaan Berikutnya ➔';
      } else {
        nextBtn.innerText = 'Lihat Hasil Belajar Kamu 🌟';
      }
      nextBtn.style.display = 'block';
    }

    function nextQuestion() {
      if (currentQ < questions.length - 1) {
        currentQ++;
        renderQuestion();
      } else {
        showResult();
      }
    }

    let finalScore = 0;
    function showResult() {
      document.getElementById('quizContent').style.display = 'none';
      document.getElementById('resultScreen').classList.add('active');

      finalScore = Math.round((correctAnswers / questions.length) * 100);
      document.getElementById('finalScoreText').innerText = finalScore;

      const starText = document.getElementById('starText');
      if (finalScore >= 85) {
        starText.innerText = '⭐⭐⭐⭐⭐ (5 Bintang - Sempurna!)';
      } else if (finalScore >= 70) {
        starText.innerText = '⭐⭐⭐⭐ (4 Bintang - Sangat Bagus!)';
      } else if (finalScore >= 50) {
        starText.innerText = '⭐⭐⭐ (3 Bintang - Hebat Sekali!)';
      } else if (finalScore >= 25) {
        starText.innerText = '⭐⭐ (2 Bintang - Cukup Bagus!)';
      } else {
        starText.innerText = '⭐ (1 Bintang - Semangat Terus Berlatih!)';
      }

      sendScoreToParent();
    }

    function sendScoreToParent() {
      window.parent.postMessage({
        type: 'QUIZ_COMPLETED',
        score: finalScore,
        total: 100
      }, '*');

      const finishBtn = document.getElementById('finishBtn');
      finishBtn.innerText = '✅ Skor Berhasil Dikirim!';
      finishBtn.style.background = '#10b981';
      finishBtn.disabled = true;
    }

    renderQuestion();
  </script>
</body>
</html>`;
}

/**
 * Prepares uploaded HTML by injecting intelligent quiz scoring bridge and auto-student-name handling
 */
function prepareUploadedHtml(htmlContent) {
  // If it already has our bridge, return as is
  if (htmlContent.includes('id="belajar-edutech-bridge"')) {
    return htmlContent;
  }

  // Remove any old floating bar if present
  let cleanHtml = htmlContent.replace(/<!-- Belajar Gamified Completion Floating Bar -->[\s\S]*?<\/div>\s*<\/div>/gi, '');

  const bridgeScript = `
  <!-- Belajar Gamified Quiz & Score Integration Bridge -->
  <script id="belajar-edutech-bridge">
  (function() {
    console.log('🚀 Belajar EduTech Bridge Active');

    // 1. Auto-fill and beautify student name input (No typing needed!)
    function setupStudentName() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const studentName = urlParams.get('student') || 'Hebat';
        
        const nameInput = document.getElementById('student-name') || document.querySelector('input[name="student-name"]');
        if (nameInput) {
          nameInput.value = studentName;
          nameInput.readOnly = true;
          const container = nameInput.closest('div');
          if (container && !container.__hasReplaced) {
            container.__hasReplaced = true;
            container.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.12))';
            container.style.border = '2px solid rgba(99,102,241,0.3)';
            container.style.borderRadius = '1rem';
            container.innerHTML = \`
              <div style="display:flex;align-items:center;justify-content:center;gap:10px;padding:4px 14px;font-family:inherit;">
                <span style="font-size:24px;">🌟</span>
                <div style="text-align:center;">
                  <span style="font-size:13px;color:#475569;font-weight:600;">Siswa:</span>
                  <span style="font-size:18px;color:#4338ca;font-weight:800;margin-left:6px;">\${studentName}</span>
                </div>
              </div>
              <input type="hidden" id="student-name" value="\${studentName}">
            \`;
          }
        }

        const nameDisplay = document.getElementById('display-name');
        if (nameDisplay) {
          nameDisplay.innerText = studentName;
        }
      } catch(e) {
        console.warn('Bridge setupStudentName error:', e);
      }
    }

    // 2. Score posting to parent system
    let hasPostedScore = false;
    function reportQuizScore(scoreVal, totalQ) {
      if (hasPostedScore) return;
      hasPostedScore = true;

      const s = Math.max(0, Math.min(100, Math.round(Number(scoreVal) || 0)));
      const tot = Number(totalQ) > 0 ? Number(totalQ) : 100;
      console.log('📢 Bridge: Reporting score to parent:', s);

      window.parent.postMessage({
        type: 'QUIZ_COMPLETED',
        score: s,
        total: tot
      }, '*');

      // Add visual confirmation in result modal if exists
      const modalContent = document.getElementById('modal-content');
      if (modalContent) {
        const existingNotice = document.getElementById('belajar-sync-notice');
        if (!existingNotice) {
          const notice = document.createElement('div');
          notice.id = 'belajar-sync-notice';
          notice.style.marginTop = '16px';
          notice.style.padding = '12px 18px';
          notice.style.background = '#dcfce7';
          notice.style.border = '2px solid #22c55e';
          notice.style.borderRadius = '16px';
          notice.style.color = '#15803d';
          notice.style.fontWeight = 'bold';
          notice.style.fontSize = '14px';
          notice.style.display = 'flex';
          notice.style.alignItems = 'center';
          notice.style.justifyContent = 'center';
          notice.style.gap = '8px';
          notice.innerHTML = \`<span>✅</span> <span>Nilai (\${s}) & Bintang Berhasil Dicatat ke Sistem!</span>\`;
          modalContent.appendChild(notice);
        }
      }
    }

    // 3. Hook existing showResult function
    function hookShowResult() {
      if (typeof window.showResult === 'function' && !window.showResult.__isHooked) {
        const origShowResult = window.showResult;
        const hooked = function(correct, total) {
          try {
            origShowResult(correct, total);
          } catch(err) {
            console.warn('Original showResult error:', err);
          }
          
          let finalScore = 0;
          if (typeof correct === 'number' && typeof total === 'number' && total > 0) {
            finalScore = Math.round((correct / total) * 100);
          } else {
            const scoreEl = document.getElementById('score-display');
            finalScore = scoreEl ? parseInt(scoreEl.innerText, 10) : Number(correct || 0);
          }
          
          reportQuizScore(finalScore, 100);
        };
        hooked.__isHooked = true;
        window.showResult = hooked;
      }
    }

    // 4. Hook button clicks & DOM score changes
    function setupListeners() {
      hookShowResult();
      setupStudentName();

      document.addEventListener('click', function(e) {
        const btn = e.target.closest('button') || e.target;
        if (btn && (btn.innerText?.includes('Cek Nilai') || btn.innerText?.includes('Selesai') || btn.getAttribute('onclick')?.includes('checkAnswers'))) {
          setTimeout(function() {
            hookShowResult();
            const scoreEl = document.getElementById('score-display') || document.querySelector('[id*="score"]');
            if (scoreEl) {
              const val = parseInt(scoreEl.innerText, 10);
              if (!isNaN(val)) {
                reportQuizScore(val, 100);
              }
            }
          }, 150);
        }
      }, true);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupListeners);
    } else {
      setupListeners();
    }

    setupStudentName();
    setTimeout(hookShowResult, 50);
    setTimeout(hookShowResult, 300);
    setTimeout(setupStudentName, 600);
  })();
  </script>
  `;

  if (cleanHtml.includes('</body>')) {
    return cleanHtml.replace('</body>', bridgeScript + '\n</body>');
  }
  return cleanHtml + bridgeScript;
}

module.exports = {
  normalizeQuestions,
  generateInteractiveQuizHtml,
  prepareUploadedHtml
};

