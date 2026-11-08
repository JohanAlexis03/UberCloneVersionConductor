// AI-assisted: see docs/AI_LOG.md #10
// Subida de imagenes a Cloudinary desde la app.
//
// Se usa una "unsigned upload preset" porque una app movil no puede
// guardar el API secret: cualquiera que abra el APK podria leerlo.
// El preset limita que puede hacer el cliente (carpeta, formato, tamano).

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

/**
 * Sube una imagen a Cloudinary y devuelve su URL publica (https).
 *
 * @param {{ uri: string, fileName?: string, mimeType?: string }} asset
 *        El asset que devuelve expo-image-picker.
 * @returns {Promise<string>} URL segura de la imagen subida.
 */
export async function uploadToCloudinary(asset) {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
        throw new Error(
            'Cloudinary no está configurado. Revisa las variables EXPO_PUBLIC_CLOUDINARY_* en .env'
        );
    }

    const formData = new FormData();

    // React Native acepta este objeto como archivo dentro de FormData.
    // No se debe poner el header Content-Type a mano: fetch agrega el boundary.
    formData.append('file', {
        uri: asset.uri,
        name: asset.fileName ?? `foto-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
    });

    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
    );

    // Cloudinary responde { error: { message } } cuando algo falla.
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.secure_url) {
        throw new Error(
            data?.error?.message ??
            'No se pudo subir la foto. Revisa tu conexión e intenta de nuevo.'
        );
    }

    return data.secure_url;
}
