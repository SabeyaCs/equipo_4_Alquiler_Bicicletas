/* RentaBici - Control de estaciones (Técnico y Administrador) */

document.addEventListener("DOMContentLoaded", () => {
  const usuario = servicioSesion.exigirRol([ROLES.TECNICO, ROLES.ADMINISTRADOR]);
  if (!usuario) return; // fue redirigido

  repositorioEstaciones.asegurarEstacionesBase();

  const puedeAgregar = usuario.idRol === ROLES.ADMINISTRADOR;

  const cuerpo = document.getElementById("cuerpo-tabla");
  const botonCambiarEstado = document.getElementById("cambiar-estado");
  const enlaceVolver = document.getElementById("volver");

  const estadosGuardados = new Map();

  function crearCelda(texto) {
    const celda = document.createElement("td");
    celda.textContent = texto;
    return celda;
  }

  // Celda con el selector de estado (clic sobre el estado para cambiarlo)
  function crearCeldaEstado(estacion, fila) {
    const celda = document.createElement("td");
    const selector = document.createElement("select");
    selector.className = "selector-rol";
    selector.dataset.idEstacion = estacion.idEstacion;
    selector.setAttribute("aria-label", "Estado de " + estacion.nombre);

    Object.values(ESTADOS_ESTACION).forEach((estado) => {
      const opcion = document.createElement("option");
      opcion.value = estado;
      opcion.textContent = estado;
      selector.appendChild(opcion);
    });
    selector.value = estacion.estado;

    selector.addEventListener("change", () => {
      const cambio = selector.value !== estadosGuardados.get(estacion.idEstacion);
      fila.classList.toggle("fila--cambiada", cambio);
    });

    celda.appendChild(selector);
    return celda;
  }

  // Dibuja la tabla leyendo SIEMPRE lo que hay guardado
  function pintarTabla() {
    cuerpo.replaceChildren();
    estadosGuardados.clear();

    repositorioEstaciones.listar().forEach((estacion) => {
      estadosGuardados.set(estacion.idEstacion, estacion.estado);

      const fila = document.createElement("tr");
      fila.appendChild(crearCelda(estacion.nombre));
      fila.appendChild(crearCelda(estacion.direccion));
      fila.appendChild(crearCeldaEstado(estacion, fila));
      fila.appendChild(crearCelda(estacion.capacidadMaxima));
      cuerpo.appendChild(fila);
    });

    // Fila de relleno: prolonga el color de las columnas, como en el diseño
    const relleno = document.createElement("tr");
    relleno.className = "relleno";
    relleno.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 4; i++) relleno.appendChild(document.createElement("td"));
    cuerpo.appendChild(relleno);
  }

  // Lista de { idEstacion, estado } con los estados que se modificaron
  function cambiosPendientes() {
    const cambios = [];
    cuerpo.querySelectorAll(".selector-rol").forEach((selector) => {
      const idEstacion = Number(selector.dataset.idEstacion);
      if (selector.value !== estadosGuardados.get(idEstacion)) {
        cambios.push({ idEstacion, estado: selector.value });
      }
    });
    return cambios;
  }

  // Botón "Cambiar Estado": guarda los cambios y se queda en la página
  botonCambiarEstado.addEventListener("click", () => {
    const cambios = cambiosPendientes();

    if (cambios.length === 0) {
      mostrarAviso("Sin cambios", "No hay cambios de estado por guardar.");
      return;
    }

    cambios.forEach((cambio) => repositorioEstaciones.cambiarEstado(cambio.idEstacion, cambio.estado));
    pintarTabla(); // muestra lo que quedó guardado
    mostrarAviso(
      "Cambios guardados",
      cambios.length === 1 ? "Se actualizó el estado de 1 estación." : "Se actualizó el estado de " + cambios.length + " estaciones."
    );
  });

  enlaceVolver.addEventListener("click", (evento) => {
    if (cambiosPendientes().length > 0 && !confirm("Tienes cambios sin guardar. ¿Quieres salir sin guardarlos?")) {
      evento.preventDefault();
    }
  });

  // Botones cuya pantalla aún no existe (p. ej. "Agregar Estación")
  document.querySelectorAll('.boton[data-disponible="false"]').forEach((boton) => {
    boton.addEventListener("click", (evento) => {
      evento.preventDefault();
      mostrarAviso(boton.textContent, "Esta pantalla estará disponible próximamente.");
    });
  });

  // El Técnico no ve el botón de agregar estación
  if (!puedeAgregar) {
    document.getElementById("agregar-estacion").remove();
  }

  pintarTabla();
});
