/* RentaBici - Reporte de fallas (los 3 roles, RU-05 / RF-08) */

document.addEventListener("DOMContentLoaded", () => {
  const usuario = servicioSesion.exigirRol([ROLES.USUARIO, ROLES.TECNICO, ROLES.ADMINISTRADOR]);
  if (!usuario) return; // fue redirigido

  repositorioEstaciones.asegurarEstacionesBase();
  repositorioBicicletas.asegurarBicicletasBase();

  const rutaMenu = servicioSesion.rutaMenu(usuario.idRol);
  document.getElementById("volver").href = rutaMenu;

  const formulario = document.getElementById("formulario-falla");
  const mensaje = document.getElementById("mensaje");
  const botonConfirmar = document.getElementById("confirmar");

  function mostrarMensaje(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.className = "mensaje mensaje--" + tipo;
  }

  const normalizar = (texto) =>
    texto.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ");

  function buscarEstacion(texto) {
    const buscado = normalizar(texto);
    return repositorioEstaciones.listar().find(
      (e) => normalizar(e.nombre) === buscado || String(e.idEstacion) === buscado
    );
  }

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    mostrarMensaje("", "ok");

    const textoId = formulario["id-bicicleta"].value.trim();
    const textoEstacion = formulario.estacion.value;
    const gravedad = formulario.falla.value;

    if (!/^\d+$/.test(textoId)) {
      mostrarMensaje("Escribe el id de la bicicleta con números (por ejemplo 0001).", "error");
      return;
    }
    const bicicleta = repositorioBicicletas.listar().find((b) => b.idBicicleta === Number(textoId));
    if (!bicicleta) {
      mostrarMensaje("No existe una bicicleta con ese id.", "error");
      return;
    }

    const estacion = buscarEstacion(textoEstacion);
    if (!estacion) {
      mostrarMensaje("No encontré esa estación. Escribe su nombre, por ejemplo Estación 1.", "error");
      return;
    }

    if (!GRAVEDADES_FALLA.includes(gravedad)) {
      mostrarMensaje("Elige la gravedad de la falla.", "error");
      return;
    }

    repositorioIncidencias.crearReporte({
      idBicicleta: bicicleta.idBicicleta,
      idUsuarioReporta: usuario.idUsuario,
      idEstacion: estacion.idEstacion,
      descripcionFalla: gravedad,
    });

    botonConfirmar.disabled = true;
    mostrarAviso(
      "Falla reportada",
      "La bicicleta " + String(bicicleta.idBicicleta).padStart(4, "0") +
        " pasó a Reparación y un técnico la revisará. Gracias por avisar.",
      () => (window.location.href = rutaMenu)
    );
  });
});
