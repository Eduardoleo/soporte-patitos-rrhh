using BL.Interface;
using BL.Application.Services;
using Model.Entities;
using Model.Contracts.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Model.Requests;
using API.Security;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuariosController : ControllerBase
    {
        private readonly IUsuariosBL _usuariosBL;
        private readonly IJwtTokenService _jwtTokenService;
        private readonly IEmpleadosBL _empleadosBL;

        public UsuariosController(IUsuariosBL usuariosBL, IJwtTokenService jwtTokenService, IEmpleadosBL empleadosBL)
        {
            _usuariosBL = usuariosBL;
            _jwtTokenService = jwtTokenService;
            _empleadosBL = empleadosBL;
        }


        [HttpGet("ObtenerTodos")]
        [Authorize(Policy = "Administracion")]
        public async Task<ActionResult<List<Usuarios>>> ObtenerTodos()
        {
            try
            {
                var usuarios = await _usuariosBL.ObtenerTodos();
                return Ok(usuarios);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
            
        }


        [HttpGet("ObtenerPorId/{id}")]
        [Authorize(Policy = "Administracion")]
        public async Task<ActionResult<Usuarios>> ObtenerPorId(int id)
        {
            try
            {
                var usuario = await _usuariosBL.ObtenerPorId(id);

                if (usuario == null)
                    return NotFound("Usuario no encontrado");

                return Ok(usuario);

            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
            
        }


        [HttpGet("ObtenerPorNombre")]
        [Authorize(Policy = "Administracion")]
        public async Task<ActionResult<Usuarios>> ObtenerPorNombre([FromQuery] string nombreUsuario)
        {
            try
            {
                var usuario = await _usuariosBL.ObtenerPorNombre(nombreUsuario);
                if (usuario == null)
                    return NotFound("Usuario no encontrado");

                return Ok(usuario);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }


        [HttpPost("CrearUsuario")]
        [Authorize(Policy = "Administracion")]
        public async Task<ActionResult<Usuarios>> CrearUsuario([FromBody] CrearUsuarioRequest request)
        {
            try
            {
                var usuario = new Usuarios
                {
                    Nombre_Usuario = request.Nombre_Usuario,
                    Password_Hash = request.Password_Hash
                };

                var creado = await _usuariosBL.CrearUsuario(usuario);

                return Ok(creado); 
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }


        [HttpPut("ActualizarUsuario/{id}")]
        [Authorize(Policy = "Administracion")]
        public async Task<ActionResult<Usuarios>> ActualizarUsuario(int id, [FromBody] UsuarioActualizarRequest request)
        {
            try
            {
                var actualizado = await _usuariosBL.ActualizarUsuario(id, request);
                return Ok(actualizado); 
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }



        [HttpPut("CambiarPassword/{id}")]
        public async Task<ActionResult> CambiarPassword(int id, [FromBody] CambiarPasswordRequest request)
        {
            if (!AccessRules.CanChangePassword(User, id)) return Forbid();
            try
            {
                await _usuariosBL.CambiarPassword(id, request.NuevaPassword);
                return Ok("Contraseña actualizada correctamente");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }


        [HttpDelete("EliminarUsuario/{id}")]
        [Authorize(Policy = "Administracion")]
        public async Task<ActionResult> EliminarUsuario(int id)
        {
            try
            {
                await _usuariosBL.EliminarUsuario(id);
                return Ok("Usuario eliminado correctamente");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }


        [HttpPost("Login")]
        [AllowAnonymous]
        public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
        {
            try
            {
                var user = await _usuariosBL.Login(request.NombreUsuario, request.Password);

                if (user == null)
                    return Unauthorized("Usuario o contraseña incorrecta");

                // Obtener información del empleado
                var empleado = await _empleadosBL.ObtenerEmpleadoPorUsuarioId(user.Usuario_ID);
                if (empleado == null)
                    return BadRequest("No se encontró información del empleado");

                // Obtener nombre completo del empleado desde InformacionPersonal
                var nombreCompleto = empleado.InformacionPersonal?.Nombre_Empleado ?? request.NombreUsuario;
                var fotografia = empleado.Fotografia_Url ?? "";
                var perfil = empleado.Perfil?.Nombre_Perfil ?? "EMPLEADO";

                // Generar token JWT
                var token = _jwtTokenService.GenerateToken(
                    user.Usuario_ID,
                    user.Nombre_Usuario,
                    nombreCompleto,
                    perfil,
                    empleado.Empleado_ID
                );

                var response = new LoginResponse
                {
                    UsuarioId = user.Usuario_ID,
                    NombreUsuario = user.Nombre_Usuario,
                    Nombre = nombreCompleto,
                    Perfil = perfil,
                    Token = token,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(300),
                    EmpleadoId = empleado.Empleado_ID,
                    FotografiaUrl = fotografia,
                    DebeCambiarClave = user.Debe_Cambiar_Clave
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }

        [HttpPost("Logout")]
        [Authorize]
        public ActionResult Logout()
        {
            return Ok(new { message = "Sesión cerrada correctamente" });
        }

        [HttpPost("ValidateToken")]
        [Authorize]
        public ActionResult ValidateToken()
        {
            return Ok(new { message = "Token válido" });
        }

    }
}



