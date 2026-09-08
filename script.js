// ============================
// ARKA Genesis - script.js
// ============================

// ---------- Supabase ----------

const SUPABASE_URL = "https://haoqywnqxeydylfzxqzz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JFc8Bh6QZyFx5iO-7izQ4g_jx8SjxS7";

const supabaseARKA = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ---------- Elementos ----------

const camera = document.getElementById("camera");
const gallery = document.getElementById("gallery");
const preview = document.getElementById("preview");
console.log("ARKA script carregado");

const btnRegistrar = document.getElementById("btnRegistrar");
const especie = document.getElementById("species");
const observacao = document.getElementById("notes");

let imagemSelecionada = null;
let localizacao = null;

// ============================
// Prévia da imagem
// ============================

function mostrarImagem(file){

  console.log("mostrarImagem chamou");
  console.log(file);

  if(!file || !preview) return;

  imagemSelecionada = file;

  const url = URL.createObjectURL(file);

  preview.src = url;
  preview.style.display = "block";

  preview.onload = () => {
    URL.revokeObjectURL(url);
  };

}

// ============================
// Localização
// ============================

async function obterLocalizacao(){

  return new Promise(resolve=>{

    if(!navigator.geolocation){
      resolve(null);
      return;
    }

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

// ============================
// IA de identificação
// ============================

async function identificarEspecie(file){

  try{

    const formData = new FormData();
    formData.append("image",file);

    const resposta = await fetch(
      "https://haoqywnqxeydylfzxqzz.supabase.co/functions/v1/identify-species",
      {
        method:"POST",
        body:formData
      }
    );

    if(!resposta.ok){
      throw new Error("IA indisponível.");
    }

    const resultado = await resposta.json();

    return{

      scientific_name:resultado.scientific_name || "",
      common_name:resultado.common_name || "",
      confidence:resultado.confidence || null

    };

  }catch(e){

    console.log("IA indisponível:",e);

    return null;

  }

}

// ============================
// Upload da imagem
// ============================

async function enviarImagem(file){

  const nome = `${Date.now()}-${file.name.replace(/[^\w.-]/g,"_")}`;

  const {error} = await supabaseARKA.storage
    .from("animal - image")
    .upload(nome,file);

  if(error) throw error;

  const {data} = supabaseARKA.storage
    .from("animal - image")
    .getPublicUrl(nome);

  return data.publicUrl;

}

// ============================
// Registrar observação
// ============================

async function registrarObservacao(){

  try{

    if(!imagemSelecionada){
      alert("Escolha uma imagem primeiro.");
      return;
    }

    btnRegistrar.disabled = true;
    btnRegistrar.textContent = "Identificando...";

    localizacao = await obterLocalizacao();

    const identificacao = await identificarEspecie(imagemSelecionada);

    if(identificacao){

      especie.value = identificacao.scientific_name;

      alert(
`Espécie identificada!

${identificacao.scientific_name}
${identificacao.common_name}

Confiança: ${identificacao.confidence ?? "--"}%`
      );

    }

    btnRegistrar.textContent = "Enviando imagem...";

    const imagemUrl = await enviarImagem(imagemSelecionada);

    btnRegistrar.textContent = "Salvando...";

    const {error} = await supabaseARKA
      .from("observations")
      .insert({

        species:especie.value || "Não identificado",
        common_name:identificacao?.common_name || null,
        confidence:identificacao?.confidence || null,

        image_url:imagemUrl,

        latitude:localizacao?.lat ?? null,
        longitude:localizacao?.lon ?? null,

        notes:observacao?.value || null

      });

    if(error) throw error;

    alert("Observação registrada com sucesso!");

    preview.src = "";
    preview.style.display = "none";

    imagemSelecionada = null;

    especie.value = "";

    if(observacao){
      observacao.value = "";
    }

  }catch(err){

    console.error(err);

    alert("Erro: " + (err.message || JSON.stringify(err)));

  }finally{

    btnRegistrar.disabled = false;
    btnRegistrar.textContent = "Salvar observação";

  }

}

btnRegistrar?.addEventListener("click",registrarObservacao);
