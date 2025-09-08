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
  function freqParaNota(freq) {
  if (!freq || freq <= 0) return '--';
  const notas = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const A4 = 440;
  const semitons = Math.round(12 * Math.log2(freq / A4));
  const notaIndex = (semitons + 9) % 12;
  const oitava = 4 + Math.floor((semitons + 9) / 12);
  return notas[notaIndex] + oitava;
}


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

