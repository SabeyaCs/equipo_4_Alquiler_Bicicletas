/* RentaBici - Ventana emergente (pop-up) compartida */

function mostrarAviso(titulo, texto, alCerrar) {
  const ventana = document.createElement("dialog");
  ventana.className = "aviso";

  const encabezado = document.createElement("h2");
  encabezado.textContent = titulo;
  ventana.appendChild(encabezado);

  if (texto) {
    const parrafo = document.createElement("p");
    parrafo.textContent = texto;
    ventana.appendChild(parrafo);
  }

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "boton boton--auto";
  boton.textContent = "Aceptar";
  boton.addEventListener("click", () => ventana.close());
  ventana.appendChild(boton);

  ventana.addEventListener("close", () => {
    ventana.remove();
    if (alCerrar) alCerrar();
  });
  document.body.appendChild(ventana);
  ventana.showModal();
}

function mostrarConfirmacion(titulo, texto, textoAceptar, textoRechazar, alAceptar) {
  const ventana = document.createElement("dialog");
  ventana.className = "aviso";

  const encabezado = document.createElement("h2");
  encabezado.textContent = titulo;
  ventana.appendChild(encabezado);

  if (texto) {
    const parrafo = document.createElement("p");
    parrafo.textContent = texto;
    ventana.appendChild(parrafo);
  }

  const botones = document.createElement("div");
  botones.className = "aviso__botones";

  const rechazar = document.createElement("button");
  rechazar.type = "button";
  rechazar.className = "boton boton--auto";
  rechazar.textContent = textoRechazar;
  rechazar.addEventListener("click", () => ventana.close());

  const aceptar = document.createElement("button");
  aceptar.type = "button";
  aceptar.className = "boton boton--auto";
  aceptar.textContent = textoAceptar;
  aceptar.addEventListener("click", () => {
    ventana.close();
    alAceptar();
  });

  botones.appendChild(aceptar);
  botones.appendChild(rechazar);
  ventana.appendChild(botones);

  ventana.addEventListener("close", () => ventana.remove());
  document.body.appendChild(ventana);
  ventana.showModal();
}
