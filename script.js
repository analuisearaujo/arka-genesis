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

  return new Promise((resolve) => {

    if (!navigator.geolocation) {

      mostrarMensagem(
        "❌ Este navegador não oferece geolocalização.",
        "erro"
      );

      resolve({
        latitude: null,
        longitude: null
      });

      return;
    }

    mostrarMensagem(
      "📍 Obtendo sua localização...",
      ""
    );

    navigator.geolocation.getCurrentPosition(

      function(position) {

        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        console.log(
          "ARKA GPS:",
          latitude,
          longitude
        );

        mostrarMensagem(
          "📍 Localização encontrada!",
          "sucesso"
        );

        resolve({
          latitude: latitude,
          longitude: longitude
        });

      },

      function(error) {

        console.error(
          "ARKA GPS ERRO:",
          error.code,
          error.message
        );

        let mensagemErro =
          "❌ Não foi possível obter o GPS.";

        if (error.code === 1) {
          mensagemErro =
            "❌ Permissão de localização negada.";
        }

        if (error.code === 2) {
          mensagemErro =
            "❌ Localização indisponível.";
        }

        if (error.code === 3) {
          mensagemErro =
            "❌ Tempo limite para obter localização.";
        }

        mostrarMensagem(
          mensagemErro,
          "erro"
        );

        resolve({
          latitude: null,
          longitude: null
        });

      },

      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }

    );

  });

},

        {

          enableHighAccuracy:
            true,

          timeout:
            15000,

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


  // ---------- DESABILITAR BOTÃO ----------

  botaoSalvar.disabled =
    true;

  botaoSalvar.innerText =
    "Obtendo localização...";


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

    botaoSalvar.innerText =
      "Preparando fotografia...";


    const imagem =
      await comprimirImagem(
        arquivoSelecionado
      );


    // ====================================
    // NOME DO ARQUIVO
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
    // SALVAR BANCO
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
              "Cascavel",

            image_url:
              imagemUrl,

            latitude:
              latitude,

            longitude:
              longitude,

            location_name:
              "Observação ARKA Genesis",

            notes:
              "Observação criada pelo ARKA Genesis."

          }

        ])

        .select();


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

      "ERRO REAL: " +
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

}
```
