package uni.AEDLab1.services;

import org.springframework.stereotype.Service;
import uni.AEDLab1.models.ColaEstadoDto;

import java.util.Arrays;

@Service
public class ColaServicio {

    public static final int TAMANO_MAXIMO_PERMITIDO = 100;
    public static final int LONGITUD_MAXIMA_NOMBRE = 12;

    private int max = 0;                    // Lo define el usuario con definirTamano
    private String[] cola = new String[0];
    private int frente = -1;                // Frente y Final se inicializan en -1
    private int finalCola = -1;

    public synchronized ColaEstadoDto obtenerEstado() {
        if (max == 0) {
            return crearEstado("Ingrese el tamaño de la cola para comenzar.", "info", null, null);
        }
        if (frente == -1) {
            return crearEstado("Cola vacía (Frente = -1, Final = -1). Esperando clientes en el banco.", "info", null, null);
        }
        String mensaje = "Frente = " + frente + " (" + cola[frente] + "), Final = " + finalCola
            + " (" + cola[finalCola] + "). Clientes en espera: " + (finalCola - frente + 1) + ".";
        return crearEstado(mensaje, "ok", null, null);
    }

    // El usuario ingresa el tamaño (Max): se crea una cola nueva y vacía
    public synchronized ColaEstadoDto definirTamano(Integer tamanoIngresado) {
        if (tamanoIngresado == null || tamanoIngresado < 1 || tamanoIngresado > TAMANO_MAXIMO_PERMITIDO) {
            throw new IllegalArgumentException("El tamaño de la cola debe ser un entero entre 1 y " + TAMANO_MAXIMO_PERMITIDO + ".");
        }
        max = tamanoIngresado;
        cola = new String[max];
        frente = -1;
        finalCola = -1;
        return crearEstado("Cola de " + max + " casillas creada (Frente = -1, Final = -1).", "ok", null, null);
    }

    // Algoritmo Encolar(Cola, Max, Frente, Final, Dato)
    public synchronized ColaEstadoDto encolar(String nombreIngresado) {
        if (max == 0) {
            throw new IllegalStateException("Defina primero el tamaño de la cola.");
        }
        String persona = validarNombre(nombreIngresado);

        // 1. Verifica que hay espacio libre en la cola
        if (finalCola < max - 1) {
            finalCola = finalCola + 1;
            cola[finalCola] = persona;

            // 1.1 Se insertó el primer elemento en la cola
            // (Final = 1 es redundante porque Frente ya vale 0, pero se respeta el algoritmo tal cual)
            if (finalCola == 0 || finalCola == 1) {
                frente = 0;
            }

            return crearEstado(
                "Cliente '" + persona + "' encolado en la casilla " + finalCola + " (Final = " + finalCola + ").",
                "ok", persona, finalCola
            );
        } else {
            throw new IllegalStateException(
                "Desbordamiento – Cola llena: Final llegó a la última casilla (" + (max - 1) + ")."
                + (frente > 0 ? " Las casillas atendidas no se reutilizan en una cola lineal." : "")
            );
        }
    }

    // Algoritmo Desencolar(Cola, Frente, Final, Dato)
    public synchronized ColaEstadoDto desencolar() {
        // 1. Verifica que la cola no esté vacía
        if (frente != -1) {
            String persona = cola[frente];   // Dato <- Cola[Frente]
            int indiceAtendido = frente;
            cola[frente] = null;             // Solo para la vista: la casilla queda vacía pero no se reutiliza

            // 1.1 Si hay un solo elemento, la cola queda vacía
            if (frente == finalCola) {
                frente = -1;
                finalCola = -1;
            } else {
                frente = frente + 1;
            }

            String mensaje = "Cliente '" + persona + "' atendido y retirado de la casilla " + indiceAtendido
                + (frente == -1 ? ". La cola quedó vacía (Frente = -1, Final = -1)." : ". Nuevo Frente = " + frente + ".");
            return crearEstado(mensaje, "info", persona, indiceAtendido);
        } else {
            throw new IllegalStateException("Subdesbordamiento – Cola vacía: no hay clientes esperando turno.");
        }
    }

    // Vacía la cola y conserva el tamaño ya definido
    public synchronized ColaEstadoDto reiniciar() {
        Arrays.fill(cola, null);
        frente = -1;
        finalCola = -1;
        return crearEstado("Cola reiniciada al estado inicial vacío.", "info", null, null);
    }

    private ColaEstadoDto crearEstado(String mensaje, String tipoMensaje, String elementoAfectado, Integer indiceAfectado) {
        int cantidad = frente == -1 ? 0 : finalCola - frente + 1;
        return new ColaEstadoDto(
            cola.clone(), frente, finalCola, cantidad, mensaje, tipoMensaje, elementoAfectado, indiceAfectado
        );
    }

    private String validarNombre(String nombreIngresado) {
        if (nombreIngresado == null || nombreIngresado.isBlank()) {
            throw new IllegalArgumentException("El nombre de la persona no puede estar vacío.");
        }

        String nombre = nombreIngresado.trim().replaceAll("\\s+", " ");

        if (nombre.length() > LONGITUD_MAXIMA_NOMBRE) {
            throw new IllegalArgumentException("El nombre no puede superar los " + LONGITUD_MAXIMA_NOMBRE + " caracteres.");
        }
        if (!nombre.matches("[\\p{L} ]+")) {
            throw new IllegalArgumentException("El nombre solo puede contener letras y espacios.");
        }
        return nombre;
    }
}