// ==========================
// Frequência para nota
// ==========================
function freqParaNota(freq) {
  if (!freq || freq <= 0) return '--';
  const notas = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const A4 = 440;
  const semitons = Math.round(12 * Math.log2(freq / A4));
  const notaIndex = (semitons + 9) % 12;
  const oitava = 4 + Math.floor((semitons + 9) / 12);
  return notas[notaIndex] + oitava;
}

// ==========================
// Piano e notas tocadas
// ==========================
let synth;
async function iniciarNota(nota) {
  console.log(`[DEBUG] Iniciando nota: ${nota}`);
  await Tone.start();
  synth = new Tone.Synth().toDestination();
  synth.triggerAttack(nota);
  document.getElementById("notaTocada").innerText = `Nota tocada: ${nota}`;
}
function pararNota() {
  console.log(`[DEBUG] Parando nota`);
  if (synth) synth.triggerRelease();
}

// ==========================
// Gerar piano horizontal C2-B6
// ==========================
function gerarPiano() {
  const notas = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const piano = document.getElementById("piano");

  for (let oitava = 2; oitava <= 6; oitava++) {
    notas.forEach((n) => {
      const nota = n + oitava;
      const key = document.createElement("div");
      key.classList.add("key");
      if (n.includes("#")) key.classList.add("black"); else key.classList.add("white");
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

  const whiteKeys = Array.from(document.querySelectorAll('.white'));
  const blackKeys = Array.from(document.querySelectorAll('.black'));
  blackKeys.forEach((black, idx) => {
    const leftWhite = whiteKeys[idx];
    if (leftWhite) black.style.left = `${leftWhite.offsetLeft + 30}px`;
  });

  console.log(`[DEBUG] Piano gerado com ${whiteKeys.length + blackKeys.length} teclas`);
}
gerarPiano();

// ==========================
// Microfone e pitch detection via Web Audio API
// ==========================
let audioContext;
let analyser;
let dataArray;
let sourceNode;
let detectando = false;

document.getElementById("btnComecar").addEventListener("click", async () => {
  if (detectando) {
    console.warn("[DEBUG] Já está detectando");
    return;
  }
  detectando = true;
  console.log("[DEBUG] Iniciando detecção de frequência...");

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log("[DEBUG] Microfone acessado com sucesso");
    sourceNode = audioContext.createMediaStreamSource(stream);
    sourceNode.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Float32Array(bufferLength);

    detectarFrequencia();
  } catch (err) {
    console.error("[ERRO] Falha ao acessar microfone:", err);
    alert("Não foi possível acessar o microfone.");
  }
});

document.getElementById("btnParar").addEventListener("click", () => {
  console.log("[DEBUG] Parando detecção de frequência");
  detectando = false;
  if (sourceNode) {
    sourceNode.disconnect();
  }
  document.getElementById("notaCantada").innerText = 'Nota cantada: --';
  document.getElementById("nivelSinal").style.width = '0%';
});

function detectarFrequencia() {
  if (!detectando) {
    console.warn("[DEBUG] detectando = false, encerrando loop");
    return;
  }

  analyser.getFloatFrequencyData(dataArray);

  let maxIndex = 0;
  for (let i = 1; i < dataArray.length; i++) {
    if (dataArray[i] > dataArray[maxIndex]) {
      maxIndex = i;
    }
  }

  const sampleRate = audioContext.sampleRate;
  const freq = maxIndex * sampleRate / analyser.fftSize;

  if (freq > 65 && freq < 2000) {
    const nota = freqParaNota(freq);
    console.log(`[DEBUG] Frequência detectada: ${freq.toFixed(2)} Hz → Nota: ${nota}`);
    document.getElementById("notaCantada").innerText = 'Nota cantada: ' + nota;
    document.getElementById("nivelSinal").style.width = '100%';
  } else {
    console.log("[DEBUG] Nenhuma frequência válida detectada");
    document.getElementById("notaCantada").innerText = 'Nota cantada: --';
    document.getElementById("nivelSinal").style.width = '0%';
  }

  requestAnimationFrame(detectarFrequencia);
}

// ==========================
// Músicas exemplo
// ==========================
let musicas = {
  "Música 1": "C4 – 'Exemplo letra 1...'\nD4 – 'Segunda linha...'",
  "Música 2": "E4 – 'Exemplo letra 2...'\nF4 – 'Segunda linha...'"
};

function mostrarMenuMusicas() {
  const menu = document.getElementById("menu-musicas");
  menu.innerHTML = "";
  Object.keys(musicas).forEach(nome => {
    const btn = document.createElement("button");
    btn.textContent = nome;
    btn.onclick = () => mostrarMusica(nome);
    menu.appendChild(btn);
  });
  console.log("[DEBUG] Menu de músicas carregado");
}

function mostrarMusica(nome) {
  const div = document.getElementById("conteudo-musica");
  div.innerHTML = `<h3>v1 - ${nome}</h3><pre>${musicas[nome]}</pre>`;
  console.log(`[DEBUG] Música exibida: ${nome}`);
}

mostrarMenuMusicas();
