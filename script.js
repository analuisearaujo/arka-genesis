const SUPABASE_URL = "https://haoqywnqxeydylfzxqzz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JFc8Bh6QZyFx5iO-7izQ4g_jx8SjxS7";

const supabaseARKA = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const camera = document.getElementById("camera");
const gallery = document.getElementById("gallery");
const preview = document.getElementById("preview");
const btnRegistrar = document.getElementById("btnRegistrar");
const especie = document.getElementById("species");
const observacao = document.getElementById("notes");

let imagemSelecionada = null;
let localizacao = null;

// ----------------------------
// Prévia da imagem
// ----------------------------

function mostrarImagem(file){
  if(!file) return;

  imagemSelecionada = file;

  const reader = new FileReader();

  reader.onload = e=>{
    preview.src = e.target.result;
    preview.style.display = "block";
  };

  reader.readAsDataURL(file);
}

camera?.addEventListener("change",e=>mostrarImagem(e.target.files[0]));
gallery?.addEventListener("change",e=>mostrarImagem(e.target.files[0]));

// ----------------------------
// Localização
// ----------------------------

async function obterLocalizacao(){

  return new Promise(resolve=>{

    if(!navigator.geolocation) return resolve(null);

    navigator.geolocation.getCurrentPosition(

      pos=>resolve({
        lat:pos.coords.latitude,
        lon:pos.coords.longitude
      }),

      ()=>resolve(null),

      {
        enableHighAccuracy:true,
        timeout:10000
      }

    );

  });

}

// ----------------------------
// Identificação da espécie
// ----------------------------

async function identificarEspecie(file){

  try{

    const formData = new FormData();
    formData.append("image",file);

    const formData = new FormData();
formData.append("image", file);

const resposta = await fetch(
  "https://haoqywnqxeydylfzxqzz.supabase.co/functions/v1/identify-species",
  {
    method: "POST",
    body: formData
  }
);

const resultado = await resposta.json();

return {
  scientific_name: resultado.scientific_name,
  common_name: resultado.common_name || "",
  confidence: resultado.confidence
};
}

// ----------------------------
// Upload
// ----------------------------

async function enviarImagem(file){

  const nome=`${Date.now()}-${file.name.replace(/[^\w.-]/g,"_")}`;

  const {error}=await supabaseARKA.storage
    .from("animal - image")
    .upload(nome,file);

  if(error){
    alert("ERRO NO UPLOAD: "+JSON.stringify(error));
    throw error;
  }

  const {data:urlData}=supabaseARKA.storage
    .from("animal - image")
    .getPublicUrl(nome);

  return urlData.publicUrl;

}

// ----------------------------
// Registrar observação
// ----------------------------

async function registrarObservacao(){

  try{

    btnRegistrar.disabled=true;
    btnRegistrar.textContent="Identificando espécie...";

    if(!imagemSelecionada){
      alert("Escolha uma imagem primeiro.");
      return;
    }

    localizacao=await obterLocalizacao();

    const identificacao=await identificarEspecie(imagemSelecionada);

    if(identificacao){

      especie.value=identificacao.scientific_name;

      alert(
`Espécie identificada!

${identificacao.scientific_name}
${identificacao.common_name||""}

Confiança: ${identificacao.confidence||"--"}%`
      );

    }

    btnRegistrar.textContent="Enviando imagem...";

    const imagemUrl=await enviarImagem(imagemSelecionada);

    btnRegistrar.textContent="Salvando observação...";

    const {error}=await supabaseARKA
      .from("observations")
      .insert({

        species:especie.value||"Não identificado",
        common_name:identificacao?.common_name||null,
        confidence:identificacao?.confidence||null,

        image_url:imagemUrl,

        latitude:localizacao?.lat??null,
        longitude:localizacao?.lon??null,

        notes:observacao?.value||null

      });

    if(error) throw error;

    alert("Observação registrada com sucesso!");

    preview.style.display="none";
    preview.src="";

    imagemSelecionada=null;

    especie.value="";

    if(observacao) observacao.value="";

  }catch(err){

    console.error(err);

    alert("ERRO:\n"+(err.message||JSON.stringify(err)));

  }finally{

    btnRegistrar.disabled=false;
    btnRegistrar.textContent="Registrar observação";

  }

}

btnRegistrar?.addEventListener("click",registrarObservacao);
