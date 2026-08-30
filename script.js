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


// ========================================
// ELEMENTOS
// ========================================

const camera =
  document.getElementById("camera");

const gallery =
  document.getElementById("gallery");

const preview =
  document.getElementById("preview");

const analise =
  document.getElementById("analise");

const resultado =
  document.getElementById("resultado");

const mensagem =
  document.getElementById("mensagem");

const botaoSalvar =
  document.getElementById("salvar");

const observacoes =
  document.getElementById("observacoes");

const nomeComum =
  document.getElementById("nomeComum");

// ========================================
// VARIÁVEIS
// ========================================

let arquivoSelecionado = null;


// ========================================
// EVENTOS
// ========================================

camera?.addEventListener(
  "change",
  processarImagem
);

gallery?.addEventListener(
  "change",
  processarImagem
);

botaoSalvar?.addEventListener(
  "click",
  salvarObservacao
);


// ========================================
// PROCESSAR IMAGEM
// ========================================

function processarImagem(event) {

  const arquivo =
    event.target.files[0];

  if (!arquivo) return;

  arquivoSelecionado =
    arquivo;

  const leitor =
    new FileReader();

  leitor.onload =
    function(e) {

      preview.src =
        e.target.result;

      preview.style.display =
        "block";

      analise.innerHTML =
        "Imagem carregada com sucesso.";

      resultado.style.display =
        "block";

      mostrarMensagem(
        "",
        ""
      );

    };

  leitor.onerror =
    function() {

      analise.innerHTML =
        "Erro ao carregar a imagem.";

    };

  leitor.readAsDataURL(
    arquivo
  );

}


// ========================================
// COMPRIMIR IMAGEM
// ========================================

function comprimirImagem(
  arquivo
) {

  return new Promise(
    (resolve, reject) => {

      const leitor =
        new FileReader();

      const img =
        new Image();

      leitor.onload =
        e => {

          img.src =
            e.target.result;

        };

      leitor.onerror =
        reject;

      img.onload =
        () => {

          const canvas =
            document.createElement(
              "canvas"
            );

          const max =
            1200;

          let largura =
            img.width;

          let altura =
            img.height;


          if (
            largura > altura &&
            largura > max
          ) {

            altura =
              altura *
              (max / largura);

            largura =
              max;

          }

          else if (
            altura > max
          ) {

            largura =
              largura *
              (max / altura);

            altura =
              max;

          }


          canvas.width =
            largura;

          canvas.height =
            altura;


          const contexto =
            canvas.getContext(
              "2d"
            );


          contexto.drawImage(
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
                    "Falha ao comprimir a imagem."
                  )
                );

                return;

              }

              resolve(
                blob
              );

            },

            "image/jpeg",

            0.8

          );

        };


      leitor.readAsDataURL(
        arquivo
      );

    }
  );

}


// ========================================
// OBTER GPS
// ========================================

function obterLocalizacao() {

  return new Promise(
    (resolve) => {

      if (
        !navigator.geolocation
      ) {

        console.warn(
          "ARKA — GPS não disponível."
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

            latitude:
              latitude,

            longitude:
              longitude

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

          enableHighAccuracy:
            true,

          timeout:
            30000,

          maximumAge:
            0

        }

      );

    }
  );

}


// ========================================
// SALVAR OBSERVAÇÃO
// ========================================

async function salvarObservacao() {


  // ---------- VERIFICAR FOTO ----------

  if (!arquivoSelecionado) {

    mostrarMensagem(
      "Escolha uma foto primeiro.",
      "erro"
    );

    return;

  }


  // ---------- BOTÃO ----------

  botaoSalvar.disabled =
    true;

  botaoSalvar.innerText =
    "Preparando...";


  try {


    // ====================================
    // GPS
    // ====================================

    const localizacao =
      await obterLocalizacao();


    const latitude =
      localizacao.latitude;

    const longitude =
      localizacao.longitude;


    console.log(
      "ARKA — localização:",
      latitude,
      longitude
    );


    // ====================================
    // COMPRIMIR
    // ====================================

    const imagem =
      await comprimirImagem(
        arquivoSelecionado
      );


    // ====================================
    // NOME
    // ====================================

    const nomeArquivo =
      "observacao-" +
      Date.now() +
      ".jpg";


    // ====================================
    // UPLOAD
    // ====================================

    botaoSalvar.innerText =
      "Enviando fotografia...";


    const upload =
      await supabaseARKA
        .storage
        .from(
          "animal - image"
        )
        .upload(

          nomeArquivo,

          imagem,

          {

            cacheControl:
              "3600",

            upsert:
              false,

            contentType:
              "image/jpeg"

          }

        );


    if (
      upload.error
    ) {

      throw upload.error;

    }


    // ====================================
    // URL PÚBLICA
    // ====================================

    const publicUrl =
      supabaseARKA
        .storage
        .from(
          "animal - image"
        )
        .getPublicUrl(
          nomeArquivo
        );


    const imagemUrl =
      publicUrl.data.publicUrl;


    // ====================================
    // BANCO
    // ====================================

    botaoSalvar.innerText =
      "Salvando observação...";


    const banco =
      await supabaseARKA
        .from(
          "observations"
        )
        .insert([

          {

            species:
              "Crotalus durissus",

            common_name:
              nomeComum.value,

            image_url:
              imagemUrl,

            latitude:
              latitude,

            longitude:
              longitude,

            location_name:
              "Observação ARKA Genesis",

            notes:
              observacoes.value,

          }

        ])
        .select()
        .single();


    if (
      banco.error
    ) {

      throw banco.error;

    }


    // ====================================
    // SUCESSO
    // ====================================

    console.log(
      "ARKA — observação salva:",
      banco.data
    );


    mostrarMensagem(

      "✅ Fotografia, localização e observação salvas!",

      "sucesso"

    );


    botaoSalvar.innerText =
      "Observação salva";


  }

  catch (erro) {


    console.error(
      "ARKA — erro:",
      erro
    );


    mostrarMensagem(

      "ERRO: " +
      erro.message,

      "erro"

    );


    botaoSalvar.disabled =
      false;

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

  if (!mensagem)
    return;


  mensagem.innerHTML =
    texto;


  mensagem.className =
    "mensagem";


  if (tipo) {

    mensagem.classList.add(
      tipo
    );

  }
console.log("ARKA TESTE VERSÃO NOVA 123");
}
console.log("ARKA VERSAO TESTE 999");
