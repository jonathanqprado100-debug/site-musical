import { PitchDetector } from "https://esm.sh/pitchy@4";

let audioCtx, analyserNode, mediaStreamSource, gainNode, detector, intervalo;
const synth = new Tone.Synth().toDestination();
let audioInicializado = false; // marca se o AudioContext já foi desbloqueado

// ==========================
// Elementos DOM
// ==========================
const btnComecar = document.getElementById("btnComecar");
const btnParar = document.getElementById("btnParar");
const notaCantada = document.getElementById("notaCantada");
const gainKnob = document.getElementById("gainKnob");
const nivelSinal = document.getElementById("nivelSinal");
const oitavasContainer = document.getElementById("oitavasContainer");

const btnIrAula = document.getElementById("btnIrAula");
const btnVoltar = document.getElementById("btnVoltar");
const interfacePrincipal = document.getElementById("interfacePrincipal");
const aulaMusica = document.getElementById("aulaMusica");

const btnTema = document.querySelectorAll(".btn-tema");

// ==========================
// Inicializa AudioContext (uma vez por gesto do usuário)
// ==========================
function iniciarAudio() {
  if (!audioInicializado) {
    audioCtx = new AudioContext();
    Tone.setContext(audioCtx);
    audioInicializado = true;
  }
}

// ==========================
// Fade navegação
// ==========================
const tempoFade = 500;
interfacePrincipal.classList.add("fade");
aulaMusica.classList.add("fade", "hidden");
aulaMusica.style.display = "block";

btnIrAula.addEventListener("click", () => {
  interfacePrincipal.classList.add("hidden");
  setTimeout(() => {
    interfacePrincipal.style.display = "none";
    aulaMusica.style.display = "block";
    void aulaMusica.offsetWidth;
    aulaMusica.classList.remove("hidden");
  }, tempoFade);
});

btnVoltar.addEventListener("click", () => {
  aulaMusica.classList.add("hidden");
  setTimeout(() => {
    aulaMusica.style.display = "none";
    interfacePrincipal.style.display = "block";
    void interfacePrincipal.offsetWidth;
    interfacePrincipal.classList.remove("hidden");
  }, tempoFade);
});

// ==========================
// Alternar tema
// ==========================
btnTema.forEach(btn => {
  btn.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
  });
});

// ==========================
// Começar detecção
// ==========================
async function iniciarDeteccao() {
  if (!audioInicializado) iniciarAudio();

  analyserNode = audioCtx.createAnalyser();
  analyserNode.fftSize = 4096;

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaStreamSource = audioCtx.createMediaStreamSource(stream);

  gainNode = audioCtx.createGain();
  gainNode.gain.value = parseFloat(gainKnob.value);

  mediaStreamSource.connect(gainNode).connect(analyserNode);

  detector = PitchDetector.forFloat32Array(analyserNode.fftSize);

  intervalo = setInterval(() => {
    const input = new Float32Array(analyserNode.fftSize);
    analyserNode.getFloatTimeDomainData(input);

    const [pitch, clarity] = detector.findPitch(input, audioCtx.sampleRate);

    if (clarity > 0.85 && pitch) {
      const nota = freqParaNota(pitch);
      notaCantada.innerText = `Nota cantada: ${nota} (${pitch.toFixed(1)} Hz)`;
      highlightPiano(nota.split(" \\ ")[0], false);
    } else {
      notaCantada.innerText = "Nota cantada: --";
      clearPianoHighlight();
    }

    const rms = Math.sqrt(input.reduce((sum, val) => sum + val * val, 0) / input.length);
    nivelSinal.style.width = `${Math.min(rms * 300, 100)}%`;
  }, 100);
}

btnComecar.addEventListener("click", iniciarDeteccao);

btnParar.addEventListener("click", () => {
  clearInterval(intervalo);
  notaCantada.innerText = "Nota cantada: --";
  clearPianoHighlight();
});

// ==========================
// Controle de ganho
// ==========================
gainKnob.addEventListener("input", () => {
  if (gainNode) gainNode.gain.value = parseFloat(gainKnob.value);
});

// ==========================
// Frequência -> nota
// ==========================
function freqParaNota(freq) {
  const notasEN = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const notasPT = ["Dó","Dó#","Ré","Ré#","Mi","Fá","Fá#","Sol","Sol#","Lá","Lá#","Si"];
  if (!freq || freq <= 0) return '--';
  const semitons = Math.round(12 * Math.log2(freq / 440));
  const notaIndex = (semitons + 9 + 120) % 12;
  const oitava = 4 + Math.floor((semitons + 9) / 12);
  return `${notasEN[notaIndex]}${oitava} \\ ${notasPT[notaIndex]} ${oitava}`;
}

// ==========================
// Gera tabela de notas
// ==========================
function gerarTabelaNotas() {
  const notasEN = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const notasPT = ["Dó","Dó#","Ré","Ré#","Mi","Fá","Fá#","Sol","Sol#","Lá","Lá#","Si"];
  for (let oitava = 1; oitava <= 7; oitava++) {
    const card = document.createElement("div");
    card.classList.add("oitava-card");
    const titulo = document.createElement("h3");
    titulo.innerText = `Oitava ${oitava}`;
    card.appendChild(titulo);
    notasEN.forEach((nota, i) => {
      const notaCard = document.createElement("div");
      notaCard.classList.add("nota-card");
      notaCard.classList.add(nota.includes("#") ? "nota-sustenida" : "nota-natural");
      notaCard.innerText = `${nota}${oitava} - ${notasPT[i]} ${oitava}`;
      card.appendChild(notaCard);
    });
    oitavasContainer.appendChild(card);
  }
}
gerarTabelaNotas();

// ==========================
// Piano funcional (mobile e desktop)
// ==========================
const pianoContainer = document.getElementById("pianoContainer");
const notasSynth = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

for (let oitava = 2; oitava <= 6; oitava++) {
  notasSynth.forEach(nota => {
    const notaCompleta = `${nota}${oitava}`;
    const tecla = document.createElement("div");
    tecla.classList.add("tecla", nota.includes("#") ? "tecla-sustenida" : "tecla-natural");
    tecla.innerText = notaCompleta;
    tecla.dataset.nota = notaCompleta;

    function tocarNota() {
      iniciarAudio(); // desbloqueia AudioContext no mobile
      synth.triggerAttack(notaCompleta);
      highlightPiano(notaCompleta, false);
    }

    function soltarNota() {
      synth.triggerRelease();
      clearPianoHighlight();
    }

    tecla.addEventListener("mousedown", tocarNota);
    tecla.addEventListener("mouseup", soltarNota);
    tecla.addEventListener("mouseleave", soltarNota);
    tecla.addEventListener("touchstart", (e) => { e.preventDefault(); tocarNota(); }, { passive: false });
    tecla.addEventListener("touchend", (e) => { e.preventDefault(); soltarNota(); }, { passive: false });

    pianoContainer.appendChild(tecla);
  });
}

// ==========================
// Destaque piano
// ==========================
function highlightPiano(nota, anim = true) {
  clearPianoHighlight();
  const tecla = document.querySelector(`.tecla[data-nota="${nota}"]`);
  if (tecla) {
    if (!anim) tecla.style.transition = "none";
    tecla.classList.add("tecla-ativa");
    if (!anim) setTimeout(() => { tecla.style.transition = ""; }, 50);
  }
}

function clearPianoHighlight() {
  document.querySelectorAll(".tecla").forEach(t => {
    t.classList.remove("tecla-ativa");
    t.style.transition = "";
  });
}
