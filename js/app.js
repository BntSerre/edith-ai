/**
 * E.D.I.T.H. Tactical AI - Main Application Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // ----------------------------------------------------
  // DOM Elements
  // ----------------------------------------------------
  const tabButtons = document.querySelectorAll('.nav-tab-item');
  const tabPanes = document.querySelectorAll('.hud-tab-pane');
  const reactorWrapper = document.getElementById('reactorWrapper');
  const edithStatusText = document.getElementById('edithStatusText');
  const waveformCanvas = document.getElementById('waveformCanvas');
  const dialogueStream = document.getElementById('dialogueStream');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const voiceMainBtn = document.getElementById('voiceMainBtn');
  const quickChips = document.querySelectorAll('.quick-chip');
  const headerTime = document.getElementById('headerTime');
  const headerBattery = document.getElementById('headerBattery');

  // Vision Elements
  const cameraVideo = document.getElementById('cameraVideo');
  const cameraCanvas = document.getElementById('cameraCanvas');
  const arScanBtn = document.getElementById('arScanBtn');
  const switchCamBtn = document.getElementById('switchCamBtn');
  const torchBtn = document.getElementById('torchBtn');
  const arResultsModal = document.getElementById('arResultsModal');
  const arResultsText = document.getElementById('arResultsText');
  const closeArResults = document.getElementById('closeArResults');

  // Tools Elements
  const noteInput = document.getElementById('noteInput');
  const addNoteBtn = document.getElementById('addNoteBtn');
  const notesContainer = document.getElementById('notesContainer');
  const timerDisplay = document.getElementById('timerDisplay');
  const timerPresetBtns = document.querySelectorAll('.timer-preset-btn');
  const stopTimerBtn = document.getElementById('stopTimerBtn');
  const telemBattery = document.getElementById('telemBattery');
  const telemCoords = document.getElementById('telemCoords');
  const telemNet = document.getElementById('telemNet');
  const telemScreen = document.getElementById('telemScreen');
  const sosBtn = document.getElementById('sosBtn');

  // Settings Elements
  const providerSelect = document.getElementById('providerSelect');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const modelSelect = document.getElementById('modelSelect');
  const userCallsignInput = document.getElementById('userCallsignInput');
  const voiceSelect = document.getElementById('voiceSelect');
  const testVoiceBtn = document.getElementById('testVoiceBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const clearChatBtn = document.getElementById('clearChatBtn');
  const installAppBtn = document.getElementById('installAppBtn');
  const installModal = document.getElementById('installModal');
  const closeInstallModal = document.getElementById('closeInstallModal');

  // ----------------------------------------------------
  // iPhone Air / iOS Touch, Haptic & Audio Unlock
  // ----------------------------------------------------
  function triggerHaptic(type = 'light') {
    if (navigator.vibrate) {
      try {
        if (type === 'light') navigator.vibrate(10);
        else if (type === 'medium') navigator.vibrate(22);
        else if (type === 'heavy') navigator.vibrate([25, 45, 25]);
      } catch (e) {}
    }
  }

  // Unlock iOS Safari Web Audio & SpeechSynthesis on first touch
  let iosUnlocked = false;
  function unlockIOSAudio() {
    if (iosUnlocked) return;
    iosUnlocked = true;
    if (window.edithAudio) window.edithAudio.ensureAudioResumed();
    if (window.speechSynthesis) {
      try {
        const dummy = new SpeechSynthesisUtterance('');
        dummy.volume = 0;
        window.speechSynthesis.speak(dummy);
      } catch (e) {}
    }
    document.removeEventListener('touchstart', unlockIOSAudio);
    document.removeEventListener('click', unlockIOSAudio);
  }
  document.addEventListener('touchstart', unlockIOSAudio, { passive: true });
  document.addEventListener('click', unlockIOSAudio, { passive: true });

  // iOS Virtual Keyboard & Viewport resize handler
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT')) {
        setTimeout(() => {
          activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (dialogueStream) dialogueStream.scrollTop = dialogueStream.scrollHeight;
        }, 120);
      }
    });
  }

  // ----------------------------------------------------
  // PWA Install Prompt Logic
  // ----------------------------------------------------
  let deferredInstallPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (installAppBtn) installAppBtn.style.display = 'block';
  });

  if (installAppBtn) {
    installAppBtn.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          console.log('[EDITH PWA] Installé avec succès !');
        }
        deferredInstallPrompt = null;
      } else {
        // Show manual install guide modal (especially for iOS Safari)
        if (installModal) installModal.classList.add('show');
      }
    });
  }

  if (closeInstallModal) {
    closeInstallModal.addEventListener('click', () => {
      installModal.classList.remove('show');
    });
  }

  // ----------------------------------------------------
  // Audio Visualizer Waveform Canvas
  // ----------------------------------------------------
  const waveCtx = waveformCanvas ? waveformCanvas.getContext('2d') : null;
  let waveAnimationId = null;
  let wavePhase = 0;

  function renderWaveform() {
    if (!waveCtx || !waveformCanvas) return;
    const width = waveformCanvas.width = waveformCanvas.offsetWidth * (window.devicePixelRatio || 1);
    const height = waveformCanvas.height = waveformCanvas.offsetHeight * (window.devicePixelRatio || 1);
    waveCtx.clearRect(0, 0, width, height);

    const isSpeaking = window.edithAudio && window.edithAudio.isSpeaking;
    const isListening = window.edithSpeech && window.edithSpeech.isListening;

    const numPoints = 28;
    const step = width / (numPoints - 1);
    const centerY = height / 2;

    waveCtx.beginPath();
    waveCtx.lineWidth = 2 * (window.devicePixelRatio || 1);

    if (isListening) {
      waveCtx.strokeStyle = '#ff7b00'; // Vision orange
      waveCtx.shadowColor = 'rgba(255, 123, 0, 0.8)';
      waveCtx.shadowBlur = 8;
    } else if (isSpeaking) {
      waveCtx.strokeStyle = '#00e5ff'; // JARVIS cyan
      waveCtx.shadowColor = 'rgba(0, 229, 255, 0.8)';
      waveCtx.shadowBlur = 8;
    } else {
      waveCtx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
      waveCtx.shadowBlur = 0;
    }

    for (let i = 0; i < numPoints; i++) {
      const x = i * step;
      let amplitude = 2;

      if (isListening) {
        amplitude = Math.sin(i * 0.4 + wavePhase) * (height * 0.35);
      } else if (isSpeaking) {
        amplitude = Math.sin(i * 0.5 + wavePhase * 1.5) * (height * 0.4) * Math.sin(i / numPoints * Math.PI);
      } else {
        amplitude = Math.sin(i * 0.2 + wavePhase * 0.5) * 3;
      }

      const y = centerY + amplitude;
      if (i === 0) waveCtx.moveTo(x, y);
      else waveCtx.lineTo(x, y);
    }
    waveCtx.stroke();

    wavePhase += 0.08;
    waveAnimationId = requestAnimationFrame(renderWaveform);
  }
  renderWaveform();

  // ----------------------------------------------------
  // Tactical Header Clock & Telemetry Loop
  // ----------------------------------------------------
  function updateHeaderTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour12: false });
    if (headerTime) headerTime.textContent = `T+${timeStr}`;
  }
  setInterval(updateHeaderTime, 1000);
  updateHeaderTime();

  async function updateHeaderBattery() {
    if (navigator.getBattery) {
      try {
        const b = await navigator.getBattery();
        const pct = Math.round(b.level * 100);
        if (headerBattery) headerBattery.textContent = `${pct}% ${b.charging ? '⚡' : ''}`;
        if (telemBattery) telemBattery.textContent = `${pct}% ${b.charging ? '(Charge)' : ''}`;
      } catch (e) {}
    }
  }
  updateHeaderBattery();

  // ----------------------------------------------------
  // Navigation Tabs Switching
  // ----------------------------------------------------
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      triggerHaptic('light');
      const targetTab = btn.dataset.tab;
      window.edithAudio.playBeep(1000, 0.04);

      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const pane = document.getElementById(targetTab);
      if (pane) pane.classList.add('active');

      // Camera lifecycle
      if (targetTab === 'tabVision') {
        window.edithVision.startCamera();
      } else {
        window.edithVision.stopCamera();
      }

      // Refresh telemetry when entering tools
      if (targetTab === 'tabTools') {
        refreshToolsView();
      }
    });
  });

  // ----------------------------------------------------
  // Reactor States
  // ----------------------------------------------------
  function setReactorState(state, statusText = '') {
    if (!reactorWrapper) return;
    reactorWrapper.classList.remove('listening', 'speaking', 'processing');

    if (state === 'listening') {
      reactorWrapper.classList.add('listening');
      if (voiceMainBtn) voiceMainBtn.classList.add('listening');
      if (edithStatusText) edithStatusText.textContent = statusText || 'ÉCOUTE VOCALE EN COURS...';
    } else if (state === 'speaking') {
      reactorWrapper.classList.add('speaking');
      if (voiceMainBtn) voiceMainBtn.classList.remove('listening');
      if (edithStatusText) edithStatusText.textContent = statusText || 'E.D.I.T.H. RÉPOND...';
    } else if (state === 'processing') {
      reactorWrapper.classList.add('processing');
      if (voiceMainBtn) voiceMainBtn.classList.remove('listening');
      if (edithStatusText) edithStatusText.textContent = statusText || 'ANALYSE EN COURS...';
    } else {
      if (voiceMainBtn) voiceMainBtn.classList.remove('listening');
      if (edithStatusText) edithStatusText.textContent = statusText || 'SYSTÈME NOMINAL // PRÊT';
    }
  }

  // ----------------------------------------------------
  // Dialogue & Chat System
  // ----------------------------------------------------
  function appendMessage(sender, text, isMarkdown = false) {
    if (!dialogueStream) return;

    const msg = document.createElement('div');
    msg.className = `message-bubble ${sender}`;

    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const isEdith = sender === 'edith';

    msg.innerHTML = `
      <div class="msg-header">
        <span class="${isEdith ? 'msg-author-edith' : 'msg-author-user'}">
          ${isEdith ? '⚡ E.D.I.T.H. // TACTICAL' : '👤 ' + (window.edithAI.userName || 'COMMANDANT')}
        </span>
        <span class="msg-timestamp">${now}</span>
      </div>
      <div class="msg-body">${formatMessageText(text)}</div>
      ${isEdith ? `
        <div class="msg-actions">
          <button class="msg-act-btn replay-speech-btn" title="Réécouter">🔊 Réécouter</button>
          <button class="msg-act-btn copy-msg-btn" title="Copier">📋 Copier</button>
        </div>
      ` : ''}
    `;

    // Action handlers for bubble
    if (isEdith) {
      const replayBtn = msg.querySelector('.replay-speech-btn');
      if (replayBtn) {
        replayBtn.addEventListener('click', () => {
          setReactorState('speaking');
          window.edithAudio.speak(text, null, () => setReactorState('idle'));
        });
      }

      const copyBtn = msg.querySelector('.copy-msg-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(text);
          copyBtn.textContent = '✓ Copié !';
          setTimeout(() => copyBtn.textContent = '📋 Copier', 2000);
        });
      }
    }

    dialogueStream.appendChild(msg);
    dialogueStream.scrollTop = dialogueStream.scrollHeight;
  }

  function formatMessageText(text) {
    if (!text) return '';
    // Format bold, code blocks, lists
    let html = text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(0,229,255,0.1);padding:2px 4px;border-radius:3px;">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
    return html;
  }

  async function handleUserSubmit(userInputText) {
    const text = (userInputText || messageInput.value || '').trim();
    if (!text) return;

    if (messageInput) messageInput.value = '';
    appendMessage('user', text);
    setReactorState('processing', 'ANALYSE DU PROTOCOLE...');

    try {
      const reply = await window.edithAI.ask(text);
      appendMessage('edith', reply);
      if (window.edithAudio.autoSpeak) {
        setReactorState('speaking', 'SYNTHÈSE VOCALE...');
        window.edithAudio.speak(reply, 
          () => setReactorState('speaking'),
          () => setReactorState('idle')
        );
      } else {
        setReactorState('idle');
      }
    } catch (err) {
      appendMessage('edith', `Erreur système : ${err.message}`);
      setReactorState('idle');
      window.edithAudio.playWarning();
    }
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      triggerHaptic('light');
      handleUserSubmit();
    });
  }

  if (messageInput) {
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        triggerHaptic('light');
        handleUserSubmit();
      }
    });
  }

  // ----------------------------------------------------
  // Voice Input (Speech Recognition)
  // ----------------------------------------------------
  if (voiceMainBtn) {
    voiceMainBtn.addEventListener('click', () => {
      triggerHaptic('medium');
      window.edithAudio.ensureAudioResumed();
      window.edithSpeech.toggle();
    });
  }

  if (reactorWrapper) {
    reactorWrapper.addEventListener('click', () => {
      triggerHaptic('medium');
      window.edithAudio.ensureAudioResumed();
      // If currently speaking, stop speech
      if (window.edithAudio.isSpeaking) {
        window.edithAudio.stopSpeaking();
        setReactorState('idle');
        return;
      }
      window.edithSpeech.toggle();
    });
  }

  window.edithSpeech.onStartCallback = () => {
    setReactorState('listening', 'ÉCOUTE ACTIVE...');
  };

  window.edithSpeech.onResultCallback = (finalText, interimText) => {
    if (messageInput) {
      messageInput.value = finalText || interimText;
    }
    if (finalText) {
      handleUserSubmit(finalText);
    }
  };

  window.edithSpeech.onEndCallback = () => {
    if (!window.edithAudio.isSpeaking && reactorWrapper.classList.contains('listening')) {
      setReactorState('idle');
    }
  };

  window.edithSpeech.onErrorCallback = (err) => {
    setReactorState('idle', 'ERREUR MICROPHONE');
    setTimeout(() => setReactorState('idle'), 2500);
  };

  // ----------------------------------------------------
  // Quick Action Chips
  // ----------------------------------------------------
  quickChips.forEach(chip => {
    chip.addEventListener('click', () => {
      triggerHaptic('light');
      const prompt = chip.dataset.prompt;
      if (prompt) {
        window.edithAudio.playBeep(700, 0.05);
        handleUserSubmit(prompt);
      }
    });
  });

  // ----------------------------------------------------
  // AR Vision Scanner Controls
  // ----------------------------------------------------
  window.edithVision.init(cameraVideo, cameraCanvas);

  if (arScanBtn) {
    arScanBtn.addEventListener('click', async () => {
      triggerHaptic('heavy');
      try {
        arScanBtn.disabled = true;
        arScanBtn.innerHTML = '⚡ ANALYSE TACTIQUE EN COURS...';
        
        const result = await window.edithVision.scanAndAnalyze();
        
        if (arResultsText) arResultsText.innerHTML = formatMessageText(result);
        if (arResultsModal) arResultsModal.classList.add('show');

        window.edithAudio.speak(result);
      } catch (err) {
        alert("Erreur de scan : " + err.message);
      } finally {
        arScanBtn.disabled = false;
        arScanBtn.innerHTML = '⚡ SCANNER LA CIBLE';
      }
    });
  }

  if (closeArResults) {
    closeArResults.addEventListener('click', () => {
      triggerHaptic('light');
      arResultsModal.classList.remove('show');
      window.edithAudio.stopSpeaking();
    });
  }

  if (switchCamBtn) {
    switchCamBtn.addEventListener('click', () => {
      triggerHaptic('light');
      window.edithVision.toggleCamera();
    });
  }

  if (torchBtn) {
    torchBtn.addEventListener('click', async () => {
      triggerHaptic('light');
      const state = await window.edithVision.toggleTorch();
      torchBtn.style.color = state ? 'var(--vision-orange-bright)' : 'var(--jarvis-blue)';
    });
  }

  // ----------------------------------------------------
  // Tools View: Notes, Timer & Telemetry
  // ----------------------------------------------------
  function renderNotes() {
    if (!notesContainer) return;
    const notes = window.edithTools.getNotes();
    notesContainer.innerHTML = '';

    if (notes.length === 0) {
      notesContainer.innerHTML = `<div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);padding:6px 0;">Aucune note dans le journal tactique.</div>`;
      return;
    }

    notes.forEach(note => {
      const item = document.createElement('div');
      item.className = 'note-item';
      item.innerHTML = `
        <div style="flex:1;">
          <span style="font-size:9px;color:var(--jarvis-blue);margin-right:6px;">[${note.date}]</span>
          <span>${note.text}</span>
        </div>
        <button class="note-del-btn" data-id="${note.id}">✕</button>
      `;
      item.querySelector('.note-del-btn').addEventListener('click', () => {
        window.edithTools.deleteNote(note.id);
        renderNotes();
      });
      notesContainer.appendChild(item);
    });
  }

  if (addNoteBtn && noteInput) {
    addNoteBtn.addEventListener('click', () => {
      const text = noteInput.value.trim();
      if (text) {
        window.edithTools.addNote(text);
        noteInput.value = '';
        renderNotes();
      }
    });
    noteInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addNoteBtn.click();
    });
  }

  // Timer Presets
  timerPresetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const secs = parseInt(btn.dataset.seconds, 10);
      window.edithTools.startTimer(
        secs,
        (formatted) => { if (timerDisplay) timerDisplay.textContent = formatted; },
        () => { if (timerDisplay) timerDisplay.textContent = '00:00'; }
      );
    });
  });

  if (stopTimerBtn) {
    stopTimerBtn.addEventListener('click', () => {
      window.edithTools.stopTimer();
      if (timerDisplay) timerDisplay.textContent = '00:00';
      window.edithAudio.playBeep(400, 0.05);
    });
  }

  // SOS Beacon
  if (sosBtn) {
    sosBtn.addEventListener('click', () => {
      const active = window.edithTools.toggleSOS((state) => {
        document.body.style.backgroundColor = state ? '#ff1100' : 'var(--bg-dark)';
      });
      sosBtn.textContent = active ? 'ARRÊTER BALISE SOS' : 'DÉCLENCHER BALISE SOS';
      sosBtn.classList.toggle('orange', active);
      if (!active) document.body.style.backgroundColor = 'var(--bg-dark)';
    });
  }

  async function refreshToolsView() {
    renderNotes();
    const telem = await window.edithTools.getDeviceTelemetry();
    if (telemCoords) {
      telemCoords.textContent = 'Acquisition GPS...';
      const coords = await window.edithTools.getTacticalCoordinates();
      telemCoords.textContent = `${coords.lat}, ${coords.lon}`;
    }
    if (telemNet) telemNet.textContent = telem.online ? 'En ligne (Uplink 100%)' : 'Hors ligne';
    if (telemScreen) telemScreen.textContent = `${telem.screen} (${telem.cores})`;
  }

  // ----------------------------------------------------
  // Settings & Configuration
  // ----------------------------------------------------
  function updateSettingsStatus() {
    const statusText = document.getElementById('settingsStatusText');
    const apiKeyHint = document.getElementById('apiKeyHint');
    const aiBadge = document.getElementById('aiLinkBadge');
    const keyVal = (apiKeyInput ? apiKeyInput.value : '').trim();
    const providerVal = providerSelect ? providerSelect.value : 'gemini';

    if (keyVal.length > 5) {
      if (statusText) statusText.textContent = `LIAISON ${providerVal.toUpperCase()} ACTIVE`;
      if (apiKeyHint) {
        apiKeyHint.textContent = '✓ Clé enregistrée';
        apiKeyHint.style.color = 'var(--jarvis-blue)';
      }
      if (aiBadge) {
        aiBadge.textContent = 'SATELLITE ACTIF';
        aiBadge.style.color = 'var(--jarvis-blue)';
      }
    } else if (providerVal === 'offline') {
      if (statusText) statusText.textContent = 'MODE AUTONOME LOCAL';
      if (apiKeyHint) {
        apiKeyHint.textContent = 'Sans clé requise';
        apiKeyHint.style.color = 'var(--text-muted)';
      }
      if (aiBadge) {
        aiBadge.textContent = 'LOCAL';
        aiBadge.style.color = 'var(--vision-orange-bright)';
      }
    } else {
      if (statusText) statusText.textContent = 'MODE LOCAL (HORS LIAISON)';
      if (apiKeyHint) {
        apiKeyHint.textContent = 'Clé requise pour satellite';
        apiKeyHint.style.color = 'var(--vision-orange)';
      }
      if (aiBadge) {
        aiBadge.textContent = 'ATTENTE CLÉ';
        aiBadge.style.color = 'var(--vision-orange-bright)';
      }
    }
  }

  function syncModelSelectOptions(provider, selectedModel) {
    if (!modelSelect) return;
    modelSelect.innerHTML = '';

    const modelsByProvider = {
      gemini: [
        { value: 'auto', label: '⚡ Auto-Détection Intelligente (Recommandé)' },
        { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Rapide & Multimodal)' },
        { value: 'gemini-1.5-flash-latest', label: 'Gemini 1.5 Flash (Dernière version)' },
        { value: 'gemini-1.5-flash-002', label: 'Gemini 1.5 Flash 002' },
        { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
        { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
        { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Raisonnement Complexe)' }
      ],
      groq: [
        { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile (Recommandé Groq)' },
        { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant (Ultra Rapide)' },
        { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B (Fenêtre 32k)' }
      ],
      openai: [
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Recommandé OpenAI)' },
        { value: 'gpt-4o', label: 'GPT-4o (Complet)' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
      ],
      offline: [
        { value: 'offline-edith', label: 'Moteur E.D.I.T.H. Local (Sans Clé / Hors-Ligne)' }
      ]
    };

    const list = modelsByProvider[provider] || modelsByProvider.gemini;
    list.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.value;
      opt.textContent = m.label;
      if (m.value === selectedModel) opt.selected = true;
      modelSelect.appendChild(opt);
    });

    if (modelSelect.selectedIndex === -1 && modelSelect.options.length > 0) {
      modelSelect.selectedIndex = 0;
    }
  }

  function initSettingsUI() {
    if (providerSelect) {
      providerSelect.value = window.edithAI.provider;
      syncModelSelectOptions(providerSelect.value, window.edithAI.customModel);
      providerSelect.addEventListener('change', () => {
        syncModelSelectOptions(providerSelect.value);
        updateSettingsStatus();
      });
    }

    if (apiKeyInput) {
      apiKeyInput.value = window.edithAI.apiKey;
      apiKeyInput.addEventListener('input', updateSettingsStatus);
    }

    if (userCallsignInput) {
      userCallsignInput.value = window.edithAI.userName;
    }

    // Interactive Functions Toggles
    const featureAutoSpeak = document.getElementById('featureAutoSpeak');
    const featureSoundFx = document.getElementById('featureSoundFx');
    const featureTacticalPacing = document.getElementById('featureTacticalPacing');

    if (featureAutoSpeak) {
      featureAutoSpeak.checked = window.edithAudio.autoSpeak;
      featureAutoSpeak.addEventListener('change', () => {
        triggerHaptic('light');
        window.edithAudio.autoSpeak = featureAutoSpeak.checked;
      });
    }

    if (featureSoundFx) {
      featureSoundFx.checked = window.edithAudio.soundEnabled;
      featureSoundFx.addEventListener('change', () => {
        triggerHaptic('light');
        window.edithAudio.soundEnabled = featureSoundFx.checked;
      });
    }

    if (featureTacticalPacing) {
      featureTacticalPacing.checked = window.edithAI.tacticalPacing;
      featureTacticalPacing.addEventListener('change', () => {
        triggerHaptic('light');
        window.edithAI.tacticalPacing = featureTacticalPacing.checked;
      });
    }

    // Sliders
    const voiceRateSlider = document.getElementById('voiceRateSlider');
    const voiceRateVal = document.getElementById('voiceRateVal');
    const voicePitchSlider = document.getElementById('voicePitchSlider');
    const voicePitchVal = document.getElementById('voicePitchVal');

    if (voiceRateSlider && voiceRateVal) {
      voiceRateSlider.value = window.edithAudio.voiceRate;
      voiceRateVal.textContent = Number(window.edithAudio.voiceRate).toFixed(2) + 'x';
      voiceRateSlider.addEventListener('input', () => {
        voiceRateVal.textContent = Number(voiceRateSlider.value).toFixed(2) + 'x';
        window.edithAudio.voiceRate = parseFloat(voiceRateSlider.value);
      });
    }

    if (voicePitchSlider && voicePitchVal) {
      voicePitchSlider.value = window.edithAudio.voicePitch;
      voicePitchVal.textContent = Number(window.edithAudio.voicePitch).toFixed(2);
      voicePitchSlider.addEventListener('input', () => {
        voicePitchVal.textContent = Number(voicePitchSlider.value).toFixed(2);
        window.edithAudio.voicePitch = parseFloat(voicePitchSlider.value);
      });
    }

    // Custom Directives Prompt
    const customPromptInput = document.getElementById('customPromptInput');
    const resetPromptBtn = document.getElementById('resetPromptBtn');
    if (customPromptInput) {
      customPromptInput.value = window.edithAI.customPrompt;
    }
    if (resetPromptBtn && customPromptInput) {
      resetPromptBtn.addEventListener('click', () => {
        triggerHaptic('medium');
        customPromptInput.value = '';
        window.edithAudio.playBeep(440, 0.05);
      });
    }

    updateSettingsStatus();

    // Visibility toggle for API Key
    const toggleApiKeyVisibility = document.getElementById('toggleApiKeyVisibility');
    if (toggleApiKeyVisibility && apiKeyInput) {
      toggleApiKeyVisibility.addEventListener('click', () => {
        triggerHaptic('light');
        if (apiKeyInput.type === 'password') {
          apiKeyInput.type = 'text';
          toggleApiKeyVisibility.textContent = '🔒';
        } else {
          apiKeyInput.type = 'password';
          toggleApiKeyVisibility.textContent = '👁️';
        }
      });
    }

    // Direct Clipboard Paste button for Mobile
    const pasteApiKeyBtn = document.getElementById('pasteApiKeyBtn');
    if (pasteApiKeyBtn && apiKeyInput) {
      pasteApiKeyBtn.addEventListener('click', async () => {
        triggerHaptic('medium');
        try {
          if (navigator.clipboard && navigator.clipboard.readText) {
            const clipText = await navigator.clipboard.readText();
            if (clipText && clipText.trim().length > 0) {
              apiKeyInput.value = clipText.trim();
              updateSettingsStatus();
              window.edithAudio.playBeep(880, 0.08);
              const origText = pasteApiKeyBtn.textContent;
              pasteApiKeyBtn.textContent = '✓ Collé !';
              setTimeout(() => { pasteApiKeyBtn.textContent = origText; }, 1800);
              return;
            }
          }
          const manual = prompt('Collez votre clé API Google Gemini ou Groq ci-dessous :');
          if (manual && manual.trim().length > 0) {
            apiKeyInput.value = manual.trim();
            updateSettingsStatus();
            window.edithAudio.playBeep(880, 0.08);
          }
        } catch (err) {
          const manual = prompt('Collez votre clé API Google Gemini ou Groq ci-dessous :');
          if (manual && manual.trim().length > 0) {
            apiKeyInput.value = manual.trim();
            updateSettingsStatus();
            window.edithAudio.playBeep(880, 0.08);
          }
        }
      });
    }

    // Callsign quick chips / pills
    document.querySelectorAll('.callsign-chip, .callsign-pill').forEach(chip => {
      chip.addEventListener('click', () => {
        triggerHaptic('light');
        const sign = chip.getAttribute('data-callsign');
        if (userCallsignInput && sign) {
          userCallsignInput.value = sign;
          window.edithAudio.playBeep(880, 0.05);
        }
      });
    });

    // Populate voices in select dropdown
    const populateVoices = () => {
      if (!voiceSelect) return;
      voiceSelect.innerHTML = '';
      const availableVoices = window.edithAudio.getAvailableVoices();
      availableVoices.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.voiceURI;
        opt.textContent = `${v.name} (${v.lang})`;
        if (window.edithAudio.preferredVoice && window.edithAudio.preferredVoice.voiceURI === v.voiceURI) {
          opt.selected = true;
        }
        voiceSelect.appendChild(opt);
      });
    };

    populateVoices();
    setTimeout(populateVoices, 1000);
    window.onEdithVoicesLoaded = populateVoices;
  }

  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
      triggerHaptic('medium');
      window.edithAI.setCredentials(
        providerSelect.value,
        apiKeyInput.value,
        modelSelect.value,
        userCallsignInput.value
      );

      const customPromptInput = document.getElementById('customPromptInput');
      const featureTacticalPacing = document.getElementById('featureTacticalPacing');
      if (customPromptInput) {
        window.edithAI.setCustomDirectives(
          customPromptInput.value,
          featureTacticalPacing ? featureTacticalPacing.checked : false
        );
      }

      const voiceRateSlider = document.getElementById('voiceRateSlider');
      const voicePitchSlider = document.getElementById('voicePitchSlider');
      const featureSoundFx = document.getElementById('featureSoundFx');
      const featureAutoSpeak = document.getElementById('featureAutoSpeak');

      window.edithAudio.setAudioParams(
        voiceRateSlider ? voiceRateSlider.value : 1.05,
        voicePitchSlider ? voicePitchSlider.value : 1.0,
        featureSoundFx ? featureSoundFx.checked : true,
        featureAutoSpeak ? featureAutoSpeak.checked : true
      );

      if (voiceSelect) {
        window.edithAudio.setVoice(voiceSelect.value);
      }

      updateSettingsStatus();
      window.edithAudio.playSuccess();
      alert("✓ TOUS LES PROTOCOLES & FONCTIONS E.D.I.T.H. ONT ÉTÉ ENREGISTRÉS AVEC SUCCÈS !");
    });
  }

  const testApiBtn = document.getElementById('testApiBtn');
  if (testApiBtn) {
    testApiBtn.addEventListener('click', async () => {
      triggerHaptic('medium');
      window.edithAI.setCredentials(
        providerSelect.value,
        apiKeyInput.value,
        modelSelect.value,
        userCallsignInput.value
      );

      testApiBtn.disabled = true;
      testApiBtn.textContent = '⚡ TEST EN COURS...';
      try {
        const testRes = await window.edithAI.testConnection();
        if (testRes.success) {
          window.edithAudio.playSuccess();
          alert(`✓ SUCCÈS LIAISON SATELLITE !\n\nModèle actif : ${testRes.model}\nRéponse EDITH : "${testRes.text}"`);
        } else {
          window.edithAudio.playWarning();
          alert(`✕ ERREUR DE LIAISON :\n${testRes.message}`);
        }
      } catch (err) {
        window.edithAudio.playWarning();
        alert(`✕ ERREUR :\n${err.message}`);
      } finally {
        testApiBtn.disabled = false;
        testApiBtn.textContent = '⚡ TESTER LIAISON IA';
      }
    });
  }

  if (testVoiceBtn) {
    testVoiceBtn.addEventListener('click', () => {
      if (voiceSelect) window.edithAudio.setVoice(voiceSelect.value);
      window.edithAudio.speak(`Système opérationnel. Bonjour, ${window.edithAI.userName}. Je suis prête à vous assister.`);
    });
  }

  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', () => {
      if (confirm("Voulez-vous réinitialiser le journal de conversation ?")) {
        window.edithAI.clearHistory();
        if (dialogueStream) dialogueStream.innerHTML = '';
        appendMessage('edith', `Journal réinitialisé. Tous les systèmes sont en ligne. Que puis-je faire pour vous, ${window.edithAI.userName} ?`);
        window.edithAudio.playBeep(600, 0.08);
      }
    });
  }

  // ----------------------------------------------------
  // Initialization & Boot sequence
  // ----------------------------------------------------
  initSettingsUI();
  renderNotes();

  // Initial welcome message
  setTimeout(() => {
    window.edithAudio.playBootSound();
    appendMessage(
      'edith',
      `Bonjour, ${window.edithAI.userName}. Je suis **E.D.I.T.H.** (Even Dead, I'm The Hero).\n\n` +
      `Tous vos protocoles tactiques sont chargés :\n` +
      `• **Bleu J.A.R.V.I.S.** pour le réseau et l'interface holographique.\n` +
      `• **Orange Vision** pour la régulation d'énergie et la vision optique.\n` +
      `• Mode vocal et visuel AR prêts.\n\n` +
      `Appuyez sur le **Réacteur ARC central** ou sur le bouton micro orange pour me parler directement !`
    );
  }, 400);

  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('[EDITH] Service Worker opérationnel :', reg.scope))
        .catch(err => console.warn('[EDITH] Erreur Service Worker :', err));
    });
  }
});
