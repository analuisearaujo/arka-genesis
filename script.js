// ============================================================
// ARKA GENESIS
// script.js
// ============================================================


// ============================================================
// SUPABASE
// ============================================================

const SUPABASE_URL =
  "https://haoqywnqxeydylfzxqzz.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_JFc8Bh6QZyFx5iO-7izQ4g_jx8SjxS7";

const supabaseARKA = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// ============================================================
// ELEMENTOS DA PÁGINA
// ============================================================

const camera = document.getElementById("camera");
const gallery = document.getElementById("gallery");

const preview = document.getElementById("preview");

const btnRegistrar =
  document.getElementById("btnRegistrar");

const especie =
  document.getElementById("species");

const observacao =
  document.getElementById("notes");


// ============================================================
// VARIÁVEIS
// ============================================================

let imagemSelecionada = null;
let localizacao = null;


// ============================================================
// MOSTRAR PRÉVIA DA IMAGEM
// ============================================================

function mostrarImagem(file) {

  console.log("ARKA: imagem selecionada");
  console.log(file);

  if (!file) {
    return;
  }

  if (!preview) {
    console.error("ARKA: elemento #preview não encontrado.");
    return;
  }

  // Guarda a imagem escolhida
  imagemSelecionada = file;

  // Cria URL temporária para mostrar a imagem
  const url = URL.createObjectURL(file);

  preview.src = url;
  preview.style.display = "block";

  // Libera a URL depois que a imagem carregar
  preview.onload = function () {

    URL.revokeObjectURL(url);

  };

}


// ============================================================
// INPUT DA CÂMERA
// ============================================================

camera?.addEventListener("change", function (event) {

  const file = event.target.files?.[0];

  mostrarImagem(file);

});


// ============================================================
// INPUT DA GALERIA
// ============================================================

gallery?.addEventListener("change", function (event) {

  const file = event.target.files?.[0];

  mostrarImagem(file);

});


// ============================================================
// LOCALIZAÇÃO
// ============================================================

async function obterLocalizacao() {

  return new Promise(function (resolve) {

    if (!navigator.geolocation) {

      console.log(
        "ARKA: geolocalização não disponível."
      );

      resolve(null);
      return;

    }

    navigator.geolocation.getCurrentPosition(

      function (posicao) {

        const local = {

          lat: posicao.coords.latitude,

          lon: posicao.coords.longitude

        };

        console.log(
          "ARKA: localização obtida",
          local
        );

        resolve(local);

      },

      function (erro) {

        console.log(
          "ARKA: não foi possível obter localização.",
          erro
        );

        resolve(null);

      },

      {

        enableHighAccuracy: true,

        timeout: 10000,

        maximumAge: 0

      }

    );

  });

}


// ============================================================
// IDENTIFICAÇÃO POR IA
// ============================================================

async function identificarEspecie(file) {

  try {

    console.log(
      "ARKA: enviando imagem para identificação..."
    );

    const formData = new FormData();

    formData.append(
      "image",
      file
    );


    const resposta = await fetch(

      "https://haoqywnqxeydylfzxqzz.supabase.co/functions/v1/identify-species",

      {

        method: "POST",

        body: formData

      }

    );


    if (!resposta.ok) {

      const textoErro =
        await resposta.text();

      console.error(
        "ARKA: erro da IA:",
        textoErro
      );

      throw new Error(
        "A identificação por IA não está disponível no momento."
      );

    }


    const resultado =
      await resposta.json();


    console.log(
      "ARKA: resultado da IA:",
      resultado
    );


    return {

      scientific_name:
        resultado.scientific_name || "",

      common_name:
        resultado.common_name || "",

      confidence:
        resultado.confidence ?? null

    };


  } catch (erro) {

    console.error(
      "ARKA: IA indisponível:",
      erro
    );

    return null;

  }

}


// ============================================================
// UPLOAD DA IMAGEM PARA O SUPABASE STORAGE
// ============================================================

async function enviarImagem(file) {

  if (!file) {

    throw new Error(
      "Nenhuma imagem foi selecionada."
    );

  }


  const nomeSeguro =
    file.name.replace(
      /[^\w.-]/g,
      "_"
    );


  const caminho =
    `observacoes/${Date.now()}-${nomeSeguro}`;


  console.log(
    "ARKA: enviando imagem:",
    caminho
  );


  const {

    data,

    error

  } = await supabaseARKA.storage

    .from("animal - image")

    .upload(
      caminho,
      file
    );


  if (error) {

    console.error(
      "ARKA: erro no upload:",
      error
    );

    throw error;

  }


  console.log(
    "ARKA: upload concluído:",
    data
  );


  const {

    data: urlData

  } = supabaseARKA.storage

    .from("animal - image")

    .getPublicUrl(
      caminho
    );


  if (!urlData?.publicUrl) {

    throw new Error(
      "Não foi possível obter a URL pública da imagem."
    );

  }


  return urlData.publicUrl;

}


// ============================================================
// REGISTRAR OBSERVAÇÃO
// ============================================================

async function registrarObservacao() {

  try {


    // --------------------------------------------------------
    // Verifica se existe imagem
    // --------------------------------------------------------

    if (!imagemSelecionada) {

      alert(
        "Escolha uma imagem primeiro."
      );

      return;

    }


    // --------------------------------------------------------
    // Desativa botão
    // --------------------------------------------------------

    if (btnRegistrar) {

      btnRegistrar.disabled = true;

      btnRegistrar.textContent =
        "Identificando...";

    }


    // --------------------------------------------------------
    // Obtém localização
    // --------------------------------------------------------

    localizacao =
      await obterLocalizacao();


    // --------------------------------------------------------
    // IDENTIFICAÇÃO POR IA
    // --------------------------------------------------------

    const identificacao =
      await identificarEspecie(
        imagemSelecionada
      );


    // --------------------------------------------------------
    // Preenche espécie automaticamente
    // --------------------------------------------------------

    if (identificacao) {

      if (
        especie &&
        identificacao.scientific_name
      ) {

        especie.value =
          identificacao.scientific_name;

      }


      console.log(
        "ARKA: espécie identificada:",
        identificacao.scientific_name
      );


      console.log(
        "ARKA: nome comum:",
        identificacao.common_name
      );


      console.log(
        "ARKA: confiança:",
        identificacao.confidence
      );

    }


    // --------------------------------------------------------
    // Upload
    // --------------------------------------------------------

    if (btnRegistrar) {

      btnRegistrar.textContent =
        "Enviando imagem...";

    }


    const imagemUrl =
      await enviarImagem(
        imagemSelecionada
      );


    console.log(
      "ARKA: URL da imagem:",
      imagemUrl
    );


    // --------------------------------------------------------
    // Salvar observação
    // --------------------------------------------------------

    if (btnRegistrar) {

      btnRegistrar.textContent =
        "Salvando...";

    }


    const dadosObservacao = {

      species:
        especie?.value ||
        "Não identificado",

      common_name:
        identificacao?.common_name ||
        null,

      confidence:
        identificacao?.confidence ??
        null,

      image_url:
        imagemUrl,

      latitude:
        localizacao?.lat ??
        null,

      longitude:
        localizacao?.lon ??
        null,

      notes:
        observacao?.value ||
        null

    };


    console.log(
      "ARKA: salvando observação:",
      dadosObservacao
    );


    const {

      error

    } = await supabaseARKA

      .from("observations")

      .insert(
        dadosObservacao
      );


    if (error) {

      console.error(
        "ARKA: erro ao salvar:",
        error
      );

      throw error;

    }


    // --------------------------------------------------------
    // SUCESSO
    // --------------------------------------------------------

    alert(
      "Observação registrada com sucesso!"
    );


    // --------------------------------------------------------
    // Limpa formulário
    // --------------------------------------------------------

    if (preview) {

      preview.src = "";

      preview.style.display =
        "none";

    }


    imagemSelecionada = null;


    if (especie) {

      especie.value = "";

    }


    if (observacao) {

      observacao.value = "";

    }


    // Limpa os inputs de arquivo
    if (camera) {

      camera.value = "";

    }


    if (gallery) {

      gallery.value = "";

    }


  } catch (erro) {


    console.error(
      "ARKA: ERRO REAL:",
      erro
    );


    const mensagem =
      erro?.message ||
      erro?.error_description ||
      JSON.stringify(erro);


    alert(
      "Erro ao registrar observação:\n\n" +
      mensagem
    );


  } finally {


    // --------------------------------------------------------
    // Reativa botão
    // --------------------------------------------------------

    if (btnRegistrar) {

      btnRegistrar.disabled =
        false;

      btnRegistrar.textContent =
        "Salvar observação";

    }

  }

}


// ============================================================
// BOTÃO REGISTRAR
// ============================================================

btnRegistrar?.addEventListener(
  "click",
  registrarObservacao
);


// ============================================================
// TESTE
// ============================================================

console.log(
  "ARKA Genesis: script carregado com sucesso."
);
