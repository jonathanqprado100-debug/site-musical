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

  for (let oitava=2; oitava<=6; oitava++) {
    notas.forEach(n => {
      const nota = n + oitava;
      const key = document.createElement("div");
      key.classList.add("key");
      if (n.includes("#")) key.classList.add("black");
      else key.classList.add("white");
      key.dataset.nota = nota;
      key.textContent = n;

      key.addEventListener("mousedown", ()=>iniciarNota(nota));
      key.addEventListener("mouseup", pararNota);
      key.addEventListener("mouseleave", pararNota);
      key.addEventListener("touchstart", ()=>iniciarNota(nota));
      key.addEventListener("touchend", pararNota);

      piano.appendChild(key);
    });
  }

  // Posicionar pretas sobre brancas
  const whiteKeys = Array.from(document.querySelectorAll('.white'));
  const blackKeys = Array.from(document.querySelectorAll('.black'));
  let skip = [0,1,3,4,5,7,8,10,11]; // posições de brancas antes das pretas
  blackKeys.forEach((black, idx)=>{
    const leftWhite = whiteKeys[skip[idx]];
    if(leftWhite) black.style.left = `${leftWhite.offsetLeft + 28}px`;
  });
}

gerarPiano();

// ==========================
// Microfone e pitch detection
// ==========================
let audioContext, analyserNode, input, stream;
let detectando = false;

async function listarMicrofones() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const select = document.getElementById("selectMicrofone");
  select.innerHTML = "";
  devices.forEach(d=>{
    if(d.kind==="audioinput") {
      const option = document.createElement("option");
      option.value = d.deviceId;
      option.textContent = d.label || `Microfone ${select.length+1}`;
      select.appendChild(option);
    }
  });
}

// ==========================
// Iniciar detecção
// ==========================
async function iniciarDeteccao() {
  if(detectando) return;
  detectando = true;

  await Tone.start();
  if(!audioContext) audioContext = new AudioContext();

  const select = document.getElementById("selectMicrofone");
  const deviceId = select.value;

  if(stream) stream.getTracks().forEach(track=>track.stop());
  stream = await navigator.mediaDevices.getUserMedia({audio:{deviceId}});
  const source = audioContext.createMediaStreamSource(stream);

  // Filtro passa-alta
  const filter = audioContext.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 50;

  analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 8192; // melhor para graves
  input = new Float32Array(analyserNode.fftSize);

  const gainNode = audioContext.createGain();
  gainNode.gain.value = 3;

  source.connect(filter).connect(gainNode).connect(analyserNode);

  function atualizarNota() {
    if(!detectando) return;
    analyserNode.getFloatTimeDomainData(input);

    // Medidor RMS
    let soma=0;
    for(let i=0;i<input.length;i++) soma+=input[i]*input[i];
    const rms = Math.sqrt(soma/input.length);
    document.getElementById("nivelSinal").style.width = `${Math.min(rms*500,100)}%`;

    if(rms>0.005) { // threshold para graves
      const pitch = detectarPitch(input, audioContext.sampleRate);
      if(pitch>0) document.getElementById("notaCantada").innerText=`Nota cantada: ${freqParaNota(pitch)}`;
      else document.getElementById("notaCantada").innerText=`Nota cantada: --`;
    } else document.getElementById("notaCantada").innerText=`Nota cantada: --`;

    requestAnimationFrame(atualizarNota);
  }

  atualizarNota();
}

// ==========================
// Parar detecção
// ==========================
function pararDeteccao() {
  detectando = false;
  if(stream) stream.getTracks().forEach(track=>track.stop());
  document.getElementById("nivelSinal").style.width = `0%`;
  document.getElementById("notaCantada").innerText = `Nota cantada: --`;
}

// ==========================
// Autocorrelation pitch detection
// ==========================
function detectarPitch(buffer,sampleRate){
  let size = buffer.length;
  let maxCorr=0;
  let bestOffset=-1;

  for(let offset=32;offset<size/2;offset++){
    let corr=0;
    for(let i=0;i<size-offset;i++) corr+=buffer[i]*buffer[i+offset];
    if(corr>maxCorr){
      maxCorr=corr;
      bestOffset=offset;
    }
  }

  if(bestOffset<=0) return -1;
  return sampleRate/bestOffset;
}

// ==========================
// Frequência para nota
// ==========================
function freqParaNota(freq){
  if(!freq||freq<=0) return '--';
  const notas=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const A4=440;
  const semitons=Math.round(12*Math.log2(freq/A4));
  const notaIndex=(semitons+9)%12;
  const oitava=4+Math.floor((semitons+9)/12);
  return notas[notaIndex]+oitava;
}

// ==========================
// Inicialização
// ==========================
listarMicrofones();
document.getElementById("btnComecar").addEventListener("click", iniciarDeteccao);
document.getElementById("btnParar").addEventListener("click", pararDeteccao);

// ==========================
// Músicas exemplo
// ==========================
let musicas={
  "Música 1":"C4 – 'Exemplo de letra 1...'\nD4 – 'Segunda linha...'",
  "Música 2":"E4 – 'Exemplo de letra 2...'\nF4 – 'Segunda linha...'"
};

function mostrarMenuMusicas(){
  const menu=document.getElementById("menu-musicas");
  menu.innerHTML="";
  Object.keys(musicas).forEach(nome=>{
    const btn=document.createElement("button");
    btn.textContent=nome;
    btn.onclick=()=>mostrarMusica(nome);
    menu.appendChild(btn);
  });
}

function mostrarMusica(nome){
  const div=document.getElementById("conteudo-musica");
  div.innerHTML=`<h3>${nome}</h3><pre>${musicas[nome]}</pre>`;
}

mostrarMenuMusicas();
