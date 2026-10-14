/* RentaBici - Pantalla de inicio de sesión */

document.addEventListener("DOMContentLoaded", async () => {
  const servicio = await crearServicioAutenticacion();

  const formulario = document.getElementById("formulario-login");
  const mensaje = document.getElementById("mensaje");

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mensaje.textContent = "";
    mensaje.className = "mensaje";

    try {
      const usuario = await servicio.iniciarSesion(
        formulario.identificador.value,
        formulario.contrasena.value
      );

      servicioSesion.iniciar(usuario);
      // Cada rol entra a su propia versión del menú principal
      window.location.href = servicioSesion.rutaMenu(usuario.idRol);
    } catch (error) {
      mensaje.textContent = error.message;
      mensaje.classList.add("mensaje--error");
    }
  });
});
