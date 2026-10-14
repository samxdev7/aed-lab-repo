package uni.AEDLab1.services;

import org.springframework.stereotype.Service;
import uni.AEDLab1.models.MovimientoRanaDto;

import java.util.Arrays;

@Service
public class SaltoRanaServicio {

    private static final char RANA_VERDE = 'V';
    private static final char RANA_CAFE = 'C';
    private static final char ESPACIO_VACIO = '_';

    // Arreglo estático donde se van guardando los movimientos (reemplaza al ArrayList)
    private MovimientoRanaDto[] movimientos;
    private int cantidadMovimientos;

    public MovimientoRanaDto[] resolver(int ranasPorLado) {
        char[] estadoActual = construirEstadoInicial(ranasPorLado);

        // Capacidad máxima conocida para este problema: N*(N+2) movimientos
        int capacidadMaxima = ranasPorLado * (ranasPorLado + 2);
        movimientos = new MovimientoRanaDto[capacidadMaxima];
        cantidadMovimientos = 0;

        boolean seEncontroSolucion = intentarResolverDesde(estadoActual);
        if (!seEncontroSolucion) {
            throw new IllegalStateException("No se encontró solución para " + ranasPorLado + " ranas por lado.");
        }

        // Se recorta el arreglo al tamaño real de movimientos usados
        return Arrays.copyOf(movimientos, cantidadMovimientos);
    }

    private char[] construirEstadoInicial(int ranasPorLado) {
        int tamanoTotal = (ranasPorLado * 2) + 1;
        char[] estadoInicial = new char[tamanoTotal];
        llenarEstadoInicial(estadoInicial, 0, ranasPorLado);
        return estadoInicial;
    }

    private void llenarEstadoInicial(char[] estado, int indice, int ranasPorLado) {
        if (indice >= estado.length) return;
        if (indice < ranasPorLado) {
            estado[indice] = RANA_VERDE;
        } else if (indice == ranasPorLado) {
            estado[indice] = ESPACIO_VACIO;
        } else {
            estado[indice] = RANA_CAFE;
        }
        llenarEstadoInicial(estado, indice + 1, ranasPorLado);
    }

    private boolean esEstadoSolucion(char[] estado) {
        int mitad = estado.length / 2;
        return verificarSolucionRecursiva(estado, 0, mitad);
    }

    private boolean verificarSolucionRecursiva(char[] estado, int indice, int mitad) {
        if (indice >= estado.length) return true;
        if (indice < mitad && estado[indice] != RANA_CAFE) return false;
        if (indice == mitad && estado[indice] != ESPACIO_VACIO) return false;
        if (indice > mitad && estado[indice] != RANA_VERDE) return false;
        return verificarSolucionRecursiva(estado, indice + 1, mitad);
    }

    // Retorna true si desde "estado" se logra llegar a la solución final (recorrido recursivo puro).
    private boolean intentarResolverDesde(char[] estado) {
        if (esEstadoSolucion(estado)) {
            return true;
        }
        return explorarPosicionRecursiva(estado, 0, estado.length - 1);
    }

    private boolean explorarPosicionRecursiva(char[] estado, int posicion, int ultimoIndice) {
        if (posicion > ultimoIndice) {
            return false;
        }

        if (estado[posicion] == RANA_VERDE) {
            if (intentarMovimiento(estado, posicion, posicion + 1, ultimoIndice, RANA_VERDE)) {
                return true;
            }
            if (posicion + 2 <= ultimoIndice && estado[posicion + 1] == RANA_CAFE
                && intentarMovimiento(estado, posicion, posicion + 2, ultimoIndice, RANA_VERDE)) {
                return true;
            }
        }

        if (estado[posicion] == RANA_CAFE) {
            if (intentarMovimiento(estado, posicion, posicion - 1, ultimoIndice, RANA_CAFE)) {
                return true;
            }
            if (posicion - 2 >= 0 && estado[posicion - 1] == RANA_VERDE
                && intentarMovimiento(estado, posicion, posicion - 2, ultimoIndice, RANA_CAFE)) {
                return true;
            }
        }

        return explorarPosicionRecursiva(estado, posicion + 1, ultimoIndice);
    }

    private boolean intentarMovimiento(
        char[] estado, int origen, int destino, int ultimoIndice, char tipoFicha
    ) {
        if (destino < 0 || destino > ultimoIndice || estado[destino] != ESPACIO_VACIO) {
            return false;
        }

        intercambiar(estado, origen, destino);

        // Agregar movimiento al arreglo estático
        movimientos[cantidadMovimientos] = new MovimientoRanaDto(
            cantidadMovimientos + 1, origen, destino, tipoFicha, new String(estado)
        );
        cantidadMovimientos++;

        if (intentarResolverDesde(estado)) {
            return true;
        }

        // Deshacer: se quita el último movimiento agregado
        cantidadMovimientos--;
        movimientos[cantidadMovimientos] = null;
        intercambiar(estado, destino, origen);
        return false;
    }

    private void intercambiar(char[] estado, int posicionA, int posicionB) {
        char temporal = estado[posicionA];
        estado[posicionA] = estado[posicionB];
        estado[posicionB] = temporal;
    }
}