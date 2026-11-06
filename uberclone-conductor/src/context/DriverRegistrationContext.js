
import React, { createContext, useContext, useState } from 'react';

const RegistrationContext = createContext();

export const RegistrationProvider = ({ children }) => {

    // Datos personales
    const [personalData, setPersonalData] = useState({
        profilePhoto: null,
        fullName: '',
        idNumber: '',
        phone: '',
        birthDate: '',
        gender: '',
        email: '',
        language: 'es',
    });

    // Datos del vehículo
    const [vehicleData, setVehicleData] = useState({
        category: 'economy',
        plate: '',
        brand: '',
        model: '',
        year: '',
        color: '',
        passengerCapacity: '4',
        vehiclePhoto: null,
    });

    // Datos de documentación
    const [documentsData, setDocumentsData] = useState({
        licenseNumber: '',
        licensePhoto: null,
        licenseExpiry: '',
        soatPhoto: null,
        soatExpiry: '',
        techPhoto: null,
        techExpiry: '',
        mercadoPagoEmail: '',
        acceptedTerms: false,
    });

    // Actualizar información personal
    const updatePersonalData = (data) => {
        setPersonalData((prev) => ({
            ...prev,
            ...data,
        }));
    };

    // Actualizar información del vehículo
    const updateVehicleData = (data) => {
        setVehicleData((prev) => ({
            ...prev,
            ...data,
        }));
    };

    // Actualizar documentación
    const updateDocumentsData = (data) => {
        setDocumentsData((prev) => ({
            ...prev,
            ...data,
        }));
    };

    // Limpiar información del registro
    const clearRegistration = () => {
        setPersonalData({
            profilePhoto: null,
            fullName: '',
            idNumber: '',
            phone: '',
            birthDate: '',
            gender: '',
            email: '',
            language: 'es',
        });

        setVehicleData({
            category: 'economy',
            plate: '',
            brand: '',
            model: '',
            year: '',
            color: '',
            passengerCapacity: '4',
            vehiclePhoto: null,
        });

        setDocumentsData({
            licenseNumber: '',
            licensePhoto: null,
            licenseExpiry: '',
            soatPhoto: null,
            soatExpiry: '',
            techPhoto: null,
            techExpiry: '',
            mercadoPagoEmail: '',
            acceptedTerms: false,
        });
    };

    return (
        <RegistrationContext.Provider
            value={{
                personalData,
                vehicleData,
                documentsData,
                updatePersonalData,
                updateVehicleData,
                updateDocumentsData,
                clearRegistration,
            }}
        >
            {children}
        </RegistrationContext.Provider>
    );
};

// Hook para utilizar el Context
export const useRegistration = () => {
    const context = useContext(RegistrationContext);

    if (!context) {
        throw new Error(
            'useRegistration debe utilizarse dentro de RegistrationProvider'
        );
    }

    return context;
};
