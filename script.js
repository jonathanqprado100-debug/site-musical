// ==========================
// Piano e notas tocadas
// ==========================
let synth;

function iniciarNota(nota) {
  synth = new Tone.Synth().toDestination();
  synth.triggerAttack(nota);
  document.getElementById("notaTocada").innerText = `Nota tocada: ${nota}`;
}

function pararNota() {
  if (synth) synth.triggerRelease();
}

// ==========================
// Gerar piano horizontal C2-B6
// ==========================
function gerarPiano() {
  const notas = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const piano = document.getElementById("piano");

  for (let oitava = 2; oitava <= 6; oitava++) {
    notas.forEach((n, i) => {
      const nota = n + oitava;
      const key = document.createElement("div");
      key.classList.add("key");
      if (n.includes("#")) key.classList.add("black");
      else key.classList.add("white");
      key.dataset.nota = nota;
      key.textContent = n;

      key.addEventListener("mousedown", () => iniciarNota(nota));
      key.addEventListener("mouseup", pararNota);
      key.addEventListener("mouseleave", pararNota);
      key.addEventListener("touchstart", () => iniciarNota(nota));
      key.addEventListener("touchend", pararNota);

      piano.appendChild(key);
    });
  }
}

gerarPiano();

// ==========================
// Microfone e pitch detection via Meyda
// ==========================
let audioContext;
let sourceNode;
let gainNode;
let analyzer;
let stream;
let detectando = false;

async function listarMicrofones() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const select = document.getElementById("selectMicrofone");
  select.innerHTML = "";
  devices.forEach(d => {
    if(d.kind === "audioinput") {
      const option = document.createElement("option");
      option.value = d.deviceId;
      option.textContent = d.label || `Microfone ${select.length + 1}`;
      select.appendChild(option);
    }
  });
}

async function iniciarDeteccao() {
  if(detectando) return;
  detectando = true;

  await Tone.start();
  if(!audioContext) audioContext = new AudioContext();

  const select = document.getElementById("selectMicrofone");
  const deviceId = select.value;

  if(stream) stream.getTracks().forEach(track => track.stop());

  stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId } });
  sourceNode = audioContext.createMediaStreamSource(stream);
  gainNode = audioContext.createGain();
  gainNode.gain.value = 3;
  sourceNode.connect(gainNode);

  analyzer = Meyda.createMeydaAnalyzer({
    audioContext: audioContext,
    source: gainNode,
    bufferSize: 16384,
    featureExtractors: ["fundamentalFrequency", "rms"],
    callback: features => {
      const rms = features.rms;
      const freq = features.fundamentalFrequency;
      document.getElementById("nivelSinal").style.width = `${Math.min(rms*500,100)}%`;

      if(freq) {
        document.getElementById("notaCantada").innerText = `Nota cantada v1: ${freqParaNota(freq)}`;
      } else {
        document.getElementById("notaCantada").innerText = `Nota cantada v1: --`;
      }
    }
  });

  analyzer.start();
}

function pararDeteccao() {
  detectando = false;
  if(stream) stream.getTracks().forEach(track => track.stop());
  if(analyzer) analyzer.stop();
  document.getElementById("nivelSinal").style.width = "0%";
  document.getElementById("notaCantada").innerText = "Nota cantada v1: --";
}

// ==========================
// Frequência para nota
// ==========================
function freqParaNota(freq) {
  if(!freq || freq <= 0) return '--';
  const notas = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const A4 = 440;
  const semitons = Math.round(12*Math.log2(freq/A4));
  const notaIndex = (semitons+9)%12;
  const oitava = 4 + Math.floor((semitons+9)/12);
  return notas[notaIndex]+oitava;
}

// ==========================
// Inicialização
// ==========================
listarMicrofones();
document.getElementById("btnComecar").addEventListener("click", iniciarDeteccao);
document.getElementById("btnParar").addEventListener("click", pararDeteccao);
