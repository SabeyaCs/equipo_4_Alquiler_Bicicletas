/* RentaBici - Alquiler de bicicletas (los 3 roles, RU-03 / RF-05) */

document.addEventListener("DOMContentLoaded", () => {
  const usuario = servicioSesion.exigirRol([ROLES.USUARIO, ROLES.TECNICO, ROLES.ADMINISTRADOR]);
  if (!usuario) return; // fue redirigido

  repositorioEstaciones.asegurarEstacionesBase();
  repositorioBicicletas.asegurarBicicletasBase();
  repositorioReservas.expirarReserva();

  const rutaMenu = servicioSesion.rutaMenu(usuario.idRol);
  document.getElementById("volver").href = rutaMenu;

  const formulario = document.getElementById("formulario-alquiler");
  const selectorEstacion = document.getElementById("estacion");
  const selectorTipo = document.getElementById("tipo");
  const mensaje = document.getElementById("mensaje");

  function mostrarMensaje(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.className = "mensaje mensaje--" + tipo;
  }

  const disponibles = () =>
    repositorioBicicletas.listar().filter((b) => b.estado === ESTADOS_BICICLETA.DISPONIBLE);

  // Solo estaciones abiertas con al menos una bicicleta disponible
  repositorioEstaciones
    .listar()
    .filter((e) => e.estado === ESTADOS_ESTACION.ABIERTA)
    .filter((e) => disponibles().some((b) => b.idEstacionActual === e.idEstacion))
    .forEach((estacion) => {
      const opcion = document.createElement("option");
      opcion.value = estacion.idEstacion;
      opcion.textContent = estacion.nombre;
      selectorEstacion.appendChild(opcion);
    });

  // Sin estaciones abiertas con bicicletas, el formulario no se puede usar
  if (selectorEstacion.options.length === 1) {
    mostrarMensaje("No hay bicicletas disponibles en estaciones abiertas por ahora.", "error");
    document.getElementById("continuar").disabled = true;
  }

  selectorEstacion.addEventListener("change", () => {
    const idEstacion = Number(selectorEstacion.value);
    selectorTipo.innerHTML = '<option value="" disabled selected></option>';
    const modelos = new Map();
    disponibles()
      .filter((b) => b.idEstacionActual === idEstacion)
      .forEach((b) => modelos.set(b.modelo.trim().toLowerCase(), b.modelo.trim()));
    modelos.forEach((nombre, clave) => {
      const opcion = document.createElement("option");
      opcion.value = clave;
      opcion.textContent = nombre;
      selectorTipo.appendChild(opcion);
    });
  });

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    mostrarMensaje("", "ok");

    const idEstacion = Number(selectorEstacion.value);
    const claveModelo = selectorTipo.value;
    const dia = Number(formulario.dia.value);
    const mes = Number(formulario.mes.value);
    const anio = Number(formulario.anio.value);

    if (!idEstacion || !claveModelo || !dia || !mes || !anio) {
      mostrarMensaje("Elige la estación, el tipo de bicicleta y la fecha completa.", "error");
      return;
    }

    // Fecha real (rechaza 31/02) y no anterior a hoy
    const fecha = new Date(anio, mes - 1, dia);
    if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) {
      mostrarMensaje("La fecha no existe. Revisa el día, el mes y el año.", "error");
      return;
    }
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fecha < hoy) {
      mostrarMensaje("La fecha no puede ser anterior a hoy.", "error");
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

    const bicicleta = disponibles().find(
      (b) => b.idEstacionActual === idEstacion && b.modelo.trim().toLowerCase() === claveModelo
    );
    if (!bicicleta) {
      mostrarMensaje("Ya no hay bicicletas de ese tipo en la estación. Elige otra opción.", "error");
      return;
    }

    const textoFecha = String(dia).padStart(2, "0") + "/" + String(mes).padStart(2, "0") + "/" + anio;

    try {
      sessionStorage.setItem("rentabici_alquiler_pendiente", JSON.stringify({ idEstacion, claveModelo, fecha: textoFecha }));
    } catch (error) {
      mostrarMensaje("No se pudo continuar. Intenta de nuevo.", "error");
      return;
    }
    window.location.href = "alquiler_datos.html";
  });
});
