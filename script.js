// ======================================================
// ARKA GENESIS
// SCRIPT PRINCIPAL
// ======================================================

// ------------------------------------------------------
// SUPABASE
// ------------------------------------------------------

const SUPABASE_URL =
  "https://haoqywnqxeydylfzxqzz.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_JFc8Bh6QZyFx5iO-7izQ4g_jx8SjxS7";

const supabaseARKA = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// ------------------------------------------------------
// ELEMENTOS DA PÁGINA
// ------------------------------------------------------

const camera = document.getElementById("camera");
const gallery = document.getElementById("gallery");

const preview = document.getElementById("preview");

const btnRegistrar =
  document.getElementById("btnRegistrar");

const especie =
  document.getElementById("species");

const observacao =
  document.getElementById("notes");


// ------------------------------------------------------
// VARIÁVEIS
// ------------------------------------------------------

let imagemSelecionada = null;

let localizacao = null;

let identificacaoAtual = null;


// ------------------------------------------------------
// MOSTRAR IMAGEM SELECIONADA
// ------------------------------------------------------

function mostrarImagem(file) {

  if (!file) {
    return;
  }

  if (!preview) {
    console.error(
      "ARKA: elemento #preview não encontrado."
    );

    return;
  }

  imagemSelecionada = file;

  const url =
    URL.createObjectURL(file);

  preview.src = url;

  preview.style.display = "block";

  preview.onload = function () {
    URL.revokeObjectURL(url);
  };

  console.log(
    "ARKA: imagem selecionada:",
    file.name
  );
}


// ------------------------------------------------------
// CÂMERA
// ------------------------------------------------------

camera?.addEventListener(
  "change",
  function (event) {

    const file =
      event.target.files?.[0];

    mostrarImagem(file);
  }
);


// ------------------------------------------------------
// GALERIA
// ------------------------------------------------------

gallery?.addEventListener(
  "change",
  function (event) {

    const file =
      event.target.files?.[0];

    mostrarImagem(file);
  }
);


// ------------------------------------------------------
// OBTER LOCALIZAÇÃO GPS
// ------------------------------------------------------

async function obterLocalizacao() {

  return new Promise(function (resolve) {

    if (!navigator.geolocation) {

      console.warn(
        "ARKA: geolocalização não é suportada."
      );

      resolve(null);

      return;
    }

    navigator.geolocation.getCurrentPosition(

      function (position) {

        const dados = {

          lat:
            position.coords.latitude,

          lon:
            position.coords.longitude
        };

        console.log(
          "ARKA: localização obtida:",
          dados
        );

        resolve(dados);
      },

      function (erro) {

        console.warn(
          "ARKA: não foi possível obter a localização.",
          erro
        );

        resolve(null);
      },

      {
        enableHighAccuracy: true,

        timeout: 15000,

        maximumAge: 0
      }
    );
  });
}


// ------------------------------------------------------
// IDENTIFICAR ESPÉCIE COM IA
// ------------------------------------------------------

async function identificarEspecie(file, coordenadas) {

  try {

    console.log("ARKA: iniciando identificação por IA...");

    const formData = new FormData();

    formData.append("image", file);

    if (
      coordenadas &&
      coordenadas.lat !== null &&
      coordenadas.lon !== null
    ) {
      formData.append(
        "latitude",
        String(coordenadas.lat)
      );

      formData.append(
        "longitude",
        String(coordenadas.lon)
      );
    }

    console.log(
      "ARKA: enviando imagem para identify-species..."
    );

    const resposta = await fetch(
      SUPABASE_URL +
        "/functions/v1/identify-species",
      {
        method: "POST",

        headers: {
          "apikey": SUPABASE_ANON_KEY
        },

        body: formData
      }
    );

    const texto = await resposta.text();

    console.log(
      "ARKA: status da Edge Function:",
      resposta.status
    );

    console.log(
      "ARKA: resposta completa da Edge Function:",
      texto
    );

    // ------------------------------------------
    // MOSTRAR O ERRO REAL
    // ------------------------------------------

    if (!resposta.ok) {

      let detalhe = texto;

      try {
        const jsonErro = JSON.parse(texto);

        detalhe =
          jsonErro.error ||
          jsonErro.message ||
          jsonErro.msg ||
          texto;

      } catch {
        // resposta não era JSON
      }

      throw new Error(
        "Edge Function HTTP " +
        resposta.status +
        ": " +
        detalhe
      );
    }

    let resultado;

    try {

      resultado = JSON.parse(texto);

    } catch {

      throw new Error(
        "A Edge Function retornou algo que não é JSON:\n\n" +
        texto
      );
    }

    console.log(
      "ARKA: JSON recebido:",
      resultado
    );

    if (resultado.error) {

      throw new Error(
        resultado.error
      );
    }

    return {

      scientific_name:
        resultado.scientific_name || null,

      common_name:
        resultado.common_name || null,

      confidence:
        resultado.confidence ?? null,

      location_name:
        resultado.location_name || null,

      latitude:
        resultado.latitude ??
        coordenadas?.lat ??
        null,

      longitude:
        resultado.longitude ??
        coordenadas?.lon ??
        null
    };

  } catch (erro) {

    console.error(
      "ARKA: ERRO REAL DA IA:",
      erro
    );

    throw erro;
  }
}


    // ----------------------------------------------
    // FORM DATA
    // ----------------------------------------------

    const formData =
      new FormData();

    formData.append(
      "image",
      file
    );


    // ----------------------------------------------
    // ENVIA GPS PARA A EDGE FUNCTION
    // ----------------------------------------------

    if (
      coordenadas &&
      coordenadas.lat !== null &&
      coordenadas.lon !== null
    ) {

      formData.append(
        "latitude",
        String(coordenadas.lat)
      );

      formData.append(
        "longitude",
        String(coordenadas.lon)
      );
    }


    // ----------------------------------------------
    // CHAMADA DA EDGE FUNCTION
    // ----------------------------------------------

    const resposta =
  await fetch(

    SUPABASE_URL +
      "/functions/v1/identify-species",

    {
      method: "POST",

      headers: {
        "apikey": SUPABASE_ANON_KEY
      },

      body: formData
    }
  );


    // ----------------------------------------------
    // LER RESPOSTA
    // ----------------------------------------------

    const texto =
      await resposta.text();

    console.log(
      "ARKA: resposta da IA:",
      texto
    );


    // ----------------------------------------------
    // VERIFICAR ERRO HTTP
    // ----------------------------------------------

    if (!resposta.ok) {

      console.error(
        "ARKA: erro HTTP da IA:",
        resposta.status,
        texto
      );

      throw new Error(
        "A identificação por IA falhou."
      );
    }


    // ----------------------------------------------
    // CONVERTER JSON
    // ----------------------------------------------

    let resultado;

    try {

      resultado =
        JSON.parse(texto);

    } catch (erro) {

      console.error(
        "ARKA: resposta da IA não é JSON:",
        texto
      );

      throw new Error(
        "A IA retornou uma resposta inválida."
      );
    }


    // ----------------------------------------------
    // VERIFICAR ERRO RETORNADO PELA EDGE FUNCTION
    // ----------------------------------------------

    if (resultado.error) {

      throw new Error(
        resultado.error
      );
    }


    // ----------------------------------------------
    // RESULTADO FINAL
    // ----------------------------------------------

    const identificacao = {

      scientific_name:
        resultado.scientific_name ||
        null,

      common_name:
        resultado.common_name ||
        null,

      confidence:
        resultado.confidence ??
        null,

      location_name:
        resultado.location_name ||
        null,

      latitude:
        resultado.latitude ??
        coordenadas?.lat ??
        null,

      longitude:
        resultado.longitude ??
        coordenadas?.lon ??
        null
    };


    console.log(
      "ARKA: identificação final:",
      identificacao
    );


    return identificacao;

  } catch (erro) {

    console.error(
      "ARKA: erro na identificação:",
      erro
    );

    throw erro;
  }
}


// ------------------------------------------------------
// ENVIAR IMAGEM PARA O SUPABASE STORAGE
// ------------------------------------------------------

async function enviarImagem(file) {

  if (!file) {

    throw new Error(
      "Nenhuma imagem foi selecionada."
    );
  }


  // ----------------------------------------------
  // NOME SEGURO
  // ----------------------------------------------

  const nomeOriginal =
    file.name || "imagem.jpg";

  const nomeSeguro =
    nomeOriginal.replace(
      /[^\w.-]/g,
      "_"
    );


  // ----------------------------------------------
  // CAMINHO DO ARQUIVO
  // ----------------------------------------------

  const caminho =
    `observacoes/${Date.now()}-${nomeSeguro}`;


  console.log(
    "ARKA: enviando imagem para Storage:",
    caminho
  );


  // ----------------------------------------------
  // UPLOAD
  // ----------------------------------------------

  const {
    data,
    error
  } = await supabaseARKA
    .storage
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
    "ARKA: imagem enviada:",
    data
  );


  // ----------------------------------------------
  // URL PÚBLICA
  // ----------------------------------------------

  const {
    data: urlData
  } =
    supabaseARKA
      .storage
      .from("animal - image")
      .getPublicUrl(
        caminho
      );


  if (
    !urlData ||
    !urlData.publicUrl
  ) {

    throw new Error(
      "Não foi possível obter a URL pública da imagem."
    );
  }


  console.log(
    "ARKA: URL da imagem:",
    urlData.publicUrl
  );


  return urlData.publicUrl;
}


// ------------------------------------------------------
// REGISTRAR OBSERVAÇÃO
// ------------------------------------------------------

async function registrarObservacao() {

  try {

    // ----------------------------------------------
    // VERIFICAR IMAGEM
    // ----------------------------------------------

    if (!imagemSelecionada) {

      alert(
        "Escolha uma imagem primeiro."
      );

      return;
    }


    // ----------------------------------------------
    // DESABILITAR BOTÃO
    // ----------------------------------------------

    if (btnRegistrar) {

      btnRegistrar.disabled = true;

      btnRegistrar.textContent =
        "Obtendo localização...";
    }


    // ----------------------------------------------
    // GPS
    // ----------------------------------------------

    localizacao =
      await obterLocalizacao();


    console.log(
      "ARKA: localização:",
      localizacao
    );


    // ----------------------------------------------
    // IDENTIFICAÇÃO
    // ----------------------------------------------

    if (btnRegistrar) {

      btnRegistrar.textContent =
        "Identificando espécie...";
    }


    identificacaoAtual =
      await identificarEspecie(
        imagemSelecionada,
        localizacao
      );


    console.log(
      "ARKA: resultado da identificação:",
      identificacaoAtual
    );


    // ----------------------------------------------
    // COLOCAR NOME CIENTÍFICO NO CAMPO
    // ----------------------------------------------

    if (
      especie &&
      identificacaoAtual?.scientific_name
    ) {

      especie.value =
        identificacaoAtual.scientific_name;
    }


    // ----------------------------------------------
    // MOSTRAR RESULTADO NO CONSOLE
    // ----------------------------------------------

    console.log(
      "--------------------------------"
    );

    console.log(
      "ARKA GENESIS - IDENTIFICAÇÃO"
    );

    console.log(
      "Nome científico:",
      identificacaoAtual?.scientific_name
    );

    console.log(
      "Nome comum:",
      identificacaoAtual?.common_name
    );

    console.log(
      "Confiança:",
      identificacaoAtual?.confidence
    );

    console.log(
      "Localização:",
      identificacaoAtual?.location_name
    );

    console.log(
      "Latitude:",
      identificacaoAtual?.latitude
    );

    console.log(
      "Longitude:",
      identificacaoAtual?.longitude
    );

    console.log(
      "--------------------------------"
    );


    // ----------------------------------------------
    // UPLOAD DA IMAGEM
    // ----------------------------------------------

    if (btnRegistrar) {

      btnRegistrar.textContent =
        "Enviando imagem...";
    }


    const imagemUrl =
      await enviarImagem(
        imagemSelecionada
      );


    // ----------------------------------------------
    // PREPARAR DADOS
    // ----------------------------------------------

    if (btnRegistrar) {

      btnRegistrar.textContent =
        "Salvando observação...";
    }


    const dadosObservacao = {

      // Nome científico
      species:
        identificacaoAtual?.scientific_name ||
        especie?.value ||
        "Não identificado",


      // Nome comum
      common_name:
        identificacaoAtual?.common_name ||
        null,


      // Confiança da IA
      confidence:
        identificacaoAtual?.confidence ??
        null,


      // Imagem
      image_url:
        imagemUrl,


      // GPS
      latitude:
        identificacaoAtual?.latitude ??
        localizacao?.lat ??
        null,


      longitude:
        identificacaoAtual?.longitude ??
        localizacao?.lon ??
        null,


      // Nome da localização
      location_name:
        identificacaoAtual?.location_name ||
        null,


      // Observações do usuário
      notes:
        observacao?.value?.trim() ||
        null
    };


    console.log(
      "ARKA: dados que serão salvos:",
      dadosObservacao
    );


    // ----------------------------------------------
    // SALVAR NO SUPABASE
    // ----------------------------------------------

    const {
      data,
      error
    } = await supabaseARKA
      .from("observations")
      .insert(
        dadosObservacao
      )
      .select();


    if (error) {

      console.error(
        "ARKA: erro ao salvar observação:",
        error
      );

      throw error;
    }


    console.log(
      "ARKA: observação salva:",
      data
    );


    // ----------------------------------------------
    // SUCESSO
    // ----------------------------------------------

    let mensagemSucesso =
      "Observação registrada com sucesso!";


    if (
      identificacaoAtual?.scientific_name
    ) {

      mensagemSucesso +=
        "\n\nEspécie: " +
        identificacaoAtual.scientific_name;
    }


    if (
      identificacaoAtual?.common_name
    ) {

      mensagemSucesso +=
        "\nNome comum: " +
        identificacaoAtual.common_name;
    }


    if (
      identificacaoAtual?.confidence !== null &&
      identificacaoAtual?.confidence !== undefined
    ) {

      const porcentagem =
        Math.round(
          Number(
            identificacaoAtual.confidence
          ) * 100
        );

      mensagemSucesso +=
        "\nConfiança: " +
        porcentagem +
        "%";
    }


    if (
      identificacaoAtual?.location_name
    ) {

      mensagemSucesso +=
        "\nLocalização: " +
        identificacaoAtual.location_name;
    }


    alert(
      mensagemSucesso
    );


    // ----------------------------------------------
    // LIMPAR FORMULÁRIO
    // ----------------------------------------------

    imagemSelecionada =
      null;

    localizacao =
      null;

    identificacaoAtual =
      null;


    if (preview) {

      preview.src = "";

      preview.style.display =
        "none";
    }


    if (especie) {

      especie.value =
        "";
    }


    if (observacao) {

      observacao.value =
        "";
    }


    if (camera) {

      camera.value =
        "";
    }


    if (gallery) {

      gallery.value =
        "";
    }


  } catch (erro) {

    // ----------------------------------------------
    // ERRO
    // ----------------------------------------------

    console.error(
      "ARKA: ERRO REAL:",
      erro
    );


    let mensagem =
      "Erro ao registrar observação.";


    if (erro?.message) {

      mensagem +=
        "\n\n" +
        erro.message;
    }


    alert(
      mensagem
    );


  } finally {

    // ----------------------------------------------
    // RESTAURAR BOTÃO
    // ----------------------------------------------

    if (btnRegistrar) {

      btnRegistrar.disabled =
        false;

      btnRegistrar.textContent =
        "Salvar observação";
    }
  }
}


// ------------------------------------------------------
// BOTÃO REGISTRAR
// ------------------------------------------------------

btnRegistrar?.addEventListener(
  "click",
  registrarObservacao
);


// ------------------------------------------------------
// INICIALIZAÇÃO
// ------------------------------------------------------

console.log(
  "================================"
);

console.log(
  "ARKA Genesis"
);

console.log(
  "Sistema de observações carregado."
);

console.log(
  "Supabase:",
  SUPABASE_URL
);

console.log(
  "================================"
);
