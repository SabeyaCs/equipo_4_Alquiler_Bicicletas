/* RentaBici - Agregar estación (solo Administrador, RF-03) */

document.addEventListener("DOMContentLoaded", () => {
  const usuario = servicioSesion.exigirRol(ROLES.ADMINISTRADOR);
  if (!usuario) return; // fue redirigido

  repositorioEstaciones.asegurarEstacionesBase();

  const formulario = document.getElementById("formulario-estacion");
  const mensaje = document.getElementById("mensaje");
  const botonConfirmar = document.getElementById("confirmar");

  function mostrarMensaje(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.className = "mensaje mensaje--" + tipo;
  }

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    mostrarMensaje("", "ok");

    const nombre = formulario.nombre.value.trim();
    const ubicacion = formulario.ubicacion.value.trim();
    const capacidad = Number(formulario.cantidad.value);

    if (!Number.isInteger(capacidad) || capacidad < 1) {
      mostrarMensaje("La cantidad debe ser un número entero mayor que 0.", "error");
      return;
    }

    const repetida = repositorioEstaciones
      .listar()
      .some((estacion) => estacion.nombre.toLowerCase() === nombre.toLowerCase());
    if (repetida) {
      mostrarMensaje("Ya existe una estación con ese nombre.", "error");
      return;
    }

    // La estación nueva queda abierta (ver RepositorioEstaciones.agregar)
    repositorioEstaciones.agregar({ nombre, direccion: ubicacion, capacidadMaxima: capacidad });

    botonConfirmar.disabled = true;
    mostrarMensaje("¡Estación agregada! Volviendo a Control de estaciones...", "ok");
    setTimeout(() => (window.location.href = "gestion_estaciones.html"), 1200);
  });
});
