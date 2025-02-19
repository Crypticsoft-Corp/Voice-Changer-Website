const recordButton = document.getElementById('record');
const playButton = document.getElementById('play');
const downloadButton = document.getElementById('download');
const effectSelect = document.getElementById('effect');
let audioContext;
let mediaRecorder;
let audioChunks = [];
let audioBuffer;

recordButton.addEventListener('click', async () => {
    if (recordButton.textContent.includes('Record')) {
        await startRecording();
    } else {
        stopRecording();
    }
});

playButton.addEventListener('click', () => {
    playAudio();
});

downloadButton.addEventListener('click', () => {
    downloadAudio();
});

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks);
            const arrayBuffer = await audioBlob.arrayBuffer();
            audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            playButton.disabled = false;
            downloadButton.disabled = false;
            audioChunks = [];
        };

        mediaRecorder.start();
        recordButton.textContent = '🛑 Stop';
        recordButton.classList.add('recording');
    } catch (err) {
        console.error('Error accessing microphone:', err);
        alert('Error accessing microphone: ' + err.message);
    }
}

function stopRecording() {
    mediaRecorder.stop();
    recordButton.textContent = '🎤 Record';
    recordButton.classList.remove('recording');
}

function playAudio() {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    const selectedEffect = effectSelect.value;
    let audioChain = source;

    switch (selectedEffect) {
        case 'echo':
            const delay = audioContext.createDelay();
            delay.delayTime.value = 0.5;
            const feedback = audioContext.createGain();
            feedback.gain.value = 0.5;
            delay.connect(feedback);
            feedback.connect(delay);
            audioChain = source.connect(delay);
            delay.connect(audioContext.destination);
            break;
        case 'robot':
            const distortion = audioContext.createWaveShaper();
            distortion.curve = makeDistortionCurve(400);
            distortion.oversample = '4x';
            audioChain = source.connect(distortion);
            distortion.connect(audioContext.destination);
            break;
        case 'chipmunk':
            source.playbackRate.value = 2.0;
            audioChain = source.connect(audioContext.destination);
            break;
        case 'alien':
            const alien = audioContext.createWaveShaper();
            alien.curve = makeDistortionCurve(50);
            alien.oversample = '4x';
            audioChain = source.connect(alien);
            alien.connect(audioContext.destination);
            break;
        case 'telephone':
            const bandpass = audioContext.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.frequency.value = 1000;
            bandpass.Q.value = 0.5;
            audioChain = source.connect(bandpass);
            bandpass.connect(audioContext.destination);
            break;
        case 'underwater':
            const underwater = audioContext.createBiquadFilter();
            underwater.type = 'lowpass';
            underwater.frequency.value = 200;
            audioChain = source.connect(underwater);
            underwater.connect(audioContext.destination);
            break;
        case 'reverb':
            const reverb = audioContext.createConvolver();
            // Use an impulse response for the reverb effect here
            // reverb.buffer = await getImpulseResponse();
            audioChain = source.connect(reverb);
            reverb.connect(audioContext.destination);
            break;
        case 'bassBoost':
            const bassBoost = audioContext.createBiquadFilter();
            bassBoost.type = 'lowshelf';
            bassBoost.frequency.value = 200;
            bassBoost.gain.value = 15;
            audioChain = source.connect(bassBoost);
            bassBoost.connect(audioContext.destination);
            break;
        case 'lowPitch':
            source.playbackRate.value = 0.5;
            audioChain = source.connect(audioContext.destination);
            break;
        case 'highPitch':
            source.playbackRate.value = 1.5;
            audioChain = source.connect(audioContext.destination);
            break;
        default:
            audioChain = source.connect(audioContext.destination);
    }

    source.start();
}

function makeDistortionCurve(amount) {
    const k = typeof amount === 'number' ? amount : 50,
        n_samples = 44100,
        curve = new Float32Array(n_samples),
        deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
        const x = i * 2 / n_samples - 1;
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
}

function downloadAudio() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'recording.mp3';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
          }
