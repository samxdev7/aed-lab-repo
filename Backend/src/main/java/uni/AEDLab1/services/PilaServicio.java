package uni.AEDLab1.services;

import org.springframework.stereotype.Service;
import uni.AEDLab1.models.PilaEstadoDto;

import java.util.Arrays;

@Service
public class PilaServicio {

    private static final int MAX = 10;
    private static final int MAX_CARACTERES_NOMBRE = 30;

    private final String[] pila = new String[MAX];
    private int tope = -1;

    // Pilallena(Pila, Tope, Max, Band): Band = verdadero si Tope = Max-1
    private boolean pilaLlena() {
        return tope == MAX - 1;
    }

    // Pilavacia(Pila, Tope, Band): Band = verdadero si Tope = -1
    private boolean pilaVacia() {
        return tope == -1;
    }

    // Push(Pila, Tope, Max, Dato)
    public synchronized PilaEstadoDto push(String centroComercial) {
        String dato = validarYLimpiarNombre(centroComercial);

        boolean band = pilaLlena();
        if (band) {
            throw new IllegalStateException("Desbordamiento - Pila llena: no se pueden apilar más centros comerciales (Max = " + MAX + ").");
        }
        tope = tope + 1;
        pila[tope] = dato;

        return construirEstado("'" + dato + "' apilado en la posición " + tope + ". Tope = " + tope + ".", "ok", dato);
    }

    // Pop(Pila, Tope, Dato)
    public synchronized PilaEstadoDto pop() {
        boolean band = pilaVacia();
        if (band) {
            throw new IllegalStateException("Subdesbordamiento - Pila vacía: no hay centros comerciales para desapilar.");
        }
        String dato = pila[tope];
        tope = tope - 1; // El algoritmo solo baja Tope; la casilla queda libre para el próximo Push

        return construirEstado("'" + dato + "' desapilado. Tope = " + tope + ".", "info", dato);
    }

    public synchronized PilaEstadoDto obtenerEstado() {
        if (pilaVacia()) {
            return construirEstado("Pila vacía (Tope = -1). Ingrese un centro comercial para apilar.", "info", null);
        }
        return construirEstado("Tope = " + tope + " (" + pila[tope] + "). Ocupación: " + (tope + 1) + "/" + MAX + ".", "ok", null);
    }

    public synchronized PilaEstadoDto reiniciar() {
        Arrays.fill(pila, null);
        tope = -1;
        return construirEstado("Pila reiniciada: vacía (Tope = -1).", "info", null);
    }

    private String validarYLimpiarNombre(String centroComercial) {
        if (centroComercial == null || centroComercial.isBlank()) {
            throw new IllegalArgumentException("El nombre del centro comercial no puede estar vacío.");
        }
        String nombre = centroComercial.trim();
        if (nombre.length() > MAX_CARACTERES_NOMBRE) {
            throw new IllegalArgumentException("El nombre no puede superar los " + MAX_CARACTERES_NOMBRE + " caracteres.");
        }
        if (!nombre.matches("[\\p{L}\\d .'-]+")) {
            throw new IllegalArgumentException("El nombre solo puede contener letras, números, espacios, punto, apóstrofo y guion.");
        }
        return nombre;
    }

    // Solo se envían las casillas ocupadas (0..Tope); lo que hay sobre el tope no forma parte de la pila
    private PilaEstadoDto construirEstado(String mensaje, String tipoMensaje, String elementoAfectado) {
        return new PilaEstadoDto(Arrays.copyOf(pila, tope + 1), tope, MAX, mensaje, tipoMensaje, elementoAfectado);
    }
}