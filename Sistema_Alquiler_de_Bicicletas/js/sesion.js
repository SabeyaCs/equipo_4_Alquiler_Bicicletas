/* RentaBici - Sesión del usuario y menú según el rol */

const CLAVE_SESION = "rentabici_sesion";

// Menú principal que corresponde a cada rol
const RUTAS_MENU = {
  [ROLES.ADMINISTRADOR]: "menu_administrador.html",
  [ROLES.TECNICO]: "menu_tecnico.html",
  [ROLES.USUARIO]: "menu_usuario.html",
};

class ServicioSesion {
  // Guarda solo lo necesario (nunca la contraseña ni el hash)
  iniciar(usuario) {
    this.guardar({
      idUsuario: usuario.idUsuario,
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      email: usuario.email,
      idRol: usuario.idRol,
      bienvenidaPendiente: true, // para mostrar el pop-up una sola vez
    });
  }

  guardar(datos) {
    try {
      sessionStorage.setItem(CLAVE_SESION, JSON.stringify(datos));
    } catch (e) {
      /* sin almacenamiento disponible */
    }
  }

  actual() {
    try {
      const texto = sessionStorage.getItem(CLAVE_SESION);
      return texto ? JSON.parse(texto) : null;
    } catch (e) {
      return null;
    }
  }

  // Si el administrador cambia su propio rol, la sesión debe reflejarlo
  actualizarRol(idRol) {
    const datos = this.actual();
    if (!datos) return;
    datos.idRol = idRol;
    this.guardar(datos);
  }

  // Devuelve true solo la primera vez después de iniciar sesión
  consumirBienvenida() {
    const datos = this.actual();
    if (!datos || !datos.bienvenidaPendiente) return false;
    datos.bienvenidaPendiente = false;
    this.guardar(datos);
    return true;
  }

  cerrar() {
    try {
      sessionStorage.removeItem(CLAVE_SESION);
    } catch (e) {
      /* nada que hacer */
    }
  }

  rutaMenu(idRol) {
    return RUTAS_MENU[idRol] || "login.html";
  }

  exigirRol(rolesPermitidos) {
    const usuario = this.actual();
    const permitidos = [].concat(rolesPermitidos);

    if (!usuario) {
      window.location.replace("login.html");
      return null;
    }
    if (!permitidos.includes(usuario.idRol)) {
      window.location.replace(this.rutaMenu(usuario.idRol));
      return null;
    }
    return usuario;
  }
}

const servicioSesion = new ServicioSesion();
