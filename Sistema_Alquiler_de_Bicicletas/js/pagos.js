/* RentaBici - Pagos y multas (los 3 roles, RU-08 / RF-10 / RF-11) */

document.addEventListener("DOMContentLoaded", () => {
  const usuario = servicioSesion.exigirRol([ROLES.USUARIO, ROLES.TECNICO, ROLES.ADMINISTRADOR]);
  if (!usuario) return; // fue redirigido

  document.getElementById("volver").href = servicioSesion.rutaMenu(usuario.idRol);

  const cuerpo = document.getElementById("cuerpo-tabla");
  const mensaje = document.getElementById("mensaje");
  const botonPagar = document.getElementById("pagar");

  function crearFila(tipo, cantidad) {
    const fila = document.createElement("tr");
    [tipo, cantidad].forEach((texto) => {
      const celda = document.createElement("td");
      celda.textContent = texto;
      fila.appendChild(celda);
    });
    return fila;
  }

  // Una fila "Alquiler" por viaje y una "Multa" cuando hubo demora
  const pendientes = repositorioPagos.pendientesDeUsuario(usuario.idUsuario);
  let filas = 0;
  let total = 0;
  pendientes.forEach((pago) => {
    cuerpo.appendChild(crearFila("Alquiler", formatearPesos(pago.montoAlquiler)));
    filas++;
    total += pago.montoAlquiler;
    if (pago.montoMulta > 0) {
      cuerpo.appendChild(crearFila("Multa", formatearPesos(pago.montoMulta)));
      filas++;
      total += pago.montoMulta;
    }
  });

  for (let i = filas; i < 5; i++) {
    const relleno = document.createElement("tr");
    relleno.className = "relleno";
    relleno.setAttribute("aria-hidden", "true");
    relleno.appendChild(document.createElement("td"));
    relleno.appendChild(document.createElement("td"));
    cuerpo.appendChild(relleno);
  }

  if (!pendientes.length) {
    mensaje.textContent = "No tienes pagos pendientes.";
    botonPagar.classList.add("boton--inactivo");
    botonPagar.setAttribute("aria-disabled", "true");
    botonPagar.addEventListener("click", (evento) => evento.preventDefault());
  } else {
    mensaje.textContent = "Total a pagar: " + formatearPesos(total);
  }
});
