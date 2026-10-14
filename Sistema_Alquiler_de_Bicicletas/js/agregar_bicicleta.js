/* RentaBici - Agregar bicicleta (Técnico y Administrador, RF-04) */

document.addEventListener("DOMContentLoaded", () => {
  const usuario = servicioSesion.exigirRol([ROLES.TECNICO, ROLES.ADMINISTRADOR]);
  if (!usuario) return; // fue redirigido

  repositorioEstaciones.asegurarEstacionesBase();
  repositorioBicicletas.asegurarBicicletasBase();

  const formulario = document.getElementById("formulario-bicicleta");
  const selectorEstacion = document.getElementById("estacion");
  const mensaje = document.getElementById("mensaje");
  const botonConfirmar = document.getElementById("confirmar");

  // Lista de estaciones registradas para elegir la ubicación
  repositorioEstaciones.listar().forEach((estacion) => {
    const opcion = document.createElement("option");
    opcion.value = estacion.idEstacion;
    opcion.textContent = estacion.nombre;
    selectorEstacion.appendChild(opcion);
  });

  function mostrarMensaje(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.className = "mensaje mensaje--" + tipo;
  }

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    mostrarMensaje("", "ok");

    const modelo = formulario.modelo.value.trim();
    const idEstacion = Number(selectorEstacion.value);
    const estacion = repositorioEstaciones.listar().find((e) => e.idEstacion === idEstacion);

    if (!modelo || !estacion) {
      mostrarMensaje("Escribe el modelo y elige una estación.", "error");
      return;
    }

    // No caben más bicicletas que la capacidad de la estación
    if (repositorioBicicletas.contarEnEstacion(idEstacion) >= estacion.capacidadMaxima) {
      mostrarMensaje(estacion.nombre + " ya alcanzó su capacidad máxima (" + estacion.capacidadMaxima + ").", "error");
      return;
    }

    const bicicleta = repositorioBicicletas.agregar({ modelo, idEstacionActual: idEstacion });

    botonConfirmar.disabled = true;
    mostrarMensaje(
      "¡Bicicleta " + String(bicicleta.idBicicleta).padStart(4, "0") + " agregada! Volviendo a Control de bicicletas...",
      "ok"
    );
    setTimeout(() => (window.location.href = "gestion_bicicletas.html"), 1200);
  });
});
