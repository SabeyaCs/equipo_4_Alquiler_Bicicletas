/* RentaBici - Capa de datos (simula la base de datos) */

const CLAVES = {
  ROLES: "rentabici_roles",
  USUARIOS: "rentabici_usuarios",
  ESTACIONES: "rentabici_estaciones",
  BICICLETAS: "rentabici_bicicletas",
  RESERVAS: "rentabici_reservas",
  ALQUILERES: "rentabici_alquileres",
  PAGOS: "rentabici_pagos",
  INCIDENCIAS: "rentabici_incidencias",
  MANTENIMIENTOS: "rentabici_mantenimientos",
  VERSION: "rentabici_version",
};

// Estados posibles de una estación
const ESTADOS_ESTACION = {
  ABIERTA: "Abierta",
  CERRADA: "Cerrada",
};

const ESTADOS_BICICLETA = {
  DISPONIBLE: "Disponible",
  RESERVADA: "Reservada",
  ALQUILADA: "Alquilada",
  REPARACION: "Reparación",
};

// Estados de una reserva (clase Reserva, RF-05)
const ESTADOS_RESERVA = {
  ACTIVA: "Activa",         // reservada, la bicicleta espera en la estación
  EXPIRADA: "Expirada",     // pasaron 15 minutos sin iniciar el viaje (RN-02)
  CANCELADA: "Cancelada",
  COMPLETADA: "Completada", // se recibió la bicicleta y empezó el alquiler
};

// Estados de un pago (clase Pago, RF-10)
const ESTADOS_PAGO = {
  PENDIENTE: "Pendiente",
  PAGADO: "Pagado",
};

const TARIFAS = {
  PRECIO_LAPSO: 3000,        // COP por cada 30 minutos o fracción
  MINUTOS_LAPSO: 30,
  LIMITE_MINUTOS: 120,       // tiempo límite permitido (2 horas)
  RECARGO_MINUTO: 200,       // COP por cada minuto de demora
  MINUTOS_RESERVA: 15,       // la reserva expira a los 15 minutos (RN-02)
};

function desglosarCosto(minutos) {
  const lapsos = Math.max(1, Math.ceil(minutos / TARIFAS.MINUTOS_LAPSO));
  const demora = Math.max(0, minutos - TARIFAS.LIMITE_MINUTOS);
  return {
    alquiler: lapsos * TARIFAS.PRECIO_LAPSO,
    multa: Math.ceil(demora) * TARIFAS.RECARGO_MINUTO,
  };
}

function calcularCosto(minutos) {
  const { alquiler, multa } = desglosarCosto(minutos);
  return alquiler + multa;
}

function formatearPesos(valor) {
  return "$" + Number(valor).toLocaleString("es-CO");
}

// Identificadores de los roles (RF-02)
const ROLES = {
  ADMINISTRADOR: 1,
  TECNICO: 2,
  USUARIO: 3,
};

/* Acceso a localStorage */
class Almacenamiento {
  leer(clave, valorPorDefecto) {
    try {
      const texto = localStorage.getItem(clave);
      return texto ? JSON.parse(texto) : valorPorDefecto;
    } catch (e) {
      return valorPorDefecto;
    }
  }

  eliminar(clave) {
    try {
      localStorage.removeItem(clave);
    } catch (error) {
      /* sin almacenamiento disponible: no hay nada que borrar */
    }
  }

  escribir(clave, valor) {
    localStorage.setItem(clave, JSON.stringify(valor));
  }
}

/* Repositorio de roles (clase Rol del diagrama) */
class RepositorioRoles {
  constructor(almacenamiento) {
    this.almacenamiento = almacenamiento;
  }

  // Crea los tres roles la primera vez que se abre la aplicación
  asegurarRolesBase() {
    if (this.listar().length > 0) return;
    this.almacenamiento.escribir(CLAVES.ROLES, [
      { idRol: ROLES.ADMINISTRADOR, nombreRol: "Administrador", descripcion: "Gestiona estaciones, bicicletas y usuarios" },
      { idRol: ROLES.TECNICO, nombreRol: "Técnico", descripcion: "Atiende incidencias y mantenimiento" },
      { idRol: ROLES.USUARIO, nombreRol: "Usuario", descripcion: "Alquila bicicletas y reporta fallas" },
    ]);
  }

  listar() {
    return this.almacenamiento.leer(CLAVES.ROLES, []);
  }

  buscarPorId(idRol) {
    return this.listar().find((rol) => rol.idRol === idRol) || null;
  }
}

class RepositorioUsuarios {
  constructor(almacenamiento) {
    this.almacenamiento = almacenamiento;
  }

  listar() {
    return this.almacenamiento.leer(CLAVES.USUARIOS, []);
  }

  buscarPorEmail(email) {
    return this.listar().find((u) => u.email === email) || null;
  }

  buscarPorDocumento(documento) {
    return this.listar().find((u) => u.documento && u.documento === documento) || null;
  }

  agregar(datos) {
    const usuarios = this.listar();
    const idUsuario = usuarios.reduce((mayor, u) => Math.max(mayor, u.idUsuario), 0) + 1;
    const usuario = { idUsuario, ...datos };
    usuarios.push(usuario);
    this.almacenamiento.escribir(CLAVES.USUARIOS, usuarios);
    return usuario;
  }

  cambiarRol(idUsuario, idRol) {
    const usuarios = this.listar();
    const usuario = usuarios.find((u) => u.idUsuario === idUsuario);
    if (!usuario) return null;
    usuario.idRol = idRol;
    this.almacenamiento.escribir(CLAVES.USUARIOS, usuarios);
    return usuario;
  }
}

class RepositorioEstaciones {
  constructor(almacenamiento) {
    this.almacenamiento = almacenamiento;
  }

  // Las 4 estaciones del diseño, la primera vez que se abre la aplicación
  asegurarEstacionesBase() {
    if (this.listar().length > 0) return;
    this.almacenamiento.escribir(CLAVES.ESTACIONES, [
      { idEstacion: 1, nombre: "Estación 1", direccion: "Calle x1", estado: ESTADOS_ESTACION.ABIERTA, capacidadMaxima: 25 },
      { idEstacion: 2, nombre: "Estación 2", direccion: "Calle x2", estado: ESTADOS_ESTACION.ABIERTA, capacidadMaxima: 30 },
      { idEstacion: 3, nombre: "Estación 3", direccion: "Calle x3", estado: ESTADOS_ESTACION.ABIERTA, capacidadMaxima: 25 },
      { idEstacion: 4, nombre: "Estación 4", direccion: "Calle x4", estado: ESTADOS_ESTACION.CERRADA, capacidadMaxima: 45 },
    ]);
  }

  listar() {
    return this.almacenamiento.leer(CLAVES.ESTACIONES, []);
  }

  // Las estaciones nuevas nacen abiertas
  agregar(datos) {
    const estaciones = this.listar();
    const idEstacion = estaciones.reduce((mayor, e) => Math.max(mayor, e.idEstacion), 0) + 1;
    const estacion = { idEstacion, estado: ESTADOS_ESTACION.ABIERTA, ...datos };
    estaciones.push(estacion);
    this.almacenamiento.escribir(CLAVES.ESTACIONES, estaciones);
    return estacion;
  }

  cambiarEstado(idEstacion, estado) {
    const estaciones = this.listar();
    const estacion = estaciones.find((e) => e.idEstacion === idEstacion);
    if (!estacion) return null;
    estacion.estado = estado;
    this.almacenamiento.escribir(CLAVES.ESTACIONES, estaciones);
    return estacion;
  }
}

class RepositorioBicicletas {
  constructor(almacenamiento) {
    this.almacenamiento = almacenamiento;
  }

  // Las 4 bicicletas del diseño, la primera vez que se abre la aplicación
  asegurarBicicletasBase() {
    if (this.listar().length > 0) return;
    this.almacenamiento.escribir(CLAVES.BICICLETAS, [
      { idBicicleta: 1, modelo: "Modelo 1", estado: ESTADOS_BICICLETA.DISPONIBLE, idEstacionActual: 1 },
      { idBicicleta: 2, modelo: "Modelo 1", estado: ESTADOS_BICICLETA.REPARACION, idEstacionActual: 1 },
      { idBicicleta: 4, modelo: "Modelo 2", estado: ESTADOS_BICICLETA.ALQUILADA, idEstacionActual: 1 },
      { idBicicleta: 5, modelo: "Modelo 1", estado: ESTADOS_BICICLETA.DISPONIBLE, idEstacionActual: 1 },
    ]);
  }

  listar() {
    return this.almacenamiento.leer(CLAVES.BICICLETAS, []);
  }

  agregar({ modelo, idEstacionActual }) {
    const bicicletas = this.listar();
    const idBicicleta = bicicletas.reduce((mayor, b) => Math.max(mayor, b.idBicicleta), 0) + 1;
    const bicicleta = { idBicicleta, modelo, estado: ESTADOS_BICICLETA.DISPONIBLE, idEstacionActual };
    bicicletas.push(bicicleta);
    this.almacenamiento.escribir(CLAVES.BICICLETAS, bicicletas);
    return bicicleta;
  }

  cambiarEstado(idBicicleta, estado) {
    const bicicletas = this.listar();
    const bicicleta = bicicletas.find((b) => b.idBicicleta === idBicicleta);
    if (!bicicleta) return;
    bicicleta.estado = estado;
    this.almacenamiento.escribir(CLAVES.BICICLETAS, bicicletas);
  }

  liberar(idBicicleta) {
    const bicicleta = this.listar().find((b) => b.idBicicleta === idBicicleta);
    if (bicicleta && bicicleta.estado !== ESTADOS_BICICLETA.REPARACION) {
      this.cambiarEstado(idBicicleta, ESTADOS_BICICLETA.DISPONIBLE);
    }
  }

  contarEnEstacion(idEstacion) {
    return this.listar().filter(
      (b) => b.idEstacionActual === idEstacion && b.estado !== ESTADOS_BICICLETA.ALQUILADA
    ).length;
  }
}

class RepositorioReservas {
  constructor(almacenamiento, repositorioBicicletas) {
    this.almacenamiento = almacenamiento;
    this.bicicletas = repositorioBicicletas;
  }

  listar() {
    return this.almacenamiento.leer(CLAVES.RESERVAS, []);
  }

  expirarReserva() {
    const reservas = this.listar();
    const limite = TARIFAS.MINUTOS_RESERVA * 60 * 1000;
    let hubo = false;
    reservas.forEach((r) => {
      if (r.estadoReserva === ESTADOS_RESERVA.ACTIVA && Date.now() - Date.parse(r.fechaReserva) > limite) {
        r.estadoReserva = ESTADOS_RESERVA.EXPIRADA;
        this.bicicletas.liberar(r.idBicicleta);
        hubo = true;
      }
    });
    if (hubo) this.almacenamiento.escribir(CLAVES.RESERVAS, reservas);
  }

  buscarActivaDeUsuario(idUsuario) {
    this.expirarReserva();
    return this.listar().find((r) => r.idUsuario === idUsuario && r.estadoReserva === ESTADOS_RESERVA.ACTIVA);
  }

  agregar({ idUsuario, idBicicleta, idEstacion, modelo, fechaUso, telefono, tiempoMinutos, costoEstimado }) {
    const reservas = this.listar();
    const idReserva = reservas.reduce((mayor, r) => Math.max(mayor, r.idReserva), 0) + 1;
    const reserva = {
      idReserva, idUsuario, idBicicleta,
      fechaReserva: new Date().toISOString(), // momento en que se reservó (DateTime)
      estadoReserva: ESTADOS_RESERVA.ACTIVA,
      idEstacion, modelo, fechaUso, telefono, tiempoMinutos, costoEstimado,
    };
    reservas.push(reserva);
    this.almacenamiento.escribir(CLAVES.RESERVAS, reservas);
    this.bicicletas.cambiarEstado(idBicicleta, ESTADOS_BICICLETA.RESERVADA);
    return reserva;
  }

  cambiarEstado(idReserva, estadoReserva) {
    const reservas = this.listar();
    const reserva = reservas.find((r) => r.idReserva === idReserva);
    if (!reserva) return null;
    reserva.estadoReserva = estadoReserva;
    this.almacenamiento.escribir(CLAVES.RESERVAS, reservas);
    return reserva;
  }

  // Cancelar: solo antes de iniciar el viaje; libera la bicicleta
  cancelar(idReserva) {
    const reserva = this.cambiarEstado(idReserva, ESTADOS_RESERVA.CANCELADA);
    if (reserva) this.bicicletas.liberar(reserva.idBicicleta);
    return reserva;
  }
}

class RepositorioPagos {
  constructor(almacenamiento) {
    this.almacenamiento = almacenamiento;
  }

  listar() {
    return this.almacenamiento.leer(CLAVES.PAGOS, []);
  }

  // RF-10 / RN-04: pagos que el usuario todavía debe
  pendientesDeUsuario(idUsuario) {
    return this.listar().filter((p) => p.idUsuario === idUsuario && p.estadoPago === ESTADOS_PAGO.PENDIENTE);
  }

  crear({ idAlquiler, idUsuario, montoAlquiler, montoMulta }) {
    const pagos = this.listar();
    const idPago = pagos.reduce((mayor, p) => Math.max(mayor, p.idPago), 0) + 1;
    const pago = {
      idPago, idAlquiler,
      monto: montoAlquiler + montoMulta,
      fechaPago: null,
      metodoPago: null,
      estadoPago: ESTADOS_PAGO.PENDIENTE,
      idUsuario, montoAlquiler, montoMulta,
    };
    pagos.push(pago);
    this.almacenamiento.escribir(CLAVES.PAGOS, pagos);
    return pago;
  }

  procesarPago(idUsuario, metodoPago) {
    const pagos = this.listar();
    let total = 0;
    pagos.forEach((p) => {
      if (p.idUsuario === idUsuario && p.estadoPago === ESTADOS_PAGO.PENDIENTE) {
        total += p.monto;
        p.estadoPago = ESTADOS_PAGO.PAGADO;
        p.fechaPago = new Date().toISOString();
        p.metodoPago = metodoPago;
      }
    });
    this.almacenamiento.escribir(CLAVES.PAGOS, pagos);
    return total;
  }
}

class RepositorioAlquileres {
  constructor(almacenamiento, repositorioReservas, repositorioBicicletas, repositorioPagos) {
    this.almacenamiento = almacenamiento;
    this.reservas = repositorioReservas;
    this.bicicletas = repositorioBicicletas;
    this.pagos = repositorioPagos;
  }

  listar() {
    return this.almacenamiento.leer(CLAVES.ALQUILERES, []);
  }

  // Alquiler sin terminar (todavía no se entrega la bicicleta)
  buscarEnCursoDeUsuario(idUsuario) {
    return this.listar().find((a) => a.idUsuario === idUsuario && a.fechaHoraFin === null) || null;
  }

  // RN-01: una sola bicicleta reservada o alquilada a la vez
  tieneBicicletaActiva(idUsuario) {
    return Boolean(this.reservas.buscarActivaDeUsuario(idUsuario) || this.buscarEnCursoDeUsuario(idUsuario));
  }

  iniciarViaje(reserva) {
    const alquileres = this.listar();
    const idAlquiler = alquileres.reduce((mayor, a) => Math.max(mayor, a.idAlquiler), 0) + 1;
    const alquiler = {
      idAlquiler,
      idUsuario: reserva.idUsuario,
      idBicicleta: reserva.idBicicleta,
      idEstacionOrigen: reserva.idEstacion,
      idEstacionDestino: null,
      fechaHoraInicio: new Date().toISOString(),
      fechaHoraFin: null,
      tarifaTotal: null,
      idReserva: reserva.idReserva,
      tiempoMinutos: reserva.tiempoMinutos,
    };
    alquileres.push(alquiler);
    this.almacenamiento.escribir(CLAVES.ALQUILERES, alquileres);
    this.reservas.cambiarEstado(reserva.idReserva, ESTADOS_RESERVA.COMPLETADA);
    this.bicicletas.cambiarEstado(reserva.idBicicleta, ESTADOS_BICICLETA.ALQUILADA);
    return alquiler;
  }

  finalizarViaje(idAlquiler) {
    const alquileres = this.listar();
    const alquiler = alquileres.find((a) => a.idAlquiler === idAlquiler);
    if (!alquiler) return null;

    const ahora = Date.now();
    const minutosUsados = Math.ceil((ahora - Date.parse(alquiler.fechaHoraInicio)) / 60000);
    const { alquiler: montoAlquiler, multa: montoMulta } = desglosarCosto(
      Math.max(minutosUsados, alquiler.tiempoMinutos)
    );

    alquiler.fechaHoraFin = new Date(ahora).toISOString();
    alquiler.idEstacionDestino = alquiler.idEstacionOrigen;
    alquiler.tarifaTotal = montoAlquiler + montoMulta;
    this.almacenamiento.escribir(CLAVES.ALQUILERES, alquileres);

    this.pagos.crear({ idAlquiler, idUsuario: alquiler.idUsuario, montoAlquiler, montoMulta });
    this.bicicletas.liberar(alquiler.idBicicleta);
    return { minutosUsados, tarifaTotal: alquiler.tarifaTotal };
  }
}

class RepositorioMantenimientos {
  constructor(almacenamiento) {
    this.almacenamiento = almacenamiento;
  }

  listar() {
    return this.almacenamiento.leer(CLAVES.MANTENIMIENTOS, []);
  }

  registrarReparacion({ idBicicleta, idTecnico, fechaIngreso }) {
    const mantenimientos = this.listar();
    const idMantenimiento = mantenimientos.reduce((mayor, m) => Math.max(mayor, m.idMantenimiento), 0) + 1;
    const mantenimiento = {
      idMantenimiento, idBicicleta, idTecnico,
      repuestosUtilizados: "",
      diagnostico: "",
      fechaIngreso,
      fechaAlta: new Date().toISOString(),
    };
    mantenimientos.push(mantenimiento);
    this.almacenamiento.escribir(CLAVES.MANTENIMIENTOS, mantenimientos);
    return mantenimiento;
  }
}

const ESTADOS_INCIDENCIA = {
  PENDIENTE: "Pendiente",
  ATENDIDA: "Atendida", // solucionada por el técnico
};

const GRAVEDADES_FALLA = ["Leve", "Intermedia", "Mayor"];

class RepositorioIncidencias {
  constructor(almacenamiento, repositorioBicicletas, repositorioMantenimientos) {
    this.almacenamiento = almacenamiento;
    this.bicicletas = repositorioBicicletas;
    this.mantenimientos = repositorioMantenimientos;
  }

  listar() {
    return this.almacenamiento.leer(CLAVES.INCIDENCIAS, []);
  }

  pendientes() {
    return this.listar().filter((i) => i.estadoIncidencia === ESTADOS_INCIDENCIA.PENDIENTE);
  }

  crearReporte({ idBicicleta, idUsuarioReporta, idEstacion, descripcionFalla }) {
    const incidencias = this.listar();
    const idIncidencia = incidencias.reduce((mayor, i) => Math.max(mayor, i.idIncidencia), 0) + 1;
    const incidencia = {
      idIncidencia, idBicicleta, idUsuarioReporta, descripcionFalla,
      fechaReporte: new Date().toISOString(),
      estadoIncidencia: ESTADOS_INCIDENCIA.PENDIENTE,
      idEstacion,
    };
    incidencias.push(incidencia);
    this.almacenamiento.escribir(CLAVES.INCIDENCIAS, incidencias);
    this.bicicletas.cambiarEstado(idBicicleta, ESTADOS_BICICLETA.REPARACION);
    return incidencia;
  }

  marcarAtendida(idIncidencia, idTecnico) {
    const incidencias = this.listar();
    const incidencia = incidencias.find((i) => i.idIncidencia === idIncidencia);
    if (!incidencia) return null;
    incidencia.estadoIncidencia = ESTADOS_INCIDENCIA.ATENDIDA;
    this.almacenamiento.escribir(CLAVES.INCIDENCIAS, incidencias);

    this.mantenimientos.registrarReparacion({
      idBicicleta: incidencia.idBicicleta,
      idTecnico,
      fechaIngreso: incidencia.fechaReporte,
    });

    const quedanPendientes = incidencias.some(
      (i) => i.idBicicleta === incidencia.idBicicleta && i.estadoIncidencia === ESTADOS_INCIDENCIA.PENDIENTE
    );
    const bicicleta = this.bicicletas.listar().find((b) => b.idBicicleta === incidencia.idBicicleta);
    const habilitada = !quedanPendientes && bicicleta && bicicleta.estado === ESTADOS_BICICLETA.REPARACION;
    if (habilitada) this.bicicletas.cambiarEstado(incidencia.idBicicleta, ESTADOS_BICICLETA.DISPONIBLE);
    return { incidencia, habilitada };
  }
}

/* Instancias compartidas por todas las pantallas */
const almacenamiento = new Almacenamiento();
const repositorioRoles = new RepositorioRoles(almacenamiento);
const repositorioUsuarios = new RepositorioUsuarios(almacenamiento);
const repositorioEstaciones = new RepositorioEstaciones(almacenamiento);
const repositorioBicicletas = new RepositorioBicicletas(almacenamiento);
const repositorioReservas = new RepositorioReservas(almacenamiento, repositorioBicicletas);
const repositorioPagos = new RepositorioPagos(almacenamiento);
const repositorioAlquileres = new RepositorioAlquileres(
  almacenamiento, repositorioReservas, repositorioBicicletas, repositorioPagos
);
const repositorioMantenimientos = new RepositorioMantenimientos(almacenamiento);
const repositorioIncidencias = new RepositorioIncidencias(
  almacenamiento, repositorioBicicletas, repositorioMantenimientos
);

function migrarDatos() {
  if (almacenamiento.leer(CLAVES.VERSION, 0) >= 2) return;

  const documentosBase = { sam: "1000000001", sam2: "1000000002", sam3: "1000000003" };

  almacenamiento.escribir(
    CLAVES.ROLES,
    almacenamiento.leer(CLAVES.ROLES, []).map((rol) => {
      if (rol.nombre !== undefined) {
        rol.nombreRol = rol.nombre;
        delete rol.nombre;
      }
      return rol;
    })
  );

  almacenamiento.escribir(
    CLAVES.USUARIOS,
    almacenamiento.leer(CLAVES.USUARIOS, []).map((usuario) => {
      if (usuario.passwordHash !== undefined) {
        usuario.password = usuario.passwordHash;
        delete usuario.passwordHash;
      }
      if (usuario.documento === undefined) usuario.documento = documentosBase[usuario.email] || "";
      return usuario;
    })
  );

  almacenamiento.eliminar(CLAVES.RESERVAS);
  almacenamiento.eliminar("rentabici_fallas");

  almacenamiento.escribir(
    CLAVES.BICICLETAS,
    almacenamiento.leer(CLAVES.BICICLETAS, []).map((bicicleta) => {
      const huerfana =
        bicicleta.estado === ESTADOS_BICICLETA.RESERVADA ||
        (bicicleta.estado === ESTADOS_BICICLETA.ALQUILADA && bicicleta.idBicicleta !== 4);
      if (huerfana) bicicleta.estado = ESTADOS_BICICLETA.DISPONIBLE;
      return bicicleta;
    })
  );

  almacenamiento.escribir(CLAVES.VERSION, 2);
}

migrarDatos();
