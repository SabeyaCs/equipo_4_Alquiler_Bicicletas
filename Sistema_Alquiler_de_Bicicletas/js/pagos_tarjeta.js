/* RentaBici - Pago con tarjeta (los 3 roles, RF-10) */

document.addEventListener("DOMContentLoaded", () => {
  const usuario = servicioSesion.exigirRol([ROLES.USUARIO, ROLES.TECNICO, ROLES.ADMINISTRADOR]);
  if (!usuario) return; // fue redirigido

  // Sin nada que pagar, se vuelve a Pagos y multas
  if (!repositorioPagos.pendientesDeUsuario(usuario.idUsuario).length) {
    window.location.href = "pagos.html";
    return;
  }

  const formulario = document.getElementById("formulario-pago");
  const campoVencimiento = document.getElementById("vencimiento");
  const mensaje = document.getElementById("mensaje");
  const botonConfirmar = document.getElementById("confirmar");

  function mostrarMensaje(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.className = "mensaje mensaje--" + tipo;
  }

  // La fecha se escribe MMAA y se muestra como MM/AA
  campoVencimiento.addEventListener("input", () => {
    const digitos = campoVencimiento.value.replace(/\D/g, "").slice(0, 4);
    campoVencimiento.value = digitos.length > 2 ? digitos.slice(0, 2) + "/" + digitos.slice(2) : digitos;
  });

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    mostrarMensaje("", "ok");

    const tarjeta = formulario.tarjeta.value.replace(/\s+/g, "");
    const digitosFecha = campoVencimiento.value.replace(/\D/g, "");
    const vencimiento = digitosFecha.length === 4 ? digitosFecha.slice(0, 2) + "/" + digitosFecha.slice(2) : "";
    const codigo = formulario.codigo.value;

    if (!/^\d{13,19}$/.test(tarjeta)) {
      mostrarMensaje("El número de tarjeta debe tener entre 13 y 19 números.", "error");
      return;
    }

    const partes = /^(\d{2})\/(\d{2})$/.exec(vencimiento);
    const mes = partes ? Number(partes[1]) : 0;
    if (!partes || mes < 1 || mes > 12) {
      mostrarMensaje("La fecha debe tener el formato MM/AA.", "error");
      return;
    }
    // La tarjeta vale hasta el último día de su mes de vencimiento
    const hoy = new Date();
    const ultimoDia = new Date(2000 + Number(partes[2]), mes, 0, 23, 59, 59);
    if (ultimoDia < hoy) {
      mostrarMensaje("La tarjeta está vencida.", "error");
      return;
    }

    if (!/^\d{3,4}$/.test(codigo)) {
      mostrarMensaje("El código debe tener 3 o 4 números.", "error");
      return;
    }

    const total = repositorioPagos.procesarPago(usuario.idUsuario, "Tarjeta");
    botonConfirmar.disabled = true;
    mostrarAviso(
      "¡Pago realizado!",
      "Se pagaron " + formatearPesos(total) + ". Gracias por usar RentaBici.",
      () => (window.location.href = servicioSesion.rutaMenu(usuario.idRol))
    );
  });
});
