let synth;
let audioContext;
let analyser;
let dataArray;
let source;
let detectarAtivo = false;

// Piano horizontal C2 - B6
function gerarPiano() {
  const notas = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const piano = document.getElementById("piano");

  for(let oitava=2; oitava<=6; oitava++){
    notas.forEach(n=>{
      const nota = n + oitava;
      const key = document.createElement("div");
      key.classList.add("key");
      key.classList.add(n.includes("#") ? "black" : "white");
      key.dataset.nota = nota;
      key.textContent = nota;
      key.addEventListener("mousedown", ()=>iniciarNota(nota));
      key.addEventListener("mouseup", pararNota);
      key.addEventListener("mouseleave", pararNota);
      key.addEventListener("touchstart", ()=>iniciarNota(nota));
      key.addEventListener("touchend", pararNota);
      piano.appendChild(key);
    });
  }
}

// Funções de tocar piano
function iniciarNota(nota){
  if(!synth) synth = new Tone.Synth().toDestination();
  synth.triggerAttack(nota);
  document.getElementById("notaTocada").innerText = `Nota tocada: ${nota}`;
}

function pararNota(){
  if(synth) synth.triggerRelease();
}

// Inicializar piano
gerarPiano();

// Lista de músicas
let musicas = {
  "Música 1": "C4 – 'A luz que vem do céu...'\nD4 – '...brilha em mim sem véu...'",
  "Música 2": "G4 – 'No palco da emoção...'\nB4 – '...canto com o coração...'"
};

// Menu de músicas
function mostrarMenuMusicas(){
  const menu = document.getElementById("menu-musicas");
  menu.innerHTML = "";
  Object.keys(musicas).forEach(nome=>{
    const btn = document.createElement("button");
    btn.textContent = nome;
    btn.onclick = ()=>mostrarMusica(nome);
    menu.appendChild(btn);
  });
}

function mostrarMusica(nome){
  const div = document.getElementById("conteudo-musica");
  div.innerHTML = `<h3>${nome}</h3><pre>${musicas[nome]}</pre>`;
}

mostrarMenuMusicas();

// Detecção de nota usando Web Audio API
async function iniciarDeteccao(){
  if(detectarAtivo) return;
  detectarAtivo = true;

  audioContext = new AudioContext();
  if(audioContext.state === "suspended") await audioContext.resume();

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  source = audioContext.createMediaStreamSource(stream);
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  dataArray = new Float32Array(analyser.fftSize);
  detectar();
}

function detectar(){
  if(!detectarAtivo) return;
  analyser.getFloatTimeDomainData(dataArray);
  const pitch = autoCorrelate(dataArray, audioContext.sampleRate);
  const barra = document.getElementById("barra");

  if(pitch !== -1){
    const nota = freqParaNota(pitch);
    document.getElementById("notaCantada").innerText = `Nota cantada: ${nota}`;
    barra.style.width = Math.min(pitch/2000*100,100) + "%";
  } else {
    document.getElementById("notaCantada").innerText = "Nota cantada: --";
    barra.style.width = "0%";
  }
  requestAnimationFrame(detectar);
}

function pararDeteccao(){
  detectarAtivo = false;
  document.getElementById("notaCantada").innerText = "Nota cantada: --";
  document.getElementById("barra").style.width = "0%";
  if(source) source.disconnect();
}

// Converter frequência para nota musical
function freqParaNota(freq){
  const notas = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const A4 = 440;
  const semitons = Math.round(12 * Math.log2(freq/A4));
  const notaIndex = (semitons + 9) % 12;
  const oitava = 4 + Math.floor((semitons + 9)/12);
  return notas[notaIndex] + oitava;
}

// Autocorrelation algorithm
function autoCorrelate(buf, sampleRate) {
  let SIZE = buf.length;
  let rms = 0;

  for (let i=0;i<SIZE;i++){
    let val = buf[i];
    rms += val*val;
  }
  rms = Math.sqrt(rms/SIZE);
  if(rms<0.01) return -1;

  let r1=0,r2=SIZE-1,thres=0.2;
  for(let i=0;i<SIZE/2;i++) if(Math.abs(buf[i])<thres){r1=i;break;}
  for(let i=1;i<SIZE/2;i++) if(Math.abs(buf[SIZE-i])<thres){r2=SIZE-i;break;}
  buf = buf.slice(r1,r2);

  let c = new Array(buf.length).fill(0);
  for(let i=0;i<buf.length;i++){
    for(let j=0;j<buf.length-i;j++){
      c[i] = c[i] + buf[j]*buf[j+i];
    }
  }

  let d=0; while(c[d]>c[d+1]) d++;
  let maxval=-1,pos=-1;
  for(let i=d;i<c.length;i++){
    if(c[i]>maxval){maxval=c[i]; pos=i;}
  }
  let T = pos;
  if(T===0) return -1;
  return sampleRate/T;
}

// Botões
document.getElementById("btn-start").addEventListener("click", iniciarDeteccao);
document.getElementById("btn-stop").addEventListener("click", pararDeteccao);
