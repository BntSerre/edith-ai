/**
 * E.D.I.T.H. Tactical Protocols & Daily Tools
 * Notes, Timer, Device Telemetry, Geolocation, SOS Beacon
 */

class EdithTools {
  constructor() {
    this.notes = JSON.parse(localStorage.getItem('edith_notes') || '[]');
    this.timerInterval = null;
    this.timerSeconds = 0;
    this.timerInitial = 0;
    this.isTimerRunning = false;
    this.sosInterval = null;
    this.isSosActive = false;
  }

  /* ----------------------------------------------------
     Mission Notes & Voice Memos
     ---------------------------------------------------- */
  getNotes() {
    return this.notes;
  }

  addNote(text) {
    if (!text || !text.trim()) return;
    const note = {
      id: Date.now().toString(),
      text: text.trim(),
      date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
    this.notes.unshift(note);
    localStorage.setItem('edith_notes', JSON.stringify(this.notes));
    if (window.edithAudio) window.edithAudio.playSuccess();
    return note;
  }

  deleteNote(id) {
    this.notes = this.notes.filter(n => n.id !== id);
    localStorage.setItem('edith_notes', JSON.stringify(this.notes));
    if (window.edithAudio) window.edithAudio.playBeep(400, 0.05);
  }

  /* ----------------------------------------------------
     Tactical Countdown Timer
     ---------------------------------------------------- */
  startTimer(seconds, onTick, onComplete) {
    this.stopTimer();
    this.timerSeconds = seconds;
    this.timerInitial = seconds;
    this.isTimerRunning = true;

    if (window.edithAudio) window.edithAudio.playActivation();

    this.timerInterval = setInterval(() => {
      this.timerSeconds--;
      if (onTick) onTick(this.formatTime(this.timerSeconds));

      if (this.timerSeconds <= 0) {
        this.stopTimer();
        if (window.edithAudio) {
          window.edithAudio.playWarning();
          window.edithAudio.speak("Attention monsieur, le compte à rebours tactique est arrivé à son terme.");
        }
        if (onComplete) onComplete();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isTimerRunning = false;
  }

  formatTime(totalSec) {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  /* ----------------------------------------------------
     Device Telemetry & Diagnostics
     ---------------------------------------------------- */
  async getDeviceTelemetry() {
    const telemetry = {
      batteryLevel: 'N/A',
      isCharging: false,
      online: navigator.onLine,
      memory: navigator.deviceMemory ? `${navigator.deviceMemory} Go RAM` : 'Optimale',
      cores: navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} cœurs` : '4 cœurs',
      screen: `${window.screen.width}x${window.screen.height}`,
      pixelRatio: window.devicePixelRatio || 1,
      coords: null
    };

    // Battery API
    if (navigator.getBattery) {
      try {
        const battery = await navigator.getBattery();
        telemetry.batteryLevel = `${Math.round(battery.level * 100)}%`;
        telemetry.isCharging = battery.charging;
      } catch (e) {}
    }

    return telemetry;
  }

  async getTacticalCoordinates() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ lat: '48.8584', lon: '2.2945', accuracy: 'Simulé (Stark Tower)' });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude.toFixed(5),
            lon: pos.coords.longitude.toFixed(5),
            altitude: pos.coords.altitude ? `${pos.coords.altitude.toFixed(1)} m` : 'Niveau de la mer',
            accuracy: `±${Math.round(pos.coords.accuracy)}m`
          });
        },
        () => {
          resolve({ lat: 'COORD_LOCKED', lon: 'ORBITAL_REF', accuracy: 'GPS masqué' });
        },
        { timeout: 6000, enableHighAccuracy: true }
      );
    });
  }

  /* ----------------------------------------------------
     SOS Emergency Beacon
     ---------------------------------------------------- */
  toggleSOS(onFlashCallback) {
    if (this.isSosActive) {
      this.isSosActive = false;
      if (this.sosInterval) clearInterval(this.sosInterval);
      return false;
    }

    this.isSosActive = true;
    let state = false;
    // Morse code SOS: ... --- ... (simplified rapid flash)
    this.sosInterval = setInterval(() => {
      state = !state;
      if (onFlashCallback) onFlashCallback(state);
      if (state && window.edithAudio) window.edithAudio.playBeep(900, 0.05);
    }, 250);

    return true;
  }
}

// Global instance
window.edithTools = new EdithTools();
