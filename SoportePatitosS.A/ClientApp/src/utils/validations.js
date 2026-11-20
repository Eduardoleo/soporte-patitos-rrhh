// Validación de correo empresarial
export const validateCorporateEmail = (email) => {
    const corporateDomain = '@patitos.sa';
    return email.toLowerCase().endsWith(corporateDomain);
};

const normalizarPerfil = (user) => `${user?.perfil || ''}`.toUpperCase();

export const isAdmin = (user) => {
    const perfil = normalizarPerfil(user);
    return perfil.includes('ADMIN');
};

export const isGeneralManager = (user) => {
    const perfil = normalizarPerfil(user);
    return perfil.includes('GERENTE GENERAL') || perfil.includes('DIRECTOR GENERAL');
};

export const isManager = (user) => {
    const perfil = normalizarPerfil(user);
    return perfil.includes('GERENTE') && !isGeneralManager(user);
};

export const isLeader = (user) => {
    const perfil = normalizarPerfil(user);
    return perfil.includes('JEFE');
};

export const isPayrollAnalyst = (user) => {
    const perfil = normalizarPerfil(user);
    return user && (
        perfil.includes('NOMINA')
        || perfil.includes('NÓMINA')
        || perfil.includes('RRHH')
        || perfil.includes('RECURSOS HUMANOS')
        || user.esAnalistaNomina === true
    );
};

export const isStandardEmployee = (user) => {
    if (!user) return false;
    return !isAdmin(user)
        && !isGeneralManager(user)
        && !isManager(user)
        && !isLeader(user)
        && !isPayrollAnalyst(user);
};

// Validar si tiene acceso a módulos especiales
export const hasAccessToModule = (user, module) => {
    if (!user) return false;

    // Solo analistas de nómina pueden ver estos módulos
    const restrictedModules = [
        'ausencias',
        'horas-extras',
        'vacaciones',
        'dias-con-goce',
        'dias-sin-goce',
        'licencia-maternidad',
        'licencia-paternidad'
    ];

    if (restrictedModules.includes(module)) {
        return isPayrollAnalyst(user) || isAdmin(user);
    }

    if (module === 'adminCrud') {
        return isAdmin(user);
    }

    if (module === 'asistenciaGeneral') {
        return isLeader(user) || isManager(user) || isGeneralManager(user) || isPayrollAnalyst(user) || isAdmin(user);
    }

    if (module === 'planillas') {
        return isPayrollAnalyst(user) || isAdmin(user);
    }

    if (module === 'evaluacionesEquipo') {
        return isLeader(user) || isManager(user) || isGeneralManager(user) || isAdmin(user);
    }

    return true;
};