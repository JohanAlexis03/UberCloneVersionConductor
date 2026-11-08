// AI-assisted: see docs/AI_LOG.md #9
// Convierte "AAAA-MM-DD" en Date solo si esa fecha existe de verdad.
// new Date(2026, 1, 31) se desborda a marzo, por eso comparamos las tres partes.
export const parseIsoDate = (dateString) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateString).trim());
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return date;
};

// Date -> "AAAA-MM-DD" usando la fecha local, no la UTC
export const formatIsoDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const startOfToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};

const NAME_PATTERN = /^[a-záéíóúüñ' -]+$/i;
const VEHICLE_TEXT_PATTERN = /^[a-z0-9áéíóúüñ.' -]+$/i;

// Al menos 3 caracteres, solo letras, espacios, apostrofes y guiones.
// Exige minimo 2 letras para descartar cosas como " - ".
export const isValidFullName = (name) => {
    const value = String(name).trim().replace(/\s+/g, ' ');

    if (value.length < 3 || value.length > 50) return false;
    if (!NAME_PATTERN.test(value)) return false;

    return value.replace(/[^a-záéíóúüñ]/gi, '').length >= 2;
};

export const isValidColombianId = (id) => {
    const value = String(id).trim();
    // Cedulas colombianas: entre 6 y 10 digitos y no puede ser todo ceros
    return /^\d{6,10}$/.test(value) && !/^0+$/.test(value);
};

export const isValidPhone = (phone) => {
    const value = String(phone).trim();
    // Celular colombiano: 10 digitos y empieza por 3
    return /^3\d{9}$/.test(value);
};

export const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(String(email).trim());

// Devuelve un mensaje de error o null si la fecha es valida
export const validateAge = (dateString) => {
    const birth = parseIsoDate(dateString);
    if (!birth) return 'Fecha inválida. Selecciona una fecha real del calendario.';

    const today = startOfToday();

    if (birth > today) return 'La fecha de nacimiento no puede ser futura.';

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    if (age < 18) return `Debes ser mayor de 18 años (tienes ${age}).`;
    if (age > 100) return 'Ingresa una fecha de nacimiento real.';

    return null;
};

// Devuelve true solo si la fecha existe y es posterior a hoy
export const isValidExpiryDate = (dateString) => {
    const date = parseIsoDate(dateString);
    if (!date) return false;
    return date > startOfToday();
};

// Validadores para Vehiculo
export const isValidColombianPlate = (plate) =>
    /^[A-Z]{3}\d{3}$/.test(String(plate).toUpperCase().trim());

export const isValidVehicleYear = (year) => {
    const value = String(year).trim();
    // Cuatro digitos exactos: "1990abc" o "1990.5" ya no pasan
    if (!/^\d{4}$/.test(value)) return false;

    const parsed = Number(value);
    const currentYear = new Date().getFullYear();
    return parsed >= 1990 && parsed <= currentYear;
};

export const isValidVehicleBrand = (brand) => {
    const value = String(brand).trim().replace(/\s+/g, ' ');
    if (value.length < 2 || value.length > 30) return false;
    if (!VEHICLE_TEXT_PATTERN.test(value)) return false;
    return /[a-záéíóúüñ]/i.test(value);
};

export const isValidVehicleModel = (model) => {
    const value = String(model).trim().replace(/\s+/g, ' ');
    if (value.length < 1 || value.length > 30) return false;
    if (!VEHICLE_TEXT_PATTERN.test(value)) return false;
    return /[a-z0-9]/i.test(value);
};

export const isValidLicenseNumber = (license) =>
    /^[a-zA-Z0-9]{6,16}$/.test(String(license).trim());
