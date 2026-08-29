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

  // ========================================
// OBTER LOCALIZAÇÃO
// ========================================

let latitude = null;
let longitude = null;

try {

    const posicao = await new Promise(
        (resolve, reject) => {

            if (!navigator.geolocation) {

                reject(
                    new Error(
                        "Geolocalização não disponível."
                    )
                );

                return;
            }

            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );

        }
    );

    latitude =
        posicao.coords.latitude;

    longitude =
        posicao.coords.longitude;

} catch (erro) {

    console.warn(
        "ARKA — localização não obtida:",
        erro.message
    );

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

    const banco =
      await supabaseARKA
        .from("observations")
        .insert([
          {
            species: "Crotalus durissus",
            common_name: "Cascavel",
            image_url: data.publicUrl,
            latitude: latitude,
            longitude: longitude,
            location_name: "Teste ARKA Genesis",
            notes: "Observação criada pelo ARKA Genesis."
          }
        ])
        .select();

    if (banco.error)
      throw banco.error;

    mostrarMensagem(
      "✅ Fotografia e observação salvas!",
      "sucesso"
    );

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

navigator.geolocation.getCurrentPosition(

    function(position) {

        console.log(
            "ARKA GPS:",
            position.coords.latitude,
            position.coords.longitude
        );

    },

    function(error) {

        console.error(
            "ARKA GPS ERRO:",
            error.code,
            error.message
        );

    },

    {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
    }

);
