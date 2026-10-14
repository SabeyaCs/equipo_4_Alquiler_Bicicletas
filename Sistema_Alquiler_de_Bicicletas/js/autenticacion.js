/* RentaBici - Autenticación (registro de usuarios) */

class HasheadorContrasena {
  generarSal() {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  async hashear(contrasena, sal = this.generarSal()) {
    const datos = new TextEncoder().encode(sal + contrasena);
    const resumen = await crypto.subtle.digest("SHA-256", datos);
    const hash = Array.from(new Uint8Array(resumen), (b) => b.toString(16).padStart(2, "0")).join("");
    return { sal, hash };
  }

  // Compara una contraseña escrita con el hash guardado
  async verificar(contrasena, sal, hashGuardado) {
    const { hash } = await this.hashear(contrasena, sal);
    return hash === hashGuardado;
  }
}

/* Servicio de autenticación */
class ServicioAutenticacion {
  constructor(repositorioUsuarios, hasheador) {
    this.repositorioUsuarios = repositorioUsuarios;
    this.hasheador = hasheador;
  }

  // Registro público (formulario): el rol SIEMPRE es "Usuario".
  registrar(datos) {
    return this.crearUsuario(datos, ROLES.USUARIO);
  }

  // Inicio de sesión: acepta el correo o el usuario (p. ej. "sam").
  async iniciarSesion(identificador, contrasena) {
    const usuario = this.repositorioUsuarios.buscarPorEmail(identificador.trim().toLowerCase());
    const valido = usuario && (await this.hasheador.verificar(contrasena, usuario.sal, usuario.password));

    if (!valido) {
      throw new Error("Correo/usuario o contraseña incorrectos.");
    }
    return usuario;
  }

  async crearUsuario({ nombre, apellidos, email, documento, contrasena }, idRol) {
    const correo = email.trim().toLowerCase();
    const numeroDocumento = documento.trim();

    if (this.repositorioUsuarios.buscarPorEmail(correo)) {
      throw new Error("Ya existe una cuenta con ese correo electrónico.");
    }

    // RF-01: se valida el número de identificación
    if (!/^\d{6,12}$/.test(numeroDocumento)) {
      throw new Error("El documento debe tener entre 6 y 12 números.");
    }
    if (this.repositorioUsuarios.buscarPorDocumento(numeroDocumento)) {
      throw new Error("Ya existe una cuenta con ese documento.");
    }

    const { sal, hash } = await this.hasheador.hashear(contrasena);

    return this.repositorioUsuarios.agregar({
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      documento: numeroDocumento,
      email: correo,
      sal,
      password: hash, // hash de la contraseña, nunca el texto
      idRol,
    });
  }
}

async function crearServicioAutenticacion() {
  repositorioRoles.asegurarRolesBase();

  const servicio = new ServicioAutenticacion(repositorioUsuarios, new HasheadorContrasena());

  // Usuario temporal de pruebas: sam / 12345 (rol Administrador)
  const sam = repositorioUsuarios.buscarPorEmail("sam");
  if (!sam) {
    await servicio.crearUsuario(
      { nombre: "sam", apellidos: "", email: "sam", documento: "1000000001", contrasena: "12345" },
      ROLES.ADMINISTRADOR
    );
  } else if (sam.idRol !== ROLES.ADMINISTRADOR) {
    // Si sam ya se había creado antes como Usuario, se corrige su rol
    repositorioUsuarios.cambiarRol(sam.idUsuario, ROLES.ADMINISTRADOR);
  }

  // Usuario normal y técnico de pruebas (contraseña 12345)
  const predeterminados = [
    { nombre: "sam2", email: "sam2", documento: "1000000002", idRol: ROLES.USUARIO },
    { nombre: "sam3", email: "sam3", documento: "1000000003", idRol: ROLES.TECNICO },
  ];
  for (const p of predeterminados) {
    if (!repositorioUsuarios.buscarPorEmail(p.email)) {
      await servicio.crearUsuario(
        { nombre: p.nombre, apellidos: "", email: p.email, documento: p.documento, contrasena: "12345" },
        p.idRol
      );
    }
  }

  return servicio;
}
