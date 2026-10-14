/* RentaBici - Menús principales (los 3 roles usan este archivo) */

const TODOS = [ROLES.USUARIO, ROLES.TECNICO, ROLES.ADMINISTRADOR];

const OPCIONES_MENU = [
  { texto: "Alquiler de bicicleta",         href: "alquiler.html",            disponible: true , roles: TODOS },
  { texto: "Administrar Reservas",          href: "reservas.html",            disponible: true , roles: TODOS },
  { texto: "Consulta de Estaciones",        href: "consulta_disponibilidad.html", disponible: true, roles: TODOS },
  { texto: "Reporte de fallas",             href: "reporte_fallas.html",      disponible: true , roles: TODOS },
  { texto: "Pagos y multas",                href: "pagos.html",               disponible: true , roles: TODOS },
  { texto: "Fallas Reportadas",             href: "fallas_reportadas.html",   disponible: true , roles: [ROLES.TECNICO, ROLES.ADMINISTRADOR] },
  { texto: "Gestión de roles y permisos",   href: "gestion_roles.html",       disponible: true,  roles: [ROLES.ADMINISTRADOR] },
  { texto: "Control de flota y estaciones", href: "control_flota.html",       disponible: true, roles: [ROLES.TECNICO, ROLES.ADMINISTRADOR] },
];

/* Opciones del menú según el rol */
function pintarOpciones(idRol) {
  const contenedor = document.getElementById("menu-opciones");

  OPCIONES_MENU.filter((opcion) => opcion.roles.includes(idRol)).forEach((opcion) => {
    const enlace = document.createElement("a");
    enlace.className = "opcion";
    enlace.textContent = opcion.texto;

    if (opcion.disponible) {
      enlace.href = opcion.href;
    } else {
      enlace.href = "#";
      enlace.addEventListener("click", (evento) => {
        evento.preventDefault();
        mostrarAviso(opcion.texto, "Esta pantalla estará disponible próximamente.");
      });
    }

    contenedor.appendChild(enlace);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const rolRequerido = Number(document.body.dataset.rol);
  const usuario = servicioSesion.exigirRol(rolRequerido);
  if (!usuario) return; // fue redirigido

  pintarOpciones(usuario.idRol);

  // El ícono de persona cierra la sesión y vuelve a la página principal
  document.getElementById("cerrar-sesion").addEventListener("click", () => {
    servicioSesion.cerrar();
  });

  // Pop-up de bienvenida (solo justo después de iniciar sesión)
  if (servicioSesion.consumirBienvenida()) {
    const nombre = (usuario.nombre + " " + (usuario.apellidos || "")).trim();
    const rol = repositorioRoles.buscarPorId(usuario.idRol);
    mostrarAviso("¡Bienvenido, " + nombre + "!", rol ? "Has iniciado sesión como " + rol.nombreRol + "." : "");
  }
});
