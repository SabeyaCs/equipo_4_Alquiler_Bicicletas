/* RentaBici - Control de flota y estaciones (Técnico y Administrador) */

document.addEventListener("DOMContentLoaded", () => {
  const usuario = servicioSesion.exigirRol([ROLES.TECNICO, ROLES.ADMINISTRADOR]);
  if (!usuario) return; // fue redirigido

  // El ícono de persona vuelve al menú que corresponde al rol
  document.getElementById("volver").href = servicioSesion.rutaMenu(usuario.idRol);

  document.querySelectorAll('.boton[data-disponible="false"]').forEach((boton) => {
    boton.addEventListener("click", (evento) => {
      evento.preventDefault();
      mostrarAviso(boton.textContent, "Esta pantalla estará disponible próximamente.");
    });
  });
});
