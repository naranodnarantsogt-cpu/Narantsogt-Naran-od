/**
 * Plays a beautiful, high-quality success/win chime using the Web Audio API.
 * Synthesizes an elegant, ascending positive arpeggio and a final warm chord
 * to reward the user when they win or complete the typing race.
 */
export function playWinSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // A beautiful positive ascending arpeggio: C4, E4, G4, C5
    const notes = [261.63, 329.63, 392.00, 523.25];
    const duration = 0.15; // duration of each note in seconds
    
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine"; // smooth, pure tone
      osc.frequency.value = freq;
      
      // Setup volume envelope
      const startTime = ctx.currentTime + index * 0.12;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    });
    
    // Add a satisfying final chord harmonizing (E4, G4, C5, E5)
    const chordNotes = [329.63, 392.00, 523.25, 659.25];
    const chordStartTime = ctx.currentTime + notes.length * 0.12;
    const chordDuration = 0.8;
    
    chordNotes.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "triangle"; // soft, warm tone
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, chordStartTime);
      gain.gain.linearRampToValueAtTime(0.15, chordStartTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, chordStartTime + chordDuration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(chordStartTime);
      osc.stop(chordStartTime + chordDuration);
    });
  } catch (e) {
    console.warn("Could not play win sound:", e);
  }
}

/**
 * Plays a high-pitched retro coin/star collection chime like in Geometry Dash.
 * Rapidly sweeps frequencies upwards with an impulse of soft square/sine wave.
 */
export function playStarSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc1.type = "sine";
    osc2.type = "triangle";
    
    const now = ctx.currentTime;
    
    // Geometry Dash star sound starts at high frequencies and sweeps up even higher
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.12);
    
    osc2.frequency.setValueAtTime(1320, now);
    osc2.frequency.exponentialRampToValueAtTime(2640, now + 0.12);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.3);
    osc2.start(now);
    osc2.stop(now + 0.3);
  } catch (e) {
    console.warn("Could not play star sound:", e);
  }
}

