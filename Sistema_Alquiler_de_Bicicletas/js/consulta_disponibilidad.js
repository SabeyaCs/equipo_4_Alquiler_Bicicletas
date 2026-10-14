/* RentaBici - Consulta Disponibilidad (los 3 roles, RU-02) */

document.addEventListener("DOMContentLoaded", () => {
  const usuario = servicioSesion.exigirRol([ROLES.USUARIO, ROLES.TECNICO, ROLES.ADMINISTRADOR]);
  if (!usuario) return; // fue redirigido

  repositorioEstaciones.asegurarEstacionesBase();
  repositorioBicicletas.asegurarBicicletasBase();

  // El ícono de persona vuelve al menú que corresponde al rol
  document.getElementById("volver").href = servicioSesion.rutaMenu(usuario.idRol);

  const cuerpo = document.getElementById("cuerpo-tabla");
  const estaciones = repositorioEstaciones.listar();
  const bicicletas = repositorioBicicletas.listar();

  const clave = (modelo) => modelo.trim().toLowerCase();
  const modelos = new Map();
  bicicletas.forEach((bicicleta) => {
    if (!modelos.has(clave(bicicleta.modelo))) modelos.set(clave(bicicleta.modelo), bicicleta.modelo.trim());
  });

  function crearCelda(texto) {
    const celda = document.createElement("td");
    celda.textContent = texto;
    return celda;
  }

  modelos.forEach((nombreModelo, claveModelo) => {
    estaciones.forEach((estacion) => {
      const disponibles = bicicletas.filter(
        (bicicleta) =>
          clave(bicicleta.modelo) === claveModelo &&
          bicicleta.idEstacionActual === estacion.idEstacion &&
          bicicleta.estado === ESTADOS_BICICLETA.DISPONIBLE
      ).length;

      const fila = document.createElement("tr");
      fila.appendChild(crearCelda(estacion.nombre));
      fila.appendChild(crearCelda(nombreModelo));
      fila.appendChild(crearCelda(disponibles));
      cuerpo.appendChild(fila);
    });
  });

  // Fila de relleno: prolonga el color de las columnas, como en el diseño
  const relleno = document.createElement("tr");
  relleno.className = "relleno";
  relleno.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 3; i++) relleno.appendChild(document.createElement("td"));
  cuerpo.appendChild(relleno);
});
