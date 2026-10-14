/* RentaBici - Pantalla de registro */

document.addEventListener("DOMContentLoaded", async () => {
  const servicio = await crearServicioAutenticacion();

  const formulario = document.getElementById("formulario-registro");
  const mensaje = document.getElementById("mensaje");

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mensaje.textContent = "";
    mensaje.className = "mensaje";

    try {
      await servicio.registrar({
        nombre: formulario.nombre.value,
        apellidos: formulario.apellidos.value,
        email: formulario.email.value,
        documento: formulario.documento.value,
        contrasena: formulario.contrasena.value,
      });

      mensaje.textContent = "¡Cuenta creada! Redirigiendo...";
      mensaje.classList.add("mensaje--ok");
      setTimeout(() => (window.location.href = "login.html"), 1200);
    } catch (error) {
      mensaje.textContent = error.message;
      mensaje.classList.add("mensaje--error");
    }
  });
});
