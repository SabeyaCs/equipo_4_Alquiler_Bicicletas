/* RentaBici - Mapa Estaciones (con sesión, los 3 roles). */
document.addEventListener("DOMContentLoaded", () => {
  servicioSesion.exigirRol([ROLES.USUARIO, ROLES.TECNICO, ROLES.ADMINISTRADOR]);
});
