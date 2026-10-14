/* RentaBici - Fallas Reportadas (Técnico y Administrador, RF-09) */

const SOLUCIONADO = "Solucionado";

document.addEventListener("DOMContentLoaded", () => {
  const usuario = servicioSesion.exigirRol([ROLES.TECNICO, ROLES.ADMINISTRADOR]);
  if (!usuario) return; // fue redirigido

  repositorioEstaciones.asegurarEstacionesBase();
  repositorioBicicletas.asegurarBicicletasBase();

  const cuerpo = document.getElementById("cuerpo-tabla");
  const mensaje = document.getElementById("mensaje");
  const botonGuardar = document.getElementById("guardar");
  const enlaceVolver = document.getElementById("volver");
  enlaceVolver.href = servicioSesion.rutaMenu(usuario.idRol);

  const idBicicleta = (incidencia) => String(incidencia.idBicicleta).padStart(4, "0");

  function crearCelda(texto) {
    const celda = document.createElement("td");
    celda.textContent = texto;
    return celda;
  }

  function crearCeldaFalla(incidencia, fila) {
    const celda = document.createElement("td");
    const selector = document.createElement("select");
    selector.className = "selector-rol";
    selector.dataset.idIncidencia = incidencia.idIncidencia;
    selector.setAttribute("aria-label", "Falla de la bicicleta " + idBicicleta(incidencia));

    const gravedad = incidencia.descripcionFalla || "Falla";
    [gravedad, SOLUCIONADO].forEach((texto) => {
      const opcion = document.createElement("option");
      opcion.value = texto;
      opcion.textContent = texto;
      selector.appendChild(opcion);
    });

    selector.addEventListener("change", () => {
      fila.classList.toggle("fila--cambiada", selector.value === SOLUCIONADO);
      mensaje.textContent = "";
    });

    celda.appendChild(selector);
    return celda;
  }

  // Dibuja la tabla leyendo SIEMPRE lo que hay guardado
  function pintarTabla() {
    cuerpo.replaceChildren();
    const estaciones = repositorioEstaciones.listar();
    const pendientes = repositorioIncidencias.pendientes();

    pendientes.forEach((incidencia) => {
      const estacion = estaciones.find((e) => e.idEstacion === incidencia.idEstacion);
      const fila = document.createElement("tr");
      fila.appendChild(crearCelda(idBicicleta(incidencia)));
      fila.appendChild(crearCelda(estacion ? estacion.nombre : "-"));
      fila.appendChild(crearCeldaFalla(incidencia, fila));
      cuerpo.appendChild(fila);
    });

    for (let i = pendientes.length; i < 6; i++) {
      const relleno = document.createElement("tr");
      relleno.className = "relleno";
      relleno.setAttribute("aria-hidden", "true");
      for (let c = 0; c < 3; c++) relleno.appendChild(document.createElement("td"));
      cuerpo.appendChild(relleno);
    }

    mensaje.className = "mensaje mensaje--centrado";
    mensaje.textContent = pendientes.length ? "" : "No hay fallas pendientes.";
  }

  function cambiosPendientes() {
    return Array.from(cuerpo.querySelectorAll(".selector-rol"))
      .filter((selector) => selector.value === SOLUCIONADO)
      .map((selector) => Number(selector.dataset.idIncidencia));
  }

  botonGuardar.addEventListener("click", () => {
    const cambios = cambiosPendientes();

    if (cambios.length === 0) {
      mostrarAviso("Sin cambios", "No hay fallas marcadas como solucionadas.");
      return;
    }

    let habilitadas = 0;
    cambios.forEach((idIncidencia) => {
      const resultado = repositorioIncidencias.marcarAtendida(idIncidencia, usuario.idUsuario);
      if (resultado && resultado.habilitada) habilitadas++;
    });
    pintarTabla(); // muestra lo que quedó guardado

    mostrarAviso(
      "Cambios guardados",
      (cambios.length === 1 ? "Se solucionó 1 falla" : "Se solucionaron " + cambios.length + " fallas") +
        ". " + (habilitadas === 1 ? "1 bicicleta volvió" : habilitadas + " bicicletas volvieron") +
        " a estar disponible" + (habilitadas === 1 ? "." : "s.")
    );
  });

  // Ícono de persona (arriba a la izquierda): vuelve al menú
  enlaceVolver.addEventListener("click", (evento) => {
    if (cambiosPendientes().length > 0 && !confirm("Tienes cambios sin guardar. ¿Quieres salir sin guardarlos?")) {
      evento.preventDefault();
    }
  });

  pintarTabla();
});
