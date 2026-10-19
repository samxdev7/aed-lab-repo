package uni.AEDLab1.services;

import org.springframework.stereotype.Service;
import uni.AEDLab1.models.ColaCircularEstadoDto;

import java.util.Arrays;

@Service
public class ColaCircularServicio {

    public static final int MAX = 10;

    private final String[] cola = new String[MAX];
    private int frente = -1;
    private int finalCola = -1;
    private int cantidad = 0;

    public synchronized ColaCircularEstadoDto obtenerEstado() {
        String mensaje = cantidad == 0
            ? "Cola circular vacía (Frente = -1, Final = -1). Esperando trabajos de impresión."
            : "Estado actual: Frente = " + frente + " (" + cola[frente] + "), Final = " + finalCola + " (" + cola[finalCola] + "). Ocupación: " + cantidad + "/" + MAX + ".";
        String tipo = cantidad == 0 ? "info" : "ok";

        return new ColaCircularEstadoDto(
            clonarCola(), frente, finalCola, cantidad, MAX, mensaje, tipo, false, null, null
        );
    }

    public synchronized ColaCircularEstadoDto encolar(String estacionInput) {
        validarEstacion(estacionInput);
        String estacion = estacionInput.trim().toUpperCase();

        // Algoritmo EncolarCircular: Verificación de desbordamiento (Cola llena)
        if ((finalCola == MAX - 1 && frente == 0) || (finalCola + 1 == frente)) {
            throw new IllegalStateException("Desbordamiento – Cola llena: No es posible agregar más trabajos de impresión a la cola circular (Capacidad máxima: " + MAX + ").");
        }

        boolean dioVuelta = false;
        // Si final está en la última celda, da la vuelta a 0
        if (finalCola == MAX - 1) {
            finalCola = 0;
            dioVuelta = true;
        } else {
            finalCola = finalCola + 1;
        }

        cola[finalCola] = estacion;

        // Si la cola estaba vacía, el frente apunta a la primera celda insertada
        if (frente == -1) {
            frente = 0;
        }

        cantidad++;

        String mensaje = dioVuelta
            ? "Vuelta circular completada: Trabajo '" + estacion + "' encolado en casilla " + finalCola + " (Final = " + finalCola + ")."
            : "Trabajo '" + estacion + "' encolado con éxito en casilla " + finalCola + " (Final = " + finalCola + ").";

        return new ColaCircularEstadoDto(
            clonarCola(), frente, finalCola, cantidad, MAX, mensaje, "ok", dioVuelta, estacion, finalCola
        );
    }

    public synchronized ColaCircularEstadoDto desencolar() {
        // Algoritmo DesencolarCircular: Verificación de subdesbordamiento (Cola vacía)
        if (frente == -1) {
            throw new IllegalStateException("Subdesbordamiento – Cola vacía: No hay trabajos de impresión pendientes en la cola circular.");
        }

        String datoEliminado = cola[frente];
        int indiceEliminado = frente;
        cola[frente] = null; // Se vacía la casilla atendida

        boolean dioVuelta = false;
        // Si hay un solo elemento, la cola queda vacía
        if (frente == finalCola) {
            frente = -1;
            finalCola = -1;
        } else {
            // Si el frente estaba en la última casilla, da la vuelta a 0
            if (frente == MAX - 1) {
                frente = 0;
                dioVuelta = true;
            } else {
                frente = frente + 1;
            }
        }

        cantidad--;

        String mensaje = cantidad == 0
            ? "Trabajo de estación '" + datoEliminado + "' atendido y eliminado de casilla " + indiceEliminado + ". La cola ha quedado vacía."
            : (dioVuelta
                ? "Vuelta circular de lectura: Trabajo '" + datoEliminado + "' atendido. Frente avanzó a casilla 0."
                : "Trabajo de estación '" + datoEliminado + "' atendido y eliminado de casilla " + indiceEliminado + ". Nuevo Frente = " + frente + ".");

        return new ColaCircularEstadoDto(
            clonarCola(), frente, finalCola, cantidad, MAX, mensaje, "info", dioVuelta, datoEliminado, indiceEliminado
        );
    }

    public synchronized ColaCircularEstadoDto reiniciar() {
        Arrays.fill(cola, null);
        frente = -1;
        finalCola = -1;
        cantidad = 0;

        return new ColaCircularEstadoDto(
            clonarCola(), frente, finalCola, cantidad, MAX,
            "Cola circular reiniciada al estado inicial vacío.", "info", false, null, null
        );
    }

    public void validarEstacion(String estacion) {
        if (estacion == null || estacion.trim().isEmpty()) {
            throw new IllegalArgumentException("El identificador de la estación de trabajo no puede estar vacío.");
        }

        String limpia = estacion.trim().toUpperCase();

        if (limpia.length() < 1 || limpia.length() > 4) {
            throw new IllegalArgumentException("La estación de trabajo debe contener entre 1 y 4 letras.");
        }

        if (!limpia.matches("^[A-Z]+$")) {
            throw new IllegalArgumentException("La estación de trabajo solo puede contener letras (A-Z). No se permiten números ni caracteres especiales.");
        }
    }

    private String[] clonarCola() {
        return Arrays.copyOf(cola, MAX);
    }
}
