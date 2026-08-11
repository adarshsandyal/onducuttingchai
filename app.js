/* ==========================================================================
   Cozy Kannada Chai Angadi - Application Script
   Immersive Audio Engine, Quote Carousel, Interactive Animations
   ========================================================================== */

// --- Quotes Data ---
const chaiQuotes = [
    {
        kn: "ಬಿಸಿ ಬಿಸಿ ಚಹಾ ಮತ್ತು ಇಂಪಾದ ಸಂಗೀತ, ಮನಸ್ಸಿಗೆ ನೆಮ್ಮದಿ.",
        en: "Hot tea and melodious music, true peace of mind."
    },
    {
        kn: "ಮಳೆಯ ಹನಿಗಳು, ಕುದಿಯುವ ಚಹಾ, ಮತ್ತು ಹಳೆಯ ನೆನಪುಗಳು...",
        en: "Raindrops, boiling tea, and the sweet aroma of memories..."
    },
    {
        kn: "ಸ್ನೇಹಿತರ ಜೊತೆ ಕಟಿಂಗ್ ಚಹಾ ಕುಡಿಯುವ ಖುಷಿಯೇ ಬೇರೆ.",
        en: "The joy of sharing a 'cutting chai' with friends is unmatched."
    },
    {
        kn: "ಬದುಕಿನ ಜಂಜಾಟಕ್ಕೆ ಒಂದು ಕಪ್ ಚಹಾ ಮತ್ತು ಕನ್ನಡ ಹಾಡುಗಳೇ ಮದ್ದು.",
        en: "For the worries of life, a cup of tea and Kannada songs are the cure."
    },
    {
        kn: "ಕುದಿಯುವ ಚಹಾದ ಹಬೆಯಲ್ಲಿ ನಮ್ಮ ಎಲ್ಲಾ ಬೇಸರಗಳು ಕರಗಿ ಹೋಗಲಿ.",
        en: "Let all our worries melt away in the rising steam of brewing tea."
    },
    {
        kn: "ಕನ್ನಡ ಮಣ್ಣಿನ ಸೊಗಡು, ಬಿಸಿ ಚಹಾದ ಸವಿ ಮತ್ತು ಸಂಗೀತದ ಅಮಲು.",
        en: "The fragrance of Kannada land, the taste of hot tea, and the magic of music."
    }
];

// --- Audio Synthesizer States ---
let audioCtx = null;
let isAudioInitialized = false;
let isMuted = false;

// Audio Nodes
let masterGainNode = null;
let rainGainNode = null;
let simmerGainNode = null;
let rainSourceNode = null;
let simmerNoiseNode = null;

// Volumes (0.0 to 1.0)
let rainVolume = 0.40;
let simmerVolume = 0.30;

// Intervals
let bubbleIntervalId = null;
let quoteIntervalId = null;
let quoteIndex = 0;

// --- DOM Elements ---
const startBtn = document.getElementById('start-btn');
const startOverlay = document.getElementById('start-overlay');
const appLayout = document.getElementById('app-layout');
const bgVideo = document.getElementById('bg-video');

const rainSlider = document.getElementById('rain-slider');
const simmerSlider = document.getElementById('simmer-slider');
const rainValText = document.getElementById('rain-val');
const simmerValText = document.getElementById('simmer-val');

const masterMuteBtn = document.getElementById('master-mute-btn');
const speakerIcon = document.getElementById('speaker-icon');

const quoteKn = document.getElementById('quote-kn');
const quoteEn = document.getElementById('quote-en');

const glassClicker = document.getElementById('glass-clicker');
const steamContainer = document.getElementById('steam-container');
const toastNotification = document.getElementById('toast');
const particleContainer = document.getElementById('particle-container');

// Preset Buttons
const presetMorning = document.getElementById('preset-morning');
const presetRainy = document.getElementById('preset-rainy');
const presetMidnight = document.getElementById('preset-midnight');

// --- Initialization ---

window.addEventListener('DOMContentLoaded', () => {
    // Generate background floating dust particles
    createFloatingDust();
});

// Start Listening Click
startBtn.addEventListener('click', () => {
    // 1. Initialize Web Audio
    initAudioEngine();
    
    // 2. Play Video (ensure muted for autoplay policies)
    bgVideo.play().catch(err => console.log("Video play interrupted:", err));
    
    // 3. Fade out overlay
    startOverlay.classList.add('fade-out');
    
    // 4. Reveal main app layout
    appLayout.classList.remove('hidden');
    
    // 5. Start Quote Slider
    startQuotesCarousel();
    
    // 6. Set Default Morning Preset
    applyPreset('morning', true); // initial silent slide
});

// --- Web Audio Engine (Pink Noise & Bubble Synthesizers) ---

function initAudioEngine() {
    if (isAudioInitialized) return;
    
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    
    // Master Gain
    masterGainNode = audioCtx.createGain();
    masterGainNode.gain.setValueAtTime(1.0, audioCtx.currentTime);
    masterGainNode.connect(audioCtx.destination);
    
    // Sub Gain Nodes
    rainGainNode = audioCtx.createGain();
    rainGainNode.gain.setValueAtTime(rainVolume, audioCtx.currentTime);
    rainGainNode.connect(masterGainNode);
    
    simmerGainNode = audioCtx.createGain();
    simmerGainNode.gain.setValueAtTime(simmerVolume, audioCtx.currentTime);
    simmerGainNode.connect(masterGainNode);
    
    // 1. SYNTHESIZE RAIN SOUND (Pink Noise + Lowpass Filter)
    const rainBuffer = createPinkNoiseBuffer();
    rainSourceNode = audioCtx.createBufferSource();
    rainSourceNode.buffer = rainBuffer;
    rainSourceNode.loop = true;
    
    const rainFilter = audioCtx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(950, audioCtx.currentTime); // Cozy dampening
    rainFilter.Q.setValueAtTime(1, audioCtx.currentTime);
    
    rainSourceNode.connect(rainFilter);
    rainFilter.connect(rainGainNode);
    rainSourceNode.start(0);
    
    // 2. SYNTHESIZE TEA SIMMER RUMBLE (Low Pink Noise rumble)
    const simmerRumbleSource = audioCtx.createBufferSource();
    simmerRumbleSource.buffer = rainBuffer;
    simmerRumbleSource.loop = true;
    
    const simmerRumbleFilter = audioCtx.createBiquadFilter();
    simmerRumbleFilter.type = 'lowpass';
    simmerRumbleFilter.frequency.setValueAtTime(160, audioCtx.currentTime); // low heat rumble
    
    const simmerRumbleGain = audioCtx.createGain();
    simmerRumbleGain.gain.setValueAtTime(0.4, audioCtx.currentTime); // moderate rumble base
    
    simmerRumbleSource.connect(simmerRumbleFilter);
    simmerRumbleFilter.connect(simmerRumbleGain);
    simmerRumbleGain.connect(simmerGainNode);
    simmerRumbleSource.start(0);
    
    // 3. SCHEDULER FOR SIMMER BUBBLES POPS
    // Schedule bubble sound nodes dynamically to create realistic boiling
    scheduleBubbles();
    
    isAudioInitialized = true;
}

// Generate mathematically correct Pink Noise
// Pink noise has a 1/f spectral density (3dB falloff per octave), perfect for natural rain
function createPinkNoiseBuffer() {
    const bufferSize = 4 * audioCtx.sampleRate; // 4 seconds of unique noise
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Paul Kellet's refined method
    let b0, b1, b2, b3, b4, b5, b6;
    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
    
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.11; // normalise volume
        b6 = white * 0.115926;
    }
    return buffer;
}

// schedule boiling bubble pops dynamically
function scheduleBubbles() {
    if (bubbleIntervalId) clearInterval(bubbleIntervalId);
    
    // Trigger pops at random tight intervals to simulate boiling
    const minDelay = 60; // ms
    const varDelay = 140; // ms
    
    function triggerNext() {
        if (!isMuted && simmerVolume > 0.05) {
            playSingleBubblePop();
        }
        const nextDelay = minDelay + Math.random() * varDelay;
        bubbleIntervalId = setTimeout(triggerNext, nextDelay);
    }
    
    triggerNext();
}

// Synthesizing a single bubble burst via FM pitch-sweeps
function playSingleBubblePop() {
    if (!audioCtx || audioCtx.state === 'suspended') return;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    
    // Bubble sound profile: start high frequency, drop fast, short envelope
    // Higher simmer volumes yield more energetic bubbles
    const baseFreq = 700 + Math.random() * 900;
    const dropFreq = baseFreq * (0.4 + Math.random() * 0.2);
    const duration = 0.02 + Math.random() * 0.035; // 20-55ms
    
    osc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(dropFreq, audioCtx.currentTime + duration);
    
    // Bubble popping envelope
    const peakGain = simmerVolume * 0.13 * (0.3 + Math.random() * 0.7);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(peakGain, audioCtx.currentTime + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    
    // Biquad filter to make bubbles sound liquid/hollow
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(baseFreq * 0.8, audioCtx.currentTime);
    filter.Q.setValueAtTime(3.0, audioCtx.currentTime); // resonant pop
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(simmerGainNode);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration + 0.01);
}

// --- Mixer Control Bindings ---

rainSlider.addEventListener('input', (e) => {
    rainVolume = parseInt(e.target.value) / 100;
    rainValText.textContent = `${e.target.value}%`;
    updateRainGain();
    clearPresetActives();
});

simmerSlider.addEventListener('input', (e) => {
    simmerVolume = parseInt(e.target.value) / 100;
    simmerValText.textContent = `${e.target.value}%`;
    updateSimmerGain();
    clearPresetActives();
});

function updateRainGain() {
    if (!audioCtx || !rainGainNode) return;
    // Smooth ramp to avoid clicks
    rainGainNode.gain.setTargetAtTime(rainVolume, audioCtx.currentTime, 0.08);
}

function updateSimmerGain() {
    if (!audioCtx || !simmerGainNode) return;
    simmerGainNode.gain.setTargetAtTime(simmerVolume, audioCtx.currentTime, 0.08);
}

// --- Master Mute Ambience ---

masterMuteBtn.addEventListener('click', () => {
    if (!isAudioInitialized) return;
    
    isMuted = !isMuted;
    
    if (isMuted) {
        // Ramp master gain to 0
        masterGainNode.gain.setTargetAtTime(0.0, audioCtx.currentTime, 0.15);
        masterMuteBtn.classList.add('muted');
        masterMuteBtn.querySelector('span').textContent = "Unmute Ambience";
        // Update speaker icon to muted (no waves)
        speakerIcon.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>`;
    } else {
        // Restore context if suspended
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        // Ramp master gain to 1
        masterGainNode.gain.setTargetAtTime(1.0, audioCtx.currentTime, 0.15);
        masterMuteBtn.classList.remove('muted');
        masterMuteBtn.querySelector('span').textContent = "Mute Ambience";
        // Update speaker icon to active
        speakerIcon.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>`;
    }
});

// --- Mood Presets Switcher ---

const presets = {
    morning: {
        rain: 20,
        simmer: 35,
        themeClass: 'theme-morning'
    },
    rainy: {
        rain: 80,
        simmer: 20,
        themeClass: 'theme-rainy'
    },
    midnight: {
        rain: 35,
        simmer: 65,
        themeClass: 'theme-midnight'
    }
};

function clearPresetActives() {
    presetMorning.classList.remove('active');
    presetRainy.classList.remove('active');
    presetMidnight.classList.remove('active');
}

function applyPreset(presetKey, immediate = false) {
    const config = presets[presetKey];
    if (!config) return;
    
    // 1. Highlight preset buttons
    clearPresetActives();
    document.getElementById(`preset-${presetKey}`).classList.add('active');
    
    // 2. Set new volume levels
    rainVolume = config.rain / 100;
    simmerVolume = config.simmer / 100;
    
    // 3. Update sliders UI
    rainSlider.value = config.rain;
    rainValText.textContent = `${config.rain}%`;
    simmerSlider.value = config.simmer;
    simmerValText.textContent = `${config.simmer}%`;
    
    // 4. Update audio gains with transition
    if (isAudioInitialized && audioCtx) {
        const rampDuration = immediate ? 0.01 : 1.5;
        rainGainNode.gain.linearRampToValueAtTime(rainVolume, audioCtx.currentTime + rampDuration);
        simmerGainNode.gain.linearRampToValueAtTime(simmerVolume, audioCtx.currentTime + rampDuration);
    }
    
    // 5. Update body themes class
    document.body.className = '';
    document.body.classList.add(config.themeClass);
}

// Preset click bindings
document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const presetKey = btn.getAttribute('data-preset');
        applyPreset(presetKey);
    });
});

// --- Quotes Carousel Slider ---

function startQuotesCarousel() {
    if (quoteIntervalId) clearInterval(quoteIntervalId);
    
    quoteIntervalId = setInterval(() => {
        // Fade out transition
        quoteKn.classList.add('quote-fade');
        quoteEn.classList.add('quote-fade');
        
        setTimeout(() => {
            quoteIndex = (quoteIndex + 1) % chaiQuotes.length;
            quoteKn.textContent = chaiQuotes[quoteIndex].kn;
            quoteEn.textContent = `"${chaiQuotes[quoteIndex].en}"`;
            
            // Fade back in
            quoteKn.classList.remove('quote-fade');
            quoteEn.classList.remove('quote-fade');
        }, 500); // matches CSS fade duration
        
    }, 7500); // rotates every 7.5 seconds
}

// --- Interactive Tea Glass Pouring & Steam Boost ---

glassClicker.addEventListener('click', () => {
    // 1. Show dynamic steam burst particles
    triggerSteamBurst();
    
    // 2. Play synthesized "tea top-up" audio sweep
    playPouringSound();
    
    // 3. Show bubble notification toast
    showToast();
});

function triggerSteamBurst() {
    // Generate 12 temporary steam particles rising from the cup
    const particleCount = 12;
    const rect = glassClicker.getBoundingClientRect();
    
    for (let i = 0; i < particleCount; i++) {
        const burst = document.createElement('div');
        burst.className = 'steam-burst';
        
        // Randomise endpoints
        const targetX = (Math.random() - 0.5) * 80; // range -40 to 40
        const targetY = -70 - Math.random() * 90;   // rise range -70 to -160
        
        burst.style.setProperty('--x', `${targetX}px`);
        burst.style.setProperty('--y', `${targetY}px`);
        
        // Center position relative to glass center top
        burst.style.left = '50%';
        burst.style.top = '35%';
        
        steamContainer.appendChild(burst);
        
        // Clean up node when animation finishes
        setTimeout(() => {
            burst.remove();
        }, 1000);
    }
}

// Synthesize a pitch-rising tea pouring stream
function playPouringSound() {
    if (!audioCtx || audioCtx.state === 'suspended' || isMuted) return;
    
    const duration = 1.2; // 1.2 seconds pouring sweep
    const steps = 15;
    const startTime = audioCtx.currentTime;
    
    // A series of rapid bubbling drops that rise in frequency (simulating a filling cup)
    for (let i = 0; i < steps; i++) {
        const scheduleTime = startTime + (i / steps) * duration;
        
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        
        // Pitch rises from 500Hz base to 1100Hz as the glass "fills"
        const fillProgress = i / steps;
        const baseFreq = 450 + (fillProgress * 450) + (Math.random() * 150);
        const endFreq = baseFreq * 0.8;
        
        osc.frequency.setValueAtTime(baseFreq, scheduleTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, scheduleTime + 0.05);
        
        // Envelope for drop sound
        gain.gain.setValueAtTime(0.0001, scheduleTime);
        gain.gain.linearRampToValueAtTime(0.08, scheduleTime + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, scheduleTime + 0.06);
        
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(baseFreq, scheduleTime);
        filter.Q.setValueAtTime(4.0, scheduleTime);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGainNode);
        
        osc.start(scheduleTime);
        osc.stop(scheduleTime + 0.08);
    }
}

// Toast indicator display
function showToast() {
    toastNotification.classList.add('show');
    
    setTimeout(() => {
        toastNotification.classList.remove('show');
    }, 2800);
}

// --- Background floating dust particles implementation ---

function createFloatingDust() {
    const particleCount = 28;
    for (let i = 0; i < particleCount; i++) {
        const dust = document.createElement('div');
        dust.className = 'dust-particle';
        
        // Random layout offsets
        dust.style.left = `${Math.random() * 100}vw`;
        dust.style.top = `${Math.random() * 100}vh`;
        
        // Random size variation
        const size = 1.5 + Math.random() * 3; // 1.5px to 4.5px
        dust.style.width = `${size}px`;
        dust.style.height = `${size}px`;
        
        // Random opacity and animations
        dust.style.opacity = 0.1 + Math.random() * 0.55;
        dust.style.animationDuration = `${8 + Math.random() * 14}s`;
        dust.style.animationDelay = `-${Math.random() * 12}s`;
        
        particleContainer.appendChild(dust);
    }
}

// --- Toggle Music Station Players (YouTube / Spotify) ---
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(tb => tb.classList.remove('active'));
        
        // Hide all player containers
        document.querySelectorAll('.player-embed-container').forEach(pc => {
            pc.style.display = 'none';
            pc.classList.remove('active');
        });
        
        // Add active class to clicked button
        btn.classList.add('active');
        
        // Show target player container
        const targetId = btn.getAttribute('data-target');
        const targetContainer = document.getElementById(targetId);
        targetContainer.style.display = 'block';
        targetContainer.classList.add('active');
    });
});
