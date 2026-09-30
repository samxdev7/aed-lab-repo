package uni.AEDLab1.models;

import java.util.List;

/**
 * Respuesta inmutable para el problema de las ocho reinas (tablero 8x8).
 * Contiene la matriz de la solución completa, la traza de pasos verificados recursivamente,
 * el estado de validez y el mensaje de confirmación.
 * 
 * @param solution Matriz de tamaño 8x2 con las coordenadas [fila, columna] de cada reina.
 * @param steps Lista ordenada de pasos verificados recursivamente.
 * @param valid Indica si la configuración completa es válida (sin amenazas mutuas).
 * @param message Mensaje descriptivo del resultado.
 * 
 * @author samxdev7
 * @version 2.0
 */
public record EightQueensResponseDto(
    int[][] solution,
    List<QueenStepDto> steps,
    boolean valid,
    String message
) {}
