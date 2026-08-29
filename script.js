// ========================================
// ARKA GENESIS
// Script principal
// ========================================

// ---------- SUPABASE ----------

const SUPABASE_URL =
  "https://haoqywnqxeydylfzxqzz.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_JFc8Bh6QZyFx5iO-7izQ4g_jx8SjxS7";

const supabaseARKA =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// ---------- ELEMENTOS ----------

const camera = document.getElementById("camera");
const gallery = document.getElementById("gallery");
const preview = document.getElementById("preview");
const analise = document.getElementById("analise");
const resultado = document.getElementById("resultado");
const mensagem = document.getElementById("mensagem");
const botaoSalvar = document.getElementById("salvar");

// ---------- VARIÁVEIS ----------

let arquivoSelecionado = null;

// ---------- EVENTOS ----------

camera?.addEventListener("change", processarImagem);
gallery?.addEventListener("change", processarImagem);
botaoSalvar?.addEventListener("click", salvarObservacao);

// ========================================
// PREVIEW DA IMAGEM
// ========================================

function processarImagem(event) {

  const arquivo = event.target.files[0];

  if (!arquivo) return;

  arquivoSelecionado = arquivo;

  const leitor = new FileReader();

  leitor.onload = function(e) {

    preview.src = e.target.result;

    preview.style.display = "block";

    analise.innerHTML =
      "Imagem carregada com sucesso.";

    resultado.style.display = "block";

    mostrarMensagem("", "");

  };

  leitor.onerror = function() {

    analise.innerHTML =
      "Erro ao carregar a imagem.";

  };

  leitor.readAsDataURL(arquivo);

}

// ========================================
// COMPRIMIR IMAGEM
// ========================================

function comprimirImagem(arquivo) {

  return new Promise((resolve, reject) => {

    const leitor = new FileReader();

    const img = new Image();

    leitor.onload = e => img.src = e.target.result;

    leitor.onerror = reject;

    img.onload = () => {

      const canvas =
        document.createElement("canvas");

      const max = 1200;

      let largura = img.width;
      let altura = img.height;

      if (largura > altura) {

        if (largura > max) {

          altura =
            altura * (max / largura);

          largura = max;

        }

      } else {

        if (altura > max) {

          largura =
            largura * (max / altura);

          altura = max;

        }

      }

      canvas.width = largura;
      canvas.height = altura;

      canvas
        .getContext("2d")
        .drawImage(
          img,
          0,
          0,
          largura,
          altura
        );

      canvas.toBlob(

        blob => {

          if (!blob) {

            reject(
              new Error(
                "Falha ao comprimir."
              )
            );

            return;
          }

          resolve(blob);

        },

        "image/jpeg",

        0.8

      );

    };

    leitor.readAsDataURL(arquivo);

  });

}

// ========================================
// OBTER GPS
// ========================================

function obterLocalizacao() {

  return new Promise((resolve) => {

    if (!navigator.geolocation) {

      console.warn(
        "ARKA — geolocalização não disponível."
      );

      resolve({
        latitude: null,
        longitude: null
      });

      return;
    }

    navigator.geolocation.getCurrentPosition(

      function(position) {

        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        console.log(
          "ARKA — GPS encontrado:",
          latitude,
          longitude
        );

        resolve({
          latitude: latitude,
          longitude: longitude
        });

      },

      function(error) {

        console.warn(
          "ARKA — erro GPS:",
          error.code,
          error.message
        );

        resolve({
          latitude: null,
          longitude: null
        });

      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }

    );

  });

}

// ========================================
// SALVAR OBSERVAÇÃO
// ========================================

async function salvarObservacao() {

  if (!arquivoSelecionado) {

    mostrarMensagem(
      "Escolha uma foto primeiro.",
      "erro"
    );

    return;

  }

  botaoSalvar.disabled = true;

  botaoSalvar.innerText =
    "Preparando...";

  try {

    // ---------- Comprimir ----------

    const imagem =
      await comprimirImagem(
        arquivoSelecionado
      );

    // ---------- Nome ----------

    const nomeArquivo =
      "observacao-" +
      Date.now() +
      ".jpg";

    botaoSalvar.innerText =
      "Enviando fotografia...";

    // ---------- Upload ----------

    const upload =
      await supabaseARKA
        .storage
        .from("animal - image")
        .upload(
          nomeArquivo,
          imagem,
          {
            cacheControl: "3600",
            upsert: false,
            contentType: "image/jpeg"
          }
        );

    if (upload.error)
      throw upload.error;

    // ---------- URL ----------

    const { data } =
      supabaseARKA
        .storage
        .from("animal - image")
        .getPublicUrl(
          nomeArquivo
        );

    botaoSalvar.innerText =
      "Salvando observação...";

    // ---------- Banco ----------

const publicUrl =
  supabaseARKA
    .storage
    .from("animal - image")
    .getPublicUrl(nomeArquivo);

const imagemUrl =
  publicUrl.data.publicUrl;
    
    const banco =
  await supabaseARKA
    .from("observations")
    .insert([{
      species: "Crotalus durissus",
      common_name: "Cascavel",
      image_url: imagemUrl,
      latitude: null,
      longitude: null,
      location_name: "Observação ARKA Genesis",
      notes: "Observação criada pelo ARKA Genesis."
    }])
    .select()
    .single();


// Verificar se a observação foi criada
if (banco.error) {
  throw banco.error;
}


// Pegar o UUID da observação recém-criada
const idObservacao =
  banco.data.id;


// Obter localização
const localizacao =
  await obterLocalizacao();


// Atualizar EXATAMENTE essa observação
const atualizacao =
  await supabaseARKA
    .from("observations")
    .update({
      latitude:
        localizacao.latitude,

      longitude:
        localizacao.longitude
    })
    .eq(
      "id",
      idObservacao
    );


// Verificar erro do GPS/update
if (atualizacao.error) {
  throw atualizacao.error;
}


// Sucesso
mostrarMensagem(
  "✅ Fotografia, localização e observação salvas!",
  "sucesso"
);;

    botaoSalvar.innerText =
      "Observação salva";

  }

  catch (erro) {

    console.error(
      "ARKA:",
      erro
    );

    mostrarMensagem(
      "ERRO: " +
      erro.message,
      "erro"
    );

    botaoSalvar.disabled = false;

    botaoSalvar.innerText =
      "Tentar novamente";

  }

}

// ========================================
// MENSAGENS
// ========================================

function mostrarMensagem(
  texto,
  tipo
) {

  if (!mensagem) return;

  mensagem.innerHTML = texto;

  mensagem.className = "mensagem";

  if (tipo)
    mensagem.classList.add(tipo);

}
