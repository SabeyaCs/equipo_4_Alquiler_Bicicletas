/* RentaBici - Administrar Reserva (los 3 roles, RU-03 / RU-04) */

document.addEventListener("DOMContentLoaded", () => {
  const usuario = servicioSesion.exigirRol([ROLES.USUARIO, ROLES.TECNICO, ROLES.ADMINISTRADOR]);
  if (!usuario) return; // fue redirigido

  repositorioEstaciones.asegurarEstacionesBase();
  repositorioBicicletas.asegurarBicicletasBase();

  const rutaMenu = servicioSesion.rutaMenu(usuario.idRol);
  document.getElementById("volver").href = rutaMenu;

  const campoId = document.getElementById("id-bicicleta");
  const campoEstado = document.getElementById("estado");
  const campoTiempo = document.getElementById("tiempo");
  const mensaje = document.getElementById("mensaje");
  const botones = {
    recibir: document.getElementById("recibir"),
    entregar: document.getElementById("entregar"),
    cancelar: document.getElementById("cancelar"),
  };

  function nombreTiempo(minutos) {
    if (minutos < 60) return minutos + " minutos";
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    return horas + (horas === 1 ? " hora" : " horas") + (resto ? " " + resto + " minutos" : "");
  }

  function pintar() {
    const idUsuario = usuario.idUsuario;
    const alquiler = repositorioAlquileres.buscarEnCursoDeUsuario(idUsuario);
    const reserva = alquiler ? null : repositorioReservas.buscarActivaDeUsuario(idUsuario);
    mensaje.textContent = "";
    mensaje.className = "mensaje";

    if (!alquiler && !reserva) {
      campoId.value = "";
      campoEstado.value = "";
      campoTiempo.value = "";
      Object.values(botones).forEach((boton) => (boton.disabled = true));
      mensaje.textContent = "No tienes una reserva vigente.";
      return;
    }

    const enUso = Boolean(alquiler);
    const vigente = alquiler || reserva;
    campoId.value = String(vigente.idBicicleta).padStart(4, "0");
    campoEstado.value = enUso ? "En uso" : "En estación";
    campoTiempo.value = nombreTiempo(vigente.tiempoMinutos);
    botones.recibir.disabled = enUso;   // ya se recibió
    botones.entregar.disabled = !enUso;
    botones.cancelar.disabled = enUso;
  }

  botones.recibir.addEventListener("click", () => {
    const reserva = repositorioReservas.buscarActivaDeUsuario(usuario.idUsuario);
    if (!reserva) return pintar();
    window.location.href = "recibir_qr.html";
  });

  botones.entregar.addEventListener("click", () => {
    const alquiler = repositorioAlquileres.buscarEnCursoDeUsuario(usuario.idUsuario);
    if (!alquiler) return pintar();

    // RN-03: no se puede devolver en una estación llena
    const estacion = repositorioEstaciones.listar().find((e) => e.idEstacion === alquiler.idEstacionOrigen);
    if (estacion && repositorioBicicletas.contarEnEstacion(estacion.idEstacion) >= estacion.capacidadMaxima) {
      mensaje.textContent = estacion.nombre + " está llena. No se puede entregar la bicicleta ahí.";
      mensaje.className = "mensaje mensaje--error";
      return;
    }

    const resultado = repositorioAlquileres.finalizarViaje(alquiler.idAlquiler);
    pintar();
    mostrarAviso(
      "Bicicleta entregada",
      "Gracias por usar RentaBici. Costo del viaje: " + formatearPesos(resultado.tarifaTotal) +
        ". Puedes pagarlo en \"Pagos y multas\".",
      () => (window.location.href = rutaMenu)
    );
  });

  botones.cancelar.addEventListener("click", () => {
    const reserva = repositorioReservas.buscarActivaDeUsuario(usuario.idUsuario);
    if (!reserva) return pintar();

    mostrarConfirmacion(
      "Cancelar reserva",
      "¿Seguro que quieres cancelar la reserva de la bicicleta " + String(reserva.idBicicleta).padStart(4, "0") + "?",
      "Sí, cancelar",
      "No",
      () => {
        repositorioReservas.cancelar(reserva.idReserva);
        pintar();
        mensaje.textContent = "Reserva cancelada.";
        mensaje.className = "mensaje mensaje--ok";
      }
    );
  });

  pintar();
});
