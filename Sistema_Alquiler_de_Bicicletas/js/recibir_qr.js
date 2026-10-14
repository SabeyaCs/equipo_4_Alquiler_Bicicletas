/* RentaBici - Recibir Bicicleta (los 3 roles, RF-06) */

document.addEventListener("DOMContentLoaded", () => {
  const usuario = servicioSesion.exigirRol([ROLES.USUARIO, ROLES.TECNICO, ROLES.ADMINISTRADOR]);
  if (!usuario) return; // fue redirigido

  // Solo tiene sentido con una reserva que todavía espera en la estación
  const reserva = repositorioReservas.buscarActivaDeUsuario(usuario.idUsuario);
  if (!reserva) {
    window.location.href = "reservas.html";
    return;
  }

  document.getElementById("recibida").addEventListener("click", () => {
    repositorioAlquileres.iniciarViaje(reserva);
    window.location.href = servicioSesion.rutaMenu(usuario.idRol);
  });
});
