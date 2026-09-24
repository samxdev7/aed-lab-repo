package uni.AEDLab1.services;

import uni.AEDLab1.models.MovimientoRanaDto;

import java.util.ArrayList;
import java.util.List;

public class SaltoRanaServicio {

    private static final char RANA_VERDE = 'V';
    private static final char RANA_CAFE = 'C';
    private static final char ESPACIO_VACIO = '_';

    public List<MovimientoRanaDto> resolver(int ranasPorLado) {
        char[] estadoActual = construirEstadoInicial(ranasPorLado);
        List<MovimientoRanaDto> movimientosEncontrados = new ArrayList<>();

        boolean seEncontroSolucion = intentarResolverDesde(estadoActual, movimientosEncontrados);
        if (!seEncontroSolucion) {
            throw new IllegalStateException("No se encontró solución para " + ranasPorLado + " ranas por lado.");
        }

        return movimientosEncontrados;
    }

    private char[] construirEstadoInicial(int ranasPorLado) {
        int tamanoTotal = (ranasPorLado * 2) + 1;
        char[] estadoInicial = new char[tamanoTotal];

        for (int indice = 0; indice < ranasPorLado; indice++) {
            estadoInicial[indice] = RANA_VERDE;
        }
        estadoInicial[ranasPorLado] = ESPACIO_VACIO;
        for (int indice = ranasPorLado + 1; indice < tamanoTotal; indice++) {
            estadoInicial[indice] = RANA_CAFE;
        }
        return estadoInicial;
    }

    private boolean esEstadoSolucion(char[] estado) {
        int mitad = estado.length / 2;
        for (int indice = 0; indice < mitad; indice++) {
            if (estado[indice] != RANA_CAFE) return false;
        }
        if (estado[mitad] != ESPACIO_VACIO) return false;
        for (int indice = mitad + 1; indice < estado.length; indice++) {
            if (estado[indice] != RANA_VERDE) return false;
        }
        return true;
    }

    // Retorna true si desde "estado" se logra llegar a la solución final.
    private boolean intentarResolverDesde(char[] estado, List<MovimientoRanaDto> movimientos) {
        if (esEstadoSolucion(estado)) {
            return true;
        }

        int ultimoIndice = estado.length - 1;

        for (int posicion = 0; posicion <= ultimoIndice; posicion++) {

            if (estado[posicion] == RANA_VERDE) {
                if (intentarMovimiento(estado, movimientos, posicion, posicion + 1, ultimoIndice, RANA_VERDE)) {
                    return true;
                }
                if (posicion + 2 <= ultimoIndice && estado[posicion + 1] == RANA_CAFE
                    && intentarMovimiento(estado, movimientos, posicion, posicion + 2, ultimoIndice, RANA_VERDE)) {
                    return true;
                }
            }

            if (estado[posicion] == RANA_CAFE) {
                if (intentarMovimiento(estado, movimientos, posicion, posicion - 1, ultimoIndice, RANA_CAFE)) {
                    return true;
                }
                if (posicion - 2 >= 0 && estado[posicion - 1] == RANA_VERDE
                    && intentarMovimiento(estado, movimientos, posicion, posicion - 2, ultimoIndice, RANA_CAFE)) {
                    return true;
                }
            }
        }

        return false;
    }

    private boolean intentarMovimiento(
        char[] estado, List<MovimientoRanaDto> movimientos,
        int origen, int destino, int ultimoIndice, char tipoFicha
    ) {
        if (destino < 0 || destino > ultimoIndice || estado[destino] != ESPACIO_VACIO) {
            return false;
        }

        intercambiar(estado, origen, destino);
        movimientos.add(new MovimientoRanaDto(
            movimientos.size() + 1, origen, destino, tipoFicha, new String(estado)
        ));

        if (intentarResolverDesde(estado, movimientos)) {
            return true;
        }

        movimientos.remove(movimientos.size() - 1);
        intercambiar(estado, destino, origen); // deshacer
        return false;
    }

    private void intercambiar(char[] estado, int posicionA, int posicionB) {
        char temporal = estado[posicionA];
        estado[posicionA] = estado[posicionB];
        estado[posicionB] = temporal;
    }
}