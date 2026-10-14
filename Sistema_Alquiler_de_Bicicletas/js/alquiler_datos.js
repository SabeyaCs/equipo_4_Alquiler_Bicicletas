/* RentaBici - Alquiler, paso 2: teléfono y tiempo */

document.addEventListener("DOMContentLoaded", () => {
  const usuario = servicioSesion.exigirRol([ROLES.USUARIO, ROLES.TECNICO, ROLES.ADMINISTRADOR]);
  if (!usuario) return; // fue redirigido

  repositorioEstaciones.asegurarEstacionesBase();
  repositorioBicicletas.asegurarBicicletasBase();
  repositorioReservas.expirarReserva();

  // Datos del paso anterior; sin ellos se vuelve a empezar
  let pendiente = null;
  try {
    pendiente = JSON.parse(sessionStorage.getItem("rentabici_alquiler_pendiente"));
  } catch (error) {
    pendiente = null;
  }
  if (!pendiente) {
    window.location.href = "alquiler.html";
    return;
  }

  const rutaMenu = servicioSesion.rutaMenu(usuario.idRol);
  const formulario = document.getElementById("formulario-datos");
  const selectorTiempo = document.getElementById("tiempo");
  const mensaje = document.getElementById("mensaje");
  const botonConfirmar = document.getElementById("confirmar");

  function mostrarMensaje(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.className = "mensaje mensaje--" + tipo;
  }

  function nombreTiempo(minutos) {
    if (minutos < 60) return minutos + " minutos";
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    return horas + (horas === 1 ? " hora" : " horas") + (resto ? " " + resto + " minutos" : "");
  }

  // Tiempos en lapsos de 30 minutos, hasta el límite permitido
  for (let minutos = TARIFAS.MINUTOS_LAPSO; minutos <= TARIFAS.LIMITE_MINUTOS; minutos += TARIFAS.MINUTOS_LAPSO) {
    const opcion = document.createElement("option");
    opcion.value = minutos;
    opcion.textContent = nombreTiempo(minutos);
    selectorTiempo.appendChild(opcion);
  }

  selectorTiempo.addEventListener("change", () => {
    mostrarMensaje("Costo estimado: " + formatearPesos(calcularCosto(Number(selectorTiempo.value))), "ok");
  });

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    mostrarMensaje("", "ok");

    const telefono = formulario.telefono.value.replace(/\s+/g, "");
    const minutos = Number(selectorTiempo.value);

    if (!/^\d{7,10}$/.test(telefono)) {
      mostrarMensaje("El teléfono debe tener entre 7 y 10 números.", "error");
      return;
    }
    if (!minutos) {
      mostrarMensaje("Elige el tiempo de uso.", "error");
      return;
    }

    // RN-04: con saldo pendiente no se puede alquilar
    if (repositorioPagos.pendientesDeUsuario(usuario.idUsuario).length) {
      mostrarMensaje("Tienes un pago pendiente. Págalo en \"Pagos y multas\" para alquilar.", "error");
      return;
    }

    // RN-01: una sola bicicleta reservada o alquilada a la vez
    if (repositorioAlquileres.tieneBicicletaActiva(usuario.idUsuario)) {
      mostrarMensaje("Ya tienes una reserva activa. Solo puedes tener una bicicleta a la vez.", "error");
      return;
    }

    const bicicleta = repositorioBicicletas.listar().find(
      (b) =>
        b.estado === ESTADOS_BICICLETA.DISPONIBLE &&
        b.idEstacionActual === pendiente.idEstacion &&
        b.modelo.trim().toLowerCase() === pendiente.claveModelo
    );
    if (!bicicleta) {
      mostrarMensaje("Ya no hay bicicletas de ese tipo en la estación. Vuelve y elige otra opción.", "error");
      return;
    }

    const estacion = repositorioEstaciones.listar().find((e) => e.idEstacion === pendiente.idEstacion);
    const costo = calcularCosto(minutos);

    repositorioReservas.agregar({
      idUsuario: usuario.idUsuario,
      idBicicleta: bicicleta.idBicicleta,
      idEstacion: pendiente.idEstacion,
      modelo: bicicleta.modelo,
      fechaUso: pendiente.fecha,
      telefono,
      tiempoMinutos: minutos,
      costoEstimado: costo,
    });
    sessionStorage.removeItem("rentabici_alquiler_pendiente");

    botonConfirmar.disabled = true;
    mostrarAviso(
      "¡Reserva creada!",
      "Bicicleta " + String(bicicleta.idBicicleta).padStart(4, "0") + " (" + bicicleta.modelo + ") en " +
        estacion.nombre + " para el " + pendiente.fecha + ", por " + nombreTiempo(minutos) +
        ". Costo estimado: " + formatearPesos(costo) + ". Se libera si no inicias el viaje en " +
        TARIFAS.MINUTOS_RESERVA + " minutos. El pago se hace en \"Pagos y multas\".",
      () => (window.location.href = rutaMenu)
    );
  });
});
