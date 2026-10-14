/* RentaBici - Gestión de roles y permisos (solo Administrador) */

document.addEventListener("DOMContentLoaded", () => {
  const sesion = servicioSesion.exigirRol(ROLES.ADMINISTRADOR);
  if (!sesion) return; // fue redirigido

  repositorioRoles.asegurarRolesBase();

  const cuerpo = document.getElementById("cuerpo-tabla");
  const botonGuardar = document.getElementById("guardar");
  const enlaceVolver = document.getElementById("volver");

  const rolesGuardados = new Map();

  function nombreCompleto(usuario) {
    return (usuario.nombre + " " + (usuario.apellidos || "")).trim();
  }

  function crearCelda(texto) {
    const celda = document.createElement("td");
    celda.textContent = texto;
    return celda;
  }

  // Celda con el selector de rol (clic sobre el rol para cambiarlo)
  function crearCeldaRol(usuario, fila) {
    const celda = document.createElement("td");
    const selector = document.createElement("select");
    selector.className = "selector-rol";
    selector.dataset.idUsuario = usuario.idUsuario;
    selector.setAttribute("aria-label", "Rol de " + nombreCompleto(usuario));

    repositorioRoles.listar().forEach((rol) => {
      const opcion = document.createElement("option");
      opcion.value = rol.idRol;
      opcion.textContent = rol.nombreRol;
      selector.appendChild(opcion);
    });
    selector.value = usuario.idRol;

    if (usuario.idUsuario === sesion.idUsuario) {
      selector.disabled = true;
      selector.title = "No puedes cambiar tu propio rol";
    }

    selector.addEventListener("change", () => {
      const cambio = Number(selector.value) !== rolesGuardados.get(usuario.idUsuario);
      fila.classList.toggle("fila--cambiada", cambio);
    });

    celda.appendChild(selector);
    return celda;
  }

  // Dibuja la tabla leyendo SIEMPRE lo que hay guardado
  function pintarTabla() {
    cuerpo.replaceChildren();
    rolesGuardados.clear();

    repositorioUsuarios.listar().forEach((usuario) => {
      rolesGuardados.set(usuario.idUsuario, usuario.idRol);

      const fila = document.createElement("tr");
      fila.appendChild(crearCelda(nombreCompleto(usuario)));
      fila.appendChild(crearCelda(usuario.email));
      fila.appendChild(crearCeldaRol(usuario, fila));
      cuerpo.appendChild(fila);
    });

    // Fila de relleno: prolonga el color de las columnas, como en el diseño
    const relleno = document.createElement("tr");
    relleno.className = "relleno";
    relleno.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 3; i++) relleno.appendChild(document.createElement("td"));
    cuerpo.appendChild(relleno);
  }

  function cambiosPendientes() {
    const cambios = [];
    cuerpo.querySelectorAll(".selector-rol").forEach((selector) => {
      const idUsuario = Number(selector.dataset.idUsuario);
      const idRol = Number(selector.value);
      if (idRol !== rolesGuardados.get(idUsuario)) {
        cambios.push({ idUsuario, idRol });
      }
    });
    return cambios;
  }

  // Botón de guardar (arriba a la derecha): guarda y se queda en la página
  botonGuardar.addEventListener("click", () => {
    const cambios = cambiosPendientes();

    if (cambios.length === 0) {
      mostrarAviso("Sin cambios", "No hay cambios de rol por guardar.");
      return;
    }

    cambios.forEach((cambio) => repositorioUsuarios.cambiarRol(cambio.idUsuario, cambio.idRol));
    pintarTabla(); // muestra lo que quedó guardado
    mostrarAviso(
      "Cambios guardados",
      cambios.length === 1 ? "Se actualizó el rol de 1 usuario." : "Se actualizó el rol de " + cambios.length + " usuarios."
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
