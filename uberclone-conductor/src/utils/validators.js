export const isValidFullName = (name) =>
    /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{1,50}$/.test(name.trim());

export const isValidColombianId = (id) =>
    /^\d{6,10}$/.test(id.trim());

export const isValidPhone = (phone) =>
    /^\d{10}$/.test(phone.trim());

export const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const validateAge = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return 'Usa el formato AAAA-MM-DD (ej: 2000-05-15).';

    const birth = new Date(dateString);
    if (isNaN(birth.getTime())) return 'Fecha inválida.';

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    if (age < 18) return `Debes ser mayor de 18 años (tienes ${age} años).`;
    return null;
};

// Validadores para Vehículo (listos para la Pestaña 2)
export const isValidColombianPlate = (plate) =>
    /^[A-Z]{3}\d{3}$/.test(plate.toUpperCase().trim());

export const isValidVehicleYear = (year) => {
    const y = parseInt(year, 10);
    const currentYear = new Date().getFullYear();
    return !isNaN(y) && y >= 1990 && y <= currentYear;
};