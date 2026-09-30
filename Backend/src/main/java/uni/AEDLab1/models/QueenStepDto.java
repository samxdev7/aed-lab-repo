package uni.AEDLab1.models;

/**
 * Representa un paso en la colocación y verificación recursiva de las 8 reinas.
 * 
 * @param step Número de paso (1 a 8).
 * @param row Fila del tablero (0 a 7).
 * @param col Columna del tablero (0 a 7).
 * @param notation Notación algebraica de la casilla (ej. "Reina 1 [a8]").
 * @param verified Indica si la reina fue verificada recursivamente sin amenazas.
 * @param message Mensaje descriptivo de la validación.
 * 
 * @author samxdev7
 * @version 2.0
 */
public record QueenStepDto(
    int step,
    int row,
    int col,
    String notation,
    boolean verified,
    String message
) {}
