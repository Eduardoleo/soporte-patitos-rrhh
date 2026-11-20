using BL.Interface;
using BL.Servicios;
using BL.Application.Services;
using DA.Servicios;
using DA.Context;
using DA.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using API.Security;
using API.Health;

var builder = WebApplication.CreateBuilder(args);

// CreateBuilder loads user-secrets in Development, then environment and command line.
// Private legacy JSON and example files are deliberately not loaded.
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var jwtSecret = builder.Configuration["Jwt:Secret"];
if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException("Falta ConnectionStrings:DefaultConnection. Consulte README.md para configurar su entorno local.");
if (builder.Environment.IsDevelopment())
    LocalDevelopmentSettings.Validate(connectionString);
if (string.IsNullOrWhiteSpace(jwtSecret) || Encoding.UTF8.GetByteCount(jwtSecret) < 32)
    throw new InvalidOperationException("Configure una clave Jwt:Secret propia de al menos 32 bytes.");

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("ClientAppPolicy", policy =>
    {
        policy
            .WithOrigins("http://localhost:3000", "https://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();
    options.AddPolicy("Administracion", policy => policy.RequireAuthenticatedUser()
        .RequireAssertion(ctx => AccessRules.IsAdmin(ctx.User)));
    options.AddPolicy("Nomina", policy => policy.RequireAuthenticatedUser()
        .RequireAssertion(ctx => AccessRules.CanReadPayroll(ctx.User)));
});
builder.Services.AddHealthChecks().AddCheck<DatabaseReadinessCheck>("database", tags: new[] { "ready" });

// Configurar JWT
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = Encoding.UTF8.GetBytes(jwtSecret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(secretKey),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddScoped<IUsuariosDA, UsuariosDA>();
builder.Services.AddScoped<IUsuariosBL, UsuariosBL>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

builder.Services.AddScoped<IDepartamentosBL, DepartamentosBL>();
builder.Services.AddScoped<IDepartamentosDA, DepartamentosDA>();

builder.Services.AddScoped<IHorariosBL, HorariosBL>();
builder.Services.AddScoped<IHorariosDA, HorariosDA>();

builder.Services.AddScoped<IPuestosBL, PuestosBL>();
builder.Services.AddScoped<IPuestosDA, PuestosDA>();

builder.Services.AddScoped<IPerfilesBL, PerfilesBL>();
builder.Services.AddScoped<IPerfilesDA, PerfilesDA>();

builder.Services.AddScoped<IEmpleadosBL, EmpleadosBL>();
builder.Services.AddScoped<IEmpleadosDA, EmpleadosDA>();

builder.Services.AddScoped<IPreguntas_EvaluacionBL, Preguntas_EvaluacionBL>();
builder.Services.AddScoped<IPreguntas_EvaluacionDA, Preguntas_EvaluacionDA>();

builder.Services.AddScoped<IEvaluacionesBL, EvaluacionesBL>();
builder.Services.AddScoped<IEvaluacionesDA, EvaluacionesDA>();

builder.Services.AddScoped<IEvaluacion_DetalleBL, Evaluacion_DetalleBL>();
builder.Services.AddScoped<IEvaluacion_DetalleDA, Evaluacion_DetalleDA>();

builder.Services.AddScoped<IAsistenciaBL, AsistenciaBL>();
builder.Services.AddScoped<IAsistenciaDA, AsistenciaDA>();

builder.Services.AddScoped<IPlanillasBL, PlanillasBL>();
builder.Services.AddScoped<IPlanillasDA, PlanillasDA>();

builder.Services.AddScoped<IColillas_PagoBL, Colillas_PagoBL>();
builder.Services.AddScoped<IColillas_PagoDA, Colillas_PagoDA>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("ClientAppPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false }).AllowAnonymous();
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
}).AllowAnonymous();

app.Run();
