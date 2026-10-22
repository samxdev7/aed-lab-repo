package uni.AEDLab1.services;

import org.springframework.stereotype.Service;
import uni.AEDLab1.models.PilaEstadoDto;

import java.util.Arrays;

@Service
public class PilaServicio {

    private static final int TAMANO_MAXIMO = 100;
    private static final int MAX_CARACTERES_NOMBRE = 30;

    private String[] pila = new String[0];
    private int max = 0;   // Se define con definirTamano (lo ingresa el usuario)
    private int tope = -1;

    // Pilallena(Pila, Tope, Max, Band): Band = verdadero si Tope = Max-1
    private boolean pilaLlena() {
        return tope == max - 1;
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
            throw new IllegalStateException("Desbordamiento - Pila llena: no se pueden apilar más centros comerciales (Max = " + max + ").");
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

    // Crea una pila nueva y vacía de nuevoMax casillas (también sirve para reiniciarla)
    public synchronized PilaEstadoDto definirTamano(int nuevoMax) {
        if (nuevoMax < 1 || nuevoMax > TAMANO_MAXIMO) {
            throw new IllegalArgumentException("El tamaño de la pila debe ser un entero entre 1 y " + TAMANO_MAXIMO + ".");
        }
        max = nuevoMax;
        pila = new String[max];
        tope = -1;
        return construirEstado("Pila creada con Max = " + max + " (Tope = -1).", "info", null);
    }

    public synchronized PilaEstadoDto obtenerEstado() {
        if (max == 0) {
            return construirEstado("Defina el tamaño de la pila (Max) para comenzar.", "info", null);
        }
        if (pilaVacia()) {
            return construirEstado("Pila vacía (Tope = -1). Ocupación: 0/" + max + ".", "info", null);
        }
        return construirEstado("Tope = " + tope + " (" + pila[tope] + "). Ocupación: " + (tope + 1) + "/" + max + ".", "ok", null);
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
        return new PilaEstadoDto(Arrays.copyOf(pila, tope + 1), tope, max, mensaje, tipoMensaje, elementoAfectado);
    }
}